// Entrada a étoile: sin sesión la raíz lleva a la página de inicio (/info/) y un enlace profundo al login (/login/);
// el login es su propia página, manda a cada rol a su pantalla, y cerrar sesión regresa al login. node tests/e2e/acceso.js
const { launch, open, BASE, reporter, sleep } = require('./lib');
(async () => {
  const b = await launch(), { rec, summary } = reporter(), errors = [];
  const ctx = await b.newContext(); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  const lands = async (url, rx) => { await p.goto(BASE + url); await p.waitForURL(rx, { timeout: 30000 }).catch(() => {}); return rx.test(p.url()); };
  rec('sin sesión: la raíz lleva a la página de inicio', await lands('/', /\/info\/$/), p.url());
  rec('sin sesión: un enlace profundo lleva al login', await lands('/#/dashboards', /\/login\/$/), p.url());
  rec('el enlace viejo #/login lleva al login nuevo', await lands('/#/login', /\/login\/$/), p.url());
  await p.goto(BASE + '/info/'); await p.click('a[href="/login/"]'); await p.waitForURL(/\/login\/$/);
  rec('«Entrar a Étoile» en la página de inicio abre el login', /\/login\/$/.test(p.url()));
  await ctx.close();
  const pg = await open(b, { region: null });
  rec('al entrar, corporativo cae en el selector nacional', /#\/select-region$/.test(pg.url()), pg.url());
  await pg.goto(BASE + '/login/'); await pg.waitForURL(/#\//, { timeout: 30000 }).catch(() => {});
  rec('con sesión vigente, /login/ entra directo', /#\/select-region$/.test(pg.url()), pg.url());
  await pg.waitForSelector('#srvContainer', { timeout: 30000 }).catch(() => {});   // como una persona: sale cuando la app ya cargó
  await pg.evaluate(() => AppAuth.logout()); await pg.waitForURL(/\/login\/$/, { timeout: 30000 }).catch(() => {}); await sleep(1200);
  rec('cerrar sesión regresa al login y pide datos', /\/login\/$/.test(pg.url()) && !!(await pg.$('#login-email')), pg.url());
  errors.push(...pg.errors); await pg.context().close();
  process.exitCode = summary(errors); await b.close();
})().catch(e => { console.error('QA ERR', e.message); process.exit(1); });
