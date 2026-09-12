const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
let failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
    console.error(`❌ FAIL: ${message}`);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('─── INICIANDO SUITE DE QA: ÉTOILE SEO, LLMO & UX AUDIT ───\n');

// 1. Verificación de existencia de archivos raíz mandatorios
const requiredFiles = ['robots.txt', 'sitemap.xml', 'llms.txt', '.well-known/llms.txt', 'index.html', 'netlify.toml'];
requiredFiles.forEach(f => {
  const fullPath = path.join(rootDir, f);
  assert(fs.existsSync(fullPath), `Archivo mandatorio existente: ${f}`);
});

// 2. Verificación de Robots.txt
if (fs.existsSync(path.join(rootDir, 'robots.txt'))) {
  const robots = fs.readFileSync(path.join(rootDir, 'robots.txt'), 'utf8');
  assert(robots.includes('Disallow: /page/'), 'robots.txt desindexa subcarpeta /page/');
  assert(robots.includes('Sitemap: https://etoile-lcp.netlify.app/sitemap.xml'), 'robots.txt contiene sitemap');
  assert(robots.includes('User-agent: GPTBot') && robots.includes('User-agent: ClaudeBot'), 'robots.txt declara directivas para crawlers LLM');
}

// 3. Verificación de Sitemap.xml
if (fs.existsSync(path.join(rootDir, 'sitemap.xml'))) {
  const sitemap = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
  assert(sitemap.startsWith('<?xml') && sitemap.includes('<urlset'), 'sitemap.xml tiene formato XML válido');
  assert(sitemap.includes('https://etoile-lcp.netlify.app/'), 'sitemap.xml contiene URL canónica');
}

// 4. Verificación de LLMS.txt
if (fs.existsSync(path.join(rootDir, 'llms.txt'))) {
  const llms = fs.readFileSync(path.join(rootDir, 'llms.txt'), 'utf8');
  assert(llms.includes('# étoile') && llms.includes('La Crêpe Parisienne'), 'llms.txt contiene metadatos de producto');
  assert(llms.includes('33 Tiendas a Nivel Nacional'), 'llms.txt describe cobertura nacional');
}

// 5. Verificación de index.html (Metadatos, OpenGraph, Schema JSON-LD)
if (fs.existsSync(path.join(rootDir, 'index.html'))) {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert(html.includes('<meta name="description"'), 'index.html contiene meta description');
  assert(html.includes('<meta property="og:title"'), 'index.html contiene Open Graph title');
  assert(html.includes('<meta name="twitter:card"'), 'index.html contiene Twitter Cards');
  assert(html.includes('application/ld+json'), 'index.html contiene Schema JSON-LD');
  assert(html.includes('google-site-verification'), 'index.html contiene meta tag para Google Search Console');
  assert(html.includes('GA4_MEASUREMENT_ID'), 'index.html contiene slot modular para Google Analytics 4');
}

// 6. Verificación de netlify.toml (Noindex /page/*)
if (fs.existsSync(path.join(rootDir, 'netlify.toml'))) {
  const toml = fs.readFileSync(path.join(rootDir, 'netlify.toml'), 'utf8');
  assert(toml.includes('for = "/page/*"') && toml.includes('noindex'), 'netlify.toml envía cabecera noindex para /page/*');
}

// 7. Verificación de Sintaxis JavaScript de todos los archivos .js
const jsFiles = [
  'js/config.js',
  'js/data.js',
  'js/utils.js',
  'js/charts.js',
  'js/kpis.js',
  'js/etoile-cache.js',
  'js/data-loader.js',
  'js/components/command-palette.js',
  'js/router.js',
  'js/app.js',
  'js/views/login.js',
  'js/views/select-region.js',
  'js/views/brand.js',
  'js/views/home.js',
  'js/views/branch.js',
  'js/views/quarter.js',
  'js/views/about.js',
  'js/views/dashboards.js',
  'js/views/privacy.js',
  'js/views/not-found.js'
];

jsFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const code = fs.readFileSync(filePath, 'utf8');
    try {
      new vm.Script(code);
      assert(true, `Sintaxis JS válida sin errores: ${file}`);
    } catch (err) {
      assert(false, `Error de sintaxis en ${file}: ${err.message}`);
    }
  } else {
    assert(false, `Archivo JS esperado no encontrado: ${file}`);
  }
});

// 8. Verificación de Crystal & Squircle Tokens y CSS
if (fs.existsSync(path.join(rootDir, 'css/styles.css'))) {
  const css = fs.readFileSync(path.join(rootDir, 'css/styles.css'), 'utf8');
  assert(css.includes('.key-takeaways-card'), 'styles.css contiene componente .key-takeaways-card');
  assert(css.includes('.faq-accordion-group'), 'styles.css contiene componente .faq-accordion-group');
  assert(css.includes('.mobile-sticky-bar'), 'styles.css contiene barra fija .mobile-sticky-bar');
  assert(css.includes('.cluster-nav-wrap'), 'styles.css contiene contenedor .cluster-nav-wrap');
  assert(css.includes('.offline-banner-floating'), 'styles.css contiene componente .offline-banner-floating');
  assert(css.includes('.grain-overlay'), 'styles.css contiene textura de grano .grain-overlay');
  assert(css.includes('.spotlight-card'), 'styles.css contiene efecto halo .spotlight-card');
  assert(css.includes('.crystal-tooltip-float'), 'styles.css contiene tooltips flotantes .crystal-tooltip-float');
  assert(css.includes('.cmd-palette-dialog'), 'styles.css contiene modal .cmd-palette-dialog');
  assert(!css.includes('–-'), 'styles.css libre de guiones simples defectuosos en variables (-- estricto)');
}

// 9. Verificación de Páginas de Error (404.html, 500.html) y Blindaje Noscript
assert(fs.existsSync(path.join(rootDir, '404.html')), '404.html existe y está configurado');
if (fs.existsSync(path.join(rootDir, '404.html'))) {
  const html404 = fs.readFileSync(path.join(rootDir, '404.html'), 'utf8');
  assert(html404.includes('404') && html404.includes('Dashboard'), '404.html contiene branding y retorno al Dashboard');
}

assert(fs.existsSync(path.join(rootDir, '500.html')), '500.html existe y está configurado');
if (fs.existsSync(path.join(rootDir, '500.html'))) {
  const html500 = fs.readFileSync(path.join(rootDir, '500.html'), 'utf8');
  assert(html500.includes('500') && html500.includes('Sincronización'), '500.html contiene mensaje de contingencia');
}

if (fs.existsSync(path.join(rootDir, 'index.html'))) {
  const htmlIndex = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert(htmlIndex.includes('<noscript>') && htmlIndex.includes('Cobertura Nacional'), 'index.html contiene <noscript> semántico (evita viewsource empty)');
}

if (fs.existsSync(path.join(rootDir, 'netlify.toml'))) {
  const toml = fs.readFileSync(path.join(rootDir, 'netlify.toml'), 'utf8');
  assert(toml.includes('for = "/*.map"') && toml.includes('status = 404'), 'netlify.toml bloquea sourcemaps expuestos con código 404');
}

console.log('\n──────────────────────────────────────────────────────');
if (failures.length > 0) {
  console.error(`\n❌ AUDITORÍA FALLIDA CON ${failures.length} ERROR(ES).`);
  process.exit(1);
} else {
  console.log('✅ TODAS LAS PRUEBAS DE QA PASARON CON ÉXITO (0 ERRORES).');
  process.exit(0);
}

