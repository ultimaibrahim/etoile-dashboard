import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';
import { SUCURSALES_META_ALL, REGION_NAME_MAP, SUCURSAL_NAME_MAP } from '../lib/data';
import { Review, SucursalMeta, UserProfile } from '../types';

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
    // 1. Intentar restaurar sesión de Apps Script desde LocalStorage
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

    // 1. Intentar login con Google Apps Script backend de GDL
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbwnfhrIGKaAy3LuRdKx7J_QIRH-GelnbazmpoEeaxmbabMcEW9Ue3BcM5X1nCVd0euZ/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', correo: email, password: password })
      });
      const data = await response.json();
      if (data && data.ok && data.user) {
        const apiSucursal = data.user.sucursal;
        let sucursalId: string | null = null;
        if (apiSucursal) {
          sucursalId = SUCURSAL_NAME_MAP[apiSucursal] || SUCURSAL_NAME_MAP[Object.keys(SUCURSAL_NAME_MAP).find(k => k.toLowerCase() === apiSucursal.toLowerCase()) || ''] || apiSucursal.toLowerCase();
        }

        const profile: UserProfile = {
          id: data.user.correo,
          nombre: data.user.nombre,
          rol: data.user.rol,
          region: data.user.region || 'GDL',
          sucursal: sucursalId
        };
        const sessionObj = { user: { id: data.user.correo, email: data.user.correo }, token: data.token };

        setSession(sessionObj);
        setUserProfile(profile);
        setActiveRegionState(data.user.region || 'GDL');

        localStorage.setItem('lcp_reviews_session_v1', JSON.stringify({
          session: sessionObj,
          profile: profile
        }));

        return true;
      }
    } catch (err) {
      console.warn("Error de autenticación con Google Apps Script:", err);
    }

    // 2. Fallback a Supabase si no se autenticó por Apps Script
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
