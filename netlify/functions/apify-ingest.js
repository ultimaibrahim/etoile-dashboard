const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Solo permitir peticiones POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);

    // 1. Validar el Token de Seguridad del Webhook
    // Apify envía la cabecera "Authorization: Bearer <token>"
    const authHeader = event.headers['authorization'];
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;

    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.warn("Intento de webhook no autorizado.");
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // 2. Obtener el datasetId del Run de Apify
    const runObject = body.resource;
    if (!runObject || !runObject.defaultDatasetId) {
      console.warn("Webhook recibido sin defaultDatasetId.");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing defaultDatasetId' })
      };
    }
    const datasetId = runObject.defaultDatasetId;

    // 3. Descargar las reseñas de la API de Apify
    const apifyToken = process.env.APIFY_TOKEN;
    const apifyUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&clean=true`;

    console.log(`Descargando dataset ${datasetId} de Apify...`);
    const datasetRes = await fetch(apifyUrl);
    if (!datasetRes.ok) {
      throw new Error(`Error al obtener dataset de Apify: ${datasetRes.statusText}`);
    }
    const items = await datasetRes.json();
    console.log(`Descargadas ${items.length} reseñas.`);

    // 4. Conectar a Supabase usando Service Role Key para hacer bypass a RLS en la escritura
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      throw new Error("Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const reviewsToUpsert = [];

    // Mapeador de sucursales a ID y Región
    function matchSucursalAndRegion(name) {
      // Normalizar texto quitando acentos básicos para facilitar coincidencias
      const normalized = name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita tildes, diéresis, circunflejos
        .replace(/[^a-z0-9 ]/g, " ");   // deja solo letras y números

      // Guadalajara (GDL)
      if (normalized.includes("andares")) return { sucursalId: "andares", region: "GDL" };
      if (normalized.includes("patria")) return { sucursalId: "patria", region: "GDL" };
      if (normalized.includes("midtown")) return { sucursalId: "midtown", region: "GDL" };
      if (normalized.includes("galerias guadalajara") || normalized.includes("galerias gdl")) return { sucursalId: "gal-gdl", region: "GDL" };
      if (normalized.includes("via viva")) return { sucursalId: "via-viva", region: "GDL" };
      if (normalized.includes("santa anita")) return { sucursalId: "sta-anita", region: "GDL" };
      if (normalized.includes("la perla")) return { sucursalId: "la-perla", region: "GDL" };
      if (normalized.includes("forum tlaquepaque") || normalized.includes("forum") || normalized.includes("tlaquepaque")) return { sucursalId: "forum", region: "GDL" };

      // CDMX / Valle de México (CDMX)
      if (normalized.includes("aztlan")) return { sucursalId: "aztlan", region: "CDMX" };
      if (normalized.includes("carso")) return { sucursalId: "carso", region: "CDMX" };
      if (normalized.includes("mexicana")) return { sucursalId: "mexicana", region: "CDMX" };
      if (normalized.includes("acoxpa")) return { sucursalId: "acoxpa", region: "CDMX" };
      if (normalized.includes("tepeyac")) return { sucursalId: "tepeyac", region: "CDMX" };
      if (normalized.includes("polanquito")) return { sucursalId: "polanquito", region: "CDMX" };
      if (normalized.includes("oceania")) return { sucursalId: "oceania", region: "CDMX" };
      if (normalized.includes("artz") || normalized.includes("pedregal")) return { sucursalId: "artz", region: "CDMX" };
      if (normalized.includes("arcos bosques") || normalized.includes("arcos")) return { sucursalId: "arcos", region: "CDMX" };
      if (normalized.includes("mitikah")) return { sucursalId: "mitikah", region: "CDMX" };
      if (normalized.includes("oasis") || normalized.includes("coyoacan")) return { sucursalId: "coyoacan", region: "CDMX" };
      if (normalized.includes("duraznos")) return { sucursalId: "duraznos", region: "CDMX" };
      if (normalized.includes("santa fe") || normalized.includes("santafe")) return { sucursalId: "santa-fe", region: "CDMX" };
      if (normalized.includes("satelite")) return { sucursalId: "satelite", region: "CDMX" };

      // Monterrey (MTY)
      if (normalized.includes("valle oriente")) return { sucursalId: "valle-oriente", region: "MTY" };
      if (normalized.includes("fashion drive")) return { sucursalId: "fashion-drive", region: "MTY" };
      if (normalized.includes("monterrey")) return { sucursalId: "gal-mty", region: "MTY" }; // "Galerías Monterrey"

      // León (LEON)
      if (normalized.includes("altacia")) return { sucursalId: "altacia", region: "LEON" };

      // San Luis Potosí (SLP)
      if (normalized.includes("the park") || normalized.includes("san luis") || normalized.includes("slp")) {
        return { sucursalId: "the-park", region: "SLP" };
      }

      // Aguascalientes (AGS)
      if (normalized.includes("altaria") || normalized.includes("pocitos") || normalized.includes("aguascalientes")) {
        return { sucursalId: "altaria", region: "AGS" };
      }

      // Toluca / Metepec (TOL)
      if (normalized.includes("town square") || normalized.includes("ts metepec")) return { sucursalId: "town-square", region: "TOL" };
      if (normalized.includes("metepec") || normalized.includes("toluca")) return { sucursalId: "gal-metepec", region: "TOL" }; // "Galerías Metepec"

      // Querétaro (QRO)
      if (normalized.includes("antea") || normalized.includes("queretaro")) return { sucursalId: "antea", region: "QRO" };

      // Cancún (CUN)
      if (normalized.includes("cancun")) return { sucursalId: "cancun", region: "CUN" };

      // Tijuana (TJ)
      if (normalized.includes("peninsula") || normalized.includes("tijuana")) return { sucursalId: "peninsula", region: "TJ" };

      return null;
    }

    let discardedCount = 0;
    for (const item of items) {
      if (!item.reviewId) {
        console.warn(`[Descarte] Reseña omitida por falta de reviewId.`);
        discardedCount++;
        continue;
      }

      const rawTitle = item.googleSearchString || item.title || "";
      const mapped = matchSucursalAndRegion(rawTitle);

      if (!mapped) {
        console.log(`[Descarte] Sucursal no registrada en mapeador: "${rawTitle}" (Review ID: ${item.reviewId})`);
        discardedCount++;
        continue;
      }

      // Validar calificación (estrellas)
      const stars = Number(item.stars);
      if (isNaN(stars) || stars < 1 || stars > 5) {
        console.warn(`[Descarte] Calificación inválida (${item.stars}) para review ${item.reviewId}`);
        discardedCount++;
        continue;
      }

      // Validar y normalizar fecha de publicación
      let publishedAtDateIso;
      try {
        const d = new Date(item.publishedAtDate);
        if (isNaN(d.getTime())) throw new Error("Fecha inválida");
        publishedAtDateIso = d.toISOString();
      } catch (e) {
        console.warn(`[Descarte] Fecha de publicación inválida o ausente (${item.publishedAtDate}) para review ${item.reviewId}`);
        discardedCount++;
        continue;
      }

      // Validar y normalizar fecha de respuesta (opcional)
      let responseDateIso = null;
      if (item.responseDate) {
        try {
          const rd = new Date(item.responseDate);
          if (!isNaN(rd.getTime())) {
            responseDateIso = rd.toISOString();
          }
        } catch (e) {
          console.warn(`[Aviso] Fecha de respuesta inválida (${item.responseDate}) para review ${item.reviewId}, se omite la fecha de respuesta.`);
        }
      }

      reviewsToUpsert.push({
        id: item.reviewId,
        sucursal: mapped.sucursalId,
        stars: stars,
        text: item.text || null,
        published_at_date: publishedAtDateIso,
        is_local_guide: item.isLocalGuide || false,
        response_text: item.responseText || null,
        response_date: responseDateIso,
        region: mapped.region
      });
    }

    if (discardedCount > 0) {
      console.warn(`[Ingesta] Se descartaron ${discardedCount} ítems por falta de mapeo o datos inválidos.`);
    }

    // 5. Realizar el upsert en Supabase
    if (reviewsToUpsert.length > 0) {
      console.log(`Subiendo ${reviewsToUpsert.length} reseñas a Supabase...`);
      const { error } = await supabase
        .from('reviews')
        .upsert(reviewsToUpsert, { onConflict: 'id' });

      if (error) throw error;
      console.log("✅ Reseñas subidas con éxito.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, count: reviewsToUpsert.length })
    };

  } catch (err) {
    console.error("Error en webhook de ingesta:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
