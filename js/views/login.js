/**
 * views/login.js — Vista de Landing Page y Login con diseño Cinemático, Storyboard de Scroll, Vapor, Toppings y Estrellas.
 */

const LoginView = {
  canvasAnimationId: null,
  storyboardAnimationId: null,
  _stickyScrollHandler: null,
  _storyboardScrollHandler: null,

  async render(errorMessage = '') {
    const app = document.getElementById('app');
    if (!app) return;

    // Forzar restablecimiento de scroll del body y limpiar listeners previos
    document.body.style.overflow = '';
    
    if (this._storyboardScrollHandler) {
      window.removeEventListener('scroll', this._storyboardScrollHandler);
      this._storyboardScrollHandler = null;
    }
    if (this.canvasAnimationId) {
      cancelAnimationFrame(this.canvasAnimationId);
      this.canvasAnimationId = null;
    }
    if (this.storyboardAnimationId) {
      cancelAnimationFrame(this.storyboardAnimationId);
      this.storyboardAnimationId = null;
    }

    // Estructura HTML de la Landing Page Storyboard pegajosa
    app.innerHTML = `
      <div class="landing-scroll-track" id="landingScrollTrack">
        <div class="landing-sticky-viewport">
          <!-- Canvas Overlay para Toppings, Vapor y Estrellas -->
          <canvas class="landing-canvas-overlay" id="landingCanvasOverlay"></canvas>

          <!-- SLIDE 1: HERO -->
          <div class="landing-slide active" id="slide-hero">
            <div class="landing-hero-content">
              <span class="eyebrow" style="color: var(--oro); font-weight:700; letter-spacing:0.16em; text-transform:uppercase;">étoile · La Crêpe Parisienne</span>
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
                <button class="btn-secondary" onclick="LoginView.scrollToNextSlide()">
                  <span>Conocer estrella</span>
                </button>
              </div>
            </div>
            <div class="scroll-indicator" onclick="LoginView.scrollToNextSlide()">
              <span>Deslizar</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19,12 12,19 5,12"></polyline></svg>
            </div>
          </div>

          <!-- SLIDE 2: PROPÓSITO, METAS, TOOPINGS Y VAPOR -->
          <div class="landing-slide" id="slide-purpose">
            <div class="landing-split">
              <div class="landing-content">
                <span class="landing-section-eyebrow">Nuestro Enfoque</span>
                <h2 class="landing-section-title">La voz de nuestros invitados como guía</h2>
                <p class="landing-section-text">
                  En La Crêpe Parisienne entendemos que cada crepa dulce o salada, y cada taza de café de especialidad preparado al momento es una oportunidad de conectar. étoile reúne y analiza las opiniones del día a día para mantener los más altos estándares de excelencia.
                </p>
                <p class="landing-section-text" style="color: var(--text-dim); font-style: italic; margin-bottom: 0;">
                  "Crear, operar y crecer modelos innovadores que hagan la vida mejor y más divertida para nuestros invitados."
                </p>
              </div>
              <div class="landing-visual" style="display:flex; justify-content:center; align-items:center; position:relative; min-height: 240px;">
                <div style="background: var(--surface); border: 1.5px solid var(--border-strong); padding: 40px; border-radius: var(--radius); text-align:center; box-shadow: var(--sombra); max-width: 320px; z-index:2; width:100%;">
                  <div style="font-family: var(--giaza); font-size: 64px; color: var(--oro); font-weight:400; line-height:1;">4.60★</div>
                  <div style="font-size: 11px; text-transform:uppercase; font-weight:700; letter-spacing:0.08em; color: var(--text-muted); margin-top: 12px;">Meta de Calidad Regional</div>
                </div>
              </div>
            </div>
          </div>

          <!-- SLIDE 3: PILARES Y CLUB PARISIENNE -->
          <div class="landing-slide" id="slide-features">
            <div class="landing-split">
              <div class="landing-content">
                <span class="landing-section-eyebrow">Pilares étoile</span>
                <h2 class="landing-section-title" style="margin-bottom: 24px;">Valores que conducen la operación</h2>
                <div class="landing-features-grid">
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
              <div class="landing-visual" style="display:flex; flex-direction:column; justify-content:center; align-items:center; position:relative; min-height: 320px; gap: 24px;">
                <div style="background: var(--surface); border: 1.5px solid var(--border-strong); padding: 32px; border-radius: var(--radius); text-align:left; box-shadow: var(--sombra); max-width: 320px; z-index:2; display:flex; flex-direction:column; gap:12px; width:100%;">
                  <div style="font-size: 11px; text-transform:uppercase; font-weight:700; letter-spacing:0.08em; color: var(--oro);">Programa Oficial 2026</div>
                  <div style="font-family: var(--sans); font-size: 22px; font-weight:800; color: var(--verde); line-height:1.2;">Recompensas en cada visita</div>
                  <div style="font-size: 13px; color: var(--text-muted); line-height:1.4;">Cashback en consumos y beneficios de temporada acumulables.</div>
                </div>
                
                <button class="btn-primary" id="login-cta-trigger" onclick="LoginView.openLoginPanel()" style="z-index:10; width:100%; max-width:320px; justify-content:center; position:relative;">
                  <span>Acceder a étoile</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12,5 19,12 12,19"></polyline></svg>
                </button>
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
      this.initStoryboardScroll();
    });
  },

  scrollToNextSlide() {
    const track = document.getElementById('landingScrollTrack');
    if (track) {
      const nextY = window.innerHeight * 1.5;
      window.scrollTo({ top: nextY, behavior: 'smooth' });
    }
  },

  // Inicializar controlador de scroll storyboard interactivo y renderizado
  initStoryboardScroll() {
    const canvas = document.getElementById('landingCanvasOverlay');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Estado físico del scroll suavizado (spring LERP)
    let currentScroll = 0;
    let targetScroll = 0;
    const lerpFactor = 0.08; // Suave y con inercia

    // Capturar scroll real después de que el router restablezca la página
    setTimeout(() => {
      currentScroll = window.scrollY;
      targetScroll = window.scrollY;
    }, 50);

    const handleScrollEvent = () => {
      targetScroll = window.scrollY;
    };
    window.addEventListener('scroll', handleScrollEvent, { passive: true });
    this._storyboardScrollHandler = handleScrollEvent;

    // Elementos de partículas
    const steamBubbles = [];
    const toppings = [];
    const reviewStars = [];
    const sparkles = [];
    const trailPoints = [];
    let hasSparkled = false;

    // Inicializar vapor
    for (let i = 0; i < 25; i++) {
      steamBubbles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.7 - 0.3,
        radius: Math.random() * 30 + 15,
        alpha: Math.random() * 0.08 + 0.02,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.005
      });
    }

    // Inicializar Toppings (posiciones fijas que se scrubs en scroll)
    const toppingTypes = ['strawberry', 'chocolate', 'mint', 'almond'];
    for (let i = 0; i < 20; i++) {
      toppings.push({
        type: toppingTypes[i % toppingTypes.length],
        x: (i * 0.06 + 0.05) * canvas.width + (Math.random() - 0.5) * 60,
        yBase: -100 - (Math.random() * 150),
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        swaySpeed: Math.random() * 0.02 + 0.005,
        swayAmp: Math.random() * 40 + 20,
        wobble: Math.random() * Math.PI
      });
    }

    // Inicializar 5 Estrellas de reseñas flotantes
    const starOffsets = [
      { rx: 0.70, ry: 0.28, radius: 24, delay: 0 },
      { rx: 0.78, ry: 0.34, radius: 18, delay: 0.1 },
      { rx: 0.65, ry: 0.42, radius: 22, delay: 0.05 },
      { rx: 0.85, ry: 0.40, radius: 16, delay: 0.15 },
      { rx: 0.72, ry: 0.48, radius: 26, delay: 0.2 } // Esta será la estrella guía que vuela
    ];

    starOffsets.forEach((offset, idx) => {
      reviewStars.push({
        rx: offset.rx,
        ry: offset.ry,
        radius: offset.radius,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: 0.008 + Math.random() * 0.005,
        wobble: Math.random() * Math.PI * 2,
        delay: offset.delay,
        color: 'var(--oro)'
      });
    });

    const drawStarShape = (cContext, cx, cy, spikes, outerRadius, innerRadius, color) => {
      let rot = Math.PI / 2 * 3;
      let sx = cx;
      let sy = cy;
      const step = Math.PI / spikes;

      cContext.beginPath();
      cContext.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        sx = cx + Math.cos(rot) * outerRadius;
        sy = cy + Math.sin(rot) * outerRadius;
        cContext.lineTo(sx, sy);
        rot += step;

        sx = cx + Math.cos(rot) * innerRadius;
        sy = cy + Math.sin(rot) * innerRadius;
        cContext.lineTo(sx, sy);
        rot += step;
      }
      cContext.lineTo(cx, cy - outerRadius);
      cContext.closePath();
      cContext.fillStyle = color;
      cContext.shadowBlur = 12;
      cContext.shadowColor = color;
      cContext.fill();
      cContext.shadowBlur = 0; // reset
    };

    // Render loop principal
    const tick = () => {
      // Guard de Auto-limpieza si salimos de la ruta (el canvas ya no está en el DOM)
      const currentCanvas = document.getElementById('landingCanvasOverlay');
      if (!currentCanvas) {
        if (this._storyboardScrollHandler) {
          window.removeEventListener('scroll', this._storyboardScrollHandler);
          this._storyboardScrollHandler = null;
        }
        if (this.storyboardAnimationId) {
          cancelAnimationFrame(this.storyboardAnimationId);
          this.storyboardAnimationId = null;
        }
        return;
      }

      // 1. Aplicar inercia física de scroll (LERP)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        currentScroll = targetScroll;
      } else {
        currentScroll += (targetScroll - currentScroll) * lerpFactor;
      }
      
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.max(0, Math.min(1, currentScroll / docHeight)) : 0;

      // 2. Controlador de activación de slides (Crossfade)
      const slideHero = document.getElementById('slide-hero');
      const slidePurpose = document.getElementById('slide-purpose');
      const slideFeatures = document.getElementById('slide-features');

      if (slideHero && slidePurpose && slideFeatures) {
        // Slide 1: Hero
        if (progress < 0.24) {
          slideHero.classList.add('active');
          slidePurpose.classList.remove('active');
          slideFeatures.classList.remove('active');
        } 
        // Slide 2: Propósito
        else if (progress >= 0.24 && progress < 0.58) {
          slideHero.classList.remove('active');
          slidePurpose.classList.add('active');
          slideFeatures.classList.remove('active');
        } 
        // Slide 3: Pilares & Club Parisienne
        else {
          slideHero.classList.remove('active');
          slidePurpose.classList.remove('active');
          slideFeatures.classList.add('active');
        }
      }

      // 3. Dibujar Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = performance.now();

      // DIBUJAR CAPA A: VAPOR/STEAM (Fase 1: progress 0.10 a 0.60)
      const steamOpacityFactor = Math.max(0, Math.min(1, (progress - 0.10) / 0.15)) * Math.max(0, Math.min(1, (0.60 - progress) / 0.15));
      if (steamOpacityFactor > 0) {
        steamBubbles.forEach(b => {
          b.wobble += b.wobbleSpeed;
          const currentX = b.x + Math.sin(b.wobble) * 20;
          
          // Scrubbing de altura basado en scroll + idle de ascenso
          const scrollOffsetY = progress * canvas.height * 1.5;
          let currentY = b.y - scrollOffsetY;
          if (currentY < -b.radius) {
            b.y += canvas.height + b.radius * 2;
          }

          ctx.beginPath();
          const grad = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, b.radius);
          grad.addColorStop(0, `rgba(245, 239, 230, ${b.alpha * steamOpacityFactor})`);
          grad.addColorStop(1, 'rgba(245, 239, 230, 0)');
          ctx.fillStyle = grad;
          ctx.arc(currentX, currentY, b.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // DIBUJAR CAPA B: TOPPINGS CAYENDO (Fase 1/2: progress 0.20 a 0.55)
      const toppingsOpacityFactor = Math.max(0, Math.min(1, (progress - 0.20) / 0.10)) * Math.max(0, Math.min(1, (0.55 - progress) / 0.10));
      if (toppingsOpacityFactor > 0) {
        toppings.forEach(t => {
          // Scrubbing de caída libre
          const fallProgress = Math.max(0, Math.min(1, (progress - 0.20) / 0.28));
          
          // Ecuación física de caída con rebote ficticio al final del viewport
          let y = t.yBase + fallProgress * (canvas.height + 250);
          
          // Agregar oscilación y rotación
          t.wobble += t.swaySpeed;
          const x = t.x + Math.sin(t.wobble) * t.swayAmp;
          const currentAngle = t.angle + fallProgress * Math.PI * 4;

          ctx.save();
          ctx.globalAlpha = toppingsOpacityFactor;
          ctx.translate(x, y);
          ctx.rotate(currentAngle);

          // Renderizar fresa
          if (t.type === 'strawberry') {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(198, 40, 40, 0.95)'; // Rojo suave
            ctx.moveTo(0, -12);
            ctx.bezierCurveTo(14, -22, 22, 2, 0, 16);
            ctx.bezierCurveTo(-22, 2, -14, -22, 0, -12);
            ctx.fill();
            
            // Hojas verdes
            ctx.beginPath();
            ctx.fillStyle = '#3D5A47';
            ctx.moveTo(-6, -14);
            ctx.quadraticCurveTo(0, -22, 6, -14);
            ctx.lineTo(0, -10);
            ctx.closePath();
            ctx.fill();
          } 
          // Renderizar chocolate chip
          else if (t.type === 'chocolate') {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(78, 52, 46, 0.95)'; // Chocolate café
            ctx.moveTo(0, -10);
            ctx.lineTo(12, 10);
            ctx.lineTo(-12, 10);
            ctx.closePath();
            ctx.fill();
          } 
          // Renderizar hoja de menta
          else if (t.type === 'mint') {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(122, 158, 138, 0.95)'; // Menta
            ctx.ellipse(0, 0, 14, 8, 0, 0, 2 * Math.PI);
            ctx.fill();
          } 
          // Renderizar almendra
          else {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(215, 172, 126, 0.95)'; // Almendra
            ctx.ellipse(0, 0, 12, 6, Math.PI / 4, 0, 2 * Math.PI);
            ctx.fill();
          }

          ctx.restore();
        });
      }

      // DIBUJAR CAPA C: ESTRELLAS FLOTANTES (Fase 2/3: progress 0.50 a 1.00)
      const starsOpacityFactor = Math.max(0, Math.min(1, (progress - 0.50) / 0.12));
      if (starsOpacityFactor > 0) {
        reviewStars.forEach((star, idx) => {
          // Si es la estrella guía y el scroll entra al rango de vuelo
          if (idx === 4 && progress >= 0.78) {
            const flyProgress = Math.max(0, Math.min(1, (progress - 0.78) / 0.18));
            
            // Inicio: coordenadas relativas en el cluster
            const startX = star.rx * canvas.width;
            const startY = star.ry * canvas.height;

            // Destino: el centro del botón login-cta-trigger
            const btn = document.getElementById('login-cta-trigger');
            let endX = canvas.width * 0.75; // fallback
            let endY = canvas.height * 0.70; // fallback

            if (btn) {
              const rect = btn.getBoundingClientRect();
              const canvasRect = canvas.getBoundingClientRect();
              endX = rect.left - canvasRect.left + rect.width / 2;
              endY = rect.top - canvasRect.top + rect.height / 2;
            }

            // Bezier curve con arco pronunciado hacia arriba
            const controlX = (startX + endX) / 2 + 180;
            const controlY = startY - 240;

            const t = flyProgress;
            const starX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
            const starY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

            // Registrar punto en la estela de luz (trail)
            if (t > 0 && t < 1) {
              trailPoints.push({ x: starX, y: starY, time: time });
            }

            // Dibujar la estela (trail) con degradado
            if (trailPoints.length > 1) {
              // Limpiar puntos viejos para evitar acumulación
              while (trailPoints.length > 0 && time - trailPoints[0].time > 800) {
                trailPoints.shift();
              }

              ctx.beginPath();
              ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
              for (let i = 1; i < trailPoints.length; i++) {
                ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
              }
              ctx.strokeStyle = 'rgba(184, 144, 47, 0.45)';
              ctx.lineWidth = 6;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
              for (let i = 1; i < trailPoints.length; i++) {
                ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
              }
              ctx.strokeStyle = '#FAF5EB';
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            // Impacto del botón
            if (t >= 0.96) {
              if (!hasSparkled) {
                hasSparkled = true;
                // Generar chispas
                for (let s = 0; s < 18; s++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = Math.random() * 4 + 2;
                  sparkles.push({
                    x: endX,
                    y: endY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    radius: Math.random() * 3 + 1.5
                  });
                }
                // Activar pulsación visual en el botón
                if (btn) btn.classList.add('btn-pulse-active');
              }
            } else {
              if (hasSparkled) {
                hasSparkled = false;
                if (btn) btn.classList.remove('btn-pulse-active');
              }
            }

            // Si aún no colisiona del todo, dibujar estrella guía
            if (t < 0.98) {
              const pulseScale = 1.0 + Math.sin(time * 0.01) * 0.15;
              drawStarShape(ctx, starX, starY, 5, star.radius * pulseScale, (star.radius * 0.45) * pulseScale, 'var(--oro)');
            }

          } else {
            // Estrellas estáticas con balanceo (idle floating sway)
            const idleOffset = Math.sin(time * 0.0015 + star.delay * Math.PI * 2) * 12;
            const x = star.rx * canvas.width;
            const y = star.ry * canvas.height + idleOffset;
            const currentAngle = star.angle + time * star.rotSpeed * 0.1;

            ctx.save();
            ctx.globalAlpha = starsOpacityFactor * (idx === 4 && progress >= 0.78 ? 0 : 1);
            
            // Dibujar la estrella con rotación de coordenadas
            ctx.translate(x, y);
            ctx.rotate(currentAngle);
            drawStarShape(ctx, 0, 0, 5, star.radius, star.radius * 0.45, 'var(--oro)');
            ctx.restore();
          }
        });
      }

      // 4. Dibujar chispas de impacto (sparkles)
      if (sparkles.length > 0) {
        sparkles.forEach((s, sIdx) => {
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.05; // gravedad sutil
          s.alpha -= 0.02; // desvanecer

          if (s.alpha <= 0) {
            sparkles.splice(sIdx, 1);
          } else {
            ctx.beginPath();
            ctx.fillStyle = `rgba(184, 144, 47, ${s.alpha})`;
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      this.storyboardAnimationId = requestAnimationFrame(tick);
    };

    tick();
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

  // Panel Deslizable - Canvas de Vapor
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
