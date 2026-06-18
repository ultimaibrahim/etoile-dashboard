/**
 * views/login.js — Vista de Login con diseño Premium y autenticación Supabase.
 */

const LoginView = {
  async render(errorMessage = '') {
    const app = document.getElementById('app');
    if (!app) return;

    // Clases del contenedor principal para dar la estética premium y centrar el login
    app.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card">
          <div class="login-header">
            <span class="eyebrow">La Crêpe Parisienne</span>
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
            <!-- <p style="margin: 0; font-size: 11px;">
              <a href="#/privacidad" class="login-footer-link" style="color: var(--text-dim); text-decoration: underline; transition: color 0.2s;" onmouseover="this.style.color='var(--oro)'" onmouseout="this.style.color='var(--text-dim)'">Aviso de Privacidad</a>
            </p> -->
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
          background: linear-gradient(135deg, var(--verde-deep) 0%, var(--bg) 100%);
          padding: 20px;
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--sombra-lg);
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          animation: cardEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(20px); }
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
          color: var(--verde);
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
          color: var(--alerta);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
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
          transition: color 0.2s;
        }
        .input-container input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px 16px 14px 44px;
          font-family: var(--sans);
          font-size: 14px;
          color: var(--text);
          outline: none;
          transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
        }
        .input-container input::placeholder {
          color: var(--text-dim);
          opacity: 0.6;
        }
        .input-container input:focus {
          border-color: var(--verde);
          background-color: var(--surface);
          box-shadow: 0 0 0 3px rgba(47, 74, 58, 0.12);
        }
        .input-container input:focus + .input-icon {
          color: var(--verde);
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
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: var(--sombra);
        }
        .login-btn:hover {
          background: var(--verde-deep);
          box-shadow: var(--sombra-lg);
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
      await AppAuth.login(email, password);
      const role = AppAuth.getUserRole();
      if (role !== 'gerente') {
        Router.navigate('#/select-region');
      } else {
        Router.navigate('#/');
      }
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
};
