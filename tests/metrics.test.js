#!/usr/bin/env node
/** tests/metrics.test.js — definiciones únicas de cifras (js/metrics.js). Sin red. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/metrics.js'), 'utf8') + ';globalThis.M = Metrics;', ctx);
const M = ctx.M;
let pass = 0, fail = 0;
const t = (n, c, x = '') => { if (c) { pass++; console.log(`✅ PASS: ${n}`); } else { fail++; console.error(`❌ FAIL: ${n} ${x}`); } };
const r = (stars, text, reply) => ({ stars, text, responseFromOwnerText: reply });
t('1★ con texto es queja', M.isComplaint(r(1, 'pésimo')));
t('2★ con texto es queja', M.isComplaint(r(2, 'regular')));
t('1★ sin texto NO es queja (se descarta)', !M.isComplaint(r(1, '')) && !M.isComplaint(r(1, null)) && !M.isComplaint(r(1, undefined)));
t('texto de solo espacios cuenta como sin texto', !M.isComplaint(r(1, '   \n ')));
t('3★ con texto no es queja', !M.isComplaint(r(3, 'normal')));
t('null no rompe', !M.isComplaint(null) && !M.isComplaint(undefined));
const list = [r(1, 'a'), r(1, ''), r(2, 'b', 'gracias'), r(5, 'c'), r(2, ' ')];
t('complaints() filtra con la misma regla', M.complaints(list).length === 2);
t('sin respuesta: solo quejas sin respuesta', M.unrepliedComplaints(list).length === 1);
t('respuesta vacía no cuenta como respondida', !M.isReplied(r(1, 'a', '  ')) && M.isReplied(r(1, 'a', 'hola')));
t('promedio ponderado (no promedio de promedios)', Math.abs(M.weightedAvg([{ avg: 5, count: 90 }, { avg: 1, count: 10 }]) - 4.6) < 1e-9);
t('promedio ponderado ignora sucursales sin reseñas', M.weightedAvg([{ avg: 0, count: 0 }, { avg: 4, count: 2 }]) === 4 && M.weightedAvg([]) === 0);
console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
