/**
 * router.js — Hash router SPA.
 */

const Router = {
  routes: {},
  current: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  match(hash) {
    if (hash === '#/') return { handler: this.routes['home'], params: {} };
    if (hash.startsWith('#/sucursal/')) {
      const id = hash.replace('#/sucursal/', '');
      return { handler: this.routes['branch'], params: { id } };
    }
    if (hash.startsWith('#/trimestre/')) {
      const q = hash.replace('#/trimestre/', '');
      return { handler: this.routes['quarter'], params: { q } };
    }
    if (hash === '#/acerca') {
      return { handler: this.routes['about'], params: {} };
    }
    if (hash === '#/explorador') {
      return { handler: this.routes['explorer'], params: {} };
    }
    return { handler: this.routes['home'], params: {} };
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  async resolve() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');
    if (!app) return;

    app.classList.add('fade-out');

    // Destroy charts before transition
    Charts.destroyAll();

    setTimeout(async () => {
      const route = this.match(hash);
      if (route.handler) {
        await route.handler(route.params);
        this.current = hash;
      }
      app.classList.remove('fade-out');
      window.scrollTo(0, 0);
      initReveal();
    }, 200);
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
  }
};
