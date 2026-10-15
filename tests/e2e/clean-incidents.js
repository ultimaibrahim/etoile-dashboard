// Borra las incidencias que abrió el usuario QA (las pruebas escriben en la base real). node tests/e2e/clean-incidents.js
const fs = require('fs'), path = require('path'); const root = path.join(__dirname, '../..');
fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').forEach(l => { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
const { createClient } = require(path.join(root, 'node_modules/@supabase/supabase-js'));
const u = JSON.parse(fs.readFileSync(path.join(__dirname, '.qa_user.json'), 'utf8'));
createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY).from('review_incidents').delete().eq('opened_by', u.id).select('id')
  .then(r => console.log(r.error ? r.error.message : `incidencias QA borradas: ${r.data.length}`));
