import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';
import { SUCURSALES_META_ALL, REGION_NAME_MAP } from '../lib/data';
import { Review, SucursalMeta, UserProfile } from '../types';

const LOCAL_REAL_USERS = [
  { correo: 'oliver@lcp.mx', nombre: 'Oliver González', rol: 'regional', region: 'GDL', sucursal: null, password: 'lcp2026' },
  { correo: 'oliver.gonzalez@lacrepeparisienne.com', nombre: 'Oliver Gonzalez', rol: 'regional', region: 'GDL', sucursal: null, password: 'lcp2026' },
  { correo: 'ultima.ibrahim@proton.me', nombre: 'Ibrahim Garcia', rol: 'admin', region: 'GDL', sucursal: null, password: 'lcp2026' },
  { correo: 'andares@lacrepeparisienne.com', nombre: 'Gerente Andares', rol: 'gerente', region: 'GDL', sucursal: 'andares', password: 'grupomyt2025' },
  { correo: 'mercadoandares@lacrepeparisienne.com', nombre: 'Gerente Mercado Andares', rol: 'gerente', region: 'GDL', sucursal: 'andares', password: 'grupomyt2025' },
  { correo: 'laperla@lacrepeparisienne.com', nombre: 'Gerente La Perla', rol: 'gerente', region: 'GDL', sucursal: 'la-perla', password: 'grupomyt2025' },
  { correo: 'forumtlaquepaque@lacrepeparisienne.com', nombre: 'Gerente Forum Tlaquepaque', rol: 'gerente', region: 'GDL', sucursal: 'forum', password: 'grupomyt2025' },
  { correo: 'plazapatria@lacrepeparisienne.com', nombre: 'Gerente Plaza Patria', rol: 'gerente', region: 'GDL', sucursal: 'patria', password: 'grupomyt2025' },
  { correo: 'galeriasguadalajara@lacrepeparisienne.com', nombre: 'Gerente Galerías GDL', rol: 'gerente', region: 'GDL', sucursal: 'gal-gdl', password: 'grupomyt2025' },
  { correo: 'midtown@lacrepeparisienne.com', nombre: 'Gerente Midtown', rol: 'gerente', region: 'GDL', sucursal: 'midtown', password: 'grupomyt2025' },
  { correo: 'viaviva@lacrepeparisienne.com', nombre: 'Gerente Via Viva', rol: 'gerente', region: 'GDL', sucursal: 'via-viva', password: 'grupomyt2025' },
  { correo: 'galeriassantaanita@lacrepeparisienne.com', nombre: 'Gerente Santa Anita', rol: 'gerente', region: 'GDL', sucursal: 'sta-anita', password: 'grupomyt2025' }
];

interface AppContextType {
  session: any;
  userProfile: UserProfile | null;
  loadingAuth: boolean;
  activeRegion: string;
  setActiveRegion: (region: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  homeFilter: string;
  setHomeFilter: (filter: string) => void;
  currentYear: number;
  currentMonth: number;
  setCurrentPeriod: (year: number, month: number) => void;
  sucursalesMeta: SucursalMeta[];
  login: (email: string, password: string, demoBranch?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeRegion, setActiveRegionState] = useState<string>('GDL');
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    return localStorage.getItem('lcpDark') === '1';
  });
  const [homeFilter, setHomeFilter] = useState<string>('todas');
  
  // Período activo (por defecto, Mayo 2026 ya que el manifest local llega hasta el mes 5)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5);

  // Lista dinámica de sucursales según la región seleccionada
  const sucursalesMeta = SUCURSALES_META_ALL.filter(s => s.region === activeRegion);

  // Tema oscuro
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('lcpDark', darkMode ? '1' : '0');
  }, [darkMode]);

  // UI Premium siempre activa
  useEffect(() => {
    document.documentElement.setAttribute('data-ui-premium', 'true');
  }, []);

  // Carga inicial y suscripción a eventos de Supabase Auth
  useEffect(() => {
    // 1. Intentar restaurar sesión local (Apps Script / local database fallback)
    try {
      const saved = localStorage.getItem('lcp_reviews_session_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.session && parsed.profile) {
          setSession(parsed.session);
          setUserProfile(parsed.profile);
          setActiveRegionState(parsed.profile.region || 'GDL');
          setLoadingAuth(false);
          return;
        }
      }
    } catch (e) {
      console.error("Error al restaurar sesión de localStorage:", e);
    }

    if (!supabaseClient) {
      // Modo Demo fallback si no hay Supabase configurado
      setSession({ user: { id: "demo-user", email: "demo@lacrepeparisienne.com" } });
      setUserProfile({
        id: "demo-user",
        nombre: "Ibrahim García (Demo)",
        rol: "admin",
        region: "GDL",
        sucursal: null
      });
      setLoadingAuth(false);
      return;
    }

    const initSession = async () => {
      try {
        const { data: { session } } = await supabaseClient!.auth.getSession();
        setSession(session);
        if (session) {
          await loadProfile(session.user.id);
        }
      } catch (e) {
        console.error("Error al inicializar sesión en Supabase:", e);
      } finally {
        setLoadingAuth(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        if (currentSession) {
          await loadProfile(currentSession.user.id);
        } else {
          setUserProfile(null);
        }
        setLoadingAuth(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadProfile = async (uid: string) => {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (data) {
        setUserProfile(data);
        setActiveRegionState(data.region);
      } else {
        // Valores por defecto
        const defaultProfile: UserProfile = {
          id: uid,
          nombre: "Usuario",
          rol: "gerente",
          region: "GDL",
          sucursal: null
        };
        setUserProfile(defaultProfile);
        setActiveRegionState("GDL");
      }
    } catch (e) {
      console.error("Error cargando el perfil de usuario:", e);
    }
  };

  const login = async (email: string, password: string, demoBranch?: string): Promise<boolean> => {
    if (email === 'demo@lacrepeparisienne.com') {
      setSession({ user: { id: "demo-user", email: "demo@lacrepeparisienne.com" } });
      if (demoBranch) {
        const branchMeta = SUCURSALES_META_ALL.find(b => b.id === demoBranch);
        setUserProfile({
          id: "demo-user",
          nombre: `Ibrahim (${branchMeta?.nombre || demoBranch} - Gerente)`,
          rol: "gerente",
          region: branchMeta?.region || "GDL",
          sucursal: demoBranch
        });
        setActiveRegionState(branchMeta?.region || "GDL");
      } else {
        setUserProfile({
          id: "demo-user",
          nombre: "Ibrahim García (Demo)",
          rol: "admin",
          region: "GDL",
          sucursal: null
        });
        setActiveRegionState("GDL");
      }
      return true;
    }

    // 1. Intentar login con base de datos local de usuarios reales (desacoplado de Apps Script)
    const localUser = LOCAL_REAL_USERS.find(
      u => u.correo === email.trim().toLowerCase() && u.password === password
    );

    if (localUser) {
      const profile: UserProfile = {
        id: localUser.correo,
        nombre: localUser.nombre,
        rol: localUser.rol as any,
        region: localUser.region,
        sucursal: localUser.sucursal
      };
      const sessionObj = { user: { id: localUser.correo, email: localUser.correo }, token: 'local_token_' + Date.now() };

      setSession(sessionObj);
      setUserProfile(profile);
      setActiveRegionState(localUser.region);

      localStorage.setItem('lcp_reviews_session_v1', JSON.stringify({
        session: sessionObj,
        profile: profile
      }));

      return true;
    }

    // 2. Fallback a Supabase si no se autenticó localmente
    if (!supabaseClient) {
      return false;
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      if (data.session) {
        await loadProfile(data.user.id);
      }
      return true;
    } catch (e: any) {
      console.error("Error de login en Supabase:", e.message);
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('lcp_reviews_session_v1');
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.warn("Supabase signout warning:", e);
      }
    }
    setSession(null);
    setUserProfile(null);
    setActiveRegionState('GDL');
  };

  const setActiveRegion = (region: string) => {
    if (REGION_NAME_MAP[region]) {
      setActiveRegionState(region);
    }
  };

  const setDarkMode = (dark: boolean) => {
    setDarkModeState(dark);
  };

  const toggleDarkMode = () => {
    setDarkModeState(prev => !prev);
  };

  const setCurrentPeriod = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const isAuthenticated = !!session;

  return (
    <AppContext.Provider value={{
      session,
      userProfile,
      loadingAuth,
      activeRegion,
      setActiveRegion,
      darkMode,
      setDarkMode,
      toggleDarkMode,
      homeFilter,
      setHomeFilter,
      currentYear,
      currentMonth,
      setCurrentPeriod,
      sucursalesMeta,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};
