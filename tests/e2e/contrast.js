// Escáner de contraste WCAG de todo el texto visible (claro y oscuro). node tests/e2e/contrast.js  → lista cuántos textos quedan bajo el mínimo.
// Base medida el 2026-10-12: 245 → 25 tras el sistema de color (restan estrellas decorativas y dos casos de 4.4:1). No debe subir de ~30.
const { launch, open, sleep } = require('./lib');
const scan = () => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const over = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const bgOf = el => { const L = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { L.push(c); if (c.a >= 1) break; } } let base = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }; for (let i = L.length - 1; i >= 0; i--) base = over(L[i], base); return base; };
  const out = [], seen = new Set(), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || seen.has(el) || el.closest('canvas,svg,script,style,noscript')) continue; seen.add(el);
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (cs.visibility === 'hidden' || cs.display === 'none' || r.width < 2 || r.height < 2) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if (op < 0.9) continue;   // aún invisible (revelado por scroll) o a media animación
    const fg = parse(cs.color), bg = bgOf(el); if (!fg) continue; const f2 = over({ ...fg, a: fg.a * op }, bg), L1 = lum(f2), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05), size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) out.push({ t: n.textContent.trim().slice(0, 28), c: (el.className || el.tagName).toString().slice(0, 30), ratio: +ratio.toFixed(2) }); }
  return out;
};
(async () => {
  const b = await launch(); let total = 0; const byClass = {};
  for (const dark of [false, true]) {
    const page = await open(b, { dark });
    for (const r of ['#/', '#/dashboards', '#/comparar', '#/sucursal/aztlan', '#/trimestre/2026-Q4']) {
      await page.evaluate(h => { location.hash = h; }, r); await sleep(2500);
      await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); }); await sleep(1500);
      const v = await page.evaluate(scan); total += v.length; v.forEach(x => { byClass[x.c] = (byClass[x.c] || 0) + 1; }); console.log((dark ? 'oscuro ' : 'claro  ') + r.padEnd(22), v.length);
    }
    await page.context().close();
  }
  console.log('TOTAL bajo el mínimo:', total, JSON.stringify(Object.entries(byClass).sort((a, b) => b[1] - a[1]).slice(0, 10)));
  await b.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
