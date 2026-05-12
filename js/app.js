/**
 * app.js — Bootstrap y estado global.
 */

/* ── STATE ─────────────────────────────────────────────── */
let darkMode = localStorage.getItem('lcpDark') === '1';
let homeFilter = 'todas';
let branchView = 'abril';

function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}
applyTheme();

function toggleDark() {
  darkMode = !darkMode;
  localStorage.setItem('lcpDark', darkMode ? '1' : '0');
  applyTheme();
  Router.resolve();
}

/* ── INIT ──────────────────────────────────────────────── */
async function initApp() {
  await DataLoader.init();

  Router.register('home', () => HomeView.render());
  Router.register('branch', params => BranchView.render(params));
  Router.register('quarter', params => QuarterView.render(params));
  Router.register('about', () => AboutView.render());
  Router.register('explorer', () => ExplorerView.render());

  Router.init();
  Router.resolve();
}

initApp();
