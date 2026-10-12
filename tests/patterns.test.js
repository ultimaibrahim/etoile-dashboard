#!/usr/bin/env node
/**
 * tests/patterns.test.js — Pruebas de js/patterns.js (quejas por hora local y titular). Sin red.
 *   node tests/patterns.test.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { Intl, Date, Number, String, Object, Array, Math, isNaN, resolveBranchMeta: (id) => ({ andares: { region: 'GDL' }, cancun1: { region: 'CUN' } }[id] || null) };
vm.createContext(ctx);
for (const f of ['time.js', 'patterns.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', f), 'utf8'), ctx);
vm.runInContext('globalThis.P = Patterns; globalThis.BT = BranchTime;', ctx);
const { P } = ctx;

let pass = 0, fail = 0;
const t = (name, cond, extra = '') => { if (cond) { pass++; console.log(`✅ PASS: ${name}`); } else { fail++; console.error(`❌ FAIL: ${name} ${extra}`); } };

// Reseña publicada a la hora local `h` (Ciudad de México = UTC-6 → UTC = h+6)
const at = (h, stars, text = 'texto', sucursal = 'andares') => ({ publishedAtDate: `2026-10-05T${String((h + 6) % 24).padStart(2, '0')}:30:00Z`, stars, text, sucursal });

let h = P.hourly([at(21, 1), at(21, 2), at(21, 5), at(13, 1), at(13, 5, '')]);
t('hourly usa la hora local (21:30 local, no UTC)', h.neg[21] === 2 && h.tot[21] === 3 && h.neg[3] === 0, JSON.stringify(h.neg));
t('hourly excluye reseñas sin texto (Regla LCP #11)', h.tot[13] === 1 && h.n === 4, `n=${h.n}, tot13=${h.tot[13]}`);
t('hourly cuenta quejas ≤ 2★', h.nNeg === 3);
t('hourly respeta el huso de Cancún', P.hourly([at(21, 1, 'x', 'cancun1')]).neg[21] === 0 && P.hourly([at(21, 1, 'x', 'cancun1')]).neg[22] === 1);

t('peakWindow encuentra la franja con más quejas', (() => { const n = Array(24).fill(0); n[20] = 4; n[21] = 5; n[22] = 3; n[10] = 6; const w = P.peakWindow(n, 3); return w.start === 20 && w.end === 22 && w.count === 12; })());
t('peakWindow sin quejas → null', P.peakWindow(Array(24).fill(0)) === null);

// Titular: pocas quejas → no afirma patrón
let hs = P.headline(P.hourly([at(21, 1), at(21, 2)]));
t('titular con < 5 quejas no afirma patrón', !hs.enough && /pocas quejas \(2\)/.test(hs.text), hs.text);

// Concentración: 8 quejas a las 20-22 h, pero solo 8 de 60 reseñas con texto caen ahí
const rs = [];
for (let i = 0; i < 8; i++) rs.push(at(21, 1));
for (let i = 0; i < 52; i++) rs.push(at(10 + (i % 3), 5));
hs = P.headline(P.hourly(rs));
t('titular detecta concentración (100% de quejas vs ~13% de reseñas)', hs.enough && hs.concentrated && hs.share === 100 && hs.expected === 13, JSON.stringify({ s: hs.share, e: hs.expected }));
t('titular menciona la franja en 24 h', /20:00 y 22:59|19:00 y 21:59|21:00 y 23:59/.test(hs.text), hs.text);

// Sin concentración: quejas repartidas como el volumen
const rs2 = [];
for (let hr = 9; hr <= 20; hr++) { for (let i = 0; i < 5; i++) rs2.push(at(hr, 5)); rs2.push(at(hr, 1)); }
hs = P.headline(P.hourly(rs2));
t('titular honesto si las quejas siguen al volumen', hs.enough && !hs.concentrated && /ritmo del volumen/.test(hs.text), hs.text);

// collect: ventana de 12 meses hacia atrás
ctx.DataLoader = { getMonth: (y, m) => (y === 2026 && m === 10) ? { reviews: [at(21, 1)] } : (y === 2025 && m === 11) ? { reviews: [at(21, 1), at(9, 5)] } : (y === 2025 && m === 10) ? { reviews: [at(1, 1)] } : null };
t('collect toma 12 meses hacia atrás (incluye nov-2025, excluye oct-2025)', P.collect(2026, 10, 12).length === 3, `n=${P.collect(2026, 10, 12).length}`);
t('collect aplica el filtro', P.collect(2026, 10, 12, r => r.stars === 5).length === 1);

// monthSpan y matriz sucursal × mes
const sp = P.monthSpan(2026, 2, 4);
t('monthSpan: 4 meses terminando en feb-2026, del más antiguo al más reciente', sp.map(x => `${x.y}-${x.m}`).join() === '2025-11,2025-12,2026-1,2026-2', JSON.stringify(sp.map(x => x.label)));
t('monthSpan: etiqueta corta y larga', sp[3].label === 'Feb 26' && sp[3].full === 'Feb 2026');
ctx.DataLoader = { computeBranchStats: (y, m, id) => ({ a: { '2026-1': [10, 5.0], '2026-2': [10, 4.0] }, b: { '2026-2': [4, 3.0] }, c: {} }[id] || {})[`${y}-${m}`] ? { count: ({ a: { '2026-1': [10, 5.0], '2026-2': [10, 4.0] }, b: { '2026-2': [4, 3.0] } }[id][`${y}-${m}`])[0], avg: ({ a: { '2026-1': [10, 5.0], '2026-2': [10, 4.0] }, b: { '2026-2': [4, 3.0] } }[id][`${y}-${m}`])[1] } : { count: 0, avg: 0 } };
const mx = P.branchMonthMatrix([{ id: 'a', abr: 'A', nombre: 'Aa' }, { id: 'b', abr: 'B' }, { id: 'c', abr: 'C' }], 2026, 2, 4);
t('matriz: omite sucursales sin reseñas en la ventana', mx.rows.length === 2 && !mx.rows.some(r => r.id === 'c'));
t('matriz: valores y conteos por mes (null donde no hay reseñas)', JSON.stringify(mx.rows[0].values) === '[null,null,5,4]' && JSON.stringify(mx.rows[0].counts) === '[0,0,10,10]');
t('matriz: ordenada de mejor a peor media ponderada (A 4.5 antes que B 3.0)', mx.rows[0].id === 'a' && Math.abs(mx.rows[0].mean - 4.5) < 1e-9 && mx.rows[1].id === 'b');
t('matriz: el nombre cae al abreviado si falta', mx.rows[1].nombre === 'B');

console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
