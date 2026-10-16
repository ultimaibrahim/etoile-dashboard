// Crea (o con --delete borra) el usuario QA temporal en Supabase con la service role de .env. Escribe tests/e2e/.qa_user.json (gitignored, chmod 600).
//   node tests/e2e/make-qa-user.js            crea usuario regional (corporativo) con región CDMX
//   node tests/e2e/make-qa-user.js --delete   lo borra (hacerlo al terminar la sesión de pruebas)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '../..');
fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').forEach(l => { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
const { createClient } = require(path.join(root, 'node_modules/@supabase/supabase-js'));
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const file = path.join(__dirname, '.qa_user.json');
(async () => {
  if (process.argv.includes('--delete')) {
    const u = JSON.parse(fs.readFileSync(file, 'utf8'));
    await sb.from('review_incidents').delete().eq('opened_by', u.id);   // si una prueba quedó a medias (la FK impediría borrar el usuario)
    await sb.from('profiles').delete().eq('id', u.id); const r = await sb.auth.admin.deleteUser(u.id);
    console.log(r.error ? r.error.message : `usuario QA ${u.id.slice(0, 8)}… borrado`); fs.unlinkSync(file); return;
  }
  const email = `qa.etoile.${Date.now()}@example.com`, password = crypto.randomBytes(18).toString('base64url') + 'Aa7!';   // la política de Supabase pide minúscula, mayúscula, dígito y símbolo
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const p = await sb.from('profiles').upsert({ id: data.user.id, nombre: 'QA Temporal', rol: 'regional', region: 'CDMX' });
  if (p.error) throw p.error;
  fs.writeFileSync(file, JSON.stringify({ id: data.user.id, email, password }), { mode: 0o600 });
  console.log(`usuario QA ${data.user.id.slice(0, 8)}… creado (regional, CDMX)`);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
