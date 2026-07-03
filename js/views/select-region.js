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
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 150px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--sombra);
          box-sizing: border-box;
        }
        .srv-card .srv-card-deco {
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 72px;
          height: 72px;
          color: var(--oro);
          opacity: 0.05;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .srv-card .srv-card-deco svg {
          width: 100%;
          height: 100%;
        }
        .srv-card:hover {
          transform: translateY(-4px);
          border-color: var(--oro);
          box-shadow: 0 12px 30px rgba(184, 144, 47, 0.12);
        }
        .srv-card:hover .srv-card-deco {
          opacity: 0.15;
          transform: scale(1.1) rotate(12deg);
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

        /* ── INDICADORES DE RATING EN TARJETAS ── */
        .srv-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .srv-card-rating-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .srv-rating-val {
          font-family: var(--sans);
          font-size: 15px;
          font-weight: 800;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .srv-rating-trend {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .srv-rating-trend.trend-up {
          color: #2e7d32;
          background: rgba(46, 125, 50, 0.08);
        }
        .srv-rating-trend.trend-down {
          color: #c62828;
          background: rgba(198, 40, 40, 0.08);
        }
        .srv-rating-trend.trend-equal {
          color: #f57f17;
          background: rgba(245, 127, 23, 0.08);
        }
        [data-theme="dark"] .srv-rating-trend.trend-up {
          color: #7AD89A;
          background: rgba(61, 138, 95, 0.18);
        }
        [data-theme="dark"] .srv-rating-trend.trend-down {
          color: #F4A090;
          background: rgba(178, 58, 43, 0.18);
        }
        [data-theme="dark"] .srv-rating-trend.trend-equal {
          color: #E8C878;
          background: rgba(232, 200, 120, 0.15);
        }
        .srv-rating-spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(184, 144, 47, 0.25);
          border-top-color: var(--oro);
          border-radius: 50%;
          animation: srvSpin 0.8s linear infinite;
        }

        /* ── SILUETAS GEOGRÁFICAS DE FONDO ── */
        .srv-card-map-overlay {
          position: absolute;
          bottom: -15px;
          right: -15px;
          width: 90px;
          height: 90px;
          opacity: 0.08;
          color: var(--verde);
          pointer-events: none;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        }
        .srv-card:hover .srv-card-map-overlay {
          transform: scale(1.1) rotate(-5deg);
          opacity: 0.15;
        }
        [data-theme="dark"] .srv-card-map-overlay {
          color: var(--oro);
          opacity: 0.06;
        }
        [data-theme="dark"] .srv-card:hover .srv-card-map-overlay {
          opacity: 0.12;
        }

        /* ── TABLA DE RANKINGS BISTRO ── */
        .srv-ranking-table-placeholder-box {
          margin-top: 30px;
          width: 100%;
        }
        .ranking-table-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--sombra);
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-sizing: border-box;
        }
        .ranking-table-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ranking-table-title {
          font-family: var(--giaza);
          font-size: 28px;
          color: var(--text);
          margin: 0;
          font-weight: 400;
        }
        .ranking-table-subtitle {
          font-size: 13px;
          color: var(--text-dim);
          margin: 0;
        }
        .ranking-table-wrapper {
          overflow-x: auto;
          width: 100%;
        }
        .ranking-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .ranking-table th {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          padding: 12px 16px;
          border-bottom: 1.5px solid var(--border);
        }
        .ranking-table td {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          font-size: 13.5px;
          color: var(--text-muted);
        }
        .ranking-row:last-child td {
          border-bottom: none;
        }
        .ranking-row:hover {
          background: var(--surface-2);
        }
        .ranking-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 800;
          background: var(--border-strong);
          color: var(--text);
        }
        .ranking-badge.rank-gold {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #1A1A1A;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        }
        .ranking-badge.rank-silver {
          background: linear-gradient(135deg, #E0E0E0 0%, #B0B0B0 100%);
          color: #1A1A1A;
          box-shadow: 0 2px 8px rgba(176, 176, 176, 0.3);
        }
        .ranking-badge.rank-bronze {
          background: linear-gradient(135deg, #CD7F32 0%, #A0522D 100%);
          color: #FAF5EB;
          box-shadow: 0 2px 8px rgba(205, 127, 50, 0.3);
        }
        .rank-shift {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .rank-shift.up {
          color: #2e7d32;
          background: rgba(46, 125, 50, 0.08);
        }
        .rank-shift.down {
          color: #c62828;
          background: rgba(198, 40, 40, 0.08);
        }
        .rank-shift.equal {
          color: var(--text-dim);
          background: transparent;
          padding: 0;
        }
        .rank-shift.new {
          color: var(--oro);
          background: rgba(184, 144, 47, 0.08);
          font-size: 9px;
        }
        [data-theme="dark"] .rank-shift.up {
          color: #7AD89A;
          background: rgba(61, 138, 95, 0.18);
        }
        [data-theme="dark"] .rank-shift.down {
          color: #F4A090;
          background: rgba(178, 58, 43, 0.18);
        }
        .srv-table-spinner {
          display: block;
          margin: 40px auto;
          width: 24px;
          height: 24px;
          border: 3px solid rgba(184, 144, 47, 0.15);
          border-top-color: var(--oro);
          border-radius: 50%;
          animation: srvSpin 0.8s linear infinite;
        }
        @keyframes srvSpin {
          to { transform: rotate(360deg); }
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
          <button class="brand-shortcut-btn" onclick="SelectRegionView.handleSelectCorporate()">
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
        ${SelectRegionView.getRegionMapSVG(r.id)}
        <div class="srv-card-top">
          <span class="srv-card-code">${r.id}</span>
          <div class="srv-card-rating-container" data-region-rating="${r.id}">
            <span class="srv-rating-spinner"></span>
          </div>
        </div>
        <div class="srv-card-bottom">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom: 4px;">
            <h3 class="srv-card-name" style="margin:0;">${r.name}</h3>
            <span class="srv-card-badge" style="font-size:10.5px; opacity:0.85;">${r.count} suc.</span>
          </div>
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

          <!-- Tabla de Rankings Bistro -->
          <div id="srv-ranking-table-placeholder" class="srv-ranking-table-placeholder-box loading">
            <div class="srv-table-spinner"></div>
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

    // Disparar carga asíncrona de calificaciones y rankings
    SelectRegionView.loadRatingsAndRankings();
  },

  async handleSelect(regionId) {
    const container = document.getElementById('srvContainer');
    if (container) {
      container.classList.add('exit-transition');
    }

    const regionName = getRegionName(regionId);
    if (typeof showRegionTransitionLoader !== 'undefined') {
      showRegionTransitionLoader(regionName, 'Accediendo al panel regional...', async () => {
        if (typeof DataLoader !== 'undefined') {
          await DataLoader.switchRegion(regionId);
        }
        Router.navigate('#/');
      });
    } else {
      setTimeout(async () => {
        if (typeof DataLoader !== 'undefined') {
          await DataLoader.switchRegion(regionId);
        }
        Router.navigate('#/');
      }, 400);
    }
  },

  handleSelectCorporate() {
    const container = document.getElementById('srvContainer');
    if (container) {
      container.classList.add('exit-transition');
    }

    if (typeof showRegionTransitionLoader !== 'undefined') {
      showRegionTransitionLoader('étoile corporativo', 'Accediendo al centro de mando...', () => {
        Router.navigate('#/brand');
      });
    } else {
      setTimeout(() => {
        Router.navigate('#/brand');
      }, 400);
    }
  },

  getRegionMapSVG(regionId) {
    const paths = {
      'GDL': 'M 20,40 L 45,15 L 75,15 L 85,30 L 80,55 L 90,65 L 70,85 L 50,85 L 35,65 L 20,60 Z',
      'CDMX': 'M 50,20 C 70,20 80,35 75,65 C 70,80 50,90 50,90 C 50,90 30,80 25,65 C 20,35 30,20 50,20 Z',
      'MTY': 'M 25,30 L 45,15 L 65,30 L 55,50 L 75,70 L 65,90 L 45,85 L 35,60 L 25,45 Z',
      'LEON': 'M 30,20 L 70,15 L 85,45 L 70,80 L 30,85 L 15,55 Z',
      'SLP': 'M 20,35 L 50,15 L 80,30 L 85,55 L 70,75 L 55,65 L 45,85 L 25,75 Z',
      'AGS': 'M 35,25 C 55,25 70,35 65,65 C 60,75 50,85 50,85 C 50,85 40,75 35,65 C 30,35 35,25 35,25 Z',
      'TOL': 'M 15,30 L 45,20 L 70,35 L 60,60 L 80,65 L 75,85 L 45,90 L 35,65 L 20,60 Z',
      'QRO': 'M 40,15 L 60,25 L 65,50 L 50,85 L 35,75 L 40,45 Z',
      'CUN': 'M 45,15 L 70,18 L 75,45 L 55,90 L 35,85 L 40,55 Z',
      'TJ': 'M 30,15 L 65,18 L 55,45 L 45,75 L 35,90 L 25,80 Z'
    };
    
    const p = paths[regionId] || 'M 20,20 L 80,20 L 80,80 L 20,80 Z';
    return `
      <svg class="srv-card-map-overlay" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
        <path d="${p}" />
      </svg>
    `;
  },

  async loadRatingsAndRankings() {
    try {
      if (typeof DataLoader !== 'undefined') {
        if (!DataLoader.currentYear) {
          await DataLoader.init();
        }
        const currYear = DataLoader.currentYear;
        const currMonth = DataLoader.currentMonth;
        const prevYear = DataLoader.previousYear;
        const prevMonth = DataLoader.previousMonth;

        // Cargar datos globales asíncronamente
        const [currReviews, prevReviews] = await Promise.all([
          DataLoader.loadBrandData(currYear, currMonth),
          DataLoader.loadBrandData(prevYear, prevMonth)
        ]);

        // Calcular métricas por región
        const regionStats = {};
        const prevRegionStats = {};

        for (const [id, name] of Object.entries(REGION_NAME_MAP)) {
          const regionBranches = SUCURSALES_META_ALL.filter(s => s.region === id);
          
          // Mes actual
          const currRegReviews = currReviews.filter(r => r.region === id);
          const currCount = currRegReviews.length;
          const currAvg = currCount ? currRegReviews.reduce((sum, r) => sum + r.stars, 0) / currCount : 0;
          const currBranchCount = regionBranches.length;
          const currComplexity = currBranchCount > 0 ? (currBranchCount * 0.018) + (Math.log10(currCount + 1) * 0.008) : 0;
          const currAdjusted = currAvg * (1 + currComplexity);

          // Mes anterior
          const prevRegReviews = prevReviews.filter(r => r.region === id);
          const prevCount = prevRegReviews.length;
          const prevAvg = prevCount ? prevRegReviews.reduce((sum, r) => sum + r.stars, 0) / prevCount : 0;
          const prevBranchCount = regionBranches.length;
          const prevComplexity = prevBranchCount > 0 ? (prevBranchCount * 0.018) + (Math.log10(prevCount + 1) * 0.008) : 0;
          const prevAdjusted = prevAvg * (1 + prevComplexity);

          regionStats[id] = {
            id,
            name,
            avg: currAvg,
            count: currCount,
            adjusted: currAdjusted,
            delta: currAvg - prevAvg
          };

          prevRegionStats[id] = {
            id,
            name,
            avg: prevAvg,
            count: prevCount,
            adjusted: prevAdjusted
          };
        }

        // Calcular rankings (ordenados por adjustedScore)
        const rankedCurr = Object.values(regionStats)
          .filter(s => s.count > 0)
          .sort((a, b) => b.adjusted - a.adjusted);

        const rankedPrev = Object.values(prevRegionStats)
          .filter(s => s.count > 0)
          .sort((a, b) => b.adjusted - a.adjusted);

        const prevRankMap = {};
        rankedPrev.forEach((s, idx) => {
          prevRankMap[s.id] = idx + 1;
        });

        // Actualizar cada tarjeta en la interfaz
        for (const [id, stats] of Object.entries(regionStats)) {
          const container = document.querySelector(`[data-region-rating="${id}"]`);
          if (container) {
            if (stats.count > 0) {
              let arrowHtml = '';
              let badgeClass = '';
              const deltaVal = stats.delta;
              if (deltaVal > 0.01) {
                arrowHtml = `<span class="trend-arrow up">▲ +${deltaVal.toFixed(2)}</span>`;
                badgeClass = 'trend-up';
              } else if (deltaVal < -0.01) {
                arrowHtml = `<span class="trend-arrow down">▼ ${deltaVal.toFixed(2)}</span>`;
                badgeClass = 'trend-down';
              } else {
                arrowHtml = `<span class="trend-arrow equal">● =</span>`;
                badgeClass = 'trend-equal';
              }

              container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                  <div class="srv-rating-val">${stats.avg.toFixed(2)} <span style="font-size:11px;color:var(--text-muted);margin-left:2px;">★</span></div>
                  <div class="srv-rating-trend ${badgeClass}" style="margin-top:2px;">${arrowHtml}</div>
                </div>
              `;
            } else {
              container.innerHTML = `<span style="font-size:11px;color:var(--text-dim)">Sin reseñas</span>`;
            }
          }
        }

        // Generar la tabla de rankings
        const tablePlaceholder = document.getElementById('srv-ranking-table-placeholder');
        if (tablePlaceholder) {
          if (rankedCurr.length > 0) {
            const rowsHtml = rankedCurr.map((stats, idx) => {
              const currentRank = idx + 1;
              const prevRank = prevRankMap[stats.id];
              let rankShiftHtml = '';
              
              if (prevRank) {
                const shift = prevRank - currentRank;
                if (shift > 0) {
                  rankShiftHtml = `<span class="rank-shift up">▲ ${shift}</span>`;
                } else if (shift < 0) {
                  rankShiftHtml = `<span class="rank-shift down">▼ ${Math.abs(shift)}</span>`;
                } else {
                  rankShiftHtml = `<span class="rank-shift equal">=</span>`;
                }
              } else {
                rankShiftHtml = `<span class="rank-shift new">NUEVO</span>`;
              }

              let medalClass = '';
              if (currentRank === 1) medalClass = 'rank-gold';
              else if (currentRank === 2) medalClass = 'rank-silver';
              else if (currentRank === 3) medalClass = 'rank-bronze';

              return `
                <tr class="ranking-row">
                  <td class="ranking-cell rank-col">
                    <span class="ranking-badge ${medalClass}">${currentRank}</span>
                  </td>
                  <td class="ranking-cell region-col">
                    <div style="font-family:var(--sans); font-size:14px; font-weight:700; color:var(--text)">${stats.name}</div>
                  </td>
                  <td class="ranking-cell shift-col">${rankShiftHtml}</td>
                  <td class="ranking-cell reviews-col">${stats.count} reseñas</td>
                  <td class="ranking-cell rating-col">${stats.avg.toFixed(2)} ★</td>
                  <td class="ranking-cell score-col font-mono" style="font-weight:700;">${stats.adjusted.toFixed(2)} pts</td>
                </tr>
              `;
            }).join('');

            tablePlaceholder.innerHTML = `
              <div class="ranking-table-card">
                <div class="ranking-table-header">
                  <h3 class="ranking-table-title">Standings & Rendimiento Regional</h3>
                  <p class="ranking-table-subtitle">Ordenado por Score Ajustado (Complejidad de sucursales + volumen de reseñas vs promedio real)</p>
                </div>
                <div class="ranking-table-wrapper">
                  <table class="ranking-table">
                    <thead>
                      <tr>
                        <th>Puesto</th>
                        <th>Región</th>
                        <th>Cambio</th>
                        <th>Reseñas</th>
                        <th>Rating Real</th>
                        <th>Score Ajustado</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>
            `;
            tablePlaceholder.classList.remove('loading');
          } else {
            tablePlaceholder.innerHTML = `
              <div class="ranking-empty" style="text-align:center;padding:40px;color:var(--text-dim);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">No se encontraron datos para calcular el ranking de este mes.</div>
            `;
            tablePlaceholder.classList.remove('loading');
          }
        }
      }
    } catch (e) {
      console.error('Error al cargar ratings y rankings:', e);
      const tablePlaceholder = document.getElementById('srv-ranking-table-placeholder');
      if (tablePlaceholder) {
        tablePlaceholder.innerHTML = `<div class="ranking-error" style="text-align:center;padding:40px;color:var(--alerta);background:rgba(178,58,43,0.06);border:1px solid rgba(178,58,43,0.2);border-radius:var(--radius);">Error al cargar datos desde Supabase. Reintente más tarde.</div>`;
      }
    }
  },

  handleMonthSelect(monthVal) {
    const month = parseInt(monthVal);
    const currYear = DataLoader.currentYear;
    DataLoader.setMonth(currYear, month);
    this.render();
  }
};
