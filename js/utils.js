/**
 * utils.js — Helpers puros y utilidades visuales.
 */

function starStr(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function svgIcon(name) {
  const i = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>'
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
    ? `<button class="topbar-back" onclick="window.location.hash='#/'">${svgIcon('arrow')}<span>Inicio</span></button>`
    : '';
  const brand = showBack
    ? `<span class="topbar-brand"><span class="accent">${branchName}</span></span>`
    : `<span class="topbar-brand">La <span class="accent">Crêpe</span> Parisienne</span>`;
  const explorerLink = `<a href="#/explorador" class="topbar-link" style="margin-right: 12px; font-size: 14px; text-decoration: none; color: var(--fg-muted);">🔍 Explorador</a>`;
  const currMonthLabel = DataLoader.currentMonth ? new Date(DataLoader.currentYear, DataLoader.currentMonth - 1).toLocaleString('es-ES', {month: 'long'}).replace(/^./, c=>c.toUpperCase()) : '';

  return `<header class="topbar">
    <div class="topbar-left">${back}${brand}</div>
    <div class="topbar-right">
      ${explorerLink}
      ${!showBack && DataLoader.currentMonth ? `<span class="topbar-month">GDL · ${currMonthLabel} ${DataLoader.currentYear}</span>` : ''}
      <button class="dark-toggle" onclick="toggleDark()" aria-label="Cambiar tema">${darkMode ? svgIcon('sun') : svgIcon('moon')}</button>
    </div>
  </header>`;
}
