// Incidencias persistentes: el gerente abre y actualiza una de SU tienda; la base le niega otra tienda de su región.
// Escribe en la base real y lo limpia al final (clean-incidents.js). No correr en paralelo (cambia el perfil QA). node tests/e2e/incidencias.js
const { execFileSync } = require('child_process'), path = require('path');
const { launch, open, reporter, sleep } = require('./lib');
const run = (f, ...a) => execFileSync('node', [path.join(__dirname, f), ...a], { stdio: 'inherit' });
(async () => {
  const b = await launch(), { rec, summary } = reporter();
  run('set-profile.js', '{"rol":"gerente","region":"CDMX","sucursal":"carso"}');
  try {
    const page = await open(b, { region: null });
    await page.click('.brf-row'); await page.waitForSelector('.rv-incident--none', { timeout: 10000 });
    await page.click('.rv-incident--none'); await page.waitForSelector('#incForm', { timeout: 10000 });
    await page.click('.inc-chip--en_revision'); await page.fill('#incOwner', 'QA Gerente'); await page.fill('#incNote', 'Prueba automática');
    await page.click('#incSave'); await page.waitForFunction(() => /Guardado/.test(document.getElementById('incMsg').textContent), null, { timeout: 15000 });
    const hist = await page.evaluate(() => document.getElementById('incHistory').innerText);
    rec('gerente: abre una incidencia de su tienda con estado, responsable y bitácora', /En revisión/.test(hist) && /QA Gerente/.test(hist) && /Prueba automática/.test(hist), hist.replace(/\n+/g, ' ').slice(0, 120));
    // Cerrarla: aparece la estrella completa de «Atendida» una vez
    await page.click('.inc-chip--resuelta'); await page.click('#incSave');
    await page.waitForSelector('.inc-done', { timeout: 15000 }); await sleep(600);
    if (process.env.SHOT) await (await page.$('#incForm')).screenshot({ path: process.env.SHOT });
    rec('al resolverla aparece la estrella completa de «Atendida»', await page.evaluate(() => document.querySelectorAll('.inc-done').length === 1 && /Resuelta/.test(document.getElementById('incHistory').innerText)));
    await page.click('.inc-chip--en_revision'); await page.click('#incSave'); await page.waitForFunction(() => /Guardado/.test(document.getElementById('incMsg').textContent), null, { timeout: 15000 }); await sleep(800);
    // Persistencia: tras recargar, la base la devuelve
    await page.reload(); await page.waitForSelector('#briefHead', { timeout: 30000 }); await sleep(2000);
    const persisted = await page.evaluate(async () => { await Incidents.load(true); return [...Incidents.byReview.values()].map(i => i.status + '|' + i.owner + '|' + i.location_id); });
    rec('la incidencia persiste en la base', persisted.includes('en_revision|QA Gerente|carso'), JSON.stringify(persisted));
    // RLS: otra tienda de su región → la base la rechaza aunque se salte la interfaz
    const denied = await page.evaluate(async () => {
      const { data } = await supabaseClient.from('reviews_core').select('id, location_id').eq('location_id', 'tepeyac').limit(1);
      if (!data || !data.length) return 'sin reseña de prueba';
      const r = await supabaseClient.from('review_incidents').insert({ review_id: data[0].id, location_id: 'tepeyac', status: 'nueva', history: [] }).select();
      return r.error ? 'rechazada' : 'ACEPTADA';
    });
    rec('gerente: la base le niega abrir una incidencia de otra tienda', denied === 'rechazada', denied);
    process.exitCode = summary(page.errors);
  } finally { run('clean-incidents.js'); run('set-profile.js', '{"rol":"regional","region":"CDMX","sucursal":null}'); await b.close(); }
})().catch(e => { console.error('QA ERR', e.message); process.exit(1); });
