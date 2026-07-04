const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // ── Auth: mismo patrón que apify-ingest.js ──
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const diagSecret = process.env.DIAG_SECRET;
  const queryParams = event.queryStringParameters || {};

  if (!diagSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta DIAG_SECRET en variables de entorno." }) };
  }
  if (!authHeader || authHeader !== `Bearer ${diagSecret}`) {
    console.warn("Intento de acceso no autorizado a diag-db.");
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Auditoría mínima
  console.log(`[AUDIT] Invocación diag-db - Fecha: ${new Date().toISOString()} - Acción: ${queryParams.action || 'diagnóstico_lectura'} - IP: ${event.headers['x-nf-client-connection-ip'] || 'desconocida'}`);

  // ── Acciones destructivas: requieren POST + confirmación explícita ──
  const destructiveActions = ['clean', 'merge_slp'];
  if (destructiveActions.includes(queryParams.action)) {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Acciones destructivas requieren POST.' }) };
    }
    let confirmBody = {};
    try { confirmBody = JSON.parse(event.body || '{}'); } catch (e) {}
    if (confirmBody.confirm !== queryParams.action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Para ejecutar '${queryParams.action}' envía body { "confirm": "${queryParams.action}" }.` })
      };
    }
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta SUPABASE_SERVICE_ROLE_KEY." }) };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: allReviews, error } = await supabase
      .from('reviews')
      .select('id, sucursal, region, stars, published_at_date, text');
    if (error) throw error;

    const statsByBranch = {};
    allReviews.forEach(r => {
      const key = `${r.region}:${r.sucursal}`;
      if (!statsByBranch[key]) {
        statsByBranch[key] = { region: r.region, sucursalId: r.sucursal, totalReviews: 0, negativeCount: 0, latestReviewDate: null };
      }
      statsByBranch[key].totalReviews++;
      if (r.stars <= 2) statsByBranch[key].negativeCount++;
      if (!statsByBranch[key].latestReviewDate || r.published_at_date > statsByBranch[key].latestReviewDate) {
        statsByBranch[key].latestReviewDate = r.published_at_date;
      }
    });

    const idTypes = { realGoogleMaps: 0, uuid: 0, shortOrOther: 0 };
    const uniqueMap = {};
    const logicalDuplicates = [];
    allReviews.forEach(r => {
      if (!r.id) idTypes.shortOrOther++;
      else if (r.id.includes('-') && r.id.length === 36) idTypes.uuid++;
      else if (r.id.length > 25) idTypes.realGoogleMaps++;
      else idTypes.shortOrOther++;

      const key = `${r.sucursal}_${r.stars}_${r.published_at_date}_${(r.text || '').substring(0, 30)}`;
      if (uniqueMap[key]) logicalDuplicates.push({ first: uniqueMap[key], second: r });
      else uniqueMap[key] = r;
    });

    let cleanStatus = "Ninguna acción ejecutada.";
    if (queryParams.action === 'clean') {
      const idsToDelete = allReviews
        .filter(r => (r.id && r.id.includes('-') && r.id.length === 36) || (r.id && r.id.length < 20) || !r.id)
        .map(r => r.id);
      if (idsToDelete.length > 0) {
        const { error: delError } = await supabase.from('reviews').delete().in('id', idsToDelete);
        if (delError) throw delError;
        cleanStatus = `Eliminadas ${idsToDelete.length} reseñas con IDs antiguos/autogenerados.`;
      } else {
        cleanStatus = "No se encontraron reseñas con IDs antiguos/autogenerados.";
      }
    } else if (queryParams.action === 'merge_slp') {
      const { error: updateError } = await supabase.from('reviews').update({ sucursal: 'the-park' }).eq('sucursal', 'san-luis');
      if (updateError) throw updateError;
      cleanStatus = "Merged san-luis -> the-park.";
    }

    let rlsPolicies = [];
    try {
      const { data: policyData, error: policyError } = await supabase.rpc('get_rls_policies');
      if (policyError) {
        const { data: rawPolicies, error: rawError } = await supabase.from('pg_policies').select('*');
        rlsPolicies = rawError ? [{ error: rawError.message }] : rawPolicies;
      } else {
        rlsPolicies = policyData;
      }
    } catch (e) {
      rlsPolicies = [{ error: e.message }];
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles').select('id, nombre, rol, region, sucursal');
    const { data: reviewMonthsData, error: rmError } = await supabase
      .from('review_months').select('*');

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalReviewsInDb: allReviews.length,
        logicalDuplicatesCount: logicalDuplicates.length,
        idTypesDistribution: idTypes,
        cleanStatus,
        profiles: profilesError ? { error: profilesError.message } : profilesData,
        reviewMonths: rmError ? { error: rmError.message } : reviewMonthsData,
        rlsPolicies,
        branchReviewBreakdown: Object.values(statsByBranch).sort((a, b) => a.region.localeCompare(b.region) || b.totalReviews - a.totalReviews),
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
