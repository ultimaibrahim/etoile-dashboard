/**
 * views/select-region.js — Vista de Selección de Región post-login con interfaz Premium,
 * Barra de Control Histórico (Año/Mes/Filtros) compacta integrada y Brand Dashboard.
 */

const SelectRegionView = {
  selectedYear: null,
  selectedMonth: null,
  filterStatus: 'all', // 'all' | 'critical' | 'optimal'
  sortBy: 'adjusted',  // 'adjusted' | 'rating-desc' | 'rating-asc' | 'volume-desc' | 'delta-desc'
  searchQuery: '',
  _documentClickBound: false,

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

    // Inicializar año y mes de forma 100% dinámica usando Date() y manifest
    if (!this.selectedYear || !this.selectedMonth) {
      const def = this.getDefaultPeriod();
      this.selectedYear = def.year;
      this.selectedMonth = def.month;
    }

    if (typeof DataLoader !== 'undefined') {
      DataLoader.setMonth(this.selectedYear, this.selectedMonth);
    }

    // Listener global para cerrar dropdowns al hacer clic fuera
    if (!this._documentClickBound) {
      this._documentClickBound = true;
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
          document.querySelectorAll('.custom-select.open').forEach(d => d.classList.remove('open'));
        }
      });
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
          padding: 32px 20px 60px 20px;
          box-sizing: border-box;
          overflow-y: auto;
        }
        .srv-container {
          width: 100%;
          max-width: 1120px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: srvEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: transform 0.4s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.4s ease;
        }
        .srv-container.exit-transition {
          transform: scale(0.94);
          opacity: 0;
        }
        @keyframes srvEntrance {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── SECCIÓN EXPLORAR REGIONES & TOOLBAR COMPACTO ── */
        .srv-section-box {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }
        .srv-header-row {
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          width: 100%;
        }
        .srv-header-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }
        .srv-title {
          font-family: var(--giaza);
          font-size: 38px;
          color: var(--text);
          margin: 0;
          font-weight: 400;
          letter-spacing: 0.01em;
          line-height: 1.1;
        }
        .srv-subtitle {
          font-size: 14px;
          color: var(--text-dim);
          max-width: 580px;
          line-height: 1.4;
          margin: 0;
        }
        .srv-filter-badge {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--oro);
          background: rgba(184, 144, 47, 0.12);
          border: 1px solid rgba(184, 144, 47, 0.25);
          padding: 3px 10px;
          border-radius: 20px;
        }

        /* ── TOOLBAR DE CONTROLES COMPACTO ── */
        .srv-toolbar {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          box-shadow: var(--sombra-card);
          box-sizing: border-box;
          width: 100%;
        }

        .srv-compact-select {
          position: relative;
          flex: 1 1 140px;
          min-width: 130px;
        }
        .srv-compact-select .custom-select-trigger {
          width: 100%;
          padding: 8px 12px;
          font-size: 12.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .srv-compact-select .custom-select-trigger:hover {
          border-color: var(--border-strong);
          background: var(--surface);
        }
        .srv-compact-select.open .custom-select-trigger {
          border-color: var(--oro);
          box-shadow: 0 0 0 3px rgba(184, 144, 47, 0.15);
        }
        .srv-compact-select .custom-select-options {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          min-width: 190px;
          max-height: 260px;
          overflow-y: auto;
          z-index: 2000;
          background: #FAF6F0;
          border: 1.5px solid var(--border-strong);
          border-radius: var(--radius-sm);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08);
          display: none;
          padding: 6px;
          box-sizing: border-box;
        }
        [data-theme="dark"] .srv-compact-select .custom-select-options {
          background: #1C2220;
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
        }
        .srv-compact-select.open .custom-select-options {
          display: block;
        }
        .srv-compact-select .custom-option {
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 600;
          color: #2D3748;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 2px;
        }
        [data-theme="dark"] .srv-compact-select .custom-option {
          color: #E2E8F0;
        }
        .srv-compact-select .custom-option:hover {
          background: rgba(61, 90, 71, 0.1);
          color: var(--verde-deep);
        }
        [data-theme="dark"] .srv-compact-select .custom-option:hover {
          background: rgba(184, 144, 47, 0.15);
          color: #FAF5EB;
        }
        .srv-compact-select .custom-option.active {
          font-weight: 700;
          color: #FFFFFF !important;
          background: var(--verde) !important;
          box-shadow: 0 2px 8px rgba(61, 90, 71, 0.25);
        }
        [data-theme="dark"] .srv-compact-select .custom-option.active {
          background: var(--oro) !important;
          color: #1A1A1A !important;
        }

        /* ── CONTROLES STEPPER 1-CLIC Y GRID DE MESES 4x3 ── */
        .srv-stepper-wrap {
          display: flex;
          align-items: center;
          gap: 3px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 3px;
          box-sizing: border-box;
        }
        .srv-stepper-btn {
          background: transparent;
          border: none;
          color: var(--text);
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .srv-stepper-btn:hover {
          background: var(--surface);
          color: var(--oro);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        .srv-stepper-btn:active {
          transform: scale(0.92);
        }
        .srv-stepper-wrap .srv-compact-select .custom-select-trigger {
          border: none !important;
          background: transparent !important;
          padding: 4px 8px !important;
          box-shadow: none !important;
        }
        .srv-popover-grid {
          width: 250px !important;
          min-width: 250px !important;
          padding: 8px !important;
        }
        .srv-month-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          width: 100%;
        }
        .srv-month-pill {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 2px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          text-align: center;
          transition: all 0.15s ease;
          outline: none;
        }
        .srv-month-pill:hover {
          background: rgba(61, 90, 71, 0.12);
          border-color: var(--verde);
          color: var(--verde-deep);
        }
        .srv-month-pill.active {
          background: var(--verde) !important;
          color: #FFFFFF !important;
          border-color: var(--verde) !important;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(61, 90, 71, 0.25);
        }
        [data-theme="dark"] .srv-month-pill.active {
          background: var(--oro) !important;
          color: #1A1A1A !important;
          border-color: var(--oro) !important;
        }

        .srv-search-box {
          position: relative;
          flex: 2 1 180px;
          min-width: 160px;
        }
        .srv-search-input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 8px 12px 8px 34px;
          font-size: 12.5px;
          color: var(--text);
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          font-family: var(--sans);
        }
        .srv-search-input:focus {
          border-color: var(--oro);
          background: var(--surface);
          box-shadow: 0 0 0 3px rgba(184, 144, 47, 0.15);
        }
        .srv-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .srv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
          width: 100%;
        }
        .srv-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 145px;
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
          align-items: center;
          width: 100%;
        }
        .srv-card-code {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          background: var(--surface-2);
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.3s ease;
        }
        .srv-card:hover .srv-card-code {
          background: var(--verde);
          color: #FAF5EB;
        }
        .srv-card-bottom {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 20px;
        }
        .srv-card-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
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
          bottom: 12px;
          right: 12px;
          width: 60px;
          height: 60px;
          opacity: 0.08;
          color: var(--verde);
          pointer-events: none;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        }
        .srv-card:hover .srv-card-map-overlay {
          transform: scale(1.08) rotate(-4deg);
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
          margin-top: 10px;
          width: 100%;
        }
        .ranking-table-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--sombra);
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-sizing: border-box;
        }
        .ranking-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ranking-table-title {
          font-family: var(--giaza);
          font-size: 26px;
          color: var(--text);
          margin: 0;
          font-weight: 400;
        }
        .ranking-table-subtitle {
          font-size: 13px;
          color: var(--text-dim);
          margin: 4px 0 0 0;
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
          padding: 14px 16px;
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

        /* ── BRAND DASHBOARD SHORTCUT BANNER ── */
        .brand-shortcut-card {
          background: var(--surface-2);
          border: 1px solid var(--border-strong);
          border-radius: 20px;
          padding: 22px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          box-shadow: var(--sombra-lg);
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
          min-width: 260px;
          display: flex;
          flex-direction: column;
          gap: 6px;
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
          font-size: 28px;
          color: var(--text);
          margin: 0;
          font-weight: 400;
        }
        .brand-shortcut-desc {
          font-size: 13px;
          color: var(--text-dim);
          margin: 0;
          line-height: 1.4;
          max-width: 650px;
        }
        .brand-shortcut-btn {
          background: var(--verde);
          border: 1px solid var(--verde);
          color: #fff;
          padding: 12px 24px;
          border-radius: 14px;
          font-size: 13.5px;
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

        @media (max-width: 768px) {
          .srv-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .srv-compact-select, .srv-search-box {
            width: 100%;
            flex: 1 1 100%;
          }
        }

        @media (max-width: 600px) {
          .brand-shortcut-card {
            padding: 18px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }
          .brand-shortcut-title {
            font-size: 22px !important;
          }
          .brand-shortcut-desc {
            font-size: 12px !important;
          }
          .brand-shortcut-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 11px 18px !important;
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

    // Años disponibles desde manifest
    const manifestYears = (typeof DataLoader !== 'undefined' && DataLoader.manifest) 
      ? Object.keys(DataLoader.manifest).map(Number).sort((a, b) => b - a)
      : [];
    const availableYears = manifestYears.length > 0 ? manifestYears : [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

    // Opciones de Año
    const yearOptionsHtml = availableYears.map(y => `
      <div class="custom-option ${y === this.selectedYear ? 'active' : ''}" data-value="${y}" onclick="SelectRegionView.onYearOptionClick(${y}, event)">${y}</div>
    `).join('');

    // Opciones de Mes (Cuadrícula 4x3 de 0 Scroll)
    const monthNames = MONTH_NAMES || ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthShortNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthOptionsHtml = `
      <div class="srv-month-grid">
        ${monthShortNames.map((mShort, idx) => {
          const mNum = idx + 1;
          return `<button type="button" class="srv-month-pill ${mNum === this.selectedMonth ? 'active' : ''}" data-value="${mNum}" onclick="SelectRegionView.onMonthOptionClick(${mNum}, event)">${mShort}</button>`;
        }).join('')}
      </div>
    `;

    // Opciones de Ordenamiento
    const sortLabels = {
      'adjusted': 'Score Ajustado',
      'rating-desc': 'Rating (Alto a Bajo)',
      'rating-asc': 'Rating (Alertas)',
      'volume-desc': 'Volumen Reseñas',
      'delta-desc': 'Mayor Crecimiento'
    };
    const sortOptionsHtml = Object.entries(sortLabels).map(([k, label]) => `
      <div class="custom-option ${k === this.sortBy ? 'active' : ''}" data-value="${k}" onclick="SelectRegionView.onSortOptionClick('${k}', event)">${label}</div>
    `).join('');

    // Opciones de Estado
    const statusLabels = {
      'all': 'Todas las Regiones',
      'critical': 'En Alerta (< 4.50 ★)',
      'optimal': 'Óptimas (≥ 4.50 ★)'
    };
    const statusOptionsHtml = Object.entries(statusLabels).map(([k, label]) => `
      <div class="custom-option ${k === this.filterStatus ? 'active' : ''}" data-value="${k}" onclick="SelectRegionView.onStatusOptionClick('${k}', event)">${label}</div>
    `).join('');

    // Lista de tarjetas de región
    const regionsList = Object.entries(REGION_NAME_MAP).map(([id, name]) => {
      const branches = SUCURSALES_META_ALL.filter(s => s.region === id);
      const count = branches.length;

      return {
        id,
        name,
        count
      };
    });

    const cardsHtml = regionsList.map(r => `
      <div class="srv-card" id="srv-card-${r.id}" onclick="SelectRegionView.handleSelect('${r.id}')">
        ${SelectRegionView.getRegionMapSVG(r.id)}
        <div class="srv-card-top">
          <span class="srv-card-code">${r.count === 1 ? `${r.id} - UNICA` : `${r.id} - ${r.count} SUC`}</span>
          <div class="srv-card-rating-container" data-region-rating="${r.id}">
            <span class="srv-rating-spinner"></span>
          </div>
        </div>
        <div class="srv-card-bottom">
          <h3 class="srv-card-name" style="margin:0;">${escapeHtml(r.name)}</h3>
        </div>
      </div>
    `).join('');

    app.innerHTML = `
      <div class="srv-wrapper">
        <div class="srv-container" id="srvContainer">
          
          <!-- Brand Dashboard Shortcut Banner -->
          ${brandDashboardHtml}

          <!-- SECCIÓN EXPLORAR REGIONES CON CONTROLES INTEGRADOS -->
          <div class="srv-section-box">
            <div class="srv-header-row">
              <div class="srv-header-text">
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                  <span class="eyebrow" style="color: var(--text-dim); font-weight:700; background: var(--surface-2); border: 1px solid var(--border-strong); padding:4px 14px; border-radius:20px; letter-spacing:0.08em; font-size:11px;">Navegación Regional</span>
                  <span class="srv-filter-badge" id="srvPeriodBadge">${monthNames[this.selectedMonth - 1]} ${this.selectedYear}</span>
                </div>
                <h1 class="srv-title">Explorar Regiones</h1>
                <p class="srv-subtitle">Elige el área operativa que deseas supervisar de manera individual o filtra métricas por período y estado.</p>
              </div>
            </div>

            <!-- TOOLBAR DE CONTROLES Y FILTROS INTEGRADOS COMPACTOS CON STEPPER 1-CLIC -->
            <div class="srv-toolbar">
              <!-- Stepper de Año -->
              <div class="srv-stepper-wrap">
                <button type="button" class="srv-stepper-btn" onclick="SelectRegionView.stepYear(-1, event)" title="Año anterior">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div class="custom-select srv-compact-select" id="srvYearDropdown" style="min-width:85px;">
                  <button class="custom-select-trigger" onclick="SelectRegionView.toggleDropdown('srvYearDropdown', event)">
                    <span class="custom-select-value">${this.selectedYear}</span>
                    <svg class="custom-select-arrow" width="9" height="5" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <div class="custom-select-options" style="min-width:110px;">
                    ${yearOptionsHtml}
                  </div>
                </div>
                <button type="button" class="srv-stepper-btn" onclick="SelectRegionView.stepYear(1, event)" title="Año siguiente">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>

              <!-- Stepper de Mes (1-Clic y Cuadrícula 4x3) -->
              <div class="srv-stepper-wrap">
                <button type="button" class="srv-stepper-btn" onclick="SelectRegionView.stepMonth(-1, event)" title="Mes anterior">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div class="custom-select srv-compact-select" id="srvMonthDropdown" style="min-width:115px;">
                  <button class="custom-select-trigger" onclick="SelectRegionView.toggleDropdown('srvMonthDropdown', event)">
                    <span class="custom-select-value">${monthNames[this.selectedMonth - 1]}</span>
                    <svg class="custom-select-arrow" width="9" height="5" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <div class="custom-select-options srv-popover-grid">
                    ${monthOptionsHtml}
                  </div>
                </div>
                <button type="button" class="srv-stepper-btn" onclick="SelectRegionView.stepMonth(1, event)" title="Mes siguiente">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>

              <!-- Selector de Ordenamiento -->
              <div class="custom-select srv-compact-select" id="srvSortDropdown">
                <button class="custom-select-trigger" onclick="SelectRegionView.toggleDropdown('srvSortDropdown', event)">
                  <span class="custom-select-value">Orden: ${sortLabels[this.sortBy]}</span>
                  <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="custom-select-options">
                  ${sortOptionsHtml}
                </div>
              </div>

              <!-- Selector de Estado -->
              <div class="custom-select srv-compact-select" id="srvStatusDropdown">
                <button class="custom-select-trigger" onclick="SelectRegionView.toggleDropdown('srvStatusDropdown', event)">
                  <span class="custom-select-value">Estado: ${statusLabels[this.filterStatus]}</span>
                  <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="custom-select-options">
                  ${statusOptionsHtml}
                </div>
              </div>

              <!-- Buscador Instantáneo -->
              <div class="srv-search-box">
                <svg class="srv-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" class="srv-search-input" id="srvSearchInput" placeholder="Buscar región..." value="${escapeHtml(this.searchQuery)}" oninput="SelectRegionView.handleSearch(this.value)">
              </div>
            </div>

            <!-- GRID DE TARJETAS DE REGIÓN -->
            <div class="srv-grid" id="srvRegionGrid">
              ${cardsHtml}
            </div>
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

  getDefaultPeriod() {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1; // 1-indexed (1-12)

    // Por defecto en analítica de negocios, el mes de operación "cerrado" es el mes anterior al actual
    let defaultYear = curMonth === 1 ? curYear - 1 : curYear;
    let defaultMonth = curMonth === 1 ? 12 : curMonth - 1;

    // Si DataLoader cuenta con manifest cargado de la base de datos, evaluar el período más reciente válido
    if (typeof DataLoader !== 'undefined' && DataLoader.manifest) {
      const manifestYears = Object.keys(DataLoader.manifest).map(Number).sort((a, b) => b - a);
      if (manifestYears.length > 0) {
        const latestYear = manifestYears[0];
        const monthsInYear = [...DataLoader.manifest[latestYear]].sort((a, b) => a - b);
        
        if (monthsInYear.length > 0) {
          defaultYear = latestYear;
          const targetPrevMonth = curMonth === 1 ? 12 : curMonth - 1;
          if (monthsInYear.includes(targetPrevMonth)) {
            defaultMonth = targetPrevMonth;
          } else {
            defaultMonth = monthsInYear[monthsInYear.length - 1];
          }
        }
      }
    }

    return { year: defaultYear, month: defaultMonth };
  },

  calculateAdjustedScore(avg, count, branchCount) {
    if (!count || count === 0) return 0;

    // 1. Suavizado Bayesiano por muestra de confianza (k = 15 reseñas, M = 4.50 promedio base de marca)
    const k = 15;
    const M = 4.50;
    const bayesianRating = (count * avg + k * M) / (count + k);

    // 2. Factor de complejidad por escala de tiendas y volumen logarítmico
    const branchWeight = (branchCount || 1) * 0.022;
    const volumeWeight = Math.log10(count + 1) * 0.020;
    const complexity = 1 + branchWeight + volumeWeight;

    return bayesianRating * complexity;
  },

  stepMonth(delta, event) {
    if (event) event.stopPropagation();
    let newM = (this.selectedMonth || 1) + delta;
    let newY = this.selectedYear || new Date().getFullYear();

    if (newM > 12) {
      newM = 1;
      newY += 1;
    } else if (newM < 1) {
      newM = 12;
      newY -= 1;
    }

    this.selectedYear = newY;
    this.onMonthOptionClick(newM, event);
  },

  stepYear(delta, event) {
    if (event) event.stopPropagation();
    const newY = (this.selectedYear || new Date().getFullYear()) + delta;
    this.onYearOptionClick(newY, event);
  },

  toggleDropdown(id, event) {
    if (event) event.stopPropagation();
    const el = document.getElementById(id);
    document.querySelectorAll('.custom-select.open').forEach(d => {
      if (d !== el) d.classList.remove('open');
    });
    if (el) el.classList.toggle('open');
  },

  showCardSpinners() {
    Object.keys(REGION_NAME_MAP).forEach(id => {
      const container = document.querySelector(`[data-region-rating="${id}"]`);
      if (container) {
        container.innerHTML = `<span class="srv-rating-spinner"></span>`;
      }
    });
    const tablePlaceholder = document.getElementById('srv-ranking-table-placeholder');
    if (tablePlaceholder) {
      tablePlaceholder.classList.add('loading');
      tablePlaceholder.innerHTML = `<div class="srv-table-spinner"></div>`;
    }
  },

  onYearOptionClick(yearNum, event) {
    if (event) event.stopPropagation();
    this.selectedYear = parseInt(yearNum);
    
    const valEl = document.querySelector('#srvYearDropdown .custom-select-value');
    if (valEl) valEl.textContent = `Año: ${this.selectedYear}`;
    
    document.querySelectorAll('#srvYearDropdown .custom-option').forEach(opt => {
      opt.classList.toggle('active', parseInt(opt.getAttribute('data-value')) === this.selectedYear);
    });
    
    const dropdown = document.getElementById('srvYearDropdown');
    if (dropdown) dropdown.classList.remove('open');

    const monthNames = MONTH_NAMES || ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const badge = document.getElementById('srvPeriodBadge');
    if (badge) badge.textContent = `${monthNames[this.selectedMonth - 1]} ${this.selectedYear}`;

    if (typeof DataLoader !== 'undefined') {
      DataLoader.setMonth(this.selectedYear, this.selectedMonth);
    }
    this.showCardSpinners();
    this.loadRatingsAndRankings();
  },

  onMonthOptionClick(monthNum, event) {
    if (event) event.stopPropagation();
    this.selectedMonth = parseInt(monthNum);
    
    const monthNames = MONTH_NAMES || ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = monthNames[this.selectedMonth - 1];

    const valEl = document.querySelector('#srvMonthDropdown .custom-select-value');
    if (valEl) valEl.textContent = `Mes: ${monthName}`;
    
    document.querySelectorAll('#srvMonthDropdown .custom-option').forEach(opt => {
      opt.classList.toggle('active', parseInt(opt.getAttribute('data-value')) === this.selectedMonth);
    });

    const dropdown = document.getElementById('srvMonthDropdown');
    if (dropdown) dropdown.classList.remove('open');

    const badge = document.getElementById('srvPeriodBadge');
    if (badge) badge.textContent = `${monthName} ${this.selectedYear}`;

    if (typeof DataLoader !== 'undefined') {
      DataLoader.setMonth(this.selectedYear, this.selectedMonth);
    }
    this.showCardSpinners();
    this.loadRatingsAndRankings();
  },

  onSortOptionClick(sortKey, event) {
    if (event) event.stopPropagation();
    this.sortBy = sortKey;
    
    const sortLabels = {
      'adjusted': 'Score Ajustado',
      'rating-desc': 'Rating (Alto a Bajo)',
      'rating-asc': 'Rating (Alertas)',
      'volume-desc': 'Volumen Reseñas',
      'delta-desc': 'Mayor Crecimiento'
    };

    const valEl = document.querySelector('#srvSortDropdown .custom-select-value');
    if (valEl) valEl.textContent = `Orden: ${sortLabels[sortKey] || sortKey}`;

    document.querySelectorAll('#srvSortDropdown .custom-option').forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-value') === sortKey);
    });

    const dropdown = document.getElementById('srvSortDropdown');
    if (dropdown) dropdown.classList.remove('open');

    this.applyFiltersAndSorting();
  },

  onStatusOptionClick(statusKey, event) {
    if (event) event.stopPropagation();
    this.filterStatus = statusKey;

    const statusLabels = {
      'all': 'Todas las Regiones',
      'critical': 'En Alerta (< 4.50 ★)',
      'optimal': 'Óptimas (≥ 4.50 ★)'
    };

    const valEl = document.querySelector('#srvStatusDropdown .custom-select-value');
    if (valEl) valEl.textContent = `Estado: ${statusLabels[statusKey] || statusKey}`;

    document.querySelectorAll('#srvStatusDropdown .custom-option').forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-value') === statusKey);
    });

    const dropdown = document.getElementById('srvStatusDropdown');
    if (dropdown) dropdown.classList.remove('open');

    this.applyFiltersAndSorting();
  },

  handleSearch(val) {
    this.searchQuery = (val || '').toLowerCase().trim();
    this.applyFiltersAndSorting();
  },

  applyFiltersAndSorting() {
    if (!this._cachedRegionStats) return;

    let statsArray = Object.values(this._cachedRegionStats);

    // 1. Filtrado por Estado (all | critical | optimal)
    if (this.filterStatus === 'critical') {
      statsArray = statsArray.filter(s => s.count > 0 && s.avg < 4.50);
    } else if (this.filterStatus === 'optimal') {
      statsArray = statsArray.filter(s => s.count > 0 && s.avg >= 4.50);
    }

    // 2. Búsqueda por texto libre
    if (this.searchQuery) {
      statsArray = statsArray.filter(s => {
        const q = this.searchQuery;
        return s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      });
    }

    // 3. Ordenamiento
    statsArray.sort((a, b) => {
      if (this.sortBy === 'rating-desc') return b.avg - a.avg;
      if (this.sortBy === 'rating-asc') return a.avg - b.avg;
      if (this.sortBy === 'volume-desc') return b.count - a.count;
      if (this.sortBy === 'delta-desc') return b.delta - a.delta;
      // Default: adjusted score
      return b.adjusted - a.adjusted;
    });

    // Actualizar orden y visibilidad de las tarjetas de región en el DOM
    const grid = document.getElementById('srvRegionGrid');
    if (grid) {
      const visibleIds = new Set(statsArray.map(s => s.id));
      statsArray.forEach(s => {
        const card = document.getElementById(`srv-card-${s.id}`);
        if (card) {
          card.style.display = '';
          grid.appendChild(card);
        }
      });
      Object.keys(REGION_NAME_MAP).forEach(id => {
        if (!visibleIds.has(id)) {
          const card = document.getElementById(`srv-card-${id}`);
          if (card) card.style.display = 'none';
        }
      });
    }

    // Re-renderizar la tabla de rankings con los ítems filtrados y ordenados
    this.renderRankingsTable(statsArray);
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
          DataLoader.setMonth(this.selectedYear, this.selectedMonth);
          await DataLoader.switchRegion(regionId);
        }
        Router.navigate('#/');
      });
    } else {
      setTimeout(async () => {
        if (typeof DataLoader !== 'undefined') {
          DataLoader.setMonth(this.selectedYear, this.selectedMonth);
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
      'GDL': 'M50 15 L65 30 L80 35 L75 55 L85 75 L60 85 L45 80 L25 85 L15 65 L20 45 L35 30 Z',
      'CDMX': 'M35 15 L65 15 L75 30 L70 50 L60 65 L65 90 L45 90 L35 75 L30 55 L38 35 Z',
      'MTY': 'M20 20 L55 15 L85 25 L80 50 L75 80 L45 85 L25 70 L30 45 L15 35 Z',
      'LEON': 'M30 20 L70 15 L85 40 L75 70 L50 85 L20 70 L15 45 Z',
      'SLP': 'M25 15 L50 25 L80 20 L75 45 L90 60 L70 85 L45 75 L30 80 L15 50 Z',
      'AGS': 'M40 15 L65 20 L75 45 L60 85 L35 85 L25 55 L30 30 Z',
      'TOL': 'M40 10 L65 15 L75 35 L70 60 L80 85 L50 90 L30 75 L20 50 L25 25 Z',
      'QRO': 'M50 10 L65 25 L55 45 L75 60 L60 90 L40 85 L30 60 L45 40 Z',
      'CUN': 'M20 15 L50 15 L55 35 L75 35 L75 75 L65 75 L65 45 L45 45 L40 85 L20 85 Z',
      'TJ': 'M15 25 L85 25 L85 45 L65 55 L70 80 L45 80 L35 60 L15 50 Z'
    };
    
    const p = paths[regionId] || 'M 20,20 L 80,20 L 80,80 L 20,80 Z';
    return `
      <svg class="srv-card-map-overlay" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
        <path d="${p}" />
      </svg>
    `;
  },

  async loadRatingsAndRankings() {
    const tablePlaceholder = document.getElementById('srv-ranking-table-placeholder');
    const skeletonTimeout = setTimeout(() => {
      if (tablePlaceholder && typeof renderSkeleton === 'function') {
        renderSkeleton(tablePlaceholder, 'row', 6);
      }
    }, 250);

    try {
      if (typeof DataLoader !== 'undefined') {
        if (!DataLoader.currentYear) {
          await DataLoader.init();
        }

        const currYear = this.selectedYear || DataLoader.currentYear;
        const currMonth = this.selectedMonth || DataLoader.currentMonth;
        const prevMonth = currMonth === 1 ? 12 : currMonth - 1;
        const prevYear = currMonth === 1 ? currYear - 1 : currYear;

        DataLoader.setMonth(currYear, currMonth);

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
          const currAdjusted = SelectRegionView.calculateAdjustedScore(currAvg, currCount, currBranchCount);

          // Mes anterior
          const prevRegReviews = prevReviews.filter(r => r.region === id);
          const prevCount = prevRegReviews.length;
          const prevAvg = prevCount ? prevRegReviews.reduce((sum, r) => sum + r.stars, 0) / prevCount : 0;
          const prevBranchCount = regionBranches.length;
          const prevAdjusted = SelectRegionView.calculateAdjustedScore(prevAvg, prevCount, prevBranchCount);

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

        this._cachedRegionStats = regionStats;

        const rankedPrev = Object.values(prevRegionStats)
          .filter(s => s.count > 0)
          .sort((a, b) => b.adjusted - a.adjusted);

        this._prevRankMap = {};
        rankedPrev.forEach((s, idx) => {
          this._prevRankMap[s.id] = idx + 1;
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

        // Aplicar filtros y construir tabla
        this.applyFiltersAndSorting();
      }
    } catch (e) {
      console.error('Error al cargar ratings y rankings:', e);
      const tablePlaceholder = document.getElementById('srv-ranking-table-placeholder');
      if (tablePlaceholder) {
        tablePlaceholder.innerHTML = `<div class="ranking-error" style="text-align:center;padding:40px;color:var(--alerta);background:rgba(178,58,43,0.06);border:1px solid rgba(178,58,43,0.2);border-radius:var(--radius);">Error al cargar datos desde Supabase. Reintente más tarde.</div>`;
      }
    } finally {
      clearTimeout(skeletonTimeout);
    }
  },

  renderRankingsTable(statsArray) {
    const tablePlaceholder = document.getElementById('srv-ranking-table-placeholder');
    if (!tablePlaceholder) return;

    if (statsArray && statsArray.length > 0) {
      const prevRankMap = this._prevRankMap || {};
      const rowsHtml = statsArray.map((stats, idx) => {
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
            <td class="ranking-cell rating-col">${stats.avg ? stats.avg.toFixed(2) + ' ★' : '0.00 ★'}</td>
            <td class="ranking-cell score-col font-mono" style="font-weight:700;">${stats.adjusted ? stats.adjusted.toFixed(2) : '0.00'} pts</td>
          </tr>
        `;
      }).join('');

      const monthNames = MONTH_NAMES || ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

      tablePlaceholder.innerHTML = `
        <div class="ranking-table-card">
          <div class="ranking-table-header">
            <div>
              <h3 class="ranking-table-title">Standings & Rendimiento Regional</h3>
              <p class="ranking-table-subtitle">Resultados consolidados para ${monthNames[this.selectedMonth - 1]} ${this.selectedYear}</p>
            </div>
            <span style="font-size:11px; font-weight:700; color:var(--text-muted); background:var(--surface-2); border:1px solid var(--border); padding:4px 12px; border-radius:12px;">
              ${statsArray.length} regiones encontradas
            </span>
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
        <div class="ranking-empty" style="text-align:center;padding:40px;color:var(--text-dim);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">No se encontraron regiones que coincidan con los filtros seleccionados para este período.</div>
      `;
      tablePlaceholder.classList.remove('loading');
    }
  }
};
