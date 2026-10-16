/**
 * views/login.js — Página de login (/login/), independiente de la app.
 * Crea su propio cliente de Supabase con las mismas opciones que la app (auth-storage.js): la sesión queda en la misma
 * cookie y la app la encuentra al llegar. Al entrar, cada rol cae en su pantalla (gerente y zonal en su región,
 * corporativo en el selector nacional). Si ya hay sesión, entra directo.
 */

const LoginView = {
  FLEUR: '<svg class="deco-fleur" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C12 2 14.5 6.5 17 8C19.5 9.5 22 10 22 10C22 10 18 11.5 16 14C14 16.5 12 22 12 22C12 22 10 16.5 8 14C6 11.5 2 10 2 10C2 10 4.5 9.5 7 8C9.5 6.5 12 2 12 2Z" /></svg>',

  async render(errorMessage = '') {
    const app = document.getElementById('app');
    if (!app) return;

    // Clases del contenedor principal para dar la estética premium y centrar el login
    app.innerHTML = `
      <div class="login-wrapper">
        <div class="login-video-container">
          <video id="login-bg-video-a" autoplay muted playsinline preload="none" poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%2314181a' viewBox='0 0 1 1'><rect width='1' height='1'/></svg>" class="login-bg-video active"></video>
          <video id="login-bg-video-b" muted playsinline preload="none" poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%2314181a' viewBox='0 0 1 1'><rect width='1' height='1'/></svg>" class="login-bg-video"></video>
          <div class="login-video-overlay"></div>
        </div>
        <div class="login-bg-deco left">${LoginView.FLEUR}</div>
        <div class="login-bg-deco right">${LoginView.FLEUR}</div>
        
        <div class="login-card">
          <div class="login-header">
            <span class="eyebrow" style="color: var(--oro-ink);">La Crêpe Parisienne</span>
            <h1 class="login-title">
              <span class="accent">étoile</span>
              <span class="sub">Dashboard</span>
            </h1>
            <p class="login-subtitle">Ingresa tus credenciales para acceder al monitoreo regional de reseñas.</p>
          </div>
          
          <form id="login-form" class="login-form" onsubmit="LoginView.handleSubmit(event)">
            ${errorMessage ? `
              <div class="login-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>${errorMessage}</span>
              </div>
            ` : ''}
            
            <div class="input-group">
              <label for="login-email">Correo Electrónico</label>
              <div class="input-container">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input type="email" id="login-email" required placeholder="ejemplo@correo.com" autocomplete="email">
              </div>
            </div>
            
            <div class="input-group">
              <label for="login-password">Contraseña</label>
              <div class="input-container">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input type="password" id="login-password" required placeholder="••••••••" autocomplete="current-password">
              </div>
            </div>
            
            <button type="submit" class="login-btn" id="login-submit-btn">
              <span>Iniciar Sesión</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12,5 19,12 12,19"></polyline></svg>
            </button>
          </form>
          
          <div class="login-footer" style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
            <p>© 2026 Grupo MYT · Corporativo Alancar</p>
          </div>
        </div>
      </div>
    `;

    // Inyectar estilos específicos de la vista de login si no se han cargado
    if (!document.getElementById('login-styles')) {
      const style = document.createElement('style');
      style.id = 'login-styles';
      style.textContent = `
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        /* ── VIDEO DE FONDO ── */
        .login-video-container {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          z-index: 0;
          overflow: hidden;
        }
        .login-bg-video {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .login-bg-video.active {
          opacity: 0.35;
        }
        .login-video-overlay {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: radial-gradient(ellipse at center, rgba(20,24,26,0.15) 0%, rgba(20,24,26,0.55) 100%);
          z-index: 1;
        }
        [data-theme="dark"] .login-video-overlay {
          background: radial-gradient(ellipse at center, rgba(10,12,14,0.25) 0%, rgba(10,12,14,0.7) 100%);
        }
        .login-bg-deco {
          position: absolute;
          width: 320px;
          height: 320px;
          color: var(--oro-ink);
          opacity: 0.03;
          pointer-events: none;
          z-index: 1;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease;
        }
        .login-bg-deco.left {
          bottom: -60px;
          left: -60px;
          transform: rotate(18deg);
        }
        .login-bg-deco.right {
          top: -60px;
          right: -60px;
          transform: rotate(-18deg);
        }
        .login-wrapper:hover .login-bg-deco.left {
          transform: rotate(24deg) scale(1.05);
          opacity: 0.05;
        }
        .login-wrapper:hover .login-bg-deco.right {
          transform: rotate(-24deg) scale(1.05);
          opacity: 0.05;
        }
        .login-bg-deco svg {
          width: 100%;
          height: 100%;
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          background: var(--surface);
          border: 1px solid rgba(184, 144, 47, 0.25);
          border-radius: var(--radius);
          box-shadow: var(--sombra-lg);
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          z-index: 10;
          animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .login-title {
          font-family: var(--sans);
          font-weight: 900;
          font-stretch: condensed;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-top: 8px;
          margin-bottom: 12px;
        }
        .login-title .accent {
          font-family: var(--giaza);
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          font-size: 42px;
          color: var(--verde-ink);
          line-height: 1;
        }
        .login-title .sub {
          font-size: 14px;
          color: var(--text-muted);
        }
        .login-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .login-error {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--alerta-bg);
          border: 1px solid var(--alerta-soft);
          color: var(--alerta-ink);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
          animation: shakeError 0.4s ease-in-out;
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          transition: color 0.25s ease;
        }
        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-dim);
          pointer-events: none;
          transition: color 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .input-container input {
          width: 100%;
          background: var(--surface-2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px 16px 14px 44px;
          font-family: var(--sans);
          font-size: 14px;
          color: var(--text);
          outline: none;
          transition: border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
                      background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
                      box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.15s ease;
        }
        .input-container input::placeholder {
          color: var(--text-dim);
          opacity: 0.85;
        }
        .input-container input:focus {
          border-color: var(--oro);
          background-color: var(--surface);
          box-shadow: 0 0 0 3px rgba(184, 144, 47, 0.15);
        }
        .input-container input:focus + .input-icon {
          color: var(--oro-ink);
          transform: scale(1.08);
        }
        .input-group:focus-within label {
          color: var(--oro-ink);
        }
        .login-btn {
          margin-top: 10px;
          background: var(--verde);
          border: 1px solid rgba(255,255,255,0.06);
          color: #FAF5EB;
          border-radius: var(--radius-sm);
          padding: 14px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), 
                      box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--sombra);
        }
        .login-btn svg {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-btn:hover {
          background: var(--verde-deep);
          box-shadow: var(--sombra-lg);
        }
        .login-btn:hover svg {
          transform: translateX(4px);
        }
        .login-btn:active {
          transform: scale(0.98);
        }
        .login-footer {
          text-align: center;
          font-size: 11px;
          color: var(--text-dim);
          margin-top: 10px;
        }
        [data-theme="dark"] .login-title .accent {
          color: var(--sage-light);
        }
        [data-theme="dark"] .login-btn {
          background: var(--verde-soft);
        }
        [data-theme="dark"] .login-btn:hover {
          background: var(--verde);
        }
      `;
      document.head.appendChild(style);
    }

    // ── Iniciar fondo de video ──
    LoginView._initVideoBackground();
  },

  async handleSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('login-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Verificando...</span>';
    }

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      window.location.replace(await LoginPage.signIn(email, password));
      return;
    } catch (e) {
      console.error("Error en login UI:", e);
      if (e.message === 'email_unconfirmed') {
        this.render('Por favor, confirma tu correo electrónico. Revisa tu bandeja de entrada para ver el enlace de verificación.');
      } else if (e.status === 429 || (e.message && (e.message.includes('too many') || e.message.includes('rate limit')))) {
        this.render('Demasiados intentos. Tu cuenta ha sido bloqueada temporalmente. Por seguridad, espera 15 minutos.');
      } else if (e.message && (e.message.includes('credentials') || e.message.includes('invalid') || e.message.includes('incorrect'))) {
        this.render('Correo o contraseña incorrectos.');
      } else {
        this.render('Correo o contraseña incorrectos.'); // Fallback genérico amigable
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <span>Iniciar Sesión</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12,5 19,12 12,19"></polyline></svg>
        `;
      }
    }
  }
,

  // ── Playlist de Videos de Fondo ──
  _VIDEO_PLAYLIST: [
    '/videos/crepa_recien_hecha.mp4',
    '/videos/antojo_disfrutar.mp4',
    '/videos/historias_antojo.mp4',
    '/videos/vinculos_simple.mp4'
  ],
  _activeQueue: [],

  _getNextVideo() {
    if (this._activeQueue.length === 0) {
      this._activeQueue = [...this._VIDEO_PLAYLIST];
      for (let i = this._activeQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this._activeQueue[i], this._activeQueue[j]] = [this._activeQueue[j], this._activeQueue[i]];
      }
    }
    return this._activeQueue.pop();
  },

  _initVideoBackground() {
    const a = document.getElementById('login-bg-video-a');
    const b = document.getElementById('login-bg-video-b');
    if (!a || !b) return;

    let current = a;
    let next = b;

    // Precargar el siguiente video en el elemento oculto
    const preloadNext = () => {
      next.src = this._getNextVideo();
      next.load();
    };

    // Al terminar el video activo, intercambiar
    const swap = () => {
      next.play().catch(() => {});
      next.classList.add('active');
      current.classList.remove('active');
      current.pause();
      current.removeAttribute('src');
      current.load();

      // Intercambiar referencias
      [current, next] = [next, current];
      preloadNext();
    };

    a.addEventListener('ended', swap);
    b.addEventListener('ended', swap);

    // Arrancar el primer video
    a.src = this._getNextVideo();
    a.load();
    a.play().catch(() => {});
    a.classList.add('active');

    // Precargar el segundo
    preloadNext();
  }
};

/* ── Arranque de la página ── */
const LoginPage = {
  client: null,

  /** Pantalla de entrada según el rol (mismo criterio que AppAuth.entersOwnRegion en la app) */
  destination(profile) {
    return ['gerente', 'zonal'].includes(profile && profile.rol) ? '/#/' : '/#/select-region';
  },

  async profileOf(userId) {
    const { data } = await this.client.from('profiles').select('rol, region').eq('id', userId).maybeSingle();
    return data || null;
  },

  async signIn(email, password) {
    if (!this.client) throw new Error('Supabase no configurado.');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message && (error.message.includes('confirm') || error.message.includes('verified'))) throw new Error('email_unconfirmed');
      throw error;
    }
    if (data.user && !data.user.email_confirmed_at) { await this.client.auth.signOut(); throw new Error('email_unconfirmed'); }
    const profile = await this.profileOf(data.user.id);
    if (!profile) { await this.client.auth.signOut(); throw new Error('Sin perfil'); }
    return this.destination(profile);
  },

  async boot() {
    try {
      if (localStorage.getItem('lcpDark') === '1') document.documentElement.setAttribute('data-theme', 'dark');
    } catch (e) {}
    try {
      const res = await fetch('/.netlify/functions/get-config');
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey) {
        this.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, SUPABASE_AUTH_OPTIONS);
        // Con sesión vigente no hay nada que pedir: directo a la app
        const { data: { session } } = await this.client.auth.getSession();
        if (session) {
          const profile = await this.profileOf(session.user.id);
          if (profile) { window.location.replace(this.destination(profile)); return; }
        }
      }
    } catch (e) {
      console.error('[Login] No se pudo preparar el acceso:', e);
    }
    await LoginView.render();
    document.documentElement.classList.add('login-ready');
  }
};
