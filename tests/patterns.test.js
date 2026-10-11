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

console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
