/**
 * utils.js — Helpers puros y utilidades visuales.
 */

function starStr(n) {
  const num = Math.round(Number(n) || 0);
  const safeN = Math.max(0, Math.min(5, num));
  return '★'.repeat(safeN) + '☆'.repeat(5 - safeN);
}

function svgIcon(name) {
  const i = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    barChart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    starFilled: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    cinema: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>',
    fleur: '<svg class="deco-fleur" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C12 2 14.5 6.5 17 8C19.5 9.5 22 10 22 10C22 10 18 11.5 16 14C14 16.5 12 22 12 22C12 22 10 16.5 8 14C6 11.5 2 10 2 10C2 10 4.5 9.5 7 8C9.5 6.5 12 2 12 2Z" /></svg>'
  };
  return i[name] || '';
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = meses[d.getUTCMonth()];
  const anio = d.getUTCFullYear();
  return `${dia} ${mes} ${anio}`;
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  const datePart = formatDate(isoString);
  const hora = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${datePart} · ${hora}:${min}`;
}

function isMonthComplete(year, month) {
  const now = new Date();
  const target = new Date(year, month, 0, 23, 59, 59);
  return now > target;
}

function isLastDayOfMonth() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return tomorrow.getMonth() !== now.getMonth();
}

function initReveal() {
  const obs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.r').forEach(el => obs.observe(el));
}

function getBranchById(id) {
  return SUCURSALES_META.find(s => s.id === id);
}

function getBranchNameToId(name) {
  return SUCURSAL_NAME_MAP[name] || null;
}

/* ── QUARTER HELPERS ───────────────────────────────────── */
function getQuarterMonths(q) {
  const map = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] };
  return map[q] || [];
}

function quarterLabel(q) {
  return `Q${q} 2026`;
}

function parseQuarterParam(param) {
  // param = "2026-Q1" or "Q1"
  const m = param.match(/Q(\d)/i);
  if (!m) return null;
  return { year: 2026, quarter: parseInt(m[1]) };
}

/* ── TOPBAR ────────────────────────────────────────────── */
function buildTopbar(showBack = false, branchName = '', isCorporate = false) {
  const currentHash = window.location.hash;
  const isHome = currentHash === '#/' || currentHash === '';
  const isDash = currentHash === '#/dashboards';
  const isAbout = currentHash.startsWith('#/acerca');

  const back = showBack
    ? `<button class="topbar-back" onclick="window.history.back()">${svgIcon('arrow')}<span>Atrás</span></button>`
    : '';
  const titleArea = showBack 
    ? `<span class="topbar-brand"><span class="accent">${branchName}</span></span>`
    : `<a href="#/" class="topbar-brand"><span class="accent">étoile</span></a>`;

  const showDashboards = typeof SUCURSALES_META !== 'undefined' && SUCURSALES_META.length > 1;

  let nav = '';
  let desktopNav = '';
  if (isCorporate) {
    const activeTab = (window.BrandView && window.BrandView.activeTab) || 'resumen';
    nav = `<nav class="topbar-nav" id="mainNav">
      <button class="topbar-link ${activeTab === 'resumen' ? 'active' : ''}" onclick="BrandView.switchTab('resumen')" style="background:none; border:none; cursor:pointer;" title="Resumen General">${svgIcon('home')} <span>Resumen</span></button>
      <button class="topbar-link ${activeTab === 'comparativa' ? 'active' : ''}" onclick="BrandView.switchTab('comparativa')" style="background:none; border:none; cursor:pointer;" title="Comparativa">${svgIcon('barChart')} <span>Comparativa</span></button>
      <button class="topbar-link ${activeTab === 'alertas' ? 'active' : ''}" onclick="BrandView.switchTab('alertas')" style="background:none; border:none; cursor:pointer;" title="Alertas Críticas">${svgIcon('alert')} <span>Alertas Nac.</span></button>
    </nav>`;

    desktopNav = `
      <div class="topbar-nav topbar-nav--desktop" id="mainNavDesktop">
        <button class="topbar-link ${activeTab === 'resumen' ? 'active' : ''}" onclick="BrandView.switchTab('resumen')" style="background:none; border:none; cursor:pointer;" title="Resumen General">${svgIcon('home')} <span>Resumen</span></button>
        <button class="topbar-link ${activeTab === 'comparativa' ? 'active' : ''}" onclick="BrandView.switchTab('comparativa')" style="background:none; border:none; cursor:pointer;" title="Comparativa">${svgIcon('barChart')} <span>Comparativa</span></button>
        <button class="topbar-link ${activeTab === 'alertas' ? 'active' : ''}" onclick="BrandView.switchTab('alertas')" style="background:none; border:none; cursor:pointer;" title="Alertas Críticas">${svgIcon('alert')} <span>Alertas Nac.</span></button>
      </div>
    `;
  } else {
    nav = `<nav class="topbar-nav" id="mainNav">
      <a href="#/" class="topbar-link ${isHome ? 'active' : ''}" title="Inicio">${svgIcon('home')} <span>Inicio</span></a>
      ${showDashboards ? `<a href="#/dashboards" class="topbar-link ${isDash ? 'active' : ''}" title="Gráficas">${svgIcon('barChart')} <span>Dashboards</span></a>` : ''}
      <a href="#/acerca" class="topbar-link ${isAbout ? 'active' : ''}" title="Acerca de">${svgIcon('info')} <span>Acerca de</span></a>
    </nav>`;

    desktopNav = `
      <div class="topbar-nav topbar-nav--desktop" id="mainNavDesktop">
        <a href="#/" class="topbar-link ${isHome ? 'active' : ''}" title="Inicio">${svgIcon('home')} <span>Inicio</span></a>
        ${showDashboards ? `<a href="#/dashboards" class="topbar-link ${isDash ? 'active' : ''}" title="Gráficas">${svgIcon('barChart')} <span>Dashboards</span></a>` : ''}
        <a href="#/acerca" class="topbar-link ${isAbout ? 'active' : ''}" title="Acerca de">${svgIcon('info')} <span>Acerca de</span></a>
      </div>
    `;
  }

  // Botón de regreso a selección de región
  let backToSelectBtn = '';
  let backToSelectBtnMobile = '';
  if (typeof AppAuth !== 'undefined' && AppAuth.isAuthenticated()) {
    const role = AppAuth.getUserRole();
    if (['admin', 'director', 'regional', 'zonal'].includes(role)) {
      backToSelectBtn = `
        <a href="#/select-region" class="topbar-link-regions" title="Volver a Selección de Región" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 10px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.18); color: var(--oro); text-decoration: none; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; margin-right: 8px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Regiones</span>
        </a>
      `;
      backToSelectBtnMobile = `
        <a href="#/select-region" class="topbar-mobile-link" onclick="window.toggleMobileMenu()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Regiones</span>
        </a>
      `;
    }
  }

  // Selector de región para administradores, regionales y zonales
  let regionSelect = '';
  let regionSelectMobile = '';
  if (!isCorporate && typeof AppAuth !== 'undefined' && AppAuth.isAuthenticated()) {
    const role = AppAuth.getUserRole();
    if (role === 'admin' || role === 'regional' || role === 'zonal') {
      const activeName = (typeof REGION_NAME_MAP !== 'undefined' && REGION_NAME_MAP[activeRegion]) || activeRegion;
      const optionsHtml = Object.entries(typeof REGION_NAME_MAP !== 'undefined' ? REGION_NAME_MAP : { 'GDL': 'Guadalajara', 'CDMX': 'CDMX' })
        .map(([id, name]) => {
          const isActive = id === activeRegion ? ' active' : '';
          return `<div class="custom-option${isActive}" data-value="${id}" onclick="handleRegionChange('${id}')">${name}</div>`;
        })
        .join('');
      regionSelect = `
        <div class="custom-select" id="topbarRegionDropdown">
          <button class="custom-select-trigger" onclick="event.stopPropagation(); document.getElementById('topbarRegionDropdown').classList.toggle('open');" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.12); color: #FAF5EB; border-radius: 20px; padding: 6px 14px; font-size: 11px;">
            <span class="custom-select-value">${activeName}</span>
            <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="custom-select-options" style="right: 0; left: auto; background: var(--verde-deep); border-color: rgba(255,255,255,0.15);">
            ${optionsHtml}
          </div>
        </div>
      `;
      regionSelectMobile = `
        <div class="topbar-mobile-select-wrap" style="display: flex; flex-direction: column; gap: 6px; padding: 10px 16px;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Región</span>
          <div class="custom-select" id="topbarRegionDropdownMobile" style="width: 100%;">
            <button class="custom-select-trigger" onclick="event.stopPropagation(); document.getElementById('topbarRegionDropdownMobile').classList.toggle('open');" style="width: 100%; justify-content: space-between; background: var(--surface-2); border-color: var(--border-strong);">
              <span class="custom-select-value" style="color: var(--text);">${activeName}</span>
              <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="custom-select-options" style="width: 100%; left: 0;">
              ${Object.entries(typeof REGION_NAME_MAP !== 'undefined' ? REGION_NAME_MAP : { 'GDL': 'Guadalajara', 'CDMX': 'CDMX' })
                .map(([id, name]) => `<div class="custom-option${id === activeRegion ? ' active' : ''}" data-value="${id}" onclick="handleRegionChange('${id}'); window.toggleMobileMenu();">${name}</div>`)
                .join('')}
            </div>
          </div>
        </div>
      `;
    }
  }

  // Botón de cerrar sesión
  let logoutBtn = '';
  let logoutBtnMobile = '';
  if (typeof AppAuth !== 'undefined' && AppAuth.isAuthenticated()) {
    logoutBtn = `
      <button class="topbar-logout" onclick="AppAuth.logout()" title="Cerrar sesión" aria-label="Cerrar sesión">
        ${svgIcon('logout')}
      </button>
    `;
    logoutBtnMobile = `
      <button class="topbar-mobile-link" onclick="AppAuth.logout(); window.toggleMobileMenu();" style="border:none; background:none; text-align:left; width:100%; cursor:pointer; color:inherit;">
        ${svgIcon('logout')}
        <span>Cerrar Sesión</span>
      </button>
    `;
  }

  // Registrar handler para menú móvil si no existe
  if (!window.toggleMobileMenu) {
    window.toggleMobileMenu = (e) => {
      if (e) e.stopPropagation();
      const dropdown = document.getElementById('topbarMobileDropdown');
      if (dropdown) {
        dropdown.classList.toggle('active');
        const hamburger = document.querySelector('.topbar-hamburger');
        if (hamburger) {
          hamburger.classList.toggle('active');
        }
      }
    };
    
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('topbarMobileDropdown');
      const hamburger = document.querySelector('.topbar-hamburger');
      if (dropdown && dropdown.classList.contains('active')) {
        if (!dropdown.contains(e.target) && !hamburger.contains(e.target)) {
          dropdown.classList.remove('active');
          if (hamburger) hamburger.classList.remove('active');
        }
      }
      // Cerrar dropdowns de región al hacer clic fuera
      document.querySelectorAll('.custom-select.open').forEach(ds => {
        if (!ds.contains(e.target)) {
          ds.classList.remove('open');
        }
      });
    });
  }

  const header = `
    <header class="topbar">
      <div class="topbar-left">${back}${titleArea}</div>
      <div class="topbar-right">
        ${desktopNav}
        <div class="topbar-actions">
          ${backToSelectBtn}
          ${regionSelect}
          <button class="dark-toggle" onclick="toggleDark()" aria-label="Cambiar tema">${darkMode ? svgIcon('sun') : svgIcon('moon')}</button>
          ${logoutBtn}
        </div>
        
        <!-- Botón hamburguesa para móviles -->
        <button class="topbar-hamburger" onclick="window.toggleMobileMenu(event)" aria-label="Menú">
          <svg class="hamburger-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line class="line-top" x1="3" y1="6" x2="21" y2="6"></line>
            <line class="line-mid" x1="3" y1="12" x2="21" y2="12"></line>
            <line class="line-bot" x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Menú desplegable móvil colapsable -->
      <div class="topbar-mobile-dropdown" id="topbarMobileDropdown">
        ${backToSelectBtnMobile}
        ${regionSelectMobile}
        <button class="topbar-mobile-link" onclick="toggleDark(); window.toggleMobileMenu();" style="border:none; background:none; text-align:left; width:100%; cursor:pointer;">
          ${darkMode ? svgIcon('sun') : svgIcon('moon')}
          <span>Tema: ${darkMode ? 'Claro' : 'Oscuro'}</span>
        </button>
        ${logoutBtnMobile}
      </div>
    </header>${nav}
  `;

  return header;
}

async function handleRegionChange(region) {
  if (typeof DataLoader !== 'undefined') {
    await DataLoader.switchRegion(region);
    Router.resolve();
  }
}

/* ── INSIGHTS DINÁMICOS ───────────────────────────────── */
function computeDynamicInsights(reviews) {
  if (!reviews || reviews.length === 0) return { alertTheme: null, problemas: [] };

  const negatives = reviews.filter(r => r.stars <= 3 && r.text && r.text.length > 5);
  if (negatives.length === 0) return { alertTheme: null, problemas: [] };

  let textBlock = negatives.map(r => r.text.toLowerCase()).join(' ');
  const keywords = ['actitud', 'groser', 'servicio', 'atención', 'tiempo', 'tard', 'lento', 'frí', 'crudo', 'calidad', 'quemado', 'sucio', 'espera', 'cobro', 'ticket', 'fila'];
  
  const freqs = {};
  keywords.forEach(kw => {
    const matches = textBlock.split(kw).length - 1;
    if (matches > 0) freqs[kw] = matches;
  });

  const sorted = Object.entries(freqs).sort((a,b) => b[1] - a[1]);
  if (sorted.length === 0) return { alertTheme: 'Comentarios diversos', problemas: negatives.slice(0, 3).map(r => `"${r.text.substring(0, 60)}..."`) };

  const topKw = sorted[0][0];
  let theme = 'Atención y Servicio';
  if (['tiempo', 'tard', 'lento', 'espera', 'fila'].includes(topKw)) theme = 'Tiempos de Espera';
  if (['frí', 'crudo', 'calidad', 'quemado'].includes(topKw)) theme = 'Calidad del Producto';
  if (['sucio'].includes(topKw)) theme = 'Limpieza';
  if (['cobro', 'ticket'].includes(topKw)) theme = 'Errores en Cobro';

  const problemas = negatives.filter(r => r.text.toLowerCase().includes(topKw)).slice(0, 3).map(r => `"${r.text.substring(0, 80)}..."`);
  
  return { alertTheme: theme, problemas };
}

function createSparklineSVG(data, width = 120, height = 36, color = '#6B907D') {
  if (!Array.isArray(data) || data.length < 2) {
    return `<svg width="${width}" height="${height}" class="sparkline"></svg>`;
  }
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const padding = 2;
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = range === 0 
      ? height / 2 
      : height - padding - ((val - min) / range) * (height - 2 * padding);
    return { x, y };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const gradId = `spark-grad-${Math.random().toString(36).substr(2, 9)}`;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="sparkline" style="overflow: visible;">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.25" />
          <stop offset="100%" stop-color="${color}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="${fillD}" fill="url(#${gradId})" />
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${points[points.length - 1].x}" cy="${points[points.length - 1].y}" r="3" fill="${color}" />
    </svg>
  `;
}

/**
 * Abre una Bottom Sheet (hoja deslizante inferior) en móvil.
 * @param {string} title - Título de la Bottom Sheet.
 * @param {Array<{value: any, label: string, active: boolean}>} options - Opciones a mostrar.
 * @param {Function} onSelect - Callback que recibe la opción seleccionada.
 */
function showBottomSheet(title, options, onSelect) {
  const existing = document.getElementById('globalBottomSheet');
  if (existing) existing.remove();

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  const optionsHtml = options.map(opt => {
    const activeClass = opt.active ? ' active' : '';
    const checkIcon = opt.active ? svgIcon('check') : '';
    return `
      <div class="bottom-sheet-option${activeClass}" data-value="${opt.value}">
        <span>${opt.label}</span>
        <span class="bottom-sheet-check">${checkIcon}</span>
      </div>
    `;
  }).join('');

  const html = `
    <div class="bottom-sheet-overlay" id="globalBottomSheet">
      <div class="bottom-sheet-container">
        <div class="bottom-sheet-handle"></div>
        <div class="bottom-sheet-header">
          <h3 class="bottom-sheet-title">${title}</h3>
          <button class="bottom-sheet-close" id="closeBottomSheetBtn">×</button>
        </div>
        <div class="bottom-sheet-options">
          ${optionsHtml}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const overlay = document.getElementById('globalBottomSheet');

  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  const closeBottomSheet = () => {
    overlay.classList.remove('active');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    setTimeout(() => {
      overlay.remove();
    }, 300);
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBottomSheet();
  });
  document.getElementById('closeBottomSheetBtn').addEventListener('click', closeBottomSheet);

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeBottomSheet();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  overlay.querySelectorAll('.bottom-sheet-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.getAttribute('data-value');
      onSelect(val);
      closeBottomSheet();
    });
  });
}

/**
 * Retorna información del último mes concluido disponible en los datos si ya pasó cronológicamente.
 */
function getConcludedMonthInfo() {
  const today = new Date();
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1; // 1-indexed (1-12)
  const curDay = today.getDate(); // 1-31
  
  if (!DataLoader || !DataLoader.manifest) return null;
  
  // 1. Durante los primeros 7 días del mes, forzar a que el mes concluido sea el mes calendario anterior
  if (curDay <= 7) {
    const targetMonth = curMonth === 1 ? 12 : curMonth - 1;
    const targetYear = curMonth === 1 ? curYear - 1 : curYear;
    
    if (DataLoader.hasMonth(targetYear, targetMonth)) {
      return { year: targetYear, month: targetMonth };
    }
  }
  
  // 2. A partir del día 8, usar lógica histórica (último disponible en manifest si ya pasó cronológicamente)
  const years = Object.keys(DataLoader.manifest).map(Number).sort((a, b) => b - a);
  if (years.length === 0) return null;
  const latestYear = years[0];
  const months = [...DataLoader.manifest[latestYear]].sort((a, b) => b - a);
  if (months.length === 0) return null;
  const latestMonth = months[0];
  
  if (curYear > latestYear || (curYear === latestYear && curMonth > latestMonth)) {
    return { year: latestYear, month: latestMonth };
  }
  return null;
}

/**
 * Abre el modal con el resumen ejecutivo del mes concluido.
 */
function showConcludedMonthModal(year, month) {
  const monthName = MONTH_NAMES[month - 1];
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Congelar scroll de fondo
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Obtener estadísticas
  const currGlobal = DataLoader.getGlobalStats(year, month);
  const currStats = DataLoader.getAllBranchStats(year, month);

  // Mes anterior para comparativas
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const hasPrev = DataLoader.hasMonth(prevYear, prevMonth);
  const prevGlobal = hasPrev ? DataLoader.getGlobalStats(prevYear, prevMonth) : { totalReviews: 0, avgRating: 0 };

  // Construir datos de sucursales en el mes concluido
  const branchesData = SUCURSALES_META.map(meta => {
    const c = currStats[meta.id] || { avg: 0, count: 0, negativeCount: 0 };
    return {
      ...meta,
      score: c.avg,
      count: c.count,
      negativeCount: c.negativeCount
    };
  });

  const activeBranches = branchesData.filter(b => b.count > 0);
  
  // Sort branches to find the leader, balancing average rating and review volume
  const sortedForLeader = [...activeBranches].sort((a, b) => {
    const scoreA = a.score + (a.count > 0 ? 0.15 * Math.log2(a.count) : 0);
    const scoreB = b.score + (b.count > 0 ? 0.15 * Math.log2(b.count) : 0);
    return scoreB - scoreA;
  });
  
  const sortedByScoreAsc = [...activeBranches].sort((a, b) => {
    // Si la calificación es 0, ponerla al final para no distorsionar como crítica
    if (a.score === 0) return 1;
    if (b.score === 0) return -1;
    return a.score - b.score;
  });

  const sucursalLider = sortedForLeader[0] || null;
  const sucursalCritica = sortedByScoreAsc[0] || null;

  // Contador de quejas desatendidas
  const data = DataLoader.getMonth(year, month);
  const reviews = data ? data.reviews : [];
  const unrepliedCount = reviews.filter(r => r.stars <= 2 && (!r.responseFromOwnerText || r.responseFromOwnerText.trim() === '')).length;
  const totalNegatives = reviews.filter(r => r.stars <= 2).length;

  // Comparativas de KPIs
  const scoreDiff = currGlobal.avgRating - prevGlobal.avgRating;
  const scoreDiffStr = scoreDiff >= 0 ? `+${scoreDiff.toFixed(2)}` : `${scoreDiff.toFixed(2)}`;
  
  const reviewsDiff = currGlobal.totalReviews - prevGlobal.totalReviews;
  const reviewsDiffStr = reviewsDiff >= 0 ? `+${reviewsDiff}` : `${reviewsDiff}`;

  const modalHtml = `
    <div class="modal-overlay active" id="concludedMonthModal" onclick="if(event.target === this) { this.remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }">
      <div class="modal-box" style="max-width: 680px; width: 90%;">
        <div class="modal-header">
          <div>
            <span class="cmb-badge" style="margin-bottom:4px; background: var(--verde); color: #FAF5EB; border: 1px solid rgba(255,255,255,0.15); display: inline-block;">Análisis Operativo GDL</span>
            <h2 class="modal-title" style="font-family: var(--serif); font-size: 24px; color: var(--text); margin: 0;">Resumen Ejecutivo — ${capitalizedMonth} ${year}</h2>
          </div>
          <button class="modal-close" onclick="document.getElementById('concludedMonthModal').remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = '';">×</button>
        </div>
        <div class="modal-body" style="padding-top:16px;">
          
          <!-- Métricas Macro -->
          <div class="scorecard-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <div class="scorecard status-optimal" style="padding: 14px; background: var(--surface-2); display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--border);">
              <div class="sc-label" style="font-size:11px; text-transform:uppercase; color:var(--text-muted);">Rating Promedio</div>
              <div class="sc-value num" style="font-size:28px; margin: 6px 0; color:var(--text); font-weight:700;">${currGlobal.avgRating.toFixed(2)}★</div>
              <div class="sc-sub" style="font-size:10px; color:${scoreDiff >= 0 ? 'var(--verde)' : 'var(--rojo-soft)'}; font-weight: 600;">
                ${scoreDiff >= 0 ? '↑' : '↓'} ${scoreDiffStr} vs ${MONTH_NAMES[prevMonth - 1] || ''}
              </div>
            </div>
            <div class="scorecard status-optimal" style="padding: 14px; background: var(--surface-2); display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--border);">
              <div class="sc-label" style="font-size:11px; text-transform:uppercase; color:var(--text-muted);">Volumen Reseñas</div>
              <div class="sc-value num" style="font-size:28px; margin: 6px 0; color:var(--text); font-weight:700;">${currGlobal.totalReviews}</div>
              <div class="sc-sub" style="font-size:10px; color:${reviewsDiff >= 0 ? 'var(--verde)' : 'var(--rojo-soft)'}; font-weight: 600;">
                ${reviewsDiff >= 0 ? '↑' : '↓'} ${reviewsDiffStr} vs ${MONTH_NAMES[prevMonth - 1] || ''}
              </div>
            </div>
            <div class="scorecard status-${totalNegatives > 0 ? 'critical' : 'optimal'}" style="padding: 14px; background: var(--surface-2); display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--border);">
              <div class="sc-label" style="font-size:11px; text-transform:uppercase; color:var(--text-muted);">Críticas (1-2★)</div>
              <div class="sc-value num" style="font-size:28px; margin: 6px 0; color: ${totalNegatives > 0 ? 'var(--rojo-soft)' : 'var(--verde)'}; font-weight:700;">${totalNegatives}</div>
              <div class="sc-sub" style="font-size:10px; color:var(--text-muted);">
                ${totalNegatives > 0 ? `${unrepliedCount} sin responder` : 'Todas respondidas'}
              </div>
            </div>
          </div>

          <!-- Sucursales Destacadas -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 20px;">
            ${sucursalLider ? `
              <div class="proactive-alert-card optimal" style="margin:0; padding:16px;">
                <div class="pac-header">
                  <div class="pac-title-wrap">
                    <span class="pac-icon" style="color: var(--verde);">${svgIcon('starFilled')}</span>
                    <span class="pac-branch">${sucursalLider.nombre}</span>
                  </div>
                  <span class="pac-tag" style="background: rgba(61, 90, 71, 0.1); color: var(--verde); font-size: 9px; font-weight: 700;">Líder</span>
                </div>
                <p class="pac-desc" style="font-size: 12px; margin-top: 8px; color:var(--text);">
                  Promedio de <strong>${sucursalLider.score.toFixed(2)} ★</strong> en ${sucursalLider.count} opiniones. Máximo desempeño regional del periodo.
                </p>
              </div>
            ` : ''}
            
            ${sucursalCritica && sucursalCritica.score < KpiMeta.ratingMinimo && sucursalCritica.id !== sucursalLider?.id ? `
              <div class="proactive-alert-card critical" style="margin:0; padding:16px;">
                <div class="pac-header">
                  <div class="pac-title-wrap">
                    <span class="pac-icon" style="color: var(--rojo-soft);">${svgIcon('alert')}</span>
                    <span class="pac-branch">${sucursalCritica.nombre}</span>
                  </div>
                  <span class="pac-tag" style="background: rgba(198, 40, 40, 0.1); color: var(--rojo-soft); font-size: 9px; font-weight: 700;">Bajo Rendimiento</span>
                </div>
                <p class="pac-desc" style="font-size: 12px; margin-top: 8px; color:var(--text);">
                  Promedio de <strong>${sucursalCritica.score.toFixed(2)} ★</strong> en ${sucursalCritica.count} opiniones. Foco prioritario de atención operativa.
                </p>
              </div>
            ` : `
              <div class="proactive-alert-card optimal" style="margin:0; padding:16px; border-left: 4px solid var(--verde);">
                <div class="pac-header">
                  <div class="pac-title-wrap">
                    <span class="pac-icon" style="color: var(--verde);">${svgIcon('check')}</span>
                    <span class="pac-branch">Cumplimiento Regional</span>
                  </div>
                  <span class="pac-tag" style="background: rgba(61, 90, 71, 0.1); color: var(--verde); font-size: 9px; font-weight: 700;">100% Ok</span>
                </div>
                <p class="pac-desc" style="font-size: 12px; margin-top: 8px; color:var(--text);">
                  ¡Felicidades! Todas las sucursales activas superaron el mínimo regional de <strong>${KpiMeta.ratingMinimo.toFixed(2)} ★</strong> en este periodo.
                </p>
              </div>
            `}
          </div>

          <!-- Recomendaciones accionables -->
          <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.05em;">
              Acciones Recomendadas para Operaciones
            </div>
            <ul style="margin:0; padding-left:18px; font-size:13px; color:var(--text); line-height:1.6; list-style-type:disc;">
              ${totalNegatives > 0 ? `
                <li style="margin-bottom:8px;">
                  <strong>Marketing & Respuesta:</strong> Hay <strong>${unrepliedCount}</strong> opiniones críticas (1-2★) sin respuesta del propietario de este mes. Responder a la brevedad en Google Business Profile.
                </li>
              ` : `
                <li style="margin-bottom:8px;">
                  <strong>Marketing & Respuesta:</strong> ¡Excelente! Sin quejas pendientes de respuesta de este mes.
                </li>
              `}
              ${sucursalCritica && sucursalCritica.score < 4.60 ? `
                <li style="margin-bottom:8px;">
                  <strong>Operación Local:</strong> Implementar plan de mejora y revisión de servicio en <strong>${sucursalCritica.nombre}</strong> para revertir el promedio de ${sucursalCritica.score.toFixed(2)}★.
                </li>
              ` : ''}
              ${sucursalLider ? `
                <li>
                  <strong>Reconocimiento:</strong> Compartir las buenas prácticas y felicitar al equipo de <strong>${sucursalLider.nombre}</strong> por su promedio de ${sucursalLider.score.toFixed(2)}★.
                </li>
              ` : ''}
            </ul>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Escuchar tecla Escape
  const _escHandler = (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('concludedMonthModal');
      if (modal) {
        modal.remove();
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
      document.removeEventListener('keydown', _escHandler);
    }
  };
  document.addEventListener('keydown', _escHandler);
}

const LcpWalkthrough = {
  currentStep: 0,
  activeTour: 'home',
  
  homeSteps: [
    {
      target: null,
      title: "Bienvenido a étoile",
      body: "El portal de reputación de La Crêpe Parisienne. Vamos a darte un recorrido rápido por las herramientas clave para tu gestión diaria."
    },
    {
      target: ".hero",
      title: "Desempeño Regional",
      body: "Aquí visualizas el promedio actual de la región, el volumen de opiniones recibidas y las alertas críticas de un vistazo."
    },
    {
      target: ".scorecard-grid",
      title: "KPIs de Operación",
      body: "Monitorea el cumplimiento de las metas del mes: volumen mínimo, calidad de reseñas y la tasa de respuesta a quejas."
    },
    {
      target: ".branch-controls-bar",
      title: "Filtros y Búsqueda",
      body: "Utiliza estos controles para buscar sucursales específicas, filtrarlas por estado (en alerta o estables) y ordenarlas a tu conveniencia."
    },
    {
      target: ".review-feed-section",
      title: "Actividad Reciente",
      body: "El feed de opiniones te muestra en tiempo real lo que dicen tus clientes. Puedes hacer clic en cualquier reseña para ver el detalle."
    }
  ],

  branchSteps: [
    {
      target: null,
      title: "Auditoría de Sucursal",
      body: "Bienvenido a la vista de detalle de sucursal. Aquí analizaremos el comportamiento de tu tienda en el periodo seleccionado."
    },
    {
      target: ".branch-hero",
      title: "Desempeño del Mes",
      body: "Visualiza el nombre de la sucursal, su promedio histórico en estrellas y cambia el mes activo desde el selector desplegable."
    },
    {
      target: ".scorecard-grid",
      title: "Scorecard Operativo",
      body: "Mide el volumen de opiniones, la calidad del texto y el promedio mensual de tu tienda contra los objetivos operativos."
    },
    {
      target: ".rating-progress-banner",
      title: "Progreso Histórico",
      body: "Esta sección calcula dinámicamente cuántas calificaciones perfectas (5 estrellas) consecutivas necesita recibir tu sucursal para elevar su promedio histórico al siguiente décimo."
    },
    {
      target: ".proactive-alerts-grid",
      title: "Áreas de Oportunidad",
      body: "Análisis automático de quejas críticas clasificado en Servicio, Calidad y Precio. Haz clic en las tarjetas en rojo para auditar los comentarios directamente."
    },
    {
      target: ".reviews-panel",
      title: "Opiniones del Periodo",
      body: "El listado de comentarios del mes con su calificación, fecha de publicación y texto original. Usa el botón para mostrar todas si hay más de 5."
    }
  ],

  get steps() {
    return this.activeTour === 'branch' ? this.branchSteps : this.homeSteps;
  },

  start() {
    const hash = window.location.hash;
    if (hash.startsWith('#/sucursal/')) {
      this.activeTour = 'branch';
    } else {
      this.activeTour = 'home';
    }
    this.currentStep = 0;
    this.showStep();
  },

  showStep() {
    this.cleanup();

    if (this.currentStep >= this.steps.length) {
      this.finish();
      return;
    }

    const step = this.steps[this.currentStep];
    
    let overlay = document.getElementById('walkthroughOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'walkthroughOverlay';
      overlay.className = 'walkthrough-overlay';
      document.body.appendChild(overlay);
      setTimeout(() => overlay.classList.add('active'), 10);
    }

    let targetEl = null;
    if (step.target) {
      targetEl = document.querySelector(step.target);
      if (targetEl) {
        targetEl.classList.add('walkthrough-highlight');
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'walkthroughTooltip';
    tooltip.className = 'walkthrough-tooltip';
    
    const isLast = this.currentStep === this.steps.length - 1;
    const stepIndicator = `Paso ${this.currentStep + 1} de ${this.steps.length}`;
    
    tooltip.innerHTML = `
      <div class="walkthrough-tooltip-title">
        <span>${step.title}</span>
        <span class="walkthrough-tooltip-step">${stepIndicator}</span>
      </div>
      <div class="walkthrough-tooltip-body">${step.body}</div>
      <div class="walkthrough-tooltip-actions">
        <button class="walkthrough-btn skip" onclick="LcpWalkthrough.skip()">${isLast ? 'Cerrar' : 'Saltar'}</button>
        <button class="walkthrough-btn next" onclick="LcpWalkthrough.next()">${isLast ? 'Finalizar' : 'Siguiente'}</button>
      </div>
    `;

    document.body.appendChild(tooltip);
    this.positionTooltip(targetEl, tooltip);
    setTimeout(() => tooltip.classList.add('active'), 50);
  },

  positionTooltip(targetEl, tooltip) {
    if (!targetEl) {
      tooltip.style.position = 'fixed';
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      tooltip.style.bottom = 'auto';
      tooltip.style.right = 'auto';
      tooltip.style.width = '340px';
      return;
    }

    if (window.innerWidth <= 576) {
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollTop + 12;
    let left = rect.left + scrollLeft + (rect.width / 2) - 160;

    if (rect.bottom + 220 > window.innerHeight && rect.top > 220) {
      top = rect.top + scrollTop - 180;
    }

    if (left < 10) left = 10;
    if (left + 320 > window.innerWidth) left = window.innerWidth - 330;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  },

  next() {
    this.currentStep++;
    this.showStep();
  },

  skip() {
    this.finish();
  },

  cleanup() {
    const prevHighlight = document.querySelector('.walkthrough-highlight');
    if (prevHighlight) {
      prevHighlight.classList.remove('walkthrough-highlight');
    }
    const prevTooltip = document.getElementById('walkthroughTooltip');
    if (prevTooltip) {
      prevTooltip.remove();
    }
  },

  showWelcomeOnboarding(userName, userRole, sucursalName = '') {
    if (localStorage.getItem('lcp_walkthrough_seen') === 'true') {
      return;
    }

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'onboardingWelcomeOverlay';
    overlay.className = 'onboarding-welcome-overlay';
    
    let roleTextHtml = '';
    if (userRole === 'gerente') {
      roleTextHtml = `
        <p style="font-size:13.5px; color:var(--text-dim); line-height:1.6; margin-bottom:20px;">
          Tu rol de <strong>Gerente de Sucursal</strong> te permite supervisar la reputación de tu tienda. En tu panel podrás medir el volumen de opiniones, la calidad de reseñas y dar seguimiento a alertas operativas.
        </p>
        <div style="background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.18); border-radius:12px; padding:12px 16px; font-size:12.5px; color:var(--oro); line-height:1.5; text-align:left;">
          <strong>Sucursal asignada:</strong> Estás asignado a <strong>${sucursalName || 'tu sucursal'}</strong>. Tu panel mostrará directamente las estadísticas de esta tienda.
        </div>
      `;
    } else if (userRole === 'zonal') {
      roleTextHtml = `
        <p style="font-size:13.5px; color:var(--text-dim); line-height:1.6; margin-bottom:20px;">
          Tu rol de <strong>Gerente Zonal</strong> te permite auditar las sucursales de tu zona de control. Puedes navegar y alternar entre regiones desde el selector del menú superior para comparar desempeños de distintas zonas.
        </p>
        <div style="background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.18); border-radius:12px; padding:12px 16px; font-size:12.5px; color:var(--oro); line-height:1.5; text-align:left;">
          <strong>Tip de navegación:</strong> Puedes ver las métricas de otras regiones mediante los controles del menú superior de la pantalla.
        </div>
      `;
    } else {
      const roleMap = { admin: 'Administrador', director: 'Director', regional: 'Gerente Regional' };
      const roleLabel = roleMap[userRole] || userRole;
      roleTextHtml = `
        <p style="font-size:13.5px; color:var(--text-dim); line-height:1.6; margin-bottom:20px;">
          Tu rol de <strong>${roleLabel}</strong> te otorga acceso al <strong>Dashboard Especial de Marca (étoile Corporate)</strong>. Desde ahí puedes analizar el rendimiento consolidado nacional de todas las regiones, Rankings de complejidad y alertas de incidencias.
        </p>
        <div style="background:rgba(61,138,95,0.06); border:1px solid rgba(61,138,95,0.15); border-radius:12px; padding:12px 16px; font-size:12.5px; color:var(--ok); line-height:1.5; text-align:left;">
          <strong>Auditoría global:</strong> Usa los reportes consolidados para reportar focos rojos y coordinar soluciones con los gerentes regionales.
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="onboarding-welcome-box">
        <div style="font-family:var(--giaza); font-size:48px; color:var(--oro); margin-bottom:10px; line-height:1;">étoile</div>
        <h2 style="font-family:var(--sans); font-size:18px; font-weight:900; text-stretch:condensed; color:var(--text); text-transform:uppercase; margin-bottom:14px; letter-spacing:0.04em;">
          ¡Bienvenido, ${userName}!
        </h2>
        <div style="font-size:13.5px; color:var(--text); font-weight:600; margin-bottom:16px;">
          A tu dashboard de reseñas y reputación
        </div>
        <div style="margin-bottom:24px;">
          ${roleTextHtml}
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
          <button class="walkthrough-btn next" onclick="LcpWalkthrough.dismissWelcome(true)" style="width:100%; padding:12px; font-size:13px;">Iniciar recorrido guiado</button>
          <button class="walkthrough-btn skip" onclick="LcpWalkthrough.dismissWelcome(false)" style="width:100%; padding:10px; font-size:12px; border-color:var(--border-strong);">Saltar introducción</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 50);
  },

  dismissWelcome(startTour) {
    const overlay = document.getElementById('onboardingWelcomeOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
    
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    if (startTour) {
      this.start();
    } else {
      this.finish();
    }
  },

  finish() {
    this.cleanup();
    const overlay = document.getElementById('walkthroughOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
    localStorage.setItem('lcp_walkthrough_seen', 'true');
  }
};

