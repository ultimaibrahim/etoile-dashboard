/**
 * apify-ingest.js — DEPRECATED / DESCONTINUADO
 * 
 * Este endpoint ha sido deshabilitado formalmente en favor de la integración directa
 * con la API oficial de Google Business Profile (GBP API) a través de gbp-sync.js.
 */

exports.handler = async (event, context) => {
  console.log('[DEPRECATED] Intento de invocación a apify-ingest. El servicio fue migrado a gbp-sync.');
  return {
    statusCode: 410,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'Gone',
      message: 'El flujo de ingesta vía Apify ha sido descontinuado en favor de la API oficial de Google Business Profile (gbp-sync).',
      migrated_to: '/.netlify/functions/gbp-sync'
    })
  };
};
