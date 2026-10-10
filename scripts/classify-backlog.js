#!/usr/bin/env node
/**
 * scripts/classify-backlog.js — Clasifica (motor local, sin LLM) las quejas de 1-2★ con texto que aún no tienen clasificación.
 * Solo escribe donde classification IS NULL: nunca pisa clasificaciones existentes.
 *   node scripts/classify-backlog.js           # cuenta (no escribe)
 *   node scripts/classify-backlog.js --apply   # clasifica y guarda
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.
 */
require('fs').readFileSync(require('path').join(__dirname, '..', '.env'), 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const { classifyAndSave } = require('../netlify/functions/classify-review');

(async () => {
  const apply = process.argv.includes('--apply');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const pending = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('reviews_core')
      .select('id, stars, text').lte('stars', 2).not('text', 'is', null).neq('text', '')
      .is('classification', null).order('id').range(from, from + 999);
    if (error) throw error;
    pending.push(...data);
    if (data.length < 1000) break;
  }
  console.log(`Quejas ≤2★ con texto sin clasificar: ${pending.length}`);
  if (!apply) return console.log('(sin --apply: no se escribió nada)');
  let done = 0;
  for (const r of pending) { await classifyAndSave(supabase, r.id, r.text, r.stars); if (++done % 100 === 0) console.log(`  ${done}/${pending.length}`); }
  console.log(`Clasificadas: ${done}`);
})().catch(e => { console.error(e.message); process.exit(1); });
