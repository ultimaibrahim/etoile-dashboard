/**
 * gbp-sync-cron.js — Sincronización programada de reseñas desde Google Business Profile.
 *
 * Corre cada 5 min (ver netlify.toml). Cada ejecución procesa 1/6 de las sucursales
 * (rotando por franja de 5 min), así cada sucursal se refresca cada 30 min y cada corrida
 * (el mismo tamaño de antes: ~1/6 de las sucursales) cabe en el timeout de las funciones programadas.
 * Antes: corría cada 30 min con las mismas 6 franjas, o sea que cada sucursal tardaba hasta 3 h en actualizarse.
 * Trae las 50 reseñas más recientes por updateTime; el historial completo se carga
 * manualmente con /.netlify/functions/gbp-sync?branch=<id>&full=true.
 */
const { handler: syncHandler } = require('./gbp-sync');

const SLOTS = 6;
const SLOT_MINUTES = 5;   // = cadencia del cron en netlify.toml; SLOTS × SLOT_MINUTES = minutos entre refrescos de una misma sucursal

exports.handler = async () => {
  const slot = Math.floor(Date.now() / (SLOT_MINUTES * 60 * 1000)) % SLOTS;
  const secret = process.env.GBP_SYNC_SECRET;
  const res = await syncHandler({
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
    queryStringParameters: { slot: String(slot), slots: String(SLOTS) }
  });
  console.log(`[gbp-sync-cron] slot ${slot + 1}/${SLOTS} -> ${res.statusCode} ${res.body}`);
  return { statusCode: res.statusCode };
};
