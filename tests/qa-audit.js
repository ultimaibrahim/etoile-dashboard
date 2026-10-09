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
  'js/views/compare.js',
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

// 10. Verificación de Reglas Operativas LCP (Turnos y Exclusión de Reseñas Sin Texto)
const branchJs = fs.readFileSync(path.join(rootDir, 'js/views/branch.js'), 'utf8');
assert(!branchJs.includes("label: 'Merienda'"), 'branch.js no incluye turno Merienda');
assert(branchJs.includes("label: 'Desayuno'") && branchJs.includes("label: 'Comida'") && branchJs.includes("label: 'Cena'"), 'branch.js define exactamente los 3 turnos (Desayuno, Comida, Cena)');
assert(branchJs.includes('reviews.filter(r => r.text && r.text.trim().length > 0)'), 'branch.js omite estrictamente reseñas sin texto en el heatmap');

const compareJs = fs.readFileSync(path.join(rootDir, 'js/views/compare.js'), 'utf8');
assert(compareJs.includes('bReviews.filter(r => r.text && r.text.trim().length > 0)'), 'compare.js omite estrictamente reseñas sin texto en métricas cualitativas y quejas');

// 11. Verificación de Luxury DataViz & Óptica Visual
const cssFile = fs.readFileSync(path.join(rootDir, 'css/styles.css'), 'utf8');
assert(cssFile.includes('--dv-oro:') && cssFile.includes('--dv-sage:'), 'styles.css contiene tokens de paleta DataViz de lujo (--dv-oro, --dv-sage)');
assert(cssFile.includes('--text-dim:     #8E9D93;'), 'styles.css eleva contraste de textos secundarios a ratio WCAG AAA (#8E9D93)');
assert(cssFile.includes('.heatmap-cell-marginal') && cssFile.includes('.heatmap-col-marginal'), 'styles.css contiene estilos para totales marginales del heatmap');
assert(cssFile.includes('.bayes-uncertainty-bar'), 'styles.css contiene micro-indicador de incertidumbre bayesiana');

assert(branchJs.includes('Total Turno') && branchJs.includes('Total Día'), 'branch.js implementa totales marginales en el Heatmap Operativo');
assert(compareJs.includes('compareRadarChart'), 'compare.js renderiza el radar de 5 dimensiones limpio');

const selectRegionJs = fs.readFileSync(path.join(rootDir, 'js/views/select-region.js'), 'utf8');
assert(selectRegionJs.includes('bayes-uncertainty-wrap'), 'select-region.js muestra el intervalo de credibilidad bayesiana');

// 12. Verificación de Arquitectura GBP y Reestructuración de Supabase
const migrationSqlPath = path.join(rootDir, 'supabase_gbp_migration.sql');
assert(fs.existsSync(migrationSqlPath), 'Script de migración supabase_gbp_migration.sql existe');
if (fs.existsSync(migrationSqlPath)) {
  const sql = fs.readFileSync(migrationSqlPath, 'utf8');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS locations'), 'supabase_gbp_migration.sql crea tabla locations');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS reviews_core'), 'supabase_gbp_migration.sql crea tabla normalizada reviews_core');
  assert(sql.includes('CREATE OR REPLACE VIEW reviews AS'), 'supabase_gbp_migration.sql crea vista retrocompatible reviews');
  assert(sql.includes('CREATE OR REPLACE VIEW quarterly_stats AS'), 'supabase_gbp_migration.sql actualiza vista quarterly_stats');
}

const apifyFn = fs.readFileSync(path.join(rootDir, 'netlify/functions/apify-ingest.js'), 'utf8');
assert(apifyFn.includes('410') && apifyFn.includes('DEPRECATED'), 'apify-ingest.js deshabilitado limpiamente con código 410 Gone');

const gbpSyncPath = path.join(rootDir, 'netlify/functions/gbp-sync.js');
assert(fs.existsSync(gbpSyncPath), 'netlify/functions/gbp-sync.js existe');
if (fs.existsSync(gbpSyncPath)) {
  const code = fs.readFileSync(gbpSyncPath, 'utf8');
  try {
    new vm.Script(code);
    assert(true, 'Sintaxis JS válida sin errores: netlify/functions/gbp-sync.js');
  } catch (err) {
    assert(false, `Error de sintaxis en gbp-sync.js: ${err.message}`);
  }
}

const gbpSetupPath = path.join(rootDir, 'scripts/gbp-setup.js');
assert(fs.existsSync(gbpSetupPath), 'scripts/gbp-setup.js existe');
if (fs.existsSync(gbpSetupPath)) {
  const code = fs.readFileSync(gbpSetupPath, 'utf8');
  try {
    new vm.Script(code);
    assert(true, 'Sintaxis JS válida sin errores: scripts/gbp-setup.js');
  } catch (err) {
    assert(false, `Error de sintaxis en gbp-setup.js: ${err.message}`);
  }
}

const gbpAuthPath = path.join(rootDir, 'scripts/gbp-auth.js');
assert(fs.existsSync(gbpAuthPath), 'scripts/gbp-auth.js existe');
if (fs.existsSync(gbpAuthPath)) {
  const code = fs.readFileSync(gbpAuthPath, 'utf8');
  try {
    new vm.Script(code);
    assert(true, 'Sintaxis JS válida sin errores: scripts/gbp-auth.js');
  } catch (err) {
    assert(false, `Error de sintaxis en gbp-auth.js: ${err.message}`);
  }
}

// 13. Pipeline GBP: funciones, cron y pruebas unitarias
['netlify/functions/gbp-sync.js', 'netlify/functions/gbp-reconcile.js', 'netlify/functions/gbp-sync-cron.js', 'netlify/functions/classify-review.js'].forEach(f => {
  const fp = path.join(rootDir, f);
  assert(fs.existsSync(fp), `${f} existe`);
  if (fs.existsSync(fp)) {
    try { new vm.Script(fs.readFileSync(fp, 'utf8')); assert(true, `Sintaxis JS válida: ${f}`); }
    catch (err) { assert(false, `Error de sintaxis en ${f}: ${err.message}`); }
  }
});
const tomlText = fs.readFileSync(path.join(rootDir, 'netlify.toml'), 'utf8');
assert(/\[functions\."gbp-sync-cron"\][\s\S]*schedule\s*=/.test(tomlText), 'netlify.toml programa gbp-sync-cron');
const classifySrc = fs.readFileSync(path.join(rootDir, 'netlify/functions/classify-review.js'), 'utf8');
assert(!classifySrc.includes(".from('reviews')") && !classifySrc.includes('classification_status'), 'classify-review escribe en reviews_core (no en la vista reviews)');
{
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, [path.join(rootDir, 'tests/gbp-sync.test.js')], { encoding: 'utf8' });
  assert(r.status === 0, `tests/gbp-sync.test.js (pruebas unitarias GBP): ${(r.stdout || '').trim().split('\n').pop()}`);
}

// 14. Higiene de secretos: nada sensible en archivos versionables
{
  const patterns = [/sb_secret_[A-Za-z0-9_-]{20,}/, /GOCSPX-[A-Za-z0-9_-]{20,}/, /nfp_[A-Za-z0-9]{30,}/, /eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}/, /1\/\/0[A-Za-z0-9_-]{60,}/];
  const skip = new Set(['node_modules', '.git', 'backups']);
  const hits = [];
  (function walk(d) {
    for (const n of fs.readdirSync(d, { withFileTypes: true })) {
      if (skip.has(n.name) || n.name === '.env') continue;
      const fp = path.join(d, n.name);
      if (n.isDirectory()) walk(fp);
      else if (/\.(js|json|html|md|toml|sql|txt|css)$/.test(n.name) && fs.statSync(fp).size < 2e6) {
        const txt = fs.readFileSync(fp, 'utf8');
        if (patterns.some(re => re.test(txt))) hits.push(path.relative(rootDir, fp));
      }
    }
  })(rootDir);
  assert(hits.length === 0, `Sin secretos en archivos versionables${hits.length ? ': ' + hits.join(', ') : ''}`);
  assert(/^\.env$/m.test(fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8')), '.env está en .gitignore');
  assert(/^backups\/$/m.test(fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8')), 'backups/ está en .gitignore');
}

console.log('\n──────────────────────────────────────────────────────');
if (failures.length > 0) {
  console.error(`\n❌ AUDITORÍA FALLIDA CON ${failures.length} ERROR(ES).`);
  process.exit(1);
} else {
  console.log('✅ TODAS LAS PRUEBAS DE QA PASARON CON ÉXITO (0 ERRORES).');
  process.exit(0);
}

