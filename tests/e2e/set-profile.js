// Cambia el perfil del usuario QA. Ej.: node tests/e2e/set-profile.js '{"rol":"gerente","sucursal":"carso"}'  (tienda)  |  '{"rol":"regional","sucursal":null}' (restaurar)
const fs = require('fs'), path = require('path'); const root = path.join(__dirname, '../..');
fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').forEach(l => { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
const { createClient } = require(path.join(root, 'node_modules/@supabase/supabase-js'));
const u = JSON.parse(fs.readFileSync(path.join(__dirname, '.qa_user.json'), 'utf8'));
createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY).from('profiles').update(JSON.parse(process.argv[2])).eq('id', u.id).then(r => console.log(r.error ? r.error.message : 'perfil QA actualizado: ' + process.argv[2]));
