// Interacciones finas: drawer (abre, Esc lo cierra y el foco vuelve), heatmap sucursal × mes (clic abre la celda),
// Comparar (intercambiar A⇄B) y navegación por la barra. Corre con el usuario QA tal cual (corporativo). node tests/e2e/vistas.js
const { launch, open, reporter, sleep } = require('./lib');
(async () => {
  const b = await launch(), { rec, summary } = reporter(), errors = [];
  const page = await open(b, { region: 'CDMX' });
  // 1) Drawer desde "Por atender"
  await page.focus('.brf-row'); await page.keyboard.press('Enter');
  await page.waitForSelector('.drawer-overlay.open, .sidebar-overlay.open, .drawer-overlay.active, .sidebar-overlay.active', { timeout: 10000 }).catch(() => {});
  const opened = await page.evaluate(() => [...document.querySelectorAll('.drawer-overlay')].some(e => getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && +getComputedStyle(e).opacity > 0));
  await page.keyboard.press('Escape'); await sleep(700);
  const closed = await page.evaluate(() => ![...document.querySelectorAll('.drawer-overlay')].some(e => getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && +getComputedStyle(e).opacity > 0));
  const focusBack = await page.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('brf-row'));
  rec('drawer: Enter en "Por atender" lo abre, Esc lo cierra', opened && closed, JSON.stringify({ opened, closed }));
  rec('drawer: al cerrar, el foco vuelve a la fila', focusBack, await page.evaluate(() => document.activeElement && document.activeElement.className));
  // 2) Heatmap sucursal × mes
  await page.evaluate(() => { location.hash = '#/dashboards'; }); await page.waitForSelector('#storyMatrix', { timeout: 20000 }); await sleep(2000);
  const cell = await page.evaluate(() => { DashboardsView.openMatrixCell(0, DashboardsView._matrix.months.length - 1); return document.querySelector('.drawer-overlay .drawer-heading') ? document.querySelector('.drawer-overlay .drawer-heading').innerText : ''; });
  await sleep(600);
  rec('heatmap: abrir una celda muestra sus reseñas en el drawer', cell.length > 3 || await page.evaluate(() => !!document.querySelector('.drawer-overlay .rv-card, .drawer-overlay .drawer-empty')), cell.slice(0, 80));
  await page.keyboard.press('Escape'); await sleep(500);
  // 3) Comparar: intercambio A⇄B
  await page.evaluate(() => { location.hash = '#/comparar'; }); await page.waitForSelector('#compareSelectA', { timeout: 20000 }); await sleep(1200);
  const before = await page.evaluate(() => [document.getElementById('compareSelectA').value, document.getElementById('compareSelectB').value]);
  await page.click('.cmp-swap'); await page.waitForFunction(b => document.getElementById('compareSelectA') && document.getElementById('compareSelectA').value === b[1], before, { timeout: 15000 }).catch(() => {});
  const after = await page.evaluate(() => [document.getElementById('compareSelectA').value, document.getElementById('compareSelectB').value]);
  rec('comparar: ⇄ intercambia A y B', before[0] && after[0] === before[1] && after[1] === before[0], JSON.stringify({ before, after }));
  // 4) Navegación por la barra y anuncio de vista
  await page.click('#mainNavDesktop a[href="#/"]'); await page.waitForSelector('#briefHead', { timeout: 20000 }); await sleep(800);
  rec('barra: Inicio vuelve y se anuncia', await page.evaluate(() => /Monitoreo Regional/.test(document.getElementById('routeAnnouncer').textContent)));
  errors.push(...page.errors); await page.context().close();
  process.exitCode = summary(errors); await b.close();
})().catch(e => { console.error('QA ERR', e.message); process.exit(1); });
