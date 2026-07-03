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
    if (hash === '#/login') return { handler: this.routes['login'], params: {} };
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

    if (hash === '#/select-region') {
      return { handler: this.routes['select-region'], params: {} };
    }
    if (hash === '#/brand') {
      return { handler: this.routes['brand'], params: {} };
    }
    if (hash === '#/dashboards') {
      return { handler: this.routes['dashboards'], params: {} };
    }
    if (hash === '#/privacidad') {
      return { handler: this.routes['privacy'], params: {} };
    }
    return { handler: this.routes['home'], params: {} };
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  async resolve() {
    const hash = window.location.hash || '#/';

    // Verificar sesión antes de permitir la navegación
    const authenticated = typeof AppAuth !== 'undefined' && AppAuth.isAuthenticated();
    if (!authenticated) {
      if (hash !== '#/login' && hash !== '#/privacidad') {
        window.location.hash = '#/login';
        return;
      }
    } else {
      if (hash === '#/login') {
        window.location.hash = '#/';
        return;
      }
    }

    const app = document.getElementById('app');
    if (!app) return;

    // Determinar si es una transición principal (Login, Select Region, o inicial)
    const isMainTransition = !this.current || 
                             (this.current === '#/login' && hash === '#/select-region') ||
                             hash === '#/login';

    if (isMainTransition && window.showLcpLoader) {
      window.showLcpLoader();
      window.updateLcpLoader(20);
    } else {
      // Sub-transición rápida usando fade-out en app para evitar parpadeos
      app.classList.add('fade-out');
    }

    // Destroy charts before transition
    Charts.destroyAll();
    if (window.HomeView && typeof HomeView.clearAutoplay === 'function') {
      HomeView.clearAutoplay();
    }

    setTimeout(async () => {
      const route = this.match(hash);
      if (isMainTransition && window.updateLcpLoader) {
        window.updateLcpLoader(60);
      }
      
      document.documentElement.classList.remove('login-page-active');
      if (route.handler) {
        await route.handler(route.params);
        this.current = hash;
      }
      if (hash === '#/login') {
        document.documentElement.classList.add('login-page-active');
      }
      
      if (isMainTransition) {
        if (window.updateLcpLoader) window.updateLcpLoader(100);
        window.scrollTo(0, 0);
        initReveal();
        if (window.hideLcpLoader) {
          setTimeout(() => {
            window.hideLcpLoader();
          }, 300);
        }
      } else {
        app.classList.remove('fade-out');
        window.scrollTo(0, 0);
        initReveal();
      }
    }, 150);
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
  }
};
