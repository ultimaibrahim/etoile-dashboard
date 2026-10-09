/**
 * gbp-sync-cron.js — Sincronización programada de reseñas desde Google Business Profile.
 *
 * Corre cada 30 min (ver netlify.toml). Cada ejecución procesa 1/6 de las sucursales
 * (rotando por franja de 30 min), así cada sucursal se refresca cada 3 h y cada corrida
 * cabe holgadamente en el timeout de las funciones programadas.
 * Trae las 50 reseñas más recientes por updateTime; el historial completo se carga
 * manualmente con /.netlify/functions/gbp-sync?branch=<id>&full=true.
 */
const { handler: syncHandler } = require('./gbp-sync');

const SLOTS = 6;
const SLOT_MINUTES = 30;

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
