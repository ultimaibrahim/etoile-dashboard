// Utilidades compartidas de las pruebas de navegador (Playwright). Requiere la app en QA_BASE (netlify dev: http://localhost:8888)
// y un usuario QA en tests/e2e/.qa_user.json (créalo con `node tests/e2e/make-qa-user.js`; está en .gitignore).
const fs = require('fs'), path = require('path');
const pw = (() => { try { return require('playwright-core'); } catch (e) { return require(process.env.PLAYWRIGHT_CORE || path.join(process.env.HOME, '.cache/motion-graphic/node_modules/playwright-core')); } })();
const BASE = process.env.QA_BASE || 'http://localhost:8888';
const CHROME = process.env.CHROME || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const creds = () => JSON.parse(fs.readFileSync(path.join(__dirname, '.qa_user.json'), 'utf8'));
const launch = () => pw.chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

/** Abre una página con sesión iniciada. Si el rol ve el selector de regiones, entra a `region` (null = se queda en el selector). */
async function open(browser, { w = 1280, h = 900, mobile = false, dark = false, region = 'CDMX' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message.slice(0, 200)));
  await page.addInitScript(d => { try { localStorage.setItem('lcp_walkthrough_seen', 'true'); localStorage.setItem('lcpDark', d ? '1' : '0'); } catch (e) {} }, dark);
  const c = creds();
  // El login de Supabase a veces no sale al primer clic (intermitente, también sin cambios en la app): un reintento.
  for (let attempt = 1; ; attempt++) {
    await page.goto(BASE + '/#/login');
    await page.waitForFunction(() => typeof supabaseClient !== 'undefined' && supabaseClient && typeof Router !== 'undefined' && Router.current === '#/login' && !!document.getElementById('login-submit-btn'), null, { timeout: 30000 });
    await page.fill('#login-email', c.email); await page.fill('#login-password', c.password); await page.click('#login-submit-btn');
    try { await page.waitForSelector('#srvContainer, #briefHead', { timeout: 25000 }); break; } catch (e) { if (attempt >= 2) throw e; }
  }
  if (region && await page.$('#srvContainer')) { await page.click(`#srv-card-${region}`); await page.waitForSelector('#briefHead', { timeout: 30000 }); }
  await sleep(2500);   // conteo animado del hero y primeras cargas
  return page;
}

/** Registro de resultados: rec(nombre, ok, detalle); summary() imprime y devuelve el código de salida */
function reporter() {
  const r = [];
  return {
    rec(n, ok, x = '') { r.push(ok); console.log((ok ? '✅' : '❌') + ' ' + n + (x ? ' — ' + x : '')); },
    summary(errors = []) { const ok = r.filter(Boolean).length; console.log(JSON.stringify({ resultados: `${ok}/${r.length} ok`, errores_consola: errors })); return ok === r.length && !errors.length ? 0 : 1; }
  };
}
module.exports = { BASE, sleep, launch, open, reporter, creds };
