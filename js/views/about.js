/**
 * views/about.js — Acerca de / Identidad del portal / Contacto
 */

const CHANGELOG_EPOCAS = [
  {
    name: 'Altair',
    description: `
      <p style="margin:0 0 8px 0;line-height:1.6;color:var(--text);">
        Representa la era de la madurez operativa y refinamiento visual del Dashboard de Reseñas. Se enfoca en consolidar el control regional de incidencias y la unificación estética.
      </p>
      <ul style="margin:0 0 16px 0;padding-left:20px;font-size:13px;color:var(--text-muted);line-height:1.6;list-style-type:disc;">
        <li><strong>Controles Orgánicos:</strong> Búsqueda, filtrado y ordenación mediante dropdowns y chips personalizados fluidos.</li>
        <li><strong>Evaluación de Desempeño:</strong> Gradiente interactivo y dinámico en hover según cumplimiento del umbral regional de 4.60.</li>
        <li><strong>Vectores SVG:</strong> Migración absoluta de iconografía decorativa a SVG nativo, optimizando la legibilidad en Dark Mode.</li>
        <li><strong>Consolidado de Alertas:</strong> Reportes integrales con feed de reseñas críticas y copia automatizada al portapapeles para Marketing.</li>
      </ul>
    `,
    versions: [
      {
        v: 'v3.2.1.altair', date: 'Mayo 2026',
        items: [
          'Optimización de Alertas: Rediseño estético y de dimensiones de los botones de copiado de alertas (tanto individual como consolidado) a formato centrado y compacto para evitar bloques masivos en la interfaz.',
          'Emblema Local Guide: Ajuste sutil del distintivo de Local Guide en la vista de detalle de reseña, limitando el tamaño del icono de estrella SVG para prevenir desbordamientos y saltos de línea indeseados en el texto.'
        ]
      },
      {
        v: 'v3.2.0.altair', date: 'Mayo 2026',
        items: [
          'Evaluación de sucursales: Calificación con estrellas de color oro ubicada ahora al lado del nombre de la sucursal en las tarjetas de la pantalla de inicio y en la cabecera de la vista de sucursal.',
          'Dropdowns personalizados: Sustitución de todos los selectores HTML nativos restantes por selectores orgánicos y estilizados de diseño premium, incluyendo el selector de mes del Hero, los filtros de sentimiento y sucursal de la barra lateral, y el selector de mes de la vista de sucursal.',
          'Interacciones y UX: Implementación de cierre automático al hacer clic fuera del dropdown para todos los nuevos selectores orgánicos y resguardo del estado del filtro de la barra lateral en memoria.'
        ]
      },
      {
        v: 'v3.1.0.altair', date: 'Mayo 2026',
        items: [
          'Agrupación e informes: Unificación de alertas regionales con la capacidad de ver el feed completo de reseñas críticas desde un botón general.',
          'Consolidación de reportes: Botón para copiar al portapapeles el resumen de incidencias estructurado para envío directo a Marketing.',
          'Dashboard Scorecards: Ajustes de altura fija y alineación interna vertical (margin-top: auto en barra de progreso) para evitar desalineaciones en móviles.',
          'Ajustes de UI: Centrado vertical y alineación del icono indicador en las tarjetas de sucursal, y transiciones fluidas en hover.',
          'Estados de alerta: Subsanada la evaluación de hover para marcar en color naranja sucursales que tengan alertas pero promedio igual o superior a la meta de 4.60, y en rojo únicamente si está por debajo.',
          'Carrusel de Actividad: Movimiento continuo fluido (0.6px/frame) con pausa inteligente en hover, clic y eventos táctiles.',
          'Responsividad del Carrusel: Ocultamiento completo de flechas en pantallas móviles para desplazamiento táctil nativo sin interferir con el texto, y gutters laterales de 48px en escritorio.',
          'Detalle de Reseñas: Modal emergente premium con desenfoque de fondo (backdrop-filter) para leer reseñas completas al hacer clic en las tarjetas del carrusel, con congelamiento de scroll del body y reanudación automática del carrusel al cerrar.',
          'Recorte de texto: Limitación visual estricta a 3 líneas de texto con puntos suspensivos en las tarjetas del carrusel, asegurando una visualización uniforme de las reseñas.'
        ]
      },
      {
        v: 'v3.0', date: 'Mayo 2026',
        items: [
          'Controles de Sucursal: Rediseño completo de búsqueda, filtros y ordenación con dropdown customizado orgánico y chips integrados de forma fluida.',
          'Evaluación de Sucursales: Gradiente interactivo en hover según desempeño (verde si todo OK, naranja si hay alertas y promedio ≥ regional, rojo si hay alertas y promedio < regional).',
          'Identidad Visual: Eliminación total de emojis en toda la plataforma, reemplazados por iconos SVG vectoriales responsivos y consistentes.',
          'Optimización Dark Mode: Ajustes en los contrastes y legibilidad del texto en modo oscuro, con transiciones fluidas en todas las vistas.'
        ]
      }
    ]
  },
  {
    name: 'Sirius',
    description: `
      <p style="margin:0 0 8px 0;line-height:1.6;color:var(--text);">
        Etapa de revolución arquitectónica e infraestructura técnica del Dashboard. Introdujo modularidad y rendimiento optimizado para el uso diario.
      </p>
      <ul style="margin:0 0 16px 0;padding-left:20px;font-size:13px;color:var(--text-muted);line-height:1.6;list-style-type:disc;">
        <li><strong>Navegación SPA:</strong> Transición completa a Single Page Application basada en un Hash Router asíncrono.</li>
        <li><strong>Carga Eficiente:</strong> Carga perezosa (lazy fetch) de JSONs mensuales y caché local persistente via KpiStore.</li>
        <li><strong>Feed y Drawer:</strong> Despliegue de tarjetas de actividad reciente y drawer lateral deslizable para filtros avanzados.</li>
        <li><strong>Adaptabilidad Mobile:</strong> Rediseño de barra de navegación inferior fija para el uso en dispositivos móviles de gerencia.</li>
      </ul>
    `,
    versions: [
      {
        v: 'v2.9', date: 'Mayo 2026',
        items: [
          'Month Dropdown: Se traslada el selector de meses al Hero con un dropdown de diseño premium integrado.',
          'Actividad Reciente: Rediseño del feed en formato carrusel con scroll horizontal y efecto de difuminado lateral.',
          'Alertas sin texto: Se filtran las alertas para mostrar únicamente reseñas negativas con comentarios escritos.',
          'Modal de Alertas: Cierre al hacer clic fuera del recuadro, bloqueo de scroll en el fondo y simplificación de botones de acción.'
        ]
      },
      {
        v: 'v2.8', date: 'Mayo 2026',
        items: [
          'Sincronización de Meses: El selector de mes ahora se sincroniza globalmente entre la pantalla principal y las vistas de sucursal.',
          'Lo más destacado: Se restaura la sección de reseñas 5 estrellas destacadas con autoplay aleatorio al lado del banner de alertas.',
          'Font loading: Se corrige la ruta de carga de la tipografía Giaza.otf y se aplica a todas las marcas étoile en footer.'
        ]
      },
      {
        v: 'v2.7', date: 'Mayo 2026',
        items: [
          'KPIs: Mapeo de métricas accionables (ej. "negativas sin responder" y listado de sucursales faltantes).',
          'Alertas: Sistema de seguimiento con chips de sucursales y opción de marcar como atendido persistente.',
          'Actividad Reciente: Nuevo feed de reseñas con 3 cards destacadas (mix positivo/negativo) y análisis de causa raíz.',
          'Feed Completo: Drawer lateral deslizable con filtros avanzados por sentimiento y sucursal.',
          'Mes Navegable: Selector de mes en el topbar header con flechas para actualización total reactiva.',
          'Scorecard Hero: Animación de conteo animado para el promedio regional con gradiente dorado.',
          'Surfaces: Profundidad visual mejorada en modo oscuro (#0B0C15, #151725, #1E2132).'
        ]
      },
      {
        v: 'v2.6', date: 'Mayo 2026',
        items: [
          'Dashboards: Charts dinámicos y responsive al 100% en pantallas móviles.',
          'Corrección definitiva del bottom nav móvil (fixed edge-to-edge sin espacios).',
          'Home: Nuevo botón "Siguiente reseña" en card Destacado con transición suave.',
          'Refinamiento de grid layout: espaciados consistentes y heights balanceados.',
          'Changelog: El botón de versión se convierte en easter egg sin estilo de link.',
          'Fix de inicialización de animaciones .r en primera carga.'
        ]
      },
      {
        v: 'v2.5', date: 'Mayo 2026',
        items: [
          'Filtrado visual de reseñas sin texto (KPI no afectado).',
          'Sección "Nuestro Propósito" alineada a la derecha con cita completa.',
          'Tooltip de gráfica se auto-oculta a los 5 segundos en móvil.',
          'Grid de dashboards responsive (1 col móvil → 2 col desktop).',
          'Hero sections full-width en resoluciones grandes (fix huecos laterales).',
          'About: card de Ibrahim al final, versión con changelog interactivo.',
          'Modal de alertas: animación de entrada + cierre con Escape.',
          'Texto normal (no italic) en sección de valores y modal.'
        ]
      },
      {
        v: 'v2.4', date: 'Mayo 2026',
        items: [
          'Restauración de identidad "Acerca de": misión, valores, propósito.',
          'Card de Product Owner con bio, email y WhatsApp actualizados.',
          'Reseñas sin texto ocultas visualmente (no afectan KPI).',
          'Botón "Mostrar todas" también filtra solo reseñas con texto.',
          'Corrección de padding-bottom móvil (botones no recortados).',
          'Alert-strip con max-width centrado en pantallas anchas.'
        ]
      },
      {
        v: 'v2.3', date: 'Abril–Mayo 2026',
        items: [
          'KPI "Calidad de reseña": fix ReferenceError (positivasConTexto).',
          'Fix error crítico en styles.css (bloque body no cerrado → página en blanco).',
          'Overflow-x hidden en html (scroll fantasma móvil eliminado).',
          'Dashboards: hero con dos columnas, acceso a Reporte Trimestral Q1.',
          'Watermark de estrellas posicionadas esquina inferior-derecha.',
          'Auto-hide tooltip en gráfica de barras tras 5s en touch.'
        ]
      },
      {
        v: 'v2.2', date: 'Abril 2026',
        items: [
          'Dark mode: data-theme en <html> (no en body).',
          'Tarjetas alert-box-sunken y highlight-box con watermark de estrellas.',
          'Ruta #/trimestre/2026-Q1 accesible desde hero de Dashboards.',
          'Eliminación de emojis decorativos (reemplazados por SVG).',
          'Mobile-first: bottom nav 6 tabs, topbar responsive.'
        ]
      },
      {
        v: 'v2.1', date: 'Marzo 2026',
        items: [
          'Sistema de roles: LEADERSHIP_ROLES vs gerente.',
          'Carga lazy de datos JSON por mes/año.',
          'KpiStore con caché localStorage.',
          'Hash router SPA async (#/, #/sucursal/:id, #/trimestre/:id, #/acerca).',
          'Vista Quarter con acordeón trimestral.'
        ]
      },
      {
        v: 'v2.0', date: 'Febrero 2026',
        items: [
          'Refactor completo: modularización en js/views/.',
          'DataLoader unificado con manifest.json.',
          'Sistema de Chart.js 4.4.1 CDN (barVolume + stackedVolume).',
          'Paleta de color LCP: --verde, --sage, --crema, --oro.'
        ]
      }
    ]
  },
  {
    name: 'v1.0 (Orígenes)',
    description: `
      <p style="margin:0 0 8px 0;line-height:1.6;color:var(--text);">
        Cimientos fundacionales del ecosistema. Se definió la identidad de marca, la paleta semántica inicial y los primeros flujos de datos operativos.
      </p>
      <ul style="margin:0 0 16px 0;padding-left:20px;font-size:13px;color:var(--text-muted);line-height:1.6;list-style-type:disc;">
        <li><strong>Identidad LCP:</strong> Creación del sistema de diseño inicial con colores representativos (verde, crema, sage y oro).</li>
        <li><strong>Tipografía Base:</strong> Introducción de las familias tipográficas Giaza, DM Sans y DM Serif Display.</li>
        <li><strong>Integración Sheets:</strong> Conexión inicial con Google Sheets y Google Apps Script para registro de lecturas y login básico.</li>
      </ul>
    `,
    versions: [
      {
        v: 'v1.0', date: 'Enero 2026',
        items: [
          'Arquitectura Base: Estructura del DOM inicial, maquetación adaptada a gerentes (mobile-first en iPhone).',
          'Variables CSS: Creación de la paleta semántica base (verde LCP, sage, crema, oro y alertas).',
          'Lecturas y Datos: Carga inicial de datos desde las hojas de cálculo de Google Sheets para reportes básicos.'
        ]
      }
    ]
  }
];

const AboutView = {
  async render() {
    Charts.destroyAll();

    const pill = (label) =>
      `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:rgba(61,90,71,0.1);color:var(--verde);font-size:12px;font-weight:600;letter-spacing:.04em;border:1px solid rgba(61,90,71,0.18);">${label}</span>`;

    document.getElementById('app').innerHTML = `
      ${buildTopbar()}

      <!-- HERO -->
      <section class="hero r">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Acerca de este portal</span>
            </div>
            <h1 style="font-family:var(--serif);font-size:clamp(28px,6vw,48px);color:var(--crema);line-height:1.1;margin-bottom:14px;">
              Dashboard de <span style="font-style:italic;color:var(--sage);">Reseñas</span>
            </h1>
            <p style="color:rgba(245,239,230,.75);font-size:15px;line-height:1.6;max-width:460px;">
              Herramienta operativa para el seguimiento y análisis de reseñas de Google Maps de las 8 sucursales de La Crêpe Parisienne en la región Guadalajara.
            </p>
          </div>
          <div class="hero-right">
            <div style="display:grid;gap:12px;">
              <div style="padding:16px 20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,239,230,.45);margin-bottom:6px;">Versión actual</div>
                <button id="versionBtn" onclick="AboutView.toggleChangelog()" style="background:none;border:none;padding:0;cursor:pointer;font-family:var(--sans);font-size:20px;font-weight:700;color:var(--crema);letter-spacing:.04em;" title="Ver Changelog">étoile - Altair</button>
              </div>
              <div style="padding:16px 20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,239,230,.45);margin-bottom:6px;">Cobertura</div>
                <div style="font-size:15px;font-weight:600;color:var(--crema);">8 sucursales · Región GDL</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CHANGELOG oculto -->
      <div id="changelogPanel" style="display:none;overflow:hidden;transition:max-height 0.4s ease;">
        <section class="section">
          <div class="section-head">
            <div class="section-title">Changelog <span class="accent">de versiones</span></div>
            <button onclick="AboutView.toggleChangelog()" style="background:none;border:none;font-size:13px;color:var(--text-muted);cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid var(--border);">Ocultar ×</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:32px;">
            ${CHANGELOG_EPOCAS.map(group => `
              <div class="epoch-group">
                <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:8px;">
                  <h3 style="font-family:var(--serif);font-size:22px;color:var(--verde);font-weight:700;margin:0;">${group.name}</h3>
                </div>
                <div style="font-size:14px;color:var(--text-muted);line-height:1.5;margin-bottom:18px;">${group.description}</div>
                <div style="display:flex;flex-direction:column;gap:16px;padding-left:8px;">
                  ${group.versions.map((entry, vIdx) => `
                    <div class="chart-card" style="border-left:3px solid ${(group.name === 'Altair' && vIdx === 0) ? 'var(--verde)' : 'var(--border)'};">
                      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:12px;">
                        <span style="font-family:var(--mono);font-weight:700;font-size:14px;color:${(group.name === 'Altair' && vIdx === 0) ? 'var(--verde)' : 'var(--text-muted)'};">${entry.v}</span>
                        <span style="font-size:11px;color:var(--text-muted);letter-spacing:.06em;">${entry.date}</span>
                        ${(group.name === 'Altair' && vIdx === 0) ? '<span style="font-size:10px;background:rgba(61,90,71,0.12);color:var(--verde);padding:2px 8px;border-radius:10px;font-weight:700;letter-spacing:.08em;">ACTUAL</span>' : ''}
                      </div>
                      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;">
                        ${entry.items.map(item => `<li style="font-size:13px;color:var(--text);padding-left:18px;position:relative;line-height:1.5;"><span style="position:absolute;left:0;color:var(--sage);">›</span>${item}</li>`).join('')}
                      </ul>
                    </div>`).join('')}
                </div>
              </div>`).join('')}
          </div>
        </section>
      </div>

      <!-- PROPÓSITO -->
      <section class="hero r" style="background:var(--verde-deep);padding:56px 24px;">
        <div style="max-width:1240px;margin:0 auto;display:flex;flex-direction:column;align-items:flex-end;text-align:right;gap:20px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,239,230,0.4);">Nuestro Propósito</div>
          <h2 style="font-family:var(--serif);font-size:clamp(28px,6vw,52px);color:var(--crema);line-height:1.1;max-width:720px;">
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
        { label: 'Hospitalidad y Excelencia', text: 'Creamos historias de hospitalidad memorable. Documentamos nuestros estándares y los seguimos con orgullo. Entrenamos continuamente para hacer cada día mejor.' },
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

      <!-- DESCARGAS -->
      <section class="section r">
        <div class="section-head">
          <div class="section-title">Descargas <span class="accent">próximamente</span></div>
        </div>
        <div class="chart-card" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 20px;">
          <div style="width:52px;height:52px;border-radius:14px;background:rgba(61,90,71,0.08);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div style="font-family:var(--serif);font-size:20px;color:var(--negro);margin-bottom:8px;">Formatos y Reportes PDF</div>
          <div style="font-size:14px;color:var(--text-muted);max-width:300px;">El módulo para exportar los reportes de KPIs mensuales en PDF está en desarrollo.</div>
        </div>
      </section>

      <!-- PRODUCT OWNER — sutil, al final -->
      <section class="section r">
        <div style="border-top:1px solid var(--border);padding-top:28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:40px;height:40px;background:rgba(61,90,71,0.1);color:var(--verde);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:15px;flex-shrink:0;border:1px solid rgba(61,90,71,0.2);">IG</div>
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
        Dashboard de Reseñas · Región Guadalajara · v3.1.0.altair · 2026
      </footer>`;

    requestAnimationFrame(() => initReveal());
  },

  toggleChangelog() {
    const panel = document.getElementById('changelogPanel');
    if (!panel) return;
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      // scroll suave hasta el panel
      setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }
};
