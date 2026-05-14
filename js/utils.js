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
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
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
function buildTopbar(showBack = false, branchName = '') {
  const back = showBack
    ? `<button class="topbar-back" onclick="window.history.back()">${svgIcon('arrow')}<span>Atrás</span></button>`
    : '';
  const brand = showBack
    ? `<span class="topbar-brand"><span class="accent">${branchName}</span></span>`
    : `<a href="#/" class="topbar-brand" style="text-transform:none; font-family:var(--serif); font-size:22px; font-style:italic;">étoile</a>`;
  
  const currentHash = window.location.hash;
  const isHome = currentHash === '#/' || currentHash === '';
  const isDash = currentHash === '#/dashboards';
  const isAbout = currentHash.startsWith('#/acerca');

  // El nav se emite SEPARADO del header para que position:fixed sea puro
  const nav = `<nav class="topbar-nav" id="mainNav">
    <a href="#/" class="topbar-link ${isHome ? 'active' : ''}" title="Inicio">${svgIcon('home')} <span>Inicio</span></a>
    <a href="#/dashboards" class="topbar-link ${isDash ? 'active' : ''}" title="Gráficas">${svgIcon('barChart')} <span>Dashboards</span></a>
    <a href="#/acerca" class="topbar-link ${isAbout ? 'active' : ''}" title="Acerca de">${svgIcon('info')} <span>Acerca de</span></a>
  </nav>`;

  const header = `<header class="topbar">
    <div class="topbar-left">${back}${brand}</div>
    <div class="topbar-right">
      <div class="topbar-nav topbar-nav--desktop" id="mainNavDesktop">
        <a href="#/" class="topbar-link ${isHome ? 'active' : ''}" title="Inicio">${svgIcon('home')} <span>Inicio</span></a>
        <a href="#/dashboards" class="topbar-link ${isDash ? 'active' : ''}" title="Gráficas">${svgIcon('barChart')} <span>Dashboards</span></a>
        <a href="#/acerca" class="topbar-link ${isAbout ? 'active' : ''}" title="Acerca de">${svgIcon('info')} <span>Acerca de</span></a>
      </div>
      <button class="dark-toggle" onclick="toggleDark()" aria-label="Cambiar tema">${darkMode ? svgIcon('sun') : svgIcon('moon')}</button>
    </div>
  </header>${nav}`;

  return header;
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
