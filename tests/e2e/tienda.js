// Vista de gerente de tienda (cuenta con sucursal). Cambia el perfil QA a gerente de Plaza Carso y lo restaura al terminar. node tests/e2e/tienda.js
const { execFileSync } = require('child_process'), path = require('path');
const { launch, open, reporter } = require('./lib');
const setP = j => execFileSync('node', [path.join(__dirname, 'set-profile.js'), j], { stdio: 'inherit' });
(async () => {
  setP('{"rol":"gerente","region":"CDMX","sucursal":"carso"}');
  const b = await launch(), { rec, summary } = reporter();
  try {
    const page = await open(b, { region: null });
    const s = await page.evaluate(() => ({ h: document.getElementById('briefHead').innerText, num: document.getElementById('heroNum').textContent, stats: [...document.querySelectorAll('.hero-stat')].map(e => e.innerText.replace(/\n+/g, ' ')), rows: [...document.querySelectorAll('.brf-row b')].map(e => e.innerText) }));
    rec('el gerente entra directo a Inicio con su sucursal', /^Plaza Carso va en/.test(s.h), s.h.slice(0, 100));
    rec('la calificación grande y las tarjetas son de su tienda', /^\d\.\d\d$/.test(s.num) && /posición/i.test(s.stats[1]) && /quejas sin respuesta/i.test(s.stats[2]), JSON.stringify(s.stats));
    rec('"Por atender" solo muestra quejas de su sucursal', s.rows.every(n => /Carso/.test(n)), JSON.stringify(s.rows));
    process.exitCode = summary(page.errors);
  } finally { setP('{"rol":"zonal","sucursal":null}'); await b.close(); }
})().catch(e => { console.error('QA ERR', e.message); process.exit(1); });
