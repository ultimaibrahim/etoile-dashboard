#!/usr/bin/env node
/**
 * tests/incidents.test.js — Pruebas de js/incidents.js con un cliente de Supabase simulado (sin red).
 *   node tests/incidents.test.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');

// Cliente simulado con la misma superficie que usa el módulo: select / insert().select().single() / update().eq().select().single()
function fakeClient(opts = {}) {
  const rows = [];
  const client = {
    rows,
    from(table) {
      if (opts.missing) return { select: async () => ({ data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.review_incidents'" } }) };
      return {
        select: async () => ({ data: rows.map(r => ({ ...r })), error: null }),
        insert(row) { const rec = { id: 'inc-' + (rows.length + 1), opened_at: '2026-10-11T12:00:00Z', resolved_at: null, ...row }; if (opts.failInsert) return { select: () => ({ single: async () => ({ data: null, error: { message: 'RLS' } }) }) }; rows.push(rec); return { select: () => ({ single: async () => ({ data: { ...rec }, error: null }) }) }; },
        update(patch) { return { eq(col, val) { const rec = rows.find(r => r[col] === val); Object.assign(rec, patch); return { select: () => ({ single: async () => ({ data: { ...rec }, error: null }) }) }; } }; }
      };
    }
  };
  return client;
}

function load(client, opts = {}) {
  const ctx = {
    console, Date, Number, String, Object, Array, Map, Math, Promise, JSON,
    supabaseClient: client,
    escapeHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    resolveBranchMeta: (id) => ({ acoxpa: { id: 'acoxpa', region: 'CDMX' } }[id] || null),
    AppAuth: { profile: { nombre: 'Ana' } },
    Severity: { isCritical: (r) => r.stars === 1 && /intoxi/i.test(r.text || '') }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/incidents.js'), 'utf8') + ';globalThis.I = Incidents;', ctx);
  if (!opts.off) ctx.I.ENABLED = true;   // el módulo viene apagado por defecto
  return ctx.I;
}

(async () => {
  let pass = 0, fail = 0;
  const t = (name, cond, extra = '') => { if (cond) { pass++; console.log(`✅ PASS: ${name}`); } else { fail++; console.error(`❌ FAIL: ${name} ${extra}`); } };
  const grave = { id: 'R1', stars: 1, text: 'Me intoxiqué', sucursal: 'acoxpa' };
  const queja = { id: 'R2', stars: 2, text: 'Lento', sucursal: 'acoxpa' };
  const buena = { id: 'R3', stars: 5, text: 'Rico', sucursal: 'acoxpa' };

  // Apagado por defecto: ni siquiera pide la tabla
  let touched = false;
  const spy = { from() { touched = true; return { select: async () => ({ data: [], error: null }) }; } };
  let I0 = load(spy, { off: true });
  t('apagado por defecto: load() no consulta la base y no muestra nada', (await I0.load(true)) === false && I0.available === false && touched === false && I0.badgeHtml({ id: 'X', stars: 1, text: 'x', sucursal: 'acoxpa' }, { critical: true }) === '');

  // Tabla inexistente: se apaga sola y la interfaz no muestra nada
  let I = load(fakeClient({ missing: true }));
  t('sin tabla: load() → false y available=false', (await I.load(true)) === false && I.available === false);
  t('sin tabla: no hay botón en ninguna reseña', I.badgeHtml(grave, { critical: true }) === '' && I.badgeHtml(queja) === '');
  t('sin tabla: unresolved() devuelve la lista intacta', I.unresolved([grave, queja]).length === 2);

  // Con tabla
  const c = fakeClient(); I = load(c);
  t('con tabla: load() → true', (await I.load(true)) === true && I.available === true);
  t('botón "Dar seguimiento" en una grave (compacta)', /Dar seguimiento/.test(I.badgeHtml(grave, { critical: true, variant: 'compact' })));
  t('queja normal compacta: sin botón; completa: con botón', I.badgeHtml(queja, { variant: 'compact' }) === '' && /Dar seguimiento/.test(I.badgeHtml(queja, { variant: 'full' })));
  t('reseñas de 3★ o más nunca llevan seguimiento', I.badgeHtml(buena, { critical: true }) === '');

  // Abrir
  const s1 = await I.save(grave, { status: 'nueva', owner: 'Luis' }, 'Se llamó al cliente');
  t('abrir: guarda sucursal, severidad grave y primera entrada de bitácora', s1.location_id === 'acoxpa' && s1.severity === 'grave' && s1.history.length === 1 && s1.history[0].by === 'Ana' && s1.history[0].note === 'Se llamó al cliente');
  t('abrir: la queja normal queda como "queja"', (await I.save(queja, { status: 'en_revision' })).severity === 'queja');
  t('el botón pasa a mostrar el estado y el responsable', /rv-incident--nueva/.test(I.badgeHtml(grave, { critical: true })) && /Nueva · Luis/.test(I.badgeHtml(grave, { critical: true })));

  // Actualizar
  const s2 = await I.save(grave, { status: 'respondida' }, 'Respondida en Google');
  t('actualizar: cambia el estado y agrega a la bitácora (2 entradas)', s2.status === 'respondida' && s2.history.length === 2 && s2.owner === 'Luis');
  const s3 = await I.save(grave, { status: 'resuelta' }, 'Caso cerrado');
  t('resolver: marca resolved_at y la bitácora llega a 3', s3.status === 'resuelta' && !!s3.resolved_at && s3.history.length === 3);
  t('isResolved y unresolved() sacan lo ya resuelto', I.isResolved(grave) && I.unresolved([grave, queja]).length === 1);
  const s4 = await I.save(grave, { status: 'en_revision' }, 'Reabierta');
  t('reabrir: limpia resolved_at', s4.resolved_at === null && !I.isResolved(grave));
  t('cambiar el responsable sin tocar el estado', (await I.save(queja, { owner: 'Marta' }, '')).owner === 'Marta');

  // Abiertas
  t('open() cuenta solo las no resueltas (grave reabierta + queja = 2)', I.open().length === 2);
  await I.save(queja, { status: 'resuelta' }, 'ok');
  t('open() con filtro por sucursal', I.open(i => i.location_id === 'acoxpa').length === 1 && I.open(i => i.location_id === 'otra').length === 0);

  // Errores
  I = load(fakeClient({ failInsert: true })); await I.load(true);
  let threw = false; try { await I.save(grave, { status: 'nueva' }, ''); } catch (e) { threw = true; }
  t('un error al guardar se propaga (la interfaz lo muestra) y no deja datos a medias', threw && I.byReview.size === 0);

  // Seguridad del HTML
  I = load(fakeClient()); await I.load(true);
  await I.save({ id: 'R"><x', stars: 1, text: 'x', sucursal: 'acoxpa' }, { status: 'nueva', owner: '<b>Hack</b>' }, '');
  const html = I.badgeHtml({ id: 'R"><x', stars: 1, text: 'x', sucursal: 'acoxpa' }, { critical: true });
  t('el responsable y el id se escapan en el HTML', !/<b>Hack/.test(html) && !/R"><x/.test(html), html);

  console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
  process.exit(fail === 0 ? 0 : 1);
})();
