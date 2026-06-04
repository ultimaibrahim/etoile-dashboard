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
    const supabaseUrl = process.env.SUPABASE_URL || 'https://lbnqpcrhyebtbblpvazp.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      throw new Error("Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const reviewsToUpsert = [];

    // Mapeador de sucursales a ID y Región
    function matchSucursalAndRegion(name) {
      const normalized = name.toLowerCase();
      
      // Región Guadalajara (GDL)
      if (normalized.includes("andares")) return { sucursalId: "andares", region: "GDL" };
      if (normalized.includes("patria")) return { sucursalId: "patria", region: "GDL" };
      if (normalized.includes("galerías guadalajara") || normalized.includes("galerias gdl")) return { sucursalId: "gal-gdl", region: "GDL" };
      if (normalized.includes("midtown")) return { sucursalId: "midtown", region: "GDL" };
      if (normalized.includes("via viva") || normalized.includes("viva viva")) return { sucursalId: "via-viva", region: "GDL" };
      if (normalized.includes("santa anita")) return { sucursalId: "sta-anita", region: "GDL" };
      if (normalized.includes("la perla")) return { sucursalId: "la-perla", region: "GDL" };
      if (normalized.includes("forum tlaquepaque")) return { sucursalId: "forum", region: "GDL" };
      
      // Región Ciudad de México (CDMX)
      if (normalized.includes("roma")) return { sucursalId: "roma", region: "CDMX" };
      if (normalized.includes("condesa")) return { sucursalId: "condesa", region: "CDMX" };
      if (normalized.includes("polanco")) return { sucursalId: "polanco", region: "CDMX" };
      if (normalized.includes("coyoacán") || normalized.includes("coyoacan")) return { sucursalId: "coyoacan", region: "CDMX" };
      if (normalized.includes("santa fe")) return { sucursalId: "santa-fe", region: "CDMX" };
      if (normalized.includes("interlomas")) return { sucursalId: "interlomas", region: "CDMX" };
      if (normalized.includes("satélite") || normalized.includes("satelite")) return { sucursalId: "satelite", region: "CDMX" };
      if (normalized.includes("del valle")) return { sucursalId: "del-valle", region: "CDMX" };
      
      return null;
    }

    for (const item of items) {
      const rawTitle = item.googleSearchString || item.title || "";
      const mapped = matchSucursalAndRegion(rawTitle);

      if (!mapped) continue; // Ignorar reseñas de sucursales no registradas

      reviewsToUpsert.push({
        id: item.reviewId,
        sucursal: mapped.sucursalId,
        stars: item.stars,
        text: item.text || null,
        published_at_date: new Date(item.publishedAtDate).toISOString(),
        is_local_guide: item.isLocalGuide || false,
        response_text: item.responseText || null,
        response_date: item.responseDate ? new Date(item.responseDate).toISOString() : null,
        region: mapped.region
      });
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
