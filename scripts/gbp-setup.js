#!/usr/bin/env node

/**
 * scripts/gbp-setup.js — Utilidad CLI para Configuración y Mapeo de Google Business Profile (GBP)
 * 
 * Permite:
 * 1. Probar conectividad con Google OAuth usando GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN.
 * 2. Consultar las cuentas (accounts) y ubicaciones (locations) disponibles en Google Business Profile.
 * 3. Mapear automáticamente los IDs de GBP con las 33 sucursales en Supabase.
 * 
 * Uso:
 *   node scripts/gbp-setup.js --list-locations
 *   node scripts/gbp-setup.js --sync-mappings
 *   node scripts/gbp-setup.js --status
 *   node scripts/gbp-setup.js --sync-coords [--apply]   # latitud/longitud/dirección desde la ficha de Google (sin --apply solo muestra)
 */

const fs = require('fs');
const path = require('path');

// Carga nativa de .env sin dependencias externas
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  });
}
const { createClient } = require('@supabase/supabase-js');

async function getAccessToken() {
  const clientId = process.env.GBP_CLIENT_ID;
  const clientSecret = process.env.GBP_CLIENT_SECRET;
  const refreshToken = process.env.GBP_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Faltan variables de entorno: GBP_CLIENT_ID, GBP_CLIENT_SECRET o GBP_REFRESH_TOKEN en tu archivo .env');
    process.exit(1);
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString()
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Error al renovar token OAuth (${res.status}):`, text);
    process.exit(1);
  }

  const data = await res.json();
  return data.access_token;
}

async function listAccounts(token) {
  const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Error al listar cuentas GBP (${res.status}):`, text);
    return [];
  }

  const data = await res.json();
  return data.accounts || [];
}

async function listLocations(token, accountName) {
  // Try Business Information API first
  const readMask = 'name,title,storeCode,storefrontAddress,metadata';
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${encodeURIComponent(readMask)}&pageSize=100`;
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    // Fallback to v4
    const fallbackUrl = `https://mybusiness.googleapis.com/v4/${accountName}/locations?pageSize=100`;
    const resFb = await fetch(fallbackUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resFb.ok) {
      console.warn(`⚠️ No se pudieron listar ubicaciones de ${accountName}: ${await resFb.text()}`);
      return [];
    }
    const dataFb = await resFb.json();
    return dataFb.locations || [];
  }

  const data = await res.json();
  return data.locations || [];
}


const norm = (t) => (t || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/la crepe parisienne/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// Alias donde el nombre en Google no coincide con `locations.nombre` en Supabase
const NAME_ALIASES = {
  'plaza peninsula tijuana': 'plaza peninsula',
  'the park san luis potosi': 'the park'
};

/**
 * Empata ubicaciones de GBP con sucursales de Supabase por nombre normalizado.
 * Descarta duplicados y cerradas. No escribe en la base: genera supabase_gbp_mappings.sql.
 */
async function syncMappings(token, accountName, supabase) {
  const readMask = 'name,title,storeCode,metadata,openInfo';
  let gbp = [];
  let pageToken = '';
  do {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${readMask}&pageSize=100${pageToken ? '&pageToken=' + pageToken : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { console.error('❌ No se pudo listar ubicaciones:', await res.text()); process.exit(1); }
    const data = await res.json();
    gbp.push(...(data.locations || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  const { data: locs, error } = await supabase.from('locations').select('id, nombre');
  if (error) { console.error('❌ Error leyendo locations:', error.message); process.exit(1); }

  const skipped = [];
  const usable = gbp.filter(l => {
    if (l.metadata?.duplicateLocation) { skipped.push([l.title, l.storeCode, 'duplicada']); return false; }
    if (l.openInfo?.status === 'CLOSED_PERMANENTLY') { skipped.push([l.title, l.storeCode, 'cerrada permanentemente']); return false; }
    if (l.metadata?.hasVoiceOfMerchant === false) { skipped.push([l.title, l.storeCode, 'sin verificar / sin acceso a reseñas']); return false; }
    return true;
  });

  const byName = new Map();
  for (const l of usable) {
    const k = norm(l.title);
    byName.set(k, [...(byName.get(k) || []), l]);
  }

  const matched = [], ambiguous = [], unmatched = [];
  const used = new Set();
  for (const sb of locs) {
    const key = norm(sb.nombre);
    const cands = byName.get(key) || byName.get(Object.keys(NAME_ALIASES).find(a => NAME_ALIASES[a] === key)) || [];
    if (cands.length === 1) { matched.push([sb, cands[0]]); used.add(cands[0].name); }
    else if (cands.length > 1) ambiguous.push([sb, cands]);
    else unmatched.push(sb);
  }
  const orphans = usable.filter(l => !used.has(l.name));

  console.log(`\n✅ Empatadas: ${matched.length} / ${locs.length}`);
  matched.forEach(([sb, g]) => console.log(`  ${sb.id.padEnd(16)} ${g.name}  (${g.title}, código ${g.storeCode || '-'})`));
  if (ambiguous.length) { console.log('\n⚠️ Ambiguas (más de una candidata):'); ambiguous.forEach(([sb, c]) => console.log(`  ${sb.id}: ${c.map(x => x.name).join(', ')}`)); }
  if (unmatched.length) { console.log('\n❌ Sucursales de Étoile sin ficha en GBP:'); unmatched.forEach(sb => console.log(`  ${sb.id} (${sb.nombre})`)); }
  if (orphans.length) { console.log('\nℹ️ Fichas de GBP activas que Étoile no tiene:'); orphans.forEach(l => console.log(`  ${l.title} (código ${l.storeCode || '-'}) ${l.name}`)); }
  if (skipped.length) { console.log('\n⏭️ Descartadas:'); skipped.forEach(([t, c, why]) => console.log(`  ${t} (código ${c || '-'}): ${why}`)); }

  const sql = ['-- Generado por scripts/gbp-setup.js --sync-mappings. Revisa antes de ejecutar en el SQL Editor de Supabase.', 'BEGIN;']
    .concat(matched.map(([sb, g]) => `UPDATE locations SET gbp_account_id = '${accountName}', gbp_location_id = '${g.name}', updated_at = now() WHERE id = '${sb.id}';`))
    .concat(['COMMIT;', ''])
    .join('\n');
  const out = path.resolve(__dirname, '../supabase/supabase_gbp_mappings.sql');
  fs.writeFileSync(out, sql, 'utf8');
  console.log(`\n💾 SQL generado: ${out}`);
}

/**
 * Llena locations.latitude/longitude/address con lo que dice la ficha de Google de cada sucursal vinculada
 * (empata por gbp_location_id). Solo escribe con --apply y solo en sucursales vinculadas.
 */
async function syncCoords(token, accountName, supabase, apply) {
  const readMask = 'name,title,latlng,storefrontAddress';
  const gbp = new Map();
  let pageToken = '';
  do {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${readMask}&pageSize=100${pageToken ? '&pageToken=' + pageToken : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { console.error('❌ No se pudo listar ubicaciones:', await res.text()); process.exit(1); }
    const data = await res.json();
    (data.locations || []).forEach(l => gbp.set(l.name, l));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  const { data: locs, error } = await supabase.from('locations').select('id, nombre, gbp_location_id').not('gbp_location_id', 'is', null);
  if (error) { console.error('❌ Error leyendo locations:', error.message); process.exit(1); }
  let ok = 0;
  for (const l of locs) {
    const key = l.gbp_location_id.startsWith('locations/') ? l.gbp_location_id : `locations/${l.gbp_location_id}`;
    const g = gbp.get(key);
    const ll = g && g.latlng;
    if (!ll || ll.latitude == null) { console.log(`  ⚠️ ${l.nombre}: Google no da coordenadas`); continue; }
    const a = g.storefrontAddress || {};
    const address = [...(a.addressLines || []), a.sublocality, a.locality, a.administrativeArea, a.postalCode].filter(Boolean).join(', ') || null;
    console.log(`  ${apply ? '✅' : '·'} ${l.nombre}: ${ll.latitude.toFixed(4)}, ${ll.longitude.toFixed(4)}`);
    if (apply) {
      const { error: e } = await supabase.from('locations').update({ latitude: ll.latitude, longitude: ll.longitude, address }).eq('id', l.id);
      if (e) { console.error(`  ❌ ${l.nombre}: ${e.message}`); continue; }
    }
    ok++;
  }
  console.log(`\n${apply ? 'Actualizadas' : 'Con coordenadas (sin --apply no se escribió nada)'}: ${ok} de ${locs.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || '--status';

  console.log('🏛️ ÉTOILE ZENITH — GESTOR DE CONFIGURACIÓN GBP API\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY en .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (action === '--status') {
    console.log('📊 Verificando estado en Supabase...');
    const { data: locations, error } = await supabase.from('locations').select('id, nombre, region, gbp_location_id');
    if (error) {
      console.error('❌ Error al consultar tabla locations:', error.message);
      console.log('💡 Sugerencia: Ejecuta el script supabase_gbp_migration.sql en Supabase SQL Editor primero.');
      return;
    }

    console.log(`✅ Total de sucursales en base de datos: ${locations.length}`);
    const linked = locations.filter(l => Boolean(l.gbp_location_id));
    console.log(`🔗 Sucursales vinculadas con GBP: ${linked.length} / ${locations.length}`);
    
    if (linked.length < locations.length) {
      console.log('\nSucursales pendientes de vincular con GBP:');
      locations.filter(l => !l.gbp_location_id).forEach(l => {
        console.log(`  - [${l.region}] ${l.nombre} (ID: ${l.id})`);
      });
    }
    return;
  }

  console.log('🔑 Obteniendo Access Token de Google...');
  const token = await getAccessToken();
  console.log('✅ Access Token obtenido con éxito.');

  console.log('🔍 Consultando cuentas de Google Business Profile...');
  const accounts = await listAccounts(token);
  console.log(`📋 Cuentas encontradas: ${accounts.length}`);
  accounts.forEach(acc => {
    console.log(`  - ${acc.accountName || acc.name} (${acc.type || 'N/A'}) [${acc.name}]`);
  });

  if (action === '--sync-mappings') {
    if (accounts.length !== 1) { console.error(`❌ Se esperaba 1 cuenta y hay ${accounts.length}. Mapea manualmente.`); process.exit(1); }
    await syncMappings(token, accounts[0].name, supabase);
    return;
  }

  if (action === '--sync-coords') {
    if (accounts.length !== 1) { console.error(`❌ Se esperaba 1 cuenta y hay ${accounts.length}.`); process.exit(1); }
    await syncCoords(token, accounts[0].name, supabase, args.includes('--apply'));
    return;
  }

  if (action === '--list-locations') {
    for (const acc of accounts) {
      console.log(`\n📍 Ubicaciones en cuenta ${acc.name}:`);
      const locs = await listLocations(token, acc.name);
      locs.forEach(l => {
        const title = l.title || l.locationName || 'Sin título';
        const storeCode = l.storeCode || 'Sin código';
        console.log(`  - ${title} (Código: ${storeCode}) -> ${l.name}`);
      });
    }
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
