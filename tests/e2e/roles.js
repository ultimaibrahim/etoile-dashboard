// Entrada y alcance por rol (modelo de Ibrahim): gerente = su tienda y su región; zonal = su región y puede ir a otras;
// corporativo (admin/regional) = selector nacional + Étoile Corporativo (eso lo cubre smoke). Cambia el perfil QA y lo restaura.
// node tests/e2e/roles.js   (no correr en paralelo con otras pruebas: comparten el usuario QA)
const { execFileSync } = require('child_process'), path = require('path');
const { launch, open, reporter, sleep } = require('./lib');
const setP = j => execFileSync('node', [path.join(__dirname, 'set-profile.js'), j], { stdio: 'inherit' });
const go = async (page, h) => { await page.evaluate(x => { location.hash = x; }, h); await sleep(1800); return page.evaluate(() => location.hash); };
(async () => {
  const b = await launch(), { rec, summary } = reporter(), errors = [];
  try {
    // Gerente de tienda (Plaza Carso, CDMX)
    setP('{"rol":"gerente","region":"CDMX","sucursal":"carso"}');
    let page = await open(b, { region: null });
    const s = await page.evaluate(() => ({ h: document.getElementById('briefHead').innerText, num: document.getElementById('heroNum').textContent, stats: [...document.querySelectorAll('.hero-stat')].map(e => e.innerText.replace(/\n+/g, ' ')), rows: [...document.querySelectorAll('.brf-row b')].map(e => e.innerText), explore: (document.querySelector('.hero-explore') || {}).innerText || '', mine: !!document.querySelector('#mainNavDesktop a[href="#/sucursal/carso"]'), regions: !!document.querySelector('.topbar-link-regions') }));
    rec('gerente: entra directo a Inicio con su sucursal', /^Plaza Carso va en/.test(s.h), s.h.slice(0, 100));
    rec('gerente: la calificación grande y las tarjetas son de su tienda', /^\d\.\d\d$/.test(s.num) && /posición/i.test(s.stats[1]) && /quejas sin respuesta/i.test(s.stats[2]), JSON.stringify(s.stats));
    rec('gerente: "Por atender" solo muestra quejas de su sucursal', s.rows.every(n => /Carso/.test(n)), JSON.stringify(s.rows));
    rec('gerente: botón para explorar su región + "Mi sucursal" en la barra, sin "Regiones"', /^Explora las otras \d+ tiendas de Ciudad de México/.test(s.explore) && s.mine && !s.regions, JSON.stringify(s));
    await page.click('.hero-explore'); await sleep(1200);
    rec('gerente: el botón lleva a las tiendas de la región', await page.evaluate(() => { const r = document.getElementById('branchGrid').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }));
    rec('gerente: sin selector de regiones ni Étoile Corporativo', (await go(page, '#/select-region')) === '#/403' && (await go(page, '#/brand')) === '#/403');
    rec('gerente: sucursal de otra región bloqueada; la suya abre', (await go(page, '#/sucursal/andares')) === '#/403' && (await go(page, '#/sucursal/carso')) === '#/sucursal/carso');
    errors.push(...page.errors); await page.context().close();

    // Zonal de CDMX
    setP('{"rol":"zonal","region":"CDMX","sucursal":null}');
    page = await open(b, { region: null });
    const z = await page.evaluate(() => ({ head: !!document.getElementById('briefHead'), h: (document.getElementById('briefHead') || {}).innerText || '', regions: !!document.querySelector('.topbar-link-regions'), explore: !!document.querySelector('.hero-explore') }));
    rec('zonal: entra directo a Inicio de su región, con botón "Regiones"', z.head && /^Ciudad de México/.test(z.h) && z.regions && !z.explore, JSON.stringify(z));
    await go(page, '#/select-region'); await page.waitForSelector('#srvContainer', { timeout: 20000 }); await sleep(1500);
    const zs = await page.evaluate(() => ({ mine: [...document.querySelectorAll('.srv-card-mine')].map(e => e.closest('.srv-card').id), corp: !!document.querySelector('.brand-shortcut-card') }));
    rec('zonal: ve las demás regiones, la suya marcada, sin Étoile Corporativo', zs.mine.join() === 'srv-card-CDMX' && !zs.corp, JSON.stringify(zs));
    await page.click('#srv-card-GDL'); await page.waitForSelector('#briefHead', { timeout: 30000 }); await sleep(1500);
    rec('zonal: puede entrar a otra región', /^Guadalajara/.test(await page.evaluate(() => document.getElementById('briefHead').innerText)));
    rec('zonal: Étoile Corporativo bloqueado', (await go(page, '#/brand')) === '#/403');
    errors.push(...page.errors); await page.context().close();
    process.exitCode = summary(errors);
  } finally { setP('{"rol":"regional","region":"CDMX","sucursal":null}'); await b.close(); }
})().catch(e => { console.error('QA ERR', e.message); process.exit(1); });
