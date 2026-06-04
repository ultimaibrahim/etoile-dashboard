const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY." })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener todas las reseñas
    const { data: allReviews, error } = await supabase
      .from('reviews')
      .select('id, sucursal, region, stars, published_at_date, text');

    if (error) throw error;

    // Calcular estadísticas por sucursal y región
    const statsByBranch = {};
    allReviews.forEach(r => {
      const key = `${r.region}:${r.sucursal}`;
      if (!statsByBranch[key]) {
        statsByBranch[key] = {
          region: r.region,
          sucursalId: r.sucursal,
          totalReviews: 0,
          negativeCount: 0,
          latestReviewDate: null
        };
      }
      statsByBranch[key].totalReviews++;
      if (r.stars <= 2) {
        statsByBranch[key].negativeCount++;
      }
      if (!statsByBranch[key].latestReviewDate || r.published_at_date > statsByBranch[key].latestReviewDate) {
        statsByBranch[key].latestReviewDate = r.published_at_date;
      }
    });

    // Clasificar los IDs
    const idTypes = {
      realGoogleMaps: 0,
      uuid: 0,
      shortOrOther: 0
    };

    // Analizar duplicados lógicos
    const uniqueMap = {};
    const logicalDuplicates = [];
    allReviews.forEach(r => {
      if (!r.id) {
        idTypes.shortOrOther++;
      } else if (r.id.includes('-') && r.id.length === 36) {
        idTypes.uuid++;
      } else if (r.id.length > 25) {
        idTypes.realGoogleMaps++;
      } else {
        idTypes.shortOrOther++;
      }

      const key = `${r.sucursal}_${r.stars}_${r.published_at_date}_${(r.text || '').substring(0, 30)}`;
      if (uniqueMap[key]) {
        logicalDuplicates.push({ first: uniqueMap[key], second: r });
      } else {
        uniqueMap[key] = r;
      }
    });

    // Acción para limpiar duplicados si se pasa la query parameter `action=clean`
    let cleanStatus = "Ninguna acción ejecutada.";
    const queryParams = event.queryStringParameters || {};
    if (queryParams.action === 'clean') {
      const idsToDelete = [];
      allReviews.forEach(r => {
        const isUuid = r.id && r.id.includes('-') && r.id.length === 36;
        const isShort = r.id && r.id.length < 20;
        if (isUuid || isShort || !r.id) {
          idsToDelete.push(r.id);
        }
      });

      if (idsToDelete.length > 0) {
        const { error: delError } = await supabase
          .from('reviews')
          .delete()
          .in('id', idsToDelete);
        
        if (delError) throw delError;
        cleanStatus = `Eliminadas ${idsToDelete.length} reseñas con IDs antiguos/autogenerados.`;
      } else {
        cleanStatus = "No se encontraron reseñas con IDs antiguos/autogenerados para eliminar.";
      }
    } else if (queryParams.action === 'clear_all') {
      const { error: delError } = await supabase
        .from('reviews')
        .delete()
        .neq('id', 'placeholder-non-existent');

      if (delError) throw delError;
      cleanStatus = "Base de datos reviews completamente vaciada.";
    } else if (queryParams.action === 'merge_slp') {
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ sucursal: 'the-park' })
        .eq('sucursal', 'san-luis');

      if (updateError) throw updateError;
      cleanStatus = "Merged san-luis -> the-park en la base de datos de Supabase.";
    }

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({
        totalReviewsInDb: allReviews.length,
        logicalDuplicatesCount: logicalDuplicates.length,
        idTypesDistribution: idTypes,
        cleanStatus,
        branchReviewBreakdown: Object.values(statsByBranch).sort((a,b) => a.region.localeCompare(b.region) || b.totalReviews - a.totalReviews)
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
