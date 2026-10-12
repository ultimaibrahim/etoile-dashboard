#!/usr/bin/env node
/**
 * tests/time.test.js — Pruebas de js/time.js (hora local de cada sucursal, 24 h). Sin red.
 *   node tests/time.test.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { Intl, Date, Number, String, Object, isNaN, resolveBranchMeta: (id) => ({ andares: { region: 'GDL' }, cancun1: { region: 'CUN' }, tj1: { region: 'TJ' } }[id] || null) };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/time.js'), 'utf8') + ';globalThis.BT = BranchTime; globalThis.rw = reviewWhen;', ctx);
const { BT, rw } = ctx;

let pass = 0, fail = 0;
const t = (name, cond, extra = '') => { if (cond) { pass++; console.log(`✅ PASS: ${name}`); } else { fail++; console.error(`❌ FAIL: ${name} ${extra}`); } };

// 2026-10-10T03:00:00Z = viernes 9-oct 21:00 en Ciudad de México (UTC-6, sin horario de verano)
const iso = '2026-10-10T03:00:00Z';
let p = BT.partsFor(iso, 'andares');
t('GDL/CDMX: 03:00Z → 21:00 del día anterior (no UTC)', p.hour === 21 && p.day === 9 && p.month === 10, JSON.stringify(p));
t('día de la semana: viernes = 5 (0 = domingo)', p.dow === 5, `dow=${p.dow}`);
p = BT.partsFor(iso, 'cancun1');
t('Cancún (UTC-5): 22:00', p.hour === 22 && p.day === 9, JSON.stringify(p));
p = BT.partsFor(iso, 'tj1');
t('Tijuana en octubre (UTC-7 por horario de verano): 20:00', p.hour === 20 && p.day === 9, JSON.stringify(p));
p = BT.partsFor('2026-01-15T03:00:00Z', 'tj1');
t('Tijuana en enero (UTC-8): 19:00', p.hour === 19 && p.day === 14, JSON.stringify(p));

// Por región directa, por objeto reseña y por defecto
t('tzFor región CUN / TJ / otra', BT.tzFor('CUN') === 'America/Cancun' && BT.tzFor('TJ') === 'America/Tijuana' && BT.tzFor('GDL') === 'America/Mexico_City');
t('tzFor reseña con region propia', BT.tzFor({ region: 'CUN', sucursal: 'andares' }) === 'America/Cancun');
t('tzFor reseña solo con sucursal', BT.tzFor({ sucursal: 'tj1' }) === 'America/Tijuana');
t('tzFor desconocido → Ciudad de México', BT.tzFor('nada') === 'America/Mexico_City' && BT.tzFor(null) === 'America/Mexico_City');

// Etiquetas
t("etiqueta 'short' = '9 oct · 21:00'", rw({ publishedAtDate: iso, sucursal: 'andares' }, 'short') === '9 oct · 21:00', rw({ publishedAtDate: iso, sucursal: 'andares' }, 'short'));
t("etiqueta 'long' = '09 Oct 2026 · 21:00'", rw({ publishedAtDate: iso, sucursal: 'andares' }, 'long') === '09 Oct 2026 · 21:00');
t("etiqueta 'date' sin hora", rw({ publishedAtDate: iso, sucursal: 'andares' }, 'date') === '09 Oct 2026');
t("etiqueta 'time' = '21:00'", rw({ publishedAtDate: iso, sucursal: 'andares' }, 'time') === '21:00');
t('medianoche local es 00:00 (no 24:00)', BT.partsFor('2026-10-10T06:00:00Z', 'andares').hour === 0 && rw({ publishedAtDate: '2026-10-10T06:05:00Z', sucursal: 'andares' }, 'time') === '00:05');
t('sin fecha → texto de respaldo; fecha inválida → vacío', rw({}, 'short') === 'Reciente' && rw({}, 'long') === 'Sin fecha' && BT.label('basura', 'andares') === '');

// corte de mes en hora de CDMX
t('corte de mes: octubre 2026 empieza a las 06:00 UTC (CDMX UTC-6)', BT.monthStartIso(2026, 10) === '2026-10-01T06:00:00.000Z', BT.monthStartIso(2026, 10));
t('corte de mes: mayo 2020 con horario de verano empieza a las 05:00 UTC', BT.monthStartIso(2020, 5) === '2020-05-01T05:00:00.000Z', BT.monthStartIso(2020, 5));
t('corte de mes: la cena del 31 pertenece a octubre aunque en UTC ya sea noviembre', JSON.stringify(BT.monthOf('2026-11-01T05:30:00Z')) === '{"y":2026,"m":10}');
t('corte de mes: el 1 a las 00:10 de CDMX ya es noviembre', JSON.stringify(BT.monthOf('2026-11-01T06:10:00Z')) === '{"y":2026,"m":11}');
t('corte de mes: diciembre → enero cruza de año', BT.monthStartIso(2027, 1) === '2027-01-01T06:00:00.000Z');

console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
