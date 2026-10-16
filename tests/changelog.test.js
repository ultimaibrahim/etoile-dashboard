#!/usr/bin/env node
/** tests/changelog.test.js — Lector del changelog público (js/changelog.js) contra el CHANGELOG_PUBLIC.md real. Sin red. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { String, RegExp, escapeHtml: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/changelog.js'), 'utf8') + ';globalThis.C = PublicChangelog;', ctx);
const { C } = ctx;
let pass = 0, fail = 0;
const t = (name, cond, extra = '') => { if (cond) { pass++; console.log(`✅ PASS: ${name}`); } else { fail++; console.error(`❌ FAIL: ${name} ${extra}`); } };

const md = fs.readFileSync(path.join(__dirname, '../CHANGELOG_PUBLIC.md'), 'utf8');
const entries = C.parse(md);
const headings = (md.match(/^## /gm) || []).length;
t('todas las versiones del changelog público se leen', entries.length === headings && headings > 0, `${entries.length}/${headings}`);
t('cada versión trae viñetas', entries.every(e => e.items.length > 0), JSON.stringify(entries.filter(e => !e.items.length).map(e => e.version)));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const label = pkg.version.replace(/-([a-z]+)\.?/i, ' $1 ');
t('la versión de package.json es la primera del changelog público', entries[0].version === label && entries[0].era === pkg.codename, `${entries[0].version} ${entries[0].era} vs ${label} ${pkg.codename}`);
const h = C.html(entries, label);
t('la versión en curso se marca como Actual (una sola vez)', (h.match(/clog-entry--current/g) || []).length === 1);
t('agrupa por época', /clog-era-name">Eltanin/.test(h) && /clog-era-name">Zenith/.test(h));
t('viñeta: quita el emoji, conserva negritas y escapa HTML', C.itemHtml('🔒 **Seguro** <script>x</script> `code`') === '<strong>Seguro</strong> &lt;script&gt;x&lt;/script&gt; <code>code</code>', C.itemHtml('🔒 **Seguro** <script>x</script> `code`'));
t('encabezado con otro formato no inventa versión', C.parse('## Notas\n* algo').length === 0);

console.log(`\n${fail === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ HAY FALLAS'} — ${pass} ok, ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
