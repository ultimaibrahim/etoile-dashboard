/**
 * views/select-region.js — Vista de Selección de Región post-login con interfaz Premium y Brand Dashboard.
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
          background: var(--bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 40px 20px;
          box-sizing: border-box;
          overflow-y: auto;
        }
        .srv-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 40px;
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
          color: var(--text);
          margin: 0;
          font-weight: 400;
          letter-spacing: 0.02em;
        }
        .srv-subtitle {
          font-size: 15px;
          color: var(--text-dim);
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
          background: var(--surface-2);
          border: 1px solid var(--border-strong);
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .srv-back-login:hover {
          background: var(--border);
          color: var(--text);
          border-color: var(--border-strong);
        }

        /* ── BRAND DASHBOARD PREMIUM STYLES ── */
        .brand-dash {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          box-shadow: var(--sombra-card);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-sizing: border-box;
          width: 100%;
        }
        .brand-dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
        }
        .brand-period-selector {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .srv-month-select {
          appearance: none;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FAF5EB;
          border-radius: 20px;
          padding: 8px 36px 8px 16px;
          font-family: var(--sans);
          font-weight: 600;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          background-image: url('data:image/svg+xml;utf8,<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23FAF5EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"></polyline></svg>');
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 12px;
          transition: all 0.2s ease;
        }
        .srv-month-select:hover {
          background-color: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }
        .brand-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .brand-kpi-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 110px;
          box-sizing: border-box;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .brand-kpi-val {
          font-family: var(--sans);
          font-weight: 800;
          font-size: 32px;
          color: var(--text);
          margin: 6px 0;
          line-height: 1;
        }
        .brand-kpi-val.gold { color: var(--oro); }
        .brand-kpi-val.green { color: #A7DBB9; }
        .brand-kpi-val.red { color: #F4A090; }
        .brand-kpi-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.06em;
        }
        .brand-kpi-sub {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
        }
        
        .brand-deficits-alert {
          background: rgba(178, 58, 43, 0.06);
          border: 1px solid rgba(178, 58, 43, 0.2);
          border-left: 4px solid var(--alerta);
          border-radius: var(--radius-sm);
          padding: 20px;
          box-sizing: border-box;
        }
        .brand-deficits-title {
          font-weight: 700;
          font-size: 12px;
          color: #F4A090;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .brand-deficits-list {
          margin: 0;
          padding-left: 18px;
          font-size: 13.5px;
          color: var(--text);
          line-height: 1.6;
        }
        .brand-deficits-list li {
          margin-bottom: 6px;
        }
        .brand-deficits-list li:last-child {
          margin-bottom: 0;
        }
        
        .brand-highlights-split {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .brand-split-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .brand-split-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .brand-branch-item {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }
        .brand-branch-item:hover {
          background: var(--surface);
          border-color: var(--verde);
        }
        .brand-branch-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .brand-branch-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }
        .brand-branch-region {
          font-size: 11px;
          color: var(--text-muted);
        }
        .brand-branch-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .brand-branch-rating {
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 700;
          color: var(--oro);
        }
        .brand-branch-reviews {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .brand-region-performance {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 20px;
          box-sizing: border-box;
          overflow-x: auto;
        }
        .brand-region-perf-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }
        .brand-region-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .brand-region-table th {
          text-align: left;
          padding: 8px 12px;
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-strong);
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .brand-region-table td {
          padding: 12px;
          border-bottom: 1px solid var(--border);
          color: var(--text);
          vertical-align: middle;
        }
        .brand-region-table tr:last-child td {
          border-bottom: none;
        }
        .brand-region-table tr:hover td {
          background: var(--surface);
        }
        .brand-region-badge {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 700;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text);
        }
        .brand-region-rating-num {
          font-family: var(--mono);
          font-weight: 700;
        }
        .brand-region-rating-num.green { color: var(--ok); }
        .brand-region-rating-num.yellow { color: var(--oro); }
        .brand-region-rating-num.red { color: var(--alerta); }
        [data-theme="dark"] .brand-region-rating-num.green { color: #7AD89A; }
        [data-theme="dark"] .brand-region-rating-num.red { color: #F4A090; }
        
        .brand-region-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .brand-region-btn:hover {
          background: var(--verde);
          border-color: var(--verde);
          color: #fff;
        }

        /* ── BRAND DASHBOARD SHORTCUT PREMIUM BANNER ── */
        .brand-shortcut-card {
          background: var(--surface-2);
          border: 1px solid var(--border-strong);
          border-radius: 24px;
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
          box-shadow: var(--sombra-lg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-sizing: border-box;
          width: 100%;
          transition: all 0.3s ease;
        }
        .brand-shortcut-card:hover {
          border-color: var(--oro);
          box-shadow: var(--sombra-card);
        }
        .brand-shortcut-content {
          flex: 1;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .brand-shortcut-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brand-shortcut-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--oro);
          box-shadow: 0 0 10px var(--oro);
          animation: pulseGold 2s infinite;
        }
        @keyframes pulseGold {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        .brand-shortcut-eyebrow {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--oro);
        }
        .brand-shortcut-title {
          font-family: var(--giaza);
          font-size: 32px;
          color: var(--text);
          margin: 0;
          font-weight: 400;
        }
        .brand-shortcut-desc {
          font-size: 13px;
          color: var(--text-dim);
          margin: 0;
          line-height: 1.5;
          max-width: 650px;
        }
        .brand-shortcut-btn {
          background: var(--verde);
          border: 1px solid var(--verde);
          color: #fff;
          padding: 14px 28px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 4px 15px rgba(61,90,71,0.25);
        }
        .brand-shortcut-btn:hover {
          filter: brightness(1.15);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(61,90,71,0.35);
        }

        @media (max-width: 600px) {
          .brand-shortcut-card {
            padding: 20px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .brand-shortcut-title {
            font-size: 24px !important;
          }
          .brand-shortcut-desc {
            font-size: 12.5px !important;
          }
          .brand-shortcut-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px 20px !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    let brandDashboardHtml = '';
    const canSeeBrandDashboard = ['admin', 'director', 'regional'].includes(role);

    if (canSeeBrandDashboard) {
      brandDashboardHtml = `
        <div class="brand-shortcut-card">
          <div class="brand-shortcut-content">
            <div class="brand-shortcut-header">
              <span class="brand-shortcut-indicator"></span>
              <span class="brand-shortcut-eyebrow">Consolidado Corporativo</span>
            </div>
            <h2 class="brand-shortcut-title">étoile corporativo</h2>
            <p class="brand-shortcut-desc">Acceder al análisis detallado de la marca: KPIs consolidados, auditoría de quejas críticas y ranking de regiones ponderado por complejidad operativa.</p>
          </div>
          <button class="brand-shortcut-btn" onclick="Router.navigate('#/brand')">
            <span>Abrir Dashboard de Marca</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12,5 19,12 12,19"></polyline></svg>
          </button>
        </div>
      `;
    }

    // Construir lista de regiones con cantidad de sucursales para el explorador
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
          
          <!-- Brand Dashboard -->
          ${brandDashboardHtml}
          
          <!-- Region Explorer -->
          <div class="srv-header" style="margin-top: 10px;">
            <span class="eyebrow" style="color: var(--text-dim); font-weight:700; background: var(--surface-2); border: 1px solid var(--border-strong); padding:6px 16px; border-radius:20px; letter-spacing:0.08em;">Navegación Regional</span>
            <h1 class="srv-title">Explorar Regiones</h1>
            <p class="srv-subtitle">Elige el área operativa que deseas supervisar de manera individual.</p>
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

    setTimeout(async () => {
      if (typeof DataLoader !== 'undefined') {
        await DataLoader.switchRegion(regionId);
      }
      Router.navigate('#/');
    }, 400);
  },

  handleMonthSelect(monthVal) {
    const month = parseInt(monthVal);
    const currYear = DataLoader.currentYear;
    DataLoader.setMonth(currYear, month);
    this.render();
  }
};
