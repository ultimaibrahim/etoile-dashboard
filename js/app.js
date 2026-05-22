/**
 * app.js — Bootstrap y estado global.
 */

/* ── STATE ─────────────────────────────────────────────── */
let darkMode = localStorage.getItem('lcpDark') === '1';
let premiumUi = localStorage.getItem('lcpPremium') === '1';
let homeFilter = 'todas';
let branchView = 'abril';

function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}
applyTheme();

function applyPremiumUi() {
  document.documentElement.setAttribute('data-ui-premium', premiumUi ? 'true' : 'false');
}
applyPremiumUi();

function toggleDark() {
  darkMode = !darkMode;
  localStorage.setItem('lcpDark', darkMode ? '1' : '0');
  applyTheme();
  Router.resolve();
}

function togglePremiumUi() {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      premiumUi = !premiumUi;
      localStorage.setItem('lcpPremium', premiumUi ? '1' : '0');
      applyPremiumUi();
      Router.resolve();
    });
  } else {
    premiumUi = !premiumUi;
    localStorage.setItem('lcpPremium', premiumUi ? '1' : '0');
    applyPremiumUi();
    Router.resolve();
  }
}

function injectPremiumToggle() {
  if (document.querySelector('.ui-premium-toggle')) return;
  const btn = document.createElement('button');
  btn.className = 'ui-premium-toggle';
  btn.setAttribute('aria-label', 'Alternar interfaz premium');
  btn.title = 'Alternar interfaz premium';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" opacity="0.6"/>
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" opacity="0.6"/>
    </svg>
  `;
  btn.addEventListener('click', togglePremiumUi);
  document.body.appendChild(btn);
}

/* ── INIT ──────────────────────────────────────────────── */
async function initApp() {
  await DataLoader.init();

  Router.register('home', () => HomeView.render());
  Router.register('branch', params => BranchView.render(params));
  Router.register('quarter', params => QuarterView.render(params));
  Router.register('about', () => AboutView.render());

  Router.register('dashboards', () => DashboardsView.render());

  Router.init();
  Router.resolve();

  injectPremiumToggle();
}

initApp();
