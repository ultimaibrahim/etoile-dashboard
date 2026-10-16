/**
 * views/about.js — Acerca de / Identidad del portal / Contacto
 */

const AboutView = {
  async render() {
    Charts.destroyAll();

    const pill = (label) =>
      `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:rgba(61,90,71,0.1);color:var(--verde-ink);font-size:12px;font-weight:600;letter-spacing:.04em;border:1px solid rgba(61,90,71,0.18);">${label}</span>`;

    document.getElementById('app').innerHTML = `
      ${buildTopbar()}

      <!-- HERO -->
      <section class="hero r">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.8);">Acerca de este portal</span>
            </div>
            <h1 style="font-family:var(--serif);font-size:clamp(28px,6vw,48px);color:#FAF5EB;line-height:1.1;margin-bottom:14px;">
              Dashboard de <span style="font-style:italic;color:var(--sage-ink);">Reseñas</span>
            </h1>
            <p style="color:rgba(245,239,230,.75);font-size:15px;line-height:1.6;max-width:460px;margin-bottom:18px;">
              Herramienta operativa para el seguimiento y análisis de reseñas de Google Maps de las sucursales de La Crêpe Parisienne en la región ${getRegionName(activeRegion)}.
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <a href="#/" class="btn-primary" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:12px;background:var(--oro);color:#FAF5EB;font-size:13px;font-weight:700;text-decoration:none;transition:all 0.2s;">
                <span>Explorar Monitoreo Activo →</span>
              </a>
              <a href="#/dashboards" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#FAF5EB;font-size:13px;font-weight:600;text-decoration:none;">
                <span>Ver Dashboards</span>
              </a>
            </div>
          </div>
          <div class="hero-right">
            <div style="display:grid;gap:12px;">
              <div style="padding:16px 20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,239,230,.45);margin-bottom:6px;">Versión actual</div>
                <button id="versionBtn" onclick="AboutView.toggleChangelog()" style="background:none;border:none;padding:0;cursor:pointer;font-family:var(--sans);font-size:20px;font-weight:700;color:#FAF5EB;letter-spacing:.04em;" title="Ver novedades" aria-expanded="false" aria-controls="changelogPanel">étoile ${escapeHtml(APP_VERSION.label)} · ${escapeHtml(APP_VERSION.codename)}</button>
              </div>
              <div style="padding:16px 20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,239,230,.45);margin-bottom:6px;">Guía de Introducción</div>
                <button onclick="localStorage.removeItem('lcp_walkthrough_seen'); Router.navigate('#/');" style="background:var(--oro);border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-family:var(--sans);font-size:12.5px;font-weight:700;color:#FAF5EB;text-align:center;transition:background 0.2s;" onmouseover="this.style.background='#a37b22'" onmouseout="this.style.background='var(--oro)'">Iniciar Tour de Bienvenida</button>
              </div>
              <div style="padding:16px 20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,239,230,.45);margin-bottom:6px;">Cobertura</div>
                <div style="font-size:15px;font-weight:600;color:#FAF5EB;">${SUCURSALES_META.length} sucursales · Región ${getRegionName(activeRegion)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <!-- CHANGELOG oculto (easter egg): el changelog PÚBLICO, leído en vivo de CHANGELOG_PUBLIC.md -->
      <div id="changelogPanel" hidden>
        <section class="section">
          <div class="section-head">
            <div class="section-title">Novedades <span class="accent">de étoile</span></div>
            <button class="clog-close" onclick="AboutView.toggleChangelog()">Ocultar ×</button>
          </div>
          <div id="changelogBody" aria-live="polite"><p class="drawer-empty">Cargando…</p></div>
        </section>
      </div>

      <!-- PROPÓSITO -->
      <section class="hero r" style="background:var(--verde-deep);padding:56px 24px;">
        <div style="max-width:1240px;margin:0 auto;display:flex;flex-direction:column;align-items:flex-end;text-align:right;gap:20px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,239,230,0.4);">Nuestro Propósito</div>
          <h2 style="font-family:var(--serif);font-size:clamp(28px,6vw,52px);color:#FAF5EB;line-height:1.1;max-width:720px;">
            &ldquo;Crear, operar y crecer modelos innovadores de restaurantes que hagan la vida mejor y más divertida para nosotros y nuestros invitados.&rdquo;
          </h2>
        </div>
      </section>

      <!-- MISIÓN Y VALORES -->
      <section class="section r">
        <div class="section-head">
          <div class="section-title">Misión <span class="accent">y valores</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${[
        { label: 'Hospitalidad y Excelencia', text: 'Creamos historias de hospitalidad memorable. Documentamos nuestros estándares and los seguimos con orgullo. Entrenamos continuamente para hacer cada día mejor.' },
        { label: 'Innovación Continua', text: 'Buscamos constantemente nuevas formas de sorprender a nuestros invitados, optimizar operaciones y adoptar tecnología que potencie a nuestro equipo.' },
        { label: 'Datos como Cultura', text: 'Cada reseña es una conversación. Escuchamos, medimos y actuamos — porque la mejora continua empieza en entender qué piensan quienes nos visitan.' },
      ].map(v => `
            <div class="chart-card" style="display:flex;align-items:flex-start;gap:16px;padding:18px 22px;">
              <div style="margin-top:2px;flex-shrink:0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--oro)" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">${v.label}</div>
                <p style="font-size:15px;line-height:1.6;color:var(--text);">${v.text}</p>
              </div>
            </div>`).join('')}
        </div>
      </section>

      <!-- FAQ & METODOLOGÍA -->
      <section class="section r">
        <div class="section-head">
          <h2 class="section-title" style="margin:0;">Preguntas Frecuentes <span class="accent">y Metodología (FAQ)</span></h2>
          <span class="section-sub">Dudas comunes sobre el cálculo de métricas y gobernanza de datos</span>
        </div>
        <div class="faq-accordion-group">
          <div class="faq-item active" id="faq-item-0">
            <button class="faq-question-btn" onclick="toggleFaqItem(0)">
              <span>¿Cómo se calcula el promedio de satisfacción (CSAT) regional y por tienda?</span>
              <svg class="faq-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-answer">
              El promedio mensual se calcula aritméticamente con el 100% de las calificaciones de 1 a 5 estrellas recibidas en el periodo calendario. Para la comparativa de desempeño y standings multitienda, se aplica adicionalmente un Suavizado Bayesiano (k=15, M=4.50★) que previene distorsiones causadas por muestras pequeñas.
            </div>
          </div>
          <div class="faq-item" id="faq-item-1">
            <button class="faq-question-btn" onclick="toggleFaqItem(1)">
              <span>¿Por qué las reseñas sin comentario escrito no aparecen en las listas de quejas?</span>
              <svg class="faq-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-answer">
              Siguiendo las reglas mandatorias del sistema, las reseñas sin texto únicamente impactan el promedio numérico de estrellas y el algoritmo de Google Maps. Quedan estrictamente excluidas de los tópicos cualitativos y alertas de servicio porque no proporcionan información accionable para la operación en sucursal.
            </div>
          </div>
          <div class="faq-item" id="faq-item-2">
            <button class="faq-question-btn" onclick="toggleFaqItem(2)">
              <span>¿Cómo se clasifican las problemáticas en Servicio, Calidad y Valor?</span>
              <svg class="faq-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-answer">
              Se utiliza un clasificador híbrido serverless con soporte de modelos de lenguaje (LLM) que analiza la semántica del comentario en español, identificando menciones directas a tiempos de espera, atención al cliente, sabor o temperatura del producto y percepción del costo-beneficio.
            </div>
          </div>
          <div class="faq-item" id="faq-item-3">
            <button class="faq-question-btn" onclick="toggleFaqItem(3)">
              <span>¿Con qué frecuencia se sincronizan los datos de Google Reviews?</span>
              <svg class="faq-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-answer">
              Las opiniones se leen directamente de la API oficial de Google Business Profile y se sincronizan con la base de datos cada 30 minutos, de modo que los cuadros de mando reflejan las reseñas nuevas, ediciones y respuestas con un desfase máximo de media hora.
            </div>
          </div>
        </div>
      </section>

      <!-- JSON-LD FAQPage Schema -->
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "¿Cómo se calcula el promedio de satisfacción (CSAT) regional y por tienda?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "El promedio mensual se calcula aritméticamente con el 100% de las calificaciones de 1 a 5 estrellas recibidas en el periodo calendario. Para la comparativa de desempeño y standings multitienda, se aplica adicionalmente un Suavizado Bayesiano (k=15, M=4.50★) que previene distorsiones por muestras pequeñas."
            }
          },
          {
            "@type": "Question",
            "name": "¿Por qué las reseñas sin comentario escrito no aparecen en las listas de quejas?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Las reseñas sin texto únicamente impactan el promedio numérico de estrellas y el algoritmo de Google Maps; quedan estrictamente excluidas de los tópicos cualitativos y alertas de servicio porque no proporcionan información accionable."
            }
          },
          {
            "@type": "Question",
            "name": "¿Cómo se clasifican las problemáticas en Servicio, Calidad y Valor?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Se utiliza un clasificador híbrido serverless con modelos de lenguaje (LLM) que analiza la semántica del comentario en español para identificar tiempos de espera, atención, calidad de preparación y valor."
            }
          },
          {
            "@type": "Question",
            "name": "¿Con qué frecuencia se sincronizan los datos de Google Reviews?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Las opiniones llegan de la API oficial de Google Business Profile cada 30 minutos y se guardan en Supabase."
            }
          }
        ]
      }
      </script>

      <!-- PRODUCT OWNER — sutil, al final -->
      <section class="section r">
        <div style="border-top:1px solid var(--border);padding-top:28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:40px;height:40px;background:rgba(61,90,71,0.1);color:var(--verde-ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:15px;flex-shrink:0;border:1px solid rgba(61,90,71,0.2);">IG</div>
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--text);">Ibrahim García</div>
              <div style="font-size:12px;color:var(--text-muted);">Product Owner · Dashboard de Reseñas LCP GDL</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="mailto:ultima.ibrahim@proton.me"
               style="text-decoration:none;background:var(--surface-2);padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;color:var(--text-muted);border:1px solid var(--border);transition:all 0.2s ease;display:flex;align-items:center;gap:6px;"
               onmouseover="this.style.color='var(--text)';this.style.borderColor='var(--sage)';"
               onmouseout="this.style.color='var(--text-muted)';this.style.borderColor='var(--border)';">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,6 12,13 22,6"/></svg>
              ultima.ibrahim@proton.me
            </a>
            <a href="${SIGNO_REPORT_URL}" target="_blank" rel="noopener"
               style="text-decoration:none;background:var(--surface-2);padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;color:var(--text-muted);border:1px solid var(--border);transition:all 0.2s ease;display:flex;align-items:center;gap:6px;"
               onmouseover="this.style.color='var(--text)';this.style.borderColor='var(--sage)';"
               onmouseout="this.style.color='var(--text-muted)';this.style.borderColor='var(--border)';">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/></svg>
              Reportar un problema
            </a>
            <a href="https://wa.me/5213333223998" target="_blank"
               style="text-decoration:none;background:var(--surface-2);padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;color:var(--text-muted);border:1px solid var(--border);transition:all 0.2s ease;display:flex;align-items:center;gap:6px;"
               onmouseover="this.style.color='var(--text)';this.style.borderColor='var(--sage)';"
               onmouseout="this.style.color='var(--text-muted)';this.style.borderColor='var(--border)';">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer class="footer">
        <span class="brand" style="text-transform:none; font-family:var(--giaza); font-size:18px;">étoile</span> · Grupo MYT / Corporativo Alancar<br>
        Dashboard de Reseñas · Región ${getRegionName(activeRegion)} · v${APP_VERSION.label} · 2026
      </footer>`;

    requestAnimationFrame(() => {
      initReveal();
    });
  },

  async toggleChangelog() {
    const panel = document.getElementById('changelogPanel');
    if (!panel) return;
    const open = panel.hidden;
    panel.hidden = !open;
    const btn = document.getElementById('versionBtn');
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (!open) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 60);
    const body = document.getElementById('changelogBody');
    try {
      body.innerHTML = PublicChangelog.html(await PublicChangelog.load(), APP_VERSION.label);
    } catch (e) {
      body.innerHTML = '<p class="drawer-empty">No se pudieron cargar las novedades.</p>';
    }
  }
};
