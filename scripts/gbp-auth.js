#!/usr/bin/env node

/**
 * scripts/gbp-auth.js — Generador de Refresh Token de Google Business Profile
 * 
 * Inicia un servidor local temporal para completar el flujo OAuth2 en 1 clic:
 * 1. Lee GBP_CLIENT_ID y GBP_CLIENT_SECRET desde .env.
 * 2. Genera la URL de autorización oficial con scope https://www.googleapis.com/auth/business.manage.
 * 3. Captura el código de autorización y solicita el refresh_token permanente.
 * 4. Guarda automáticamente GBP_REFRESH_TOKEN en tu archivo .env.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Carga nativa de .env
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

const clientId = process.env.GBP_CLIENT_ID;
const clientSecret = process.env.GBP_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('❌ Error: Falta GBP_CLIENT_ID o GBP_CLIENT_SECRET en .env');
  process.exit(1);
}

const PORT = 3000;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/business.manage';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent'
  }).toString();

console.log('🏛️ ÉTOILE ZENITH — AUTENTICADOR GOOGLE BUSINESS PROFILE\n');
console.log('🔗 Abre el siguiente enlace en tu navegador para autorizar la cuenta:');
console.log('\n' + authUrl + '\n');
console.log(`⏳ Esperando respuesta en ${REDIRECT_URI}... (Presiona Ctrl+C para cancelar)\n`);

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
  
  if (reqUrl.pathname === '/callback') {
    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>❌ Error de Autorización</h1><p>${error}</p>`);
      console.error('❌ Autorización rechazada por Google:', error);
      server.close();
      process.exit(1);
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>❌ Código no recibido</h1>`);
      return;
    }

    try {
      console.log('🔑 Canjeando código por Refresh Token...');
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI
        }).toString()
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Google OAuth error: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const refreshToken = tokenData.refresh_token;

      if (!refreshToken) {
        console.warn('⚠️ Google no devolvió un nuevo refresh_token (quizá ya tenías uno emitido anteriormente).');
      } else {
        console.log('✅ ¡Refresh Token obtenido con éxito!');
        
        // Guardar en .env
        let currentEnv = fs.readFileSync(envPath, 'utf8');
        if (currentEnv.includes('GBP_REFRESH_TOKEN=')) {
          currentEnv = currentEnv.replace(/GBP_REFRESH_TOKEN=.*/g, `GBP_REFRESH_TOKEN=${refreshToken}`);
        } else {
          currentEnv += `\nGBP_REFRESH_TOKEN=${refreshToken}\n`;
        }
        fs.writeFileSync(envPath, currentEnv, 'utf8');
        console.log('💾 GBP_REFRESH_TOKEN guardado automáticamente en .env');
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 30px; border-radius: 16px; background: #0c1410; color: #fff; text-align: center; border: 1px solid rgba(229,184,66,0.3); box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
          <h1 style="color: #E5B842; margin-top: 0;">✨ ¡Autorización Exitosa!</h1>
          <p style="color: #8E9D93; font-size: 16px; line-height: 1.6;">Las credenciales de Google Business Profile han sido vinculadas correctamente con <strong>Étoile Zenith</strong>.</p>
          <p style="color: #5CE1A6; font-weight: bold;">Ya puedes cerrar esta ventana y regresar a tu terminal.</p>
        </div>
      `);

      server.close(() => {
        console.log('\n🎉 Proceso completado exitosamente.');
        process.exit(0);
      });

    } catch (tokenErr) {
      console.error('❌ Error al obtener token:', tokenErr.message);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>❌ Error al procesar token</h1><p>${tokenErr.message}</p>`);
      server.close();
      process.exit(1);
    }
  }
});

server.listen(PORT, '127.0.0.1', () => {
  // Servidor listo
});
