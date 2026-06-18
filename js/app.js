/**
 * app.js — Bootstrap, estado global e integración con Supabase.
 */

/* ── SUPABASE CONFIG ───────────────────────────────────── */
// La configuración de Supabase se carga de forma dinámica desde el servidor de Netlify.

/* ── COOKIE STORAGE FOR AUTH ───────────────────────────── */
const CookieStorage = {
  getItem(key) {
    const name = key + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        try {
          return decodeURIComponent(c.substring(name.length, c.length));
        } catch (e) {
          return c.substring(name.length, c.length);
        }
      }
    }
    return null;
  },
  setItem(key, value) {
    const d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 días de persistencia
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax; Secure`;
  },
  removeItem(key) {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
  }
};

// Limpiar localStorage de cualquier token anterior de Supabase por seguridad
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      localStorage.removeItem(key);
    }
  }
} catch (err) {
  console.warn("No se pudo limpiar localStorage:", err);
}

var supabaseClient = null;

/* ── STATE ─────────────────────────────────────────────── */
let darkMode = localStorage.getItem('lcpDark') === '1';
let premiumUi = true;
let homeFilter = 'todas';
let branchView = 'abril';

function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}
applyTheme();

function applyPremiumUi() {
  document.documentElement.setAttribute('data-ui-premium', 'true');
}
applyPremiumUi();

function toggleDark() {
  darkMode = !darkMode;
  localStorage.setItem('lcpDark', darkMode ? '1' : '0');
  applyTheme();
  Router.resolve();
}

/* ── AUTHENTICATION ENGINE ────────────────────────────── */
const AppAuth = {
  session: null,
  profile: null,

  async init() {
    if (!supabaseClient) {
      console.error("Supabase no configurado. Acceso denegado.");
      this.session = null;
      this.profile = null;
      return false;
    }

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      this.session = session;
      if (session) {
        await this.loadProfile(session.user.id);
      }
      return !!this.session;
    } catch (e) {
      console.error("Error inicializando sesión:", e);
      return false;
    }
  },

  async loadProfile(uid) {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      if (data) {
        this.profile = data;
        setRegionActiva(data.region); // Sincroniza la región en data.js
      } else {
        // Perfil por defecto si no existe en la BD aún
        this.profile = { nombre: "Usuario", rol: "gerente", region: "GDL", sucursal: null };
        setRegionActiva("GDL");
      }
    } catch (e) {
      console.error("Error cargando perfil:", e);
    }
  },

  async login(email, password) {
    if (!supabaseClient) {
      throw new Error("Supabase no configurado.");
    }

    // 1. Intentar inicio de sesión
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      // Capturar si Supabase reporta que el correo no está confirmado
      if (error.message && (error.message.includes('confirm') || error.message.includes('verified'))) {
        throw new Error("email_unconfirmed");
      }
      throw error;
    }

    // 2. Guard en cliente: bloquear inicio de sesión si el correo no está confirmado
    if (data.user && !data.user.email_confirmed_at) {
      await supabaseClient.auth.signOut();
      throw new Error("email_unconfirmed");
    }

    this.session = data.session;
    await this.loadProfile(data.user.id);
    
    if (typeof DataLoader !== 'undefined') {
      DataLoader.cache = {};
      await DataLoader.init();
      await DataLoader.computeHistoricalRatings();
    }
    return true;
  },

  async logout() {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    this.session = null;
    this.profile = null;
    
    if (typeof DataLoader !== 'undefined') {
      DataLoader.cache = {};
      DataLoader.manifest = null;
    }
    if (typeof setRegionActiva === 'function') {
      setRegionActiva('GDL');
    }
    
    Router.navigate('#/login');
  },

  isAuthenticated() {
    return !!this.session;
  },

  getUserRole() {
    return this.profile ? this.profile.rol : null;
  },

  getUserRegion() {
    return this.profile ? this.profile.region : null;
  },

  getUserSucursal() {
    return this.profile ? this.profile.sucursal : null;
  }
};

/* ── INIT ──────────────────────────────────────────────── */
async function initApp() {
  // Obtener configuración pública de Supabase desde Netlify Serverless Function
  try {
    const res = await fetch('/.netlify/functions/get-config');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const config = await res.json();
    if (config.supabaseUrl && config.supabaseAnonKey) {
      supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          storage: CookieStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
  } catch (e) {
    console.error("No se pudo obtener la configuración de Supabase desde el servidor:", e);
  }

  // Inicializar autenticación y sesión
  await AppAuth.init();
  
  await DataLoader.init();
  await DataLoader.computeHistoricalRatings();

  // Registrar vistas en el Router
  Router.register('login', () => LoginView.render());
  Router.register('select-region', () => SelectRegionView.render());
  Router.register('brand', () => BrandView.render());
  Router.register('home', () => HomeView.render());
  Router.register('branch', params => BranchView.render(params));
  Router.register('quarter', params => QuarterView.render(params));
  Router.register('about', () => AboutView.render());
  Router.register('dashboards', () => DashboardsView.render());
  Router.register('privacy', () => PrivacyView.render());

  Router.init();
  Router.resolve();

  // Inicializar banner de cookies (Deshabilitado temporalmente para revisión legal)
  // initCookieBanner();
}

function initCookieBanner() {
  // Si ya se tomó una decisión, no mostrar el banner
  if (localStorage.getItem('lcpCookieConsent') === 'accepted' || localStorage.getItem('lcpCookieConsent') === 'declined') {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'lcp-cookie-banner';
  banner.className = 'cookie-banner-wrap';
  
  banner.innerHTML = `
    <div class="cookie-banner-content">
      <div class="cookie-banner-text">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--oro); flex-shrink: 0; margin-top: 1px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>
          Utilizamos cookies esenciales y almacenamiento local para mantener tu sesión activa y guardar tus preferencias. Consulta nuestro <a href="#/privacidad" style="text-decoration: underline; color: var(--oro); font-weight: 700;">Aviso de Privacidad</a> para más detalles.
        </span>
      </div>
      <div class="cookie-banner-actions">
        <button class="cookie-btn accept" onclick="acceptLcpCookies()">Aceptar</button>
        <button class="cookie-btn decline" onclick="declineLcpCookies()">Rechazar</button>
      </div>
    </div>
  `;

  if (!document.getElementById('cookie-banner-styles')) {
    const style = document.createElement('style');
    style.id = 'cookie-banner-styles';
    style.textContent = `
      .cookie-banner-wrap {
        position: fixed;
        bottom: 24px;
        left: 24px;
        right: 24px;
        background: var(--surface-2);
        border: 1px solid var(--border-strong);
        border-radius: 16px;
        box-shadow: var(--sombra-lg);
        padding: 16px 24px;
        z-index: 2000;
        box-sizing: border-box;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        animation: bannerSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @media (min-width: 768px) {
        .cookie-banner-wrap {
          max-width: 480px;
          right: auto;
        }
      }
      .cookie-banner-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      @media (min-width: 576px) {
        .cookie-banner-content {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
      }
      .cookie-banner-text {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-size: 12.5px;
        line-height: 1.5;
        color: var(--text);
      }
      .cookie-banner-text span {
        flex-grow: 1;
      }
      .cookie-banner-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .cookie-btn {
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }
      .cookie-btn.accept {
        background: var(--verde);
        color: #fff;
      }
      .cookie-btn.accept:hover {
        background: var(--verde-soft);
      }
      .cookie-btn.decline {
        background: transparent;
        border-color: var(--border-strong);
        color: var(--text-dim);
      }
      .cookie-btn.decline:hover {
        background: var(--border);
        color: var(--text);
      }
      @keyframes bannerSlideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  window.acceptLcpCookies = () => {
    localStorage.setItem('lcpCookieConsent', 'accepted');
    const el = document.getElementById('lcp-cookie-banner');
    if (el) el.remove();
  };

  window.declineLcpCookies = () => {
    localStorage.setItem('lcpCookieConsent', 'declined');
    const el = document.getElementById('lcp-cookie-banner');
    if (el) el.remove();
  };

  document.body.appendChild(banner);
}

initApp();

