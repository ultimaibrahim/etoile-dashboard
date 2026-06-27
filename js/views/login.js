/**
 * views/login.js — Vista de Landing Page y Login con diseño Premium, Sticky Stack de secciones y animación de vapor interactivo.
 */

const LoginView = {
  canvasAnimationId: null,

  async render(errorMessage = '') {
    const app = document.getElementById('app');
    if (!app) return;

    // Despejar animaciones anteriores de canvas si las hubiera
    if (this.canvasAnimationId) {
      cancelAnimationFrame(this.canvasAnimationId);
      this.canvasAnimationId = null;
    }

    // HTML de la Landing Page con Sticky Stacking + Panel Deslizable de Login
    app.innerHTML = `
      <!-- LANDING HERO -->
      <section class="landing-hero r">
        <div class="landing-hero-content">
          <span class="eyebrow" style="color: var(--oro); font-weight:700;">étoile · La Crêpe Parisienne</span>
          <h1 class="landing-title">
            Materializar la <span>hospitalidad</span> memorable
          </h1>
          <p class="landing-subtitle">
            El portal de monitoreo de calidad, servicio y experiencia regional para supervisores y directores de Grupo MYT.
          </p>
          <div class="landing-cta-row">
            <button class="btn-primary" onclick="LoginView.openLoginPanel()">
              <span>Acceder al Portal</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12,5 19,12 12,19"></polyline></svg>
            </button>
            <button class="btn-secondary" onclick="document.getElementById('sticky-landing-container').scrollIntoView({ behavior: 'smooth' })">
              <span>Conocer estrella</span>
            </button>
          </div>
        </div>
        <div class="scroll-indicator" onclick="document.getElementById('sticky-landing-container').scrollIntoView({ behavior: 'smooth' })">
          <span>Deslizar</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19,12 12,19 5,12"></polyline></svg>
        </div>
      </section>

      <!-- CONTENEDOR DE TARJETAS APILADAS (STICKY STACKING) -->
      <div class="landing-sticky-container" id="sticky-landing-container">
        
        <!-- CARD 1: PROPÓSITO -->
        <div class="landing-sticky-card r">
          <div class="landing-split">
            <div class="landing-content">
              <span class="landing-section-eyebrow">Nuestro Enfoque</span>
              <h2 class="landing-section-title">La voz de nuestros invitados como guía</h2>
              <p class="landing-section-text">
                En La Crêpe Parisienne entendemos que cada crepa dulce o salada, y cada taza de café de especialidad preparado al momento es una oportunidad de conectar. étoile reúne y analiza las experiencias del día a día para mantener los más altos estándares de excelencia en cada región.
              </p>
              <p class="landing-section-text" style="color: var(--text-dim); font-style: italic; margin-bottom: 0;">
                "Crear, operar y crecer modelos innovadores que hagan la vida mejor y más divertida para nuestros invitados."
              </p>
            </div>
            <div class="landing-visual" style="display:flex; justify-content:center; align-items:center; position:relative; min-height: 240px;">
              <div class="watermark-stars" style="opacity: 0.08; transform: scale(2); pointer-events:none; position:absolute;">
                ${svgIcon('fleur')}
              </div>
              <div style="background: var(--surface-2); border: 1.5px solid var(--border-strong); padding: 40px; border-radius: var(--radius); text-align:center; box-shadow: var(--sombra); max-width: 320px; z-index:1;">
                <div style="font-family: var(--giaza); font-size: 64px; color: var(--oro); font-weight:400; line-height:1;">4.60★</div>
                <div style="font-size: 11px; text-transform:uppercase; font-weight:700; letter-spacing:0.08em; color: var(--text-muted); margin-top: 12px;">Meta de Calidad Regional</div>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 2: PILARES -->
        <div class="landing-sticky-card r">
          <div class="landing-split" style="width: 100%;">
            <div class="landing-content" style="grid-column: 1 / -1; text-align: center; margin-bottom: 24px;">
              <span class="landing-section-eyebrow">Pilares étoile</span>
              <h2 class="landing-section-title" style="margin-bottom: 0;">Valores que conducen la operación</h2>
            </div>
            <div class="landing-features-grid" style="grid-column: 1 / -1; width: 100%;">
              <div class="landing-feature-card">
                <div class="landing-feature-icon">${svgIcon('check')}</div>
                <h3 class="landing-feature-title">Hospitalidad y Excelencia</h3>
                <p class="landing-feature-desc">Creamos historias memorables. Documentamos los estándares de servicio de Grupo MYT y los seguimos con orgullo.</p>
              </div>
              <div class="landing-feature-card">
                <div class="landing-feature-icon">${svgIcon('barChart')}</div>
                <h3 class="landing-feature-title">Cultura de Datos</h3>
                <p class="landing-feature-desc">Cada opinión es una conversación. Escuchamos, evaluamos y actuamos de manera oportuna sobre las quejas críticas.</p>
              </div>
              <div class="landing-feature-card">
                <div class="landing-feature-icon">${svgIcon('info')}</div>
                <h3 class="landing-feature-title">Monitoreo de Calidad</h3>
                <p class="landing-feature-desc">Seguimiento exhaustivo del volumen de opiniones y el ratio de comentarios para identificar oportunidades en cada turno.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 3: FIDELIZACIÓN (CLUB PARISIENNE) -->
        <div class="landing-sticky-card r">
          <div class="landing-split">
            <div class="landing-content">
              <span class="landing-section-eyebrow">Lealtad y Cercanía</span>
              <h2 class="landing-section-title">Club Parisienne</h2>
              <p class="landing-section-text">
                El corazón de nuestra comunidad. Mediante el programa de recompensas, reconocemos la preferencia de nuestros invitados, devolviéndoles valor en cada consumo, otorgando crepas de regalo el mes de su cumpleaños y afianzando una relación que va más allá de la barra de servicio.
              </p>
              <button class="btn-primary" onclick="LoginView.openLoginPanel()" style="margin-top: 8px;">
                <span>Acceder a étoile</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12,5 19,12 12,19"></polyline></svg>
              </button>
            </div>
            <div class="landing-visual" style="display:flex; justify-content:center; align-items:center; position:relative; min-height: 240px;">
              <div style="background: var(--surface-2); border: 1.5px solid var(--border-strong); padding: 32px; border-radius: var(--radius); text-align:left; box-shadow: var(--sombra); max-width: 320px; z-index:1; display:flex; flex-direction:column; gap:12px; width:100%;">
                <div style="font-size: 11px; text-transform:uppercase; font-weight:700; letter-spacing:0.08em; color: var(--oro);">Programa Oficial 2026</div>
                <div style="font-family: var(--sans); font-size: 22px; font-weight:800; color: var(--verde); line-height:1.2;">Recompensas en cada visita</div>
                <div style="font-size: 13px; color: var(--text-muted); line-height:1.4;">Cashback en consumos y beneficios de temporada acumulables.</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- PANEL DE LOGIN DESLIZABLE (BOTTOM SHEET / SLIDE OVER) -->
      <div class="login-panel-overlay" id="loginPanelOverlay" onclick="LoginView.closeLoginPanel(event)">
        <div class="login-panel-content" onclick="event.stopPropagation()">
          <canvas class="login-canvas-bg" id="loginCanvasBg"></canvas>
          
          <div class="login-panel-header">
            <div style="display:flex; align-items:baseline; gap:6px;">
              <span class="brand-text" style="font-family: var(--giaza); font-size: 28px; color: var(--verde); line-height:1;">étoile</span>
              <span style="font-size:11px; color: var(--text-muted); font-weight:600;">Ingreso</span>
            </div>
            <button class="login-panel-close" onclick="LoginView.closeLoginPanel()">×</button>
          </div>

          <div class="login-panel-body">
            <div class="login-card" style="position:relative; z-index:2;">
              <div class="login-header">
                <span class="eyebrow" style="color: var(--oro);">Acceso Restringido</span>
                <p class="login-subtitle" style="margin-top:8px;">Ingresa tus credenciales autorizadas corporativas.</p>
              </div>

              <form id="login-form" class="login-form" onsubmit="LoginView.handleSubmit(event)" style="margin-top: 16px;">
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12,5 19,12 12,19"></polyline></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    if (errorMessage) {
      this.openLoginPanel();
    }

    requestAnimationFrame(() => {
      initReveal();
      this.initStickyStackScrollListener();
    });
  },

  // Controlador de scroll interactivo para el apilamiento de tarjetas (Sticky Stacking)
  initStickyStackScrollListener() {
    const container = document.getElementById('sticky-landing-container');
    if (!container) return;

    const cards = container.querySelectorAll('.landing-sticky-card');
    
    const handleScroll = () => {
      const triggerOffset = 80;
      cards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        
        // Si la tarjeta está fija en el top y las siguientes están avanzando
        if (rect.top <= triggerOffset + 5) {
          // Evaluar la posición relativa de la siguiente tarjeta
          if (idx < cards.length - 1) {
            const nextCard = cards[idx + 1];
            const nextRect = nextCard.getBoundingClientRect();
            
            // Distancia de solapamiento
            const distance = triggerOffset - nextRect.top;
            if (distance > 0) {
              card.classList.add('stacked-1');
              if (idx > 0) {
                cards[idx - 1].classList.add('stacked-2');
              }
            } else {
              card.classList.remove('stacked-1');
              if (idx > 0) {
                cards[idx - 1].classList.remove('stacked-2');
              }
            }
          }
        } else {
          card.classList.remove('stacked-1', 'stacked-2');
        }
      });
    };

    window.removeEventListener('scroll', this._stickyScrollHandler);
    this._stickyScrollHandler = handleScroll;
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Ejecutar una vez al cargar
    handleScroll();
  },

  openLoginPanel() {
    const overlay = document.getElementById('loginPanelOverlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.initDynamicBg();
    }
  },

  closeLoginPanel(event) {
    const overlay = document.getElementById('loginPanelOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      if (this.canvasAnimationId) {
        cancelAnimationFrame(this.canvasAnimationId);
        this.canvasAnimationId = null;
      }
    }
  },

  initDynamicBg() {
    const canvas = document.getElementById('loginCanvasBg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const maxParticles = 40;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.8 - 0.4,
        radius: Math.random() * 24 + 12,
        alpha: Math.random() * 0.2 + 0.1,
        growth: Math.random() * 0.05 + 0.02
      });
    }

    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.radius += p.growth;
        
        const screenFraction = p.y / canvas.height;
        let currentAlpha = p.alpha * screenFraction;
        if (currentAlpha < 0) currentAlpha = 0;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(184, 144, 47, ${currentAlpha})`);
        grad.addColorStop(1, 'rgba(184, 144, 47, 0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        if (p.y + p.radius < 0 || currentAlpha <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + p.radius;
          p.radius = Math.random() * 24 + 12;
          p.alpha = Math.random() * 0.2 + 0.1;
        }
      });

      angle += 0.003;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 3;
      ctx.strokeStyle = 'var(--oro)';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      for (let r = 20; r < 280; r += 16) {
        ctx.save();
        ctx.globalAlpha = 0.06 * (1 - r / 300);
        ctx.beginPath();
        ctx.arc(centerX + Math.cos(angle + r) * 3, centerY + Math.sin(angle + r) * 3, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      this.canvasAnimationId = requestAnimationFrame(draw);
    };

    draw();
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
      
      this.closeLoginPanel();

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
        this.render('Correo o contraseña incorrectos.');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <span>Iniciar Sesión</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12,5 19,12 12,19"></polyline></svg>
        `;
      }
    }
  }
};
