/**
 * app.js — Bootstrap, estado global e integración con Supabase.
 */

/* ── SUPABASE CONFIG ───────────────────────────────────── */
// Estas constantes están configuradas con tus credenciales de Supabase
const SUPABASE_URL = 'https://lbnqpcrhyebtbblpvazp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WXCdzeTmvrF2IGJfogAMGw_FBP-mr8Y';

var supabaseClient = null;
try {
  if (SUPABASE_URL && SUPABASE_URL !== 'https://placeholder.supabase.co') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error("Error al inicializar Supabase client:", e);
}

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
      return false;
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      this.session = data.session;
      await this.loadProfile(data.user.id);
      
      if (typeof DataLoader !== 'undefined') {
        DataLoader.cache = {};
        await DataLoader.init();
      }
      return true;
    } catch (e) {
      console.error("Error de autenticación:", e.message);
      return false;
    }
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
  // Inicializar autenticación y sesión
  await AppAuth.init();
  
  await DataLoader.init();

  // Registrar vistas en el Router
  Router.register('login', () => LoginView.render());
  Router.register('select-region', () => SelectRegionView.render());
  Router.register('home', () => HomeView.render());
  Router.register('branch', params => BranchView.render(params));
  Router.register('quarter', params => QuarterView.render(params));
  Router.register('about', () => AboutView.render());
  Router.register('dashboards', () => DashboardsView.render());

  Router.init();
  Router.resolve();
}

initApp();

