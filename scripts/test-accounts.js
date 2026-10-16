// Crea una cuenta de prueba por rol (admin, regional, zonal CDMX, gerente Plaza Carso) y guarda sus credenciales en
// .env.cuentas-prueba (ignorado por git, chmod 600). Usa la service role de .env. Viven en el Supabase de producción.
//   node scripts/test-accounts.js            crea las cuentas (falla si ya existen)
//   node scripts/test-accounts.js --delete   borra las cuentas, sus perfiles e incidencias y el archivo
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const FILE = path.join(root, '.env.cuentas-prueba');
fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').forEach(l => { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
const { createClient } = require(path.join(root, 'node_modules/@supabase/supabase-js'));
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ROLES = [
  { key: 'ADMIN', rol: 'admin', region: 'CDMX', sucursal: null, nombre: 'Prueba Admin' },
  { key: 'REGIONAL', rol: 'regional', region: 'CDMX', sucursal: null, nombre: 'Prueba Regional' },
  { key: 'ZONAL', rol: 'zonal', region: 'CDMX', sucursal: null, nombre: 'Prueba Zonal CDMX' },
  { key: 'GERENTE', rol: 'gerente', region: 'CDMX', sucursal: 'carso', nombre: 'Prueba Gerente Plaza Carso' }
];
(async () => {
  if (process.argv.includes('--delete')) {
    const env = Object.fromEntries(fs.readFileSync(FILE, 'utf8').split('\n').map(l => l.match(/^(ETOILE_\w+_ID)=(.+)$/)).filter(Boolean).map(m => [m[1], m[2]]));
    for (const id of Object.values(env)) {
      await sb.from('review_incidents').delete().eq('opened_by', id); await sb.from('profiles').delete().eq('id', id);
      const r = await sb.auth.admin.deleteUser(id); console.log(r.error ? r.error.message : `borrada ${id.slice(0, 8)}…`);
    }
    fs.unlinkSync(FILE); return;
  }
  if (fs.existsSync(FILE)) throw new Error('.env.cuentas-prueba ya existe: bórralas primero con --delete');
  const out = ['# Cuentas de prueba de Étoile, una por rol (creadas ' + new Date().toISOString().slice(0, 10) + '). NO versionar (.gitignore: .env.*).',
    '# Viven en el Supabase de producción. Para borrarlas: node scripts/test-accounts.js --delete', ''];
  for (const r of ROLES) {
    const email = `prueba.${r.rol}@etoile-qa.example.com`, password = crypto.randomBytes(15).toString('base64url') + 'Aa7!';   // la política de Supabase pide minúscula, mayúscula, dígito y símbolo
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(r.rol + ': ' + error.message);
    const p = await sb.from('profiles').upsert({ id: data.user.id, nombre: r.nombre, rol: r.rol, region: r.region, sucursal: r.sucursal });
    if (p.error) throw new Error(r.rol + ' perfil: ' + p.error.message);
    out.push(`# ${r.nombre} (${r.rol}${r.sucursal ? ', ' + r.sucursal : ''}, ${r.region})`, `ETOILE_${r.key}_EMAIL=${email}`, `ETOILE_${r.key}_PASSWORD=${password}`, `ETOILE_${r.key}_ID=${data.user.id}`, '');
    console.log('creada', r.rol);
  }
  fs.writeFileSync(FILE, out.join('\n'), { mode: 0o600 });
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
