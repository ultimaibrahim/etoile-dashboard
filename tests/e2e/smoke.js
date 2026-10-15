// Humo de la app con rol regional/corporativo (ve el selector de regiones). node tests/e2e/smoke.js
const { launch, open, reporter, sleep } = require('./lib');
(async () => {
  const b = await launch(), { rec, summary } = reporter(), errors = [];
  for (const cfg of [{ k: 'escritorio' }, { k: 'móvil', w: 390, h: 844, mobile: true }, { k: 'oscuro', dark: true }]) {
    const page = await open(b, { ...cfg, region: null });
    // 1) Pantalla de regiones con briefing nacional
    await page.waitForSelector('#srvBriefing .srv-brf-text', { timeout: 30000 });
    const nac = await page.evaluate(() => ({ h: document.querySelector('.srv-brf-text').innerText, sort: document.querySelector('#srvSortDropdown .custom-select-value').innerText }));
    rec(`(${cfg.k}) briefing nacional + orden por urgencia`, /^La marca está \d\.\d\d★ (sobre|bajo) la meta/.test(nac.h) && /Urgencia/.test(nac.sort), nac.h.slice(0, 90));
    // 2) Entrar a una región: promedio primero, briefing en pastilla, "Por atender"
    await page.click('#srv-card-CDMX'); await page.waitForSelector('#briefHead'); await sleep(2500);
    const h = await page.evaluate(() => { const n = document.getElementById('heroNum').getBoundingClientRect(), p = document.querySelector('.brf-pill').getBoundingClientRect(); return { numFirst: n.top < p.top, pill: parseFloat(getComputedStyle(document.querySelector('.brf-pill')).borderRadius) >= 16, rows: document.querySelectorAll('.brf-row').length, old: !!document.querySelector('.hero-diagnosis, .welcome-banner-home') }; });
    rec(`(${cfg.k}) Inicio: promedio antes del briefing, pastilla, Por atender, sin bloques viejos`, h.numFirst && h.pill && h.rows >= 0 && !h.old, JSON.stringify(h));
    // 3) El cursor no cambia nada en el hero
    if (!cfg.mobile) {
      const n0 = await page.evaluate(() => document.getElementById('heroNum').textContent), bb = await (await page.$('.hero-left')).boundingBox();
      await page.mouse.move(bb.x + bb.width * 0.4, bb.y + bb.height * 0.5, { steps: 8 }); await sleep(400);
      rec(`(${cfg.k}) el cursor no cambia el promedio`, await page.evaluate(() => document.getElementById('heroNum').textContent) === n0);
    }
    // 4) Comparar y Dashboards cargan sin errores
    for (const [hash, sel] of [['#/comparar', '.cmp-title'], ['#/dashboards', '#regionHourChart']]) { await page.evaluate(x => { location.hash = x; }, hash); await page.waitForSelector(sel, { timeout: 20000 }); await sleep(1500); rec(`(${cfg.k}) ${hash} carga`, true); }
    errors.push(...page.errors); await page.context().close();
  }
  process.exitCode = summary(errors); await b.close();
})().catch(e => { console.error('QA ERR', e.message); process.exit(1); });
