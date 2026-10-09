#!/usr/bin/env node
/**
 * tests/gbp-sync.test.js — Pruebas unitarias del pipeline GBP (sin red ni Supabase).
 *   node tests/gbp-sync.test.js
 */
const Module = require('module');
const origLoad = Module._load;
Module._load = function (req, ...a) { return req === '@supabase/supabase-js' ? { createClient: () => ({}) } : origLoad.call(this, req, ...a); };

const { reconcile } = require('../netlify/functions/gbp-reconcile');
const { _internal } = require('../netlify/functions/gbp-sync');
const { parseStars, cleanComment } = _internal;

let pass = 0, fail = 0;
const t = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`✅ PASS: ${name}`); }
  else { fail++; console.error(`❌ FAIL: ${name} ${extra}`); }
};

// ── parseStars
t('parseStars: ONE..FIVE', ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].map(parseStars).join() === '1,2,3,4,5');
t('parseStars: desconocido -> null (no inventa 5★)', parseStars('STAR_RATING_UNSPECIFIED') === null && parseStars(undefined) === null);

// ── cleanComment
t('cleanComment: original + traducción', cleanComment('Malísimas\n\n(Translated by Google)\nAwful') === 'Malísimas');
t('cleanComment: traducción primero + (Original)', cleanComment('(Translated by Google) Great\n\n(Original)\nMuy bueno') === 'Muy bueno');
t('cleanComment: vacío/null/espacios -> null', cleanComment('') === null && cleanComment(null) === null && cleanComment('  \n ') === null);
t('cleanComment: paréntesis normales intactos', cleanComment('Rica (pero cara)') === 'Rica (pero cara)');

// ── reconcile
const row = (id, stars, text, iso, extra = {}) => ({ id, stars, text, published_at: iso, ...extra });
const T0 = '2026-08-01T10:00:00.000Z';

let r = reconcile([row('LEG1', 5, 'Rico', T0)], [row('GBP1', 5, 'Rico', '2026-08-01T10:00:00.900000Z')]);
t('reconcile: empate por timestamp conserva id histórico', r.rows.length === 1 && r.rows[0].id === 'LEG1' && r.stats.exact === 1 && r.stats.inserted === 0);

r = reconcile([row('LEG1', 5, 'Excelente servicio y muy rico todo', '2025-01-01T00:00:00Z')], [row('GBP1', 5, 'Excelente servicio y muy rico todo', T0)]);
t('reconcile: fecha aproximada de Apify empata por texto', r.rows[0].id === 'LEG1' && r.stats.text === 1);

r = reconcile([row('LEG1', 5, '', T0)], [row('GBP1', 5, null, '2026-08-01T20:00:00Z')]);
t('reconcile: sin texto, <=1 día, mismas estrellas -> empate difuso', r.rows[0].id === 'LEG1' && r.stats.fuzzy === 1);

r = reconcile([row('LEG1', 5, '', T0)], [row('GBP1', 4, null, T0)]);
t('reconcile: estrellas distintas sin texto NO empatan', r.rows[0].id === 'GBP1' && r.stats.inserted === 1 && r.stats.legacyUnmatched === 1);

r = reconcile([row('LEG1', 5, 'Me encantó la crepa de cajeta', T0)], [row('GBP1', 2, 'Me encantó la crepa de cajeta', '2026-09-01T00:00:00Z')]);
t('reconcile: reseña editada (otras estrellas) empata por texto', r.rows[0].id === 'LEG1' && r.stats.edited === 1);

r = reconcile([row('LEG1', 5, 'x', T0, { raw_gbp_payload: { reviewId: 'GBP1' } })], [row('GBP1', 5, 'x', '2030-01-01T00:00:00Z')]);
t('reconcile: ya vinculada (payload.reviewId) se reconoce aunque cambie la fecha', r.rows[0].id === 'LEG1' && r.stats.linked === 1);

r = reconcile([row('LEG1', 5, 'Muy bueno', T0)], [row('GBP1', 5, 'Muy bueno', T0), row('GBP2', 5, 'Muy bueno', '2026-09-09T00:00:00Z')]);
t('reconcile: una fila vieja solo se usa una vez (no se duplica el id)', new Set(r.rows.map(x => x.id)).size === r.rows.length && r.stats.inserted === 1);

r = reconcile([], [row('GBP1', 5, 'a', T0), row('GBP2', 1, 'b', T0)]);
t('reconcile: base vacía -> todo se inserta con reviewId de GBP', r.rows.map(x => x.id).join() === 'GBP1,GBP2' && r.stats.inserted === 2);

r = reconcile([row('LEG1', 5, 'a', T0, { classification: { es_queja: false } })], [row('GBP1', 5, 'a', T0, { reply_text: 'gracias' })]);
t('reconcile: no envía classification (el upsert no la pisa)', !('classification' in r.rows[0]) && r.rows[0].reply_text === 'gracias');

r = reconcile([row('LEG1', 5, 'a', T0), row('LEG2', 5, 'b', T0)], []);
t('reconcile: filas históricas sin pareja no se tocan ni se borran', r.rows.length === 0 && r.stats.legacyUnmatched === 2);

// idempotencia: segunda pasada con lo ya vinculado
const first = reconcile([row('LEG1', 4, 'hola', T0)], [row('GBP1', 4, 'hola', T0), row('GBP2', 3, 'nueva', '2026-09-01T00:00:00Z')]);
const db2 = [row('LEG1', 4, 'hola', T0, { raw_gbp_payload: { reviewId: 'GBP1' } }), row('GBP2', 3, 'nueva', '2026-09-01T00:00:00Z', { raw_gbp_payload: { reviewId: 'GBP2' } })];
const second = reconcile(db2, [row('GBP1', 4, 'hola', T0), row('GBP2', 3, 'nueva', '2026-09-01T00:00:00Z')]);
t('reconcile: idempotente (2ª pasada = 0 inserciones, mismos ids)', first.rows.map(x => x.id).join() === 'LEG1,GBP2' && second.stats.inserted === 0 && second.rows.map(x => x.id).join() === 'LEG1,GBP2');

console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
