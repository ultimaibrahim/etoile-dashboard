/**
 * views/select-region.js — Vista de Selección de Región post-login con interfaz Premium.
 */

const SelectRegionView = {
  async render() {
    const app = document.getElementById('app');
    if (!app) return;

    // Verificar seguridad: solo roles de liderazgo pueden elegir región
    const role = AppAuth.getUserRole();
    if (!AppAuth.isAuthenticated()) {
      Router.navigate('#/login');
      return;
    }
    if (role === 'gerente') {
      Router.navigate('#/');
      return;
    }

    // Inyectar estilos para esta pantalla si no se han cargado
    if (!document.getElementById('select-region-styles')) {
      const style = document.createElement('style');
      style.id = 'select-region-styles';
      style.textContent = `
        .srv-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--verde-deep) 0%, var(--bg) 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          box-sizing: border-box;
          overflow-y: auto;
        }
        .srv-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 36px;
          animation: srvEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: transform 0.4s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.4s ease;
        }
        .srv-container.exit-transition {
          transform: scale(0.94);
          opacity: 0;
        }
        @keyframes srvEntrance {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .srv-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .srv-title {
          font-family: var(--giaza);
          font-size: 42px;
          color: var(--crema);
          margin: 0;
          font-weight: 400;
          letter-spacing: 0.02em;
        }
        .srv-subtitle {
          font-size: 15px;
          color: rgba(245, 239, 230, 0.7);
          max-width: 580px;
          line-height: 1.5;
          margin: 0;
        }
        .srv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
          width: 100%;
        }
        .srv-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 150px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: var(--sombra);
          box-sizing: border-box;
        }
        .srv-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 100% 0%, rgba(122, 158, 138, 0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .srv-card:hover {
          transform: translateY(-4px);
          border-color: var(--verde);
          box-shadow: 0 12px 30px rgba(61, 90, 71, 0.15);
        }
        .srv-card:hover::before {
          opacity: 1;
        }
        .srv-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }
        .srv-card-code {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          background: var(--surface-2);
          padding: 4px 8px;
          border-radius: 6px;
        }
        .srv-card-badge {
          font-size: 11px;
          font-weight: 600;
          color: var(--verde);
          background: rgba(61, 90, 71, 0.1);
          padding: 4px 8px;
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .srv-card:hover .srv-card-badge {
          background: var(--verde);
          color: var(--crema);
        }
        .srv-card-bottom {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 24px;
        }
        .srv-card-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }
        .srv-card-desc {
          font-size: 12px;
          color: var(--text-dim);
          margin: 0;
        }
        .srv-footer {
          margin-top: 16px;
        }
        .srv-back-login {
          background: transparent;
          border: 1px solid rgba(245, 239, 230, 0.3);
          color: rgba(245, 239, 230, 0.7);
          font-size: 13px;
          font-weight: 500;
          padding: 10px 20px;
          border-radius: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .srv-back-login:hover {
          background: rgba(245, 239, 230, 0.1);
          color: rgba(245, 239, 230, 0.95);
          border-color: rgba(245, 239, 230, 0.5);
        }
      `;
      document.head.appendChild(style);
    }

    // Construir lista de regiones con cantidad de sucursales
    const regionsList = Object.entries(REGION_NAME_MAP).map(([id, name]) => {
      const branches = SUCURSALES_META_ALL.filter(s => s.region === id);
      const count = branches.length;
      
      let desc = '';
      if (id === 'GDL') desc = 'Jalisco · Regional';
      else if (id === 'CDMX') desc = 'Ciudad de México';
      else if (id === 'MTY') desc = 'Nuevo León';
      else if (id === 'TJ') desc = 'Baja California';
      else desc = 'Sucursal única';

      return {
        id,
        name,
        count,
        desc
      };
    });

    const cardsHtml = regionsList.map(r => `
      <div class="srv-card" onclick="SelectRegionView.handleSelect('${r.id}')">
        <div class="srv-card-top">
          <span class="srv-card-code">${r.id}</span>
          <span class="srv-card-badge">${r.count} sucursal${r.count !== 1 ? 'es' : ''}</span>
        </div>
        <div class="srv-card-bottom">
          <h3 class="srv-card-name">${r.name}</h3>
          <p class="srv-card-desc">${r.desc}</p>
        </div>
      </div>
    `).join('');

    app.innerHTML = `
      <div class="srv-wrapper">
        <div class="srv-container" id="srvContainer">
          <div class="srv-header">
            <span class="eyebrow" style="color:rgba(245,239,230,0.9); font-weight:700; background:rgba(61,90,71,0.45); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); padding:6px 16px; border-radius:20px; border:1px solid rgba(122,158,138,0.25); letter-spacing:0.08em;">Monitoreo Regional</span>
            <h1 class="srv-title">Selecciona una Región</h1>
            <p class="srv-subtitle">Elige el área operativa que deseas supervisar. Tu perfil administrativo te permite alternar libremente entre regiones.</p>
          </div>
          
          <div class="srv-grid">
            ${cardsHtml}
          </div>
          
          <div class="srv-header srv-footer">
            <button class="srv-back-login" onclick="AppAuth.logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12,19 5,12 12,5"></polyline></svg>
              <span>Regresar al Login</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async handleSelect(regionId) {
    const container = document.getElementById('srvContainer');
    if (container) {
      container.classList.add('exit-transition');
    }

    // Esperar a que la transición de escala/desvanecimiento termine (400ms)
    setTimeout(async () => {
      if (typeof DataLoader !== 'undefined') {
        await DataLoader.switchRegion(regionId);
      }
      Router.navigate('#/');
    }, 400);
  }
};
