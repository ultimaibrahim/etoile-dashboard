/**
 * gbp-reconcile.js — Empata reseñas de GBP con las filas históricas de Apify en reviews_core.
 *
 * Los IDs de Apify (p. ej. "ChdDSUhN…") no son los reviewId de la API oficial ("AbFvOq…"),
 * así que un upsert por id duplicaría el historial y perdería `classification`.
 * Orden de empate para cada reseña de GBP (cada fila existente se usa una sola vez):
 *   1. Ya vinculada: raw_gbp_payload.reviewId == reviewId.
 *   2. Mismas estrellas y |published_at − createTime| <= 2 s.
 *   3. Mismas estrellas y mismo inicio de texto normalizado (si hay texto).
 *   4. Mismas estrellas, ambas sin texto y diferencia <= 1 día.
 *   5. Mismo inicio de texto (no vacío) aunque cambien las estrellas: reseña editada.
 * Sin empate -> reseña nueva (se inserta con el reviewId de GBP).
 */

const DAY_MS = 86400000;
const EXACT_MS = 2000;

const norm = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const textKey = (t) => norm(t).slice(0, 40);

/**
 * @param {Array} existing filas de reviews_core de UNA sucursal: {id, stars, text, published_at, raw_gbp_payload}
 * @param {Array} incoming filas ya mapeadas desde GBP: {id (reviewId), stars, text, published_at, ...}
 * @returns {{rows: Array, stats: object}} filas listas para upsert (con el id definitivo)
 */
function reconcile(existing, incoming) {
  const used = new Set();
  const byLinked = new Map();
  const byStars = new Map();
  for (const e of existing) {
    const gid = e.raw_gbp_payload && (e.raw_gbp_payload.reviewId || e.raw_gbp_payload.name);
    if (gid) byLinked.set(gid, e);
    const list = byStars.get(e.stars) || [];
    list.push({ row: e, t: Date.parse(e.published_at), key: textKey(e.text) });
    byStars.set(e.stars, list);
  }

  const stats = { linked: 0, exact: 0, text: 0, fuzzy: 0, edited: 0, inserted: 0 };
  const rows = [];
  const pending = [];

  const take = (row, gbpRow, how) => {
    used.add(row.id);
    stats[how]++;
    // Conserva el id histórico; classification no se envía, así el upsert no la pisa.
    rows.push({ ...gbpRow, id: row.id });
  };

  // Pasada 1 y 2 (las más fiables) para todas antes de usar las difusas
  for (const g of incoming) {
    const linked = byLinked.get(g.id);
    if (linked && !used.has(linked.id)) { take(linked, g, 'linked'); continue; }
    const t = Date.parse(g.published_at);
    let best = null, bd = Infinity;
    for (const c of byStars.get(g.stars) || []) {
      if (used.has(c.row.id)) continue;
      const d = Math.abs(c.t - t);
      if (d < bd) { bd = d; best = c; }
    }
    if (best && bd <= EXACT_MS) take(best.row, g, 'exact');
    else pending.push(g);
  }

  const stillPending = [];
  const stats5 = [];
  for (const g of pending) {
    const k = textKey(g.text);
    const hit = k && (byStars.get(g.stars) || []).find(c => !used.has(c.row.id) && c.key === k);
    if (hit) take(hit.row, g, 'text'); else stillPending.push(g);
  }

  for (const g of stillPending) {
    const t = Date.parse(g.published_at);
    let best = null, bd = Infinity;
    if (!g.text) {
      for (const c of byStars.get(g.stars) || []) {
        if (used.has(c.row.id) || c.key) continue;
        const d = Math.abs(c.t - t);
        if (d < bd) { bd = d; best = c; }
      }
    }
    if (best && bd <= DAY_MS) take(best.row, g, 'fuzzy');
    else stats5.push(g);
  }

  const allLegacy = [].concat(...byStars.values());
  for (const g of stats5) {
    const k = textKey(g.text);
    const hit = k && allLegacy.find(c => !used.has(c.row.id) && c.key === k);
    if (hit) take(hit.row, g, 'edited'); else { stats.inserted++; rows.push(g); }
  }

  stats.legacyUnmatched = existing.filter(e => !used.has(e.id)).length;
  // Diagnóstico: una reseña "nueva" anterior al último scrape de Apify es sospechosa de duplicado.
  const lastLegacy = existing.reduce((m, e) => Math.max(m, Date.parse(e.published_at) || 0), 0);
  stats.insertedBeforeLastScrape = rows.filter(r => !used.has(r.id) && !existing.some(e => e.id === r.id) && Date.parse(r.published_at) < lastLegacy - DAY_MS).length;
  return { rows, stats };
}

module.exports = { reconcile };
