/**
 * auth-storage.js — Dónde vive la sesión de Supabase: una cookie de primera parte (path=/), compartida por la app (/)
 * y la página de login (/login/). Antes estaba dentro de app.js; se separó para que ambas páginas usen la misma.
 */

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


/** Opciones del cliente de Supabase, iguales en la app y en el login (si difieren, no comparten sesión) */
const SUPABASE_AUTH_OPTIONS = { auth: { storage: CookieStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } };
