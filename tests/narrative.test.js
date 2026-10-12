#!/usr/bin/env node
/**
 * tests/narrative.test.js — Pruebas de js/narrative.js (los titulares de las gráficas). Sin red.
 *   node tests/narrative.test.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { Number, Math, Array, Object, String };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/narrative.js'), 'utf8') + ';globalThis.N = Narrative;', ctx);
const { N } = ctx;

let pass = 0, fail = 0;
const t = (name, cond, extra = '') => { if (cond) { pass++; console.log(`✅ PASS: ${name}`); } else { fail++; console.error(`❌ FAIL: ${name} ${extra}`); } };

// ranking
let s = N.ranking([{ nombre: 'Aztlán', score: 5, count: 25 }, { nombre: 'Plaza Carso', score: 2.33, count: 3 }, { nombre: 'Artz', score: 4.8, count: 6 }], 4.6);
t('ranking: dice cuántas están bajo la meta y la más rezagada', /1 de 3 sucursales están bajo la meta de 4.60★/.test(s) && /Plaza Carso con 2.33★, a 2.27 de la meta/.test(s), s);
t('ranking: avisa de la poca muestra de la rezagada (3 reseñas)', /solo 3 reseñas: poca muestra/.test(s), s);
t('ranking: con muestra suficiente no avisa', !/poca muestra/.test(N.ranking([{ nombre: 'X', score: 3, count: 20 }], 4.6)));
t('ranking: todas cumplen → lidera la mejor', /Las 2 sucursales con reseñas cumplen la meta de 4.60★; lidera A con 5.00★/.test(N.ranking([{ nombre: 'A', score: 5, count: 9 }, { nombre: 'B', score: 4.7, count: 9 }], 4.6)));
t('ranking: sin reseñas', N.ranking([{ nombre: 'A', score: 0, count: 0 }], 4.6) === 'Aún no hay reseñas este mes.');

// volumen
s = N.volume([{ nombre: 'Aztlán', count: 25, neg: 0 }, { nombre: 'Tepeyac', count: 10, neg: 4 }, { nombre: 'Artz', count: 5, neg: 0 }]);
t('volumen: la que concentra y la de mayor proporción de quejas', /Aztlán concentra el 63% de las 40 reseñas/.test(s) && /Tepeyac tiene la mayor proporción de quejas: 4 de 10 \(40%\)/.test(s), s);
t('volumen: sin quejas', /no hay quejas \(1-2★\) en ninguna sucursal/.test(N.volume([{ nombre: 'A', count: 5, neg: 0 }])));
t('volumen: quejas solo en sucursales con poca muestra no se acusan', /repartidas en sucursales con pocas reseñas/.test(N.volume([{ nombre: 'A', count: 20, neg: 0 }, { nombre: 'B', count: 2, neg: 1 }])));

// distribución
t('distribución: porcentaje de 5★ y cuántas de 1★', N.distribution([73, 1, 1, 0, 3]) === 'El 94% de las 78 opiniones son de 5★; las de 1★ son 3 (4%).', N.distribution([73, 1, 1, 0, 3]));
t('distribución: sin 1★', /no hay reseñas de 1★/.test(N.distribution([10, 0, 0, 0, 0])));

// tendencia de calificación
const L = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
s = N.ratingTrend(L, [4.9, 4.8, 4.5, 4.7, 4.75], 4.6);
t('tendencia: mejor y peor mes', /Mejor mes: Ene \(4.90★\); más bajo: Mar \(4.50★\)/.test(s), s);
t('tendencia: dirección del último mes frente al anterior', /May sube 0.05 frente a Abr/.test(s), s);
t('tendencia: cuántos meses bajo la meta', /1 de 5 meses quedaron bajo la meta de 4.60★/.test(s), s);
t('tendencia: ignora meses sin dato (null)', /Mejor mes: Ene/.test(N.ratingTrend(L, [4.9, null, 4.5, null, 4.7], 4.6)));
t('tendencia: mes en curso se avisa', /\(May aún está en curso\)/.test(N.ratingTrend(L, [4.9, 4.8, 4.5, 4.7, 4.75], 4.6, true)));
t('tendencia: estable', /Calificación estable en 4.80★/.test(N.ratingTrend(['A', 'B'], [4.8, 4.8], 4.6)));
t('tendencia: un solo mes', /Solo hay un mes con datos/.test(N.ratingTrend(['A'], [4.8], 4.6)));

// tendencia de volumen
t('volumen en el tiempo: variación porcentual', /baja 20% frente a Abr \(10 → 8\)/.test(N.volumeTrend(['Mar', 'Abr', 'May'], [30, 10, 8])));
t('volumen en el tiempo: mes en curso no se compara contra un mes completo', /May va con 8 reseñas \(mes en curso\)/.test(N.volumeTrend(['Mar', 'Abr', 'May'], [30, 10, 8], true)));

// matriz sucursal × mes
const M = (rows, labels = ['Ago 26', 'Sep 26', 'Oct 26']) => ({ months: labels.map(l => ({ label: l, full: l })), rows });
const row = (nombre, values, counts) => ({ nombre, values, counts, total: counts.reduce((x, y) => x + y, 0) });   // como lo arma Patterns.branchMonthMatrix
let mx = M([row('Tepeyac', [4.8, 4.9, 4.2], [10, 10, 9]), row('Artz', [4.5, 4.4, 4.9], [8, 8, 8]), row('Aztlán', [4.9, 4.9, 4.9], [20, 20, 20])]);
s = N.matrix(mx, 4.6);
t('matriz: cuántas están bajo la meta este mes', /1 de 3 sucursales con reseñas suficientes están bajo la meta de 4.60★ en Oct 26/.test(s), s);
t('matriz: mayor caída con antes → después', /Mayor caída: Tepeyac \(-0.70★ frente a Sep 26: 4.90 → 4.20\)/.test(s), s);
t('matriz: mayor mejora', /Mayor mejora: Artz \(\+0.50★\)/.test(s), s);
t('matriz: ignora sucursales con muestra chica (< 5) en alguno de los meses', !/Tepeyac/.test(N.matrix(M([row('Tepeyac', [4.8, 4.9, 3.0], [10, 10, 2]), row('Aztlán', [4.9, 4.9, 4.9], [20, 20, 20])]), 4.6).replace(/^.*?Mayor/, 'Mayor')) || /0 de 1/.test(N.matrix(M([row('Tepeyac', [4.8, 4.9, 3.0], [10, 10, 2]), row('Aztlán', [4.9, 4.9, 4.9], [20, 20, 20])]), 4.6)));
t('matriz: nadie se movió más de 0.10★', /Ninguna sucursal se movió más de 0.10★ frente a Sep 26/.test(N.matrix(M([row('A', [4.8, 4.8, 4.82], [9, 9, 9]), row('B', [4.7, 4.7, 4.7], [9, 9, 9])]), 4.6)));
t('matriz: mes en curso se avisa', /Oct 26 \(en curso\)/.test(N.matrix(mx, 4.6, true)));
t('matriz: con pocas reseñas en el último mes no afirma nada', /Aún hay pocas reseñas en Oct 26/.test(N.matrix(M([row('A', [4.8, 4.8, 3.0], [9, 9, 2])]), 4.6)));
const sw = N.matrix(M([row('Aztlán', [4.9, 4.9, 4.9], [20, 20, 20]), row('Plaza Carso', [5, 4.8, 2.33], [6, 6, 3]), row('Tepeyac', [4.8, 4.8, 3.0], [9, 9, 1])]), 4.6);
t('matriz: avisa de calificaciones muy bajas con pocas reseñas (a vigilar), de la peor a la mejor', /A vigilar \(pocas reseñas\): Plaza Carso \(2.33★, 3 reseñas\), Tepeyac \(3.00★, 1 reseña\)\./.test(sw), sw);
t('matriz: sin esos casos no añade el aviso', !/A vigilar/.test(N.matrix(mx, 4.6)));
t('matriz: sin datos', N.matrix({ months: [], rows: [] }, 4.6) === 'Aún no hay reseñas para comparar sucursales.');
s = N.matrixVolume(M([row('A', [4, 4, 4], [10, 30, 5]), row('B', [4, 4, 4], [5, 5, 5])]));
t('matriz de volumen: mes pico y sucursal con más volumen', /El mes con más reseñas fue Sep 26 \(35\)/.test(s) && /A es la sucursal con más volumen: 45 reseñas en 3 meses \(15 al mes\)/.test(s), s);

console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
