#!/usr/bin/env node
/**
 * tests/severity.test.js — Pruebas de js/severity.js (qué reseñas son críticas y por qué). Sin red.
 *   node tests/severity.test.js
 * La calibración se validó contra las quejas reales: ~4.6% de las ≤2★ con texto resultan críticas.
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { Date, Number, String, Object, Array, Math, Infinity };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/severity.js'), 'utf8') + ';globalThis.S = Severity;', ctx);
const { S } = ctx;

let pass = 0, fail = 0;
const t = (name, cond, extra = '') => { if (cond) { pass++; console.log(`✅ PASS: ${name}`); } else { fail++; console.error(`❌ FAIL: ${name} ${extra}`); } };
const rv = (stars, text, iso = '2026-10-10T03:00:00Z') => ({ stars, text, publishedAtDate: iso });
const ids = (r) => S.analyze(r).reasons.map(x => x.id);

// Alcance
t('sin texto nunca es crítica (Regla LCP #11)', !S.analyze(rv(1, '')).critical && S.analyze(rv(1, null)).score === 0);
t('3★ o más no se evalúa', S.analyze(rv(3, 'horrible intoxicación')).score === 0 && S.analyze(rv(5, 'x')).score === 0);

// Lo común NO es crítico: servicio malo, lento, caro, grosero
t('1★ corta y sin gravedad → NO crítica (2 pts)', (() => { const a = S.analyze(rv(1, 'No me gustó')); return a.score === 2 && !a.critical; })());
t('"Pésimo servicio, muy lento" → NO crítica', !S.analyze(rv(1, 'Pésimo servicio, son demasiado lentos, 40 minutos para una crepa.')).critical);
t('1★ solo grosera → NO crítica (2+2 = 4)', (() => { const a = S.analyze(rv(1, 'La encargada fue muy grosera')); return a.score === 4 && !a.critical; })());
t('1★ muy extensa sin gravedad → NO crítica (2+1 = 3)', !S.analyze(rv(1, 'a'.repeat(550))).critical);
t('2★ con higiene sola → NO crítica', !S.analyze(rv(2, 'Estaba sucio el lugar')).critical);

// Lo grave basta con 1-2★
t('1★ con intoxicación → crítica, razón Salud', (() => { const a = S.analyze(rv(1, 'Me intoxiqué con la crepa')); return a.critical && ids(rv(1, 'Me intoxiqué con la crepa')).includes('salud'); })());
t('2★ con una mosca en la bebida → crítica (1+5 = 6)', S.analyze(rv(2, 'Había una mosca en la bebida')).critical);
t('alergia mal atendida → crítica', S.analyze(rv(1, 'Soy alérgica a la nuez y no me avisaron')).critical);
t('plástico en la comida → crítica', S.analyze(rv(1, 'Vi un plástico en mi crepa')).critical);
t('acentos y mayúsculas no importan', ids(rv(1, 'CUCARACHA EN LA MESA')).includes('plagas') && ids(rv(1, 'Había una cucarácha')).includes('plagas'));
t('mención de Profeco → crítica', S.analyze(rv(1, 'Voy a avisar a Profeco')).critical);

// Se acumula lo serio
t('1★ con trato + higiene → crítica (2+2+2 = 6)', (() => { const a = S.analyze(rv(1, 'Fueron groseros y el lugar estaba sucio')); return a.critical && a.score === 6; })());

// Falsos positivos conocidos (detectados al validar con datos reales)
t('"me tocó un cabello" no es acoso (es "me salió")', !ids(rv(1, 'Me tocó un cabello en mi crepa')).includes('acoso') && ids(rv(1, 'Me tocó un cabello en mi crepa')).includes('objeto'));
t('"por demanda uno tiene que trabajar rápido" no es legal', !ids(rv(1, 'Entiendo que por demanda uno tiene que trabajar rápido')).includes('legal'));
t('"es un robo" (precio) no cuenta como cobro indebido; "me robaron" sí', !ids(rv(1, 'Siento que es un robo lo que cobran')).includes('cobro') && ids(rv(1, 'Me robaron en la caja')).includes('cobro'));

// Explicabilidad
t('cada categoría suma una sola vez', S.analyze(rv(1, 'cucaracha cucaracha cucaracha rata')).score === 7);
t('las razones se pueden mostrar (etiquetas)', S.analyze(rv(1, 'Me intoxiqué y fueron groseros')).reasons.map(x => x.label).join(',') === '1★,Salud,Trato');
t('cada razón guarda la palabra que la disparó', S.analyze(rv(1, 'Me intoxiqué con la crepa')).reasons.find(x => x.id === 'salud').match === 'intoxiq');

// criticalIn
const now = Date.parse('2026-10-11T12:00:00Z');
const lista = [
  rv(1, 'Me intoxiqué', '2026-10-09T03:00:00Z'),
  rv(1, 'Me intoxiqué', '2026-10-10T03:00:00Z'),
  rv(1, 'Me intoxiqué', '2026-09-01T03:00:00Z'),
  rv(5, 'Excelente', '2026-10-10T05:00:00Z'),
  rv(1, 'No me gustó', '2026-10-10T06:00:00Z')
];
const rec = S.criticalIn(lista, 14, now);
t('criticalIn: solo críticas de los últimos 14 días', rec.length === 2, `n=${rec.length}`);
t('criticalIn: de la más reciente a la más antigua', rec.length === 2 && rec[0].publishedAtDate > rec[1].publishedAtDate);
t('criticalIn sin límite de días trae todas las críticas', S.criticalIn(lista, null, now).length === 3);

console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
