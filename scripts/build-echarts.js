#!/usr/bin/env node
/**
 * scripts/build-echarts.js — Empaqueta src/echarts-entry.js a js/vendor/echarts.custom.min.js (IIFE minificado).
 *   node scripts/build-echarts.js
 * El resultado se versiona: el sitio sigue sin paso de build en producción y sin CDN para ECharts (CSP intacto).
 */
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const out = path.join(root, 'js/vendor/echarts.custom.min.js');

esbuild.build({
  entryPoints: [path.join(root, 'src/echarts-entry.js')],
  bundle: true, minify: true, format: 'iife', target: ['es2019'],
  legalComments: 'none', outfile: out, logLevel: 'warning'
}).then(() => {
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`✅ ${path.relative(root, out)} — ${kb} KB`);
}).catch(() => process.exit(1));
