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
    if (!hash || hash === '#' || hash === '#/') {
      return { handler: this.routes['home'], params: {} };
    }

    // Normalizar hash: remover query params y slashes finales
    const rawPath = hash.split('?')[0].replace(/\/+$/, '') || '#/';

    if (rawPath === '#/login') return { handler: this.routes['login'], params: {} };
    if (rawPath === '#/404') return { handler: this.routes['not-found'], params: { type: 'not-found' } };
    if (rawPath === '#/403') return { handler: this.routes['not-found'], params: { type: 'forbidden' } };
    if (rawPath === '#/acerca' || rawPath === '#/about') return { handler: this.routes['about'], params: {} };
    if (rawPath === '#/privacidad' || rawPath === '#/privacy') return { handler: this.routes['privacy'], params: {} };
    if (rawPath === '#/select-region') return { handler: this.routes['select-region'], params: {} };
    if (rawPath === '#/brand') return { handler: this.routes['brand'], params: {} };
    if (rawPath === '#/dashboards') return { handler: this.routes['dashboards'], params: {} };
    if (rawPath === '#/comparar' || rawPath === '#/compare') {
      const queryString = hash.includes('?') ? hash.split('?')[1] : '';
      const searchParams = new URLSearchParams(queryString);
      return {
        handler: this.routes['compare'],
        params: {
          a: searchParams.get('a'),
          b: searchParams.get('b')
        }
      };
    }

    if (rawPath.startsWith('#/sucursal/')) {
      const id = rawPath.replace('#/sucursal/', '');
      // Si el ID no existe en el catálogo de sucursales, activar 404 SPA
      const meta = typeof getBranchById === 'function' ? getBranchById(id) : null;
      if (!meta && typeof SUCURSALES_META_ALL !== 'undefined') {
        return { handler: this.routes['not-found'], params: { type: 'not-found', requestedBranch: id } };
      }
      return { handler: this.routes['branch'], params: { id } };
    }

    if (rawPath.startsWith('#/trimestre/')) {
      const q = rawPath.replace('#/trimestre/', '');
      const qParsed = typeof parseQuarterParam === 'function' ? parseQuarterParam(q) : null;
      if (!qParsed || qParsed.quarter < 1 || qParsed.quarter > 4) {
        return { handler: this.routes['not-found'], params: { type: 'not-found', requestedQuarter: q } };
      }
      return { handler: this.routes['quarter'], params: { q } };
    }

    // Rutas dinámicas registradas directamente con Router.register()
    const routeKey = rawPath.replace(/^#\/?/, '');
    if (this.routes[routeKey]) {
      return { handler: this.routes[routeKey], params: {} };
    }

    // Para cualquier otra ruta no reconocida, activar vista 404 SPA
    return { handler: this.routes['not-found'], params: { type: 'not-found', requestedPath: hash } };
  },

  updateRouteMeta(hash, params = {}) {
    let title = 'Dashboard Reseñas · étoile';
    let description = 'Plataforma de inteligencia operativa y análisis de satisfacción del cliente de La Crêpe Parisienne (Grupo MYT).';

    if (hash === '#/login') {
      title = 'Iniciar Sesión · étoile LCP';
      description = 'Acceso seguro al sistema de inteligencia operativa y monitoreo de reseñas de La Crêpe Parisienne.';
    } else if (hash.startsWith('#/sucursal/')) {
      const meta = typeof getBranchById === 'function' ? getBranchById(params.id) : null;
      const branchName = meta ? meta.nombre : (params.id || 'Sucursal');
      const region = meta && meta.region ? meta.region : '';
      title = `${branchName} ${region ? `(${region})` : ''} · Métricas y Reseñas | étoile`;
      description = `Análisis de satisfacción del cliente, CSAT, incidencias y evolución de opiniones de Google Maps para la sucursal ${branchName}.`;
    } else if (hash.startsWith('#/trimestre/')) {
      const q = (params.q || '').toUpperCase();
      title = `Reporte Ejecutivo ${q} · étoile LCP`;
      description = `Consolidado trimestral de satisfacción del cliente, ranking regional y auditoría de calidad de La Crêpe Parisienne para ${q}.`;
    } else if (hash.startsWith('#/comparar') || hash.startsWith('#/compare')) {
      title = 'Comparador Head-to-Head de Sucursales · étoile LCP';
      description = 'Análisis comparativo directo entre dos sucursales de La Crêpe Parisienne con Radar Operativo de 5 dimensiones.';
    } else if (hash === '#/dashboards') {
      title = 'Dashboards Analíticos y Alertas · étoile LCP';
      description = 'Cuadro de mando con distribución de volumen, ranking multitienda y alertas operativas proactivas.';
    } else if (hash === '#/brand') {
      title = 'Brand Dashboard Nacional · étoile LCP';
      description = 'Monitoreo consolidado a nivel nacional de satisfacción del cliente de La Crêpe Parisienne (33 sucursales).';
    } else if (hash === '#/select-region') {
      title = 'Explorador de Regiones · étoile LCP';
      description = 'Exploración regional histórica, ranking bayesiano y monitoreo de sucursales en México.';
    } else if (hash === '#/acerca') {
      title = 'Metodología y Arquitectura · étoile LCP';
      description = 'Metodología de cálculo CSAT, tratamiento de opiniones sin texto, gobernanza y preguntas frecuentes (FAQ).';
    } else if (hash === '#/privacidad') {
      title = 'Aviso de Privacidad · étoile LCP';
      description = 'Aviso de privacidad y directivas de protección de datos personales de Grupo MYT y étoile.';
    } else if (hash === '#/403' || (params && params.type === 'forbidden')) {
      title = 'Acceso Restringido (403) · étoile LCP';
      description = 'El rol operativo actual no cuenta con permisos para consultar este módulo o región.';
    } else if (hash === '#/404' || (params && params.type === 'not-found')) {
      title = 'Página no encontrada (404) · étoile LCP';
      description = 'La ruta o sucursal solicitada no existe dentro del sistema.';
    } else {
      const reg = typeof activeRegion !== 'undefined' ? (typeof getRegionName === 'function' ? getRegionName(activeRegion) : activeRegion) : 'GDL';
      title = `Monitoreo Regional (${reg}) · étoile LCP`;
      description = `Resumen operativo mensual, promedio regional y alertas de desempeño de La Crêpe Parisienne para la región ${reg}.`;
    }

    document.title = title;

    // Actualizar o inyectar meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Actualizar OpenGraph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    // Notificar a GA4 evento page_view en cambio SPA si está activo
    if (typeof window.gtag === 'function' && window.GA4_MEASUREMENT_ID) {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: window.location.href,
        page_path: window.location.hash || '#/'
      });
    }
  },

  navigate(hash) {
    if ((window.location.hash === '#/' || window.location.hash === '') && hash.startsWith('#/sucursal/')) {
      if (typeof ViewState !== 'undefined') {
        ViewState.set('homeScroll', window.scrollY);
      }
    }
    window.location.hash = hash;
  },

  async resolve() {
    const hash = window.location.hash || '#/';

    // Guardar scroll si navegamos desde Home a Sucursal
    if ((this.current === '#/' || !this.current) && hash.startsWith('#/sucursal/')) {
      if (typeof ViewState !== 'undefined') {
        ViewState.set('homeScroll', window.scrollY);
      }
    }

    // Verificar sesión y aplicar Guards de Rol antes de permitir navegación
    const authenticated = typeof AppAuth !== 'undefined' && AppAuth.isAuthenticated();
    const matchedRoute = this.match(hash);
    const isPublicRoute = hash === '#/login' || 
                          hash === '#/privacidad' || 
                          hash === '#/404' || 
                          hash === '#/403' || 
                          matchedRoute.handler === this.routes['not-found'];

    // El login es su propia página (/login/); los enlaces viejos a #/login siguen funcionando
    if (hash === '#/login') {
      window.location.replace('/login/');
      return;
    }

    if (!authenticated) {
      if (!isPublicRoute) {
        // Sin sesión: quien llega a la raíz ve primero la página de inicio pública; un enlace profundo va directo al login
        window.location.replace(hash === '' || hash === '#/' ? '/info/' : '/login/');
        return;
      }
    } else {
      if (hash === '#/login') {
        window.location.hash = '#/';
        return;
      }

      // Guard por Rol
      const userRole = AppAuth.getUserRole();
      const userRegion = AppAuth.getUserRegion();

      // 1. Gerente de Tienda (gerente): puede ver todas las sucursales de su región, pero no otras regiones ni la vista nacional (#/brand)
      if (userRole === 'gerente') {
        if (hash === '#/brand' || hash === '#/select-region') {
          console.warn(`[Guard de Seguridad] Gerente de Tienda no tiene acceso a ${hash}.`);
          window.location.hash = '#/403';
          return;
        }
        if (hash.startsWith('#/sucursal/')) {
          const targetBranchId = hash.replace('#/sucursal/', '');
          const targetMeta = typeof getBranchById === 'function' ? getBranchById(targetBranchId) : null;
          if (targetMeta && targetMeta.region && userRegion && targetMeta.region !== userRegion) {
            console.warn(`[Guard de Seguridad] Gerente de Tienda (${userRegion}) intentó acceder a sucursal fuera de su región (${targetMeta.region}).`);
            window.location.hash = '#/403';
            return;
          }
        }
      }

      // 2. Gerente Zonal (zonal): sin acceso a la vista corporativa nacional (#/brand)
      if (userRole === 'zonal' && hash === '#/brand') {
        console.warn(`[Guard de Seguridad] Vista corporativa nacional restringida para Gerente Zonal.`);
        window.location.hash = '#/403';
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
    if (typeof MobileStickyBarManager !== 'undefined') {
      MobileStickyBarManager.unmount();
    }

    const prevRoute = this.current;

    setTimeout(async () => {
      const route = this.match(hash);
      if (isMainTransition && window.updateLcpLoader) {
        window.updateLcpLoader(60);
      }
      
      document.documentElement.classList.remove('login-page-active');
      if (route.handler) {
        await route.handler(route.params);
        this.current = hash;
        this.updateRouteMeta(hash, route.params);
      }
      if (hash === '#/login') {
        document.documentElement.classList.add('login-page-active');
      }
      
      if (isMainTransition) {
        if (window.updateLcpLoader) window.updateLcpLoader(100);
        window.scrollTo(0, 0);
        initReveal();
        if (typeof initSpotlightCards === 'function') initSpotlightCards();
        if (typeof initBlurReveals === 'function') initBlurReveals();
        if (typeof updateSlidingTabPill === 'function') updateSlidingTabPill();
        if (typeof initSegmentedTabs === 'function') initSegmentedTabs();
        if (window.hideLcpLoader) {
          setTimeout(() => {
            window.hideLcpLoader();
          }, 300);
        }
      } else {
        app.classList.remove('fade-out');
        if (hash === '#/' && prevRoute && prevRoute.startsWith('#/sucursal/')) {
          const savedScroll = typeof ViewState !== 'undefined' ? ViewState.get('homeScroll', 0) : 0;
          window.scrollTo(0, savedScroll);
        } else {
          window.scrollTo(0, 0);
        }
        initReveal();
        if (typeof initSpotlightCards === 'function') initSpotlightCards();
        if (typeof initBlurReveals === 'function') initBlurReveals();
        if (typeof updateSlidingTabPill === 'function') updateSlidingTabPill();
        if (typeof initSegmentedTabs === 'function') initSegmentedTabs();
      }
      // Lectores de pantalla: anunciar la vista nueva (no en la carga inicial, que ya se lee completa)
      const announcer = document.getElementById('routeAnnouncer');
      if (announcer && prevRoute) announcer.textContent = document.title.split(' · ')[0];
      window.dispatchEvent(new CustomEvent('etoile:route-rendered', { detail: { hash } }));
    }, 150);
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
  }
};
