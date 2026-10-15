/**
 * gbp-sync.js — Ingesta y Sincronización Oficial con Google Business Profile API
 * 
 * Conecta directamente a la API oficial de GBP sin intermediarios ni scrapers:
 * 1. Renueva el token de acceso con Google OAuth2 mediante GBP_REFRESH_TOKEN.
 * 2. Consulta las reseñas y respuestas oficiales de cada ubicación registrada.
 * 3. Realiza upsert atómico en 'reviews_core' en Supabase.
 * 4. Clasifica quejas críticas (1-2 estrellas) vía LLM preservando el motor Étoile.
 */

const { createClient } = require('@supabase/supabase-js');
const { reconcile } = require('./gbp-reconcile');

// Mapeador de estrellas de GBP a números
const STAR_MAP = {
  'ONE': 1,
  'TWO': 2,
  'THREE': 3,
  'FOUR': 4,
  'FIVE': 5
};

function parseStars(val) {
  if (typeof val === 'number') return Math.min(5, Math.max(1, Math.round(val)));
  if (typeof val === 'string') {
    const upper = val.toUpperCase().trim();
    if (STAR_MAP[upper]) return STAR_MAP[upper];
    const n = parseInt(upper, 10);
    if (!isNaN(n) && n >= 1 && n <= 5) return n;
  }
  // STAR_RATING_UNSPECIFIED u otro valor desconocido: no inventamos una calificación
  return null;
}


/**
 * Google anexa una traducción automática al comentario. Dos formas:
 *   "<original>\n\n(Translated by Google)\n<traducción>"
 *   "(Translated by Google) <traducción>\n\n(Original)\n<original>"
 * Nos quedamos solo con el texto original del cliente; el crudo sigue en raw_gbp_payload.
 */
function cleanComment(raw) {
  if (!raw) return null;
  let t = raw;
  const orig = t.match(/^\s*\((?:Translated by Google|Traducido por Google)\)[\s\S]*?\n\s*\((?:Original|Original text)\)\s*\n?([\s\S]*)$/i);
  if (orig) t = orig[1];
  else t = t.replace(/\s*\((?:Translated by Google|Traducido por Google)\)[\s\S]*$/i, '');
  t = t.trim();
  return t || null;
}


const EXISTING_COLS = 'id, stars, text, published_at, updated_at, reply_text, reply_published_at, reviewer_name, raw_gbp_payload';

/** Lee todas las filas de una sucursal en reviews_core (paginado de 1000 en 1000). Solo para el historial completo. */
async function loadExistingReviews(supabase, locationId) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('reviews_core')
      .select(EXISTING_COLS)
      .eq('location_id', locationId)
      .order('published_at', { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

/**
 * Sync incremental: lee solo las filas ya vinculadas a los reviewId recibidos de Google.
 * Una reseña sin vínculo es nueva: el historial de Apify se concilió en la carga inicial (v3.5.0f).
 */
async function loadLinkedReviews(supabase, locationId, reviewIds) {
  const out = [];
  for (let i = 0; i < reviewIds.length; i += 100) {
    const { data, error } = await supabase
      .from('reviews_core')
      .select(EXISTING_COLS)
      .eq('location_id', locationId)
      .in('raw_gbp_payload->>reviewId', reviewIds.slice(i, i + 100));
    if (error) throw error;
    out.push(...data);
  }
  return out;
}

const sameInstant = (a, b) => (a ? Date.parse(a) : null) === (b ? Date.parse(b) : null);

/** True si la fila de Google no aporta cambios respecto a la ya guardada (se omite del upsert). */
function isUnchanged(old, row) {
  return old.stars === row.stars
    && (old.text || null) === (row.text || null)
    && (old.reply_text || null) === (row.reply_text || null)
    && (old.reviewer_name || null) === (row.reviewer_name || null)
    && sameInstant(old.published_at, row.published_at)
    && sameInstant(old.updated_at, row.updated_at)
    && sameInstant(old.reply_published_at, row.reply_published_at)
    && Boolean(old.raw_gbp_payload && old.raw_gbp_payload.reviewId);
}

const REVIEWS_PAGE_SIZE = 50; // máximo permitido por la API v4
const REQUEST_GAP_MS = 250;   // holgura bajo la cuota de la API (300 QPM)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Descarga reseñas de una ubicación siguiendo nextPageToken.
 * maxPages = 1 trae las 50 más recientes por updateTime (sync incremental).
 * maxPages = Infinity trae el historial completo (backfill).
 */
async function fetchLocationReviews(accessToken, accPath, locPath, maxPages) {
  const reviews = [];
  let pageToken = '';
  let pages = 0;
  do {
    const qs = new URLSearchParams({ pageSize: String(REVIEWS_PAGE_SIZE), orderBy: 'updateTime desc' });
    if (pageToken) qs.set('pageToken', pageToken);
    const res = await fetch(`https://mybusiness.googleapis.com/v4/${accPath}/${locPath}/reviews?${qs}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = new Error(await res.text());
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    reviews.push(...(data.reviews || []));
    pageToken = data.nextPageToken || '';
    pages++;
    if (pageToken && pages < maxPages) await sleep(REQUEST_GAP_MS);
  } while (pageToken && pages < maxPages);
  return reviews;
}

/**
 * Obtiene un nuevo Access Token de Google a partir del Refresh Token
 */
async function getGoogleAccessToken() {
  const clientId = process.env.GBP_CLIENT_ID;
  const clientSecret = process.env.GBP_CLIENT_SECRET;
  const refreshToken = process.env.GBP_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Faltan variables de entorno para autenticación GBP (GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN).');
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Fallo al refrescar token de Google (${res.status}): ${errText}`);
  }

  const tokenData = await res.json();
  return tokenData.access_token;
}

exports.handler = async (event, context) => {
  // 1. Validar autorización de seguridad
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const queryParams = event.queryStringParameters || {};
  const syncSecret = process.env.GBP_SYNC_SECRET;

  if (syncSecret) {
    const isAuthorized = (authHeader === `Bearer ${syncSecret}`) || (queryParams.secret === syncSecret);
    if (!isAuthorized) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
  }

  const isDryRun = queryParams.dryRun === 'true';
  const targetBranch = queryParams.branch || null;
  // slot/slots: procesa solo 1/N de las sucursales (orden por id) para caber en el timeout de Netlify
  const slots = Math.max(1, parseInt(queryParams.slots, 10) || 1);
  const slot = ((parseInt(queryParams.slot, 10) || 0) % slots + slots) % slots;
  // full=true -> historial completo (backfill, usar con ?branch= por el timeout de Netlify). Por defecto: 50 más recientes.
  const fullHistory = queryParams.full === 'true';
  const maxPages = fullHistory ? Infinity : Math.max(1, parseInt(queryParams.pages, 10) || 1);

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Faltan credenciales de Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Obtener lista de sucursales a sincronizar
    let locQuery = supabase.from('locations').select('*').eq('active', true);
    if (targetBranch) {
      locQuery = locQuery.eq('id', targetBranch);
    }
    const { data: locations, error: locError } = await locQuery;
    if (locError) throw locError;

    if (!locations || locations.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, message: 'No se encontraron sucursales activas para sincronizar.', synced: 0 })
      };
    }

    // Filtrar aquellas sucursales que tengan configurado gbp_location_id
    const configuredLocations = locations
      .filter(l => Boolean(l.gbp_location_id))
      .sort((a, b) => a.id.localeCompare(b.id))
      .filter((_, i) => i % slots === slot);
    if (configuredLocations.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Sucursales encontradas pero ninguna tiene asignado gbp_location_id aún. Ejecuta scripts/gbp-setup.js para vincularlas.',
          totalLocations: locations.length,
          configured: 0
        })
      };
    }

    // 3. Autenticación con Google
    const accessToken = await getGoogleAccessToken();

    let totalSynced = 0;
    const errors = [];
    const reviewsToUpsert = [];
    const reconcileStats = {};
    let classified = 0;

    // 4. Iterar sobre las sucursales configuradas
    for (const loc of configuredLocations) {
      try {
        const accountId = loc.gbp_account_id || process.env.GBP_ACCOUNT_ID;
        if (!accountId) {
          errors.push({ branch: loc.id, error: 'Falta account_id en location y en variable de entorno GBP_ACCOUNT_ID.' });
          continue;
        }

        // Normalizar formato de nombres en la API de GBP
        // Si accountId no empieza con "accounts/", anteponerlo
        const accPath = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;
        const locPath = loc.gbp_location_id.startsWith('locations/') ? loc.gbp_location_id : `locations/${loc.gbp_location_id}`;

        const reviews = await fetchLocationReviews(accessToken, accPath, locPath, maxPages);

        const mapped = [];
        for (const r of reviews) {
          const stars = parseStars(r.starRating);
          if (stars === null) {
            errors.push({ branch: loc.id, review: r.reviewId || r.name, error: `starRating no reconocido: ${r.starRating}` });
            continue;
          }
          mapped.push({
            id: r.reviewId || r.name,
            location_id: loc.id,
            stars: stars,
            text: cleanComment(r.comment),
            reviewer_name: r.reviewer?.displayName || null,
            reviewer_photo_url: r.reviewer?.profilePhotoUrl || null,
            is_local_guide: false, // la API v4 no expone Local Guide; la columna se conserva por compatibilidad con la vista `reviews`
            published_at: r.createTime || new Date().toISOString(),
            updated_at: r.updateTime || null,
            reply_text: r.reviewReply?.comment || null,
            reply_published_at: r.reviewReply?.updateTime || null,
            raw_gbp_payload: r
          });
        }

        const existing = fullHistory
          ? await loadExistingReviews(supabase, loc.id)
          : await loadLinkedReviews(supabase, loc.id, mapped.map(m => m.id));
        const { rows, stats } = reconcile(existing, mapped);
        const existingById = new Map(existing.map(e => [e.id, e]));
        const changed = rows.filter(r => !existingById.has(r.id) || !isUnchanged(existingById.get(r.id), r));
        stats.unchanged = rows.length - changed.length;
        reviewsToUpsert.push(...changed);
        reconcileStats[loc.id] = stats;
        totalSynced += reviews.length;
        await sleep(REQUEST_GAP_MS);
      } catch (locErr) {
        errors.push({ branch: loc.id, status: locErr.status, error: locErr.message });
      }
    }

    // 5. Upsert en Supabase
    if (reviewsToUpsert.length > 0 && !isDryRun) {
      const chunkSize = 200;
      for (let i = 0; i < reviewsToUpsert.length; i += chunkSize) {
        const chunk = reviewsToUpsert.slice(i, i + chunkSize);
        const { error: upsertError } = await supabase
          .from('reviews_core')
          .upsert(chunk, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }

      // Clasificación local (sin LLM) de quejas de 1-2★ que aún no tienen clasificación.
      // Solo reseñas nuevas o sin clasificar: nunca se re-clasifica el historial ni se pisa lo existente.
      try {
        const { classifyAndSave } = require('./classify-review');
        const ids = reviewsToUpsert.filter(r => r.stars <= 2 && r.text).map(r => r.id);
        let pending = [];
        for (let i = 0; i < ids.length; i += 200) {
          const { data, error } = await supabase
            .from('reviews_core')
            .select('id, classification')
            .in('id', ids.slice(i, i + 200));
          if (error) throw error;
          pending.push(...data.filter(d => !d.classification).map(d => d.id));
        }
        const byId = new Map(reviewsToUpsert.map(r => [r.id, r]));
        for (const id of pending) {
          const r = byId.get(id);
          await classifyAndSave(supabase, id, r.text, r.stars);
        }
        classified = pending.length;
      } catch (cErr) {
        console.warn('[GBP-Sync] Advertencia en clasificación:', cErr.message);
      }
    }

    // Marca de "última sincronización" en las sucursales consultadas sin error (aunque no hubiera cambios),
    // después del upsert: si este falla, la sucursal no queda como sincronizada.
    // Si la columna aún no existe (supabase_sync_status.sql sin ejecutar) solo se avisa.
    const okIds = configuredLocations.map(l => l.id).filter(id => !errors.some(e => e.branch === id));
    if (okIds.length > 0 && !isDryRun) {
      const { error: markError } = await supabase
        .from('locations')
        .update({ gbp_synced_at: new Date().toISOString() })
        .in('id', okIds);
      if (markError) console.warn('[GBP-Sync] No se pudo marcar gbp_synced_at:', markError.message);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        dryRun: isDryRun,
        totalFetched: totalSynced,
        upserted: isDryRun ? 0 : reviewsToUpsert.length,
        locationsProcessed: configuredLocations.length,
        slot: slots > 1 ? `${slot + 1}/${slots}` : undefined,
        reconcile: reconcileStats,
        classified,
        errors: errors.length > 0 ? errors : undefined
      })
    };

  } catch (err) {
    console.error('[GBP-Sync] Error en sincronización:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

// Expuestos para pruebas
exports._internal = { parseStars, cleanComment, fetchLocationReviews, isUnchanged };
