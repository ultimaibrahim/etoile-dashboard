#!/usr/bin/env node
/**
 * scripts/version.js — Una sola fuente de verdad para la versión: package.json ("version" y "codename").
 * Propaga a:
 *   - index.html y login/index.html: el ?v= de cada <script>/<link> (rompe la caché del navegador en cada versión)
 *   - js/version.js: APP_VERSION, que lee la interfaz (Acerca de, easter egg del changelog)
 * Y avisa si algún changelog todavía no tiene la entrada de esa versión.
 *
 * Uso normal (lo corre npm solo, vía el script "version" de package.json, y lo agrega al commit de la versión):
 *   npm version 2.0.0-beta.9            → versión nueva
 *   npm version 2.0.0-beta.8a           → parche con letra
 *   npm version prerelease --preid=beta → siguiente beta
 *   (Pasar --no-git-tag-version si no se quiere commit/tag automático.)
 * Manual: node scripts/version.js          · Verificación (CI/pruebas): node scripts/version.js --check
 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version, codename = pkg.codename || '';
// "2.0.0-beta.8a" → "2.0.0 beta 8a" (así se escribe en los changelogs)
const label = version.replace(/-([a-z]+)\.?/i, ' $1 ');
const check = process.argv.includes('--check');

// Páginas que cargan archivos de la app con ?v= (la app y el login, que es su propia página)
const PAGES = ['index.html', 'login/index.html'];
const bump = html => html.replace(/(\.(?:js|css)\?v=)[0-9A-Za-z.\-]+/g, `$1${version}`);

const verPath = path.join(root, 'js/version.js');
const verJs = `/** Generado por scripts/version.js desde package.json — no editar a mano. */\nconst APP_VERSION = Object.freeze(${JSON.stringify({ version, codename, label }, null, 2)});\n`;

const stale = [];
for (const pg of PAGES) { const h = fs.readFileSync(path.join(root, pg), 'utf8'); if (bump(h) !== h) stale.push(pg + ' (?v=)'); }
if (!fs.existsSync(verPath) || fs.readFileSync(verPath, 'utf8') !== verJs) stale.push('js/version.js');

const missing = ['CHANGELOG.md', 'CHANGELOG_PUBLIC.md'].filter(f => {
  const txt = fs.readFileSync(path.join(root, f), 'utf8');
  return !txt.includes(version) && !txt.toLowerCase().includes(label.toLowerCase());
});

if (check) {
  if (stale.length) { console.error(`❌ Versión desincronizada (${version}): ${stale.join(', ')}. Corre: node scripts/version.js`); process.exit(1); }
  console.log(`✅ Versión ${version} sincronizada${missing.length ? ` (aviso: falta entrada en ${missing.join(', ')})` : ''}`);
  process.exit(0);
}
for (const pg of PAGES) { const f = path.join(root, pg); fs.writeFileSync(f, bump(fs.readFileSync(f, 'utf8'))); }
fs.writeFileSync(verPath, verJs);
console.log(`Versión ${version}${codename ? ' ' + codename : ''} → ${PAGES.join(', ')}, js/version.js`);
if (missing.length) console.warn(`⚠️  Falta la entrada "${label}" en: ${missing.join(', ')} (doble changelog en el mismo commit).`);
