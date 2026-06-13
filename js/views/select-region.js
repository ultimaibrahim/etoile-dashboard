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
          background: linear-gradient(135deg, var(--verde-deep) 0%, var(--bg) 100%);
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
      `;
      document.head.appendChild(style);
    }

    let brandDashboardHtml = '';
    const canSeeBrandDashboard = ['admin', 'director', 'regional'].includes(role);

    if (canSeeBrandDashboard) {
      const year = DataLoader.currentYear;
      const month = DataLoader.currentMonth;
      
      // Load current month's brand data
      const brandReviews = await DataLoader.loadBrandData(year, month);
      
      // Load previous month's brand data for delta comparisons
      let prevYear = year;
      let prevMonth = month - 1;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }
      const prevBrandReviews = await DataLoader.loadBrandData(prevYear, prevMonth);

      // ── CALCULAR KPIs DE MARCA ──
      const totalReviews = brandReviews.length;
      const avgRating = totalReviews ? brandReviews.reduce((sum, r) => sum + r.stars, 0) / totalReviews : 0;
      
      const prevTotalReviews = prevBrandReviews.length;
      const prevAvgRating = prevTotalReviews ? prevBrandReviews.reduce((sum, r) => sum + r.stars, 0) / prevTotalReviews : 0;
      const ratingDelta = avgRating - prevAvgRating;
      const ratingDeltaStr = totalReviews && prevTotalReviews && ratingDelta !== 0
        ? `${ratingDelta >= 0 ? '↑' : '↓'} ${Math.abs(ratingDelta).toFixed(2)} vs mes ant.`
        : 'Sin datos comp.';
        
      const activeAlerts = brandReviews.filter(r => r.stars <= 2).length;
      const prevActiveAlerts = prevBrandReviews.filter(r => r.stars <= 2).length;
      const alertsDelta = activeAlerts - prevActiveAlerts;
      const alertsDeltaStr = alertsDelta !== 0
        ? `${alertsDelta > 0 ? '+' : ''}${alertsDelta} vs mes ant.`
        : 'Estable';

      // ── CALCULAR MÉTRIQUES POR REGIÓN ──
      const regionStats = {};
      for (const [id, name] of Object.entries(REGION_NAME_MAP)) {
        const regionBranches = SUCURSALES_META_ALL.filter(s => s.region === id);
        const regionReviews = brandReviews.filter(r => r.region === id);
        const prevRegionReviews = prevBrandReviews.filter(r => r.region === id);
        
        const count = regionReviews.length;
        const avg = count ? regionReviews.reduce((sum, r) => sum + r.stars, 0) / count : 0;
        
        const prevCount = prevRegionReviews.length;
        const prevAvg = prevCount ? prevRegionReviews.reduce((sum, r) => sum + r.stars, 0) / prevCount : 0;
        const delta = avg - prevAvg;
        
        const alerts = regionReviews.filter(r => r.stars <= 2).length;
        
        regionStats[id] = {
          name,
          branchCount: regionBranches.length,
          reviewCount: count,
          avgRating: avg,
          delta,
          alerts
        };
      }

      // ── IDENTIFICAR LÍDERES Y FOCOS ROJOS EN SUCURSALES ──
      const branchStats = [];
      for (const s of SUCURSALES_META_ALL) {
        const branchReviews = brandReviews.filter(r => r.sucursal === s.id);
        const count = branchReviews.length;
        const avg = count ? branchReviews.reduce((sum, r) => sum + r.stars, 0) / count : 0;
        const alerts = branchReviews.filter(r => r.stars <= 2).length;
        
        if (count > 0) {
          const score = avg + 0.15 * Math.log2(count);
          branchStats.push({
            ...s,
            count,
            avg,
            alerts,
            score
          });
        }
      }

      // Destacan (Top 3 sucursales por score)
      const highlights = [...branchStats]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
        
      // Focos Rojos (Bottom 3 sucursales con avg < 4.60)
      const redFlags = [...branchStats]
        .filter(b => b.avg < KpiMeta.ratingMinimo)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 3);

      // ── CALCULAR DÉFICITS Y ACCIONES INMEDIATAS ──
      const deficits = [];
      
      // Regiones bajo el estándar (4.60)
      const regionsBelowTarget = Object.entries(regionStats)
        .filter(([id, stats]) => stats.reviewCount > 0 && stats.avgRating < KpiMeta.ratingMinimo);
      if (regionsBelowTarget.length > 0) {
        const names = regionsBelowTarget.map(([id, stats]) => `${stats.name} (${stats.avgRating.toFixed(2)}★)`).join(', ');
        deficits.push(`<strong>Regiones bajo meta (menor a ${KpiMeta.ratingMinimo.toFixed(2)}★):</strong> ${names}.`);
      }

      // Sucursales críticas con alertas
      const criticalBranches = branchStats.filter(b => b.avg < 4.30 && b.alerts > 0);
      if (criticalBranches.length > 0) {
        const names = criticalBranches.map(b => `${b.nombre} (${b.avg.toFixed(2)}★, ${b.alerts} quejas)`).join(', ');
        deficits.push(`<strong>Sucursales críticas (menor a 4.30★ con quejas):</strong> ${names}. Se requiere atención de supervisores locales.`);
      }

      // Quejas sin contestar (unreplied quejas críticas)
      const unansweredCriticalNegatives = brandReviews.filter(r => r.stars <= 2 && (!r.responseText || r.responseText.trim() === '')).length;
      if (unansweredCriticalNegatives > 0) {
        deficits.push(`<strong>Respuestas pendientes:</strong> Hay <strong>${unansweredCriticalNegatives}</strong> reseñas críticas (1-2★) sin responder en Google Reviews. Contestar de inmediato.`);
      }

      if (deficits.length === 0) {
        deficits.push(`<strong>Operación Nacional Estable:</strong> Todas las regiones cumplen con el promedio mínimo de ${KpiMeta.ratingMinimo.toFixed(2)}★ y no hay incidencias pendientes de respuesta.`);
      }

      // ── CONSTRUIR HTML DEL BRAND DASHBOARD ──
      const monthName = MONTH_NAMES[month - 1];
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      
      // Selector de mes
      const availableMonths = DataLoader.manifest[year] || [month];
      const sortedMonths = [...availableMonths].sort((a, b) => a - b);
      const monthOptions = sortedMonths.map(m => {
        const mName = MONTH_NAMES[m - 1];
        const mCap = mName.charAt(0).toUpperCase() + mName.slice(1);
        return `<option value="${m}" ${m === month ? 'selected' : ''}>${mCap} ${year}</option>`;
      }).join('');

      brandDashboardHtml = `
        <div class="brand-dash">
          <div class="brand-dash-header">
            <div>
              <span class="eyebrow" style="color:var(--oro); font-weight:700; letter-spacing:0.1em; text-transform:uppercase; font-size:11px;">Métricas de Marca</span>
              <h2 style="font-family:var(--giaza); font-size:32px; font-weight:400; color:var(--text); margin:4px 0 0 0;">étoile corporativo</h2>
            </div>
            <div class="brand-period-selector">
              <select class="srv-month-select" onchange="SelectRegionView.handleMonthSelect(this.value)">
                ${monthOptions}
              </select>
            </div>
          </div>

          <!-- KPI Grid -->
          <div class="brand-kpi-grid">
            <div class="brand-kpi-card">
              <span class="brand-kpi-label">Rating Global</span>
              <span class="brand-kpi-val num gold">${avgRating ? avgRating.toFixed(2) : '—'}★</span>
              <span class="brand-kpi-sub" style="color:${ratingDelta >= 0 ? 'var(--ok)' : 'var(--alerta)'}">${ratingDeltaStr}</span>
            </div>
            <div class="brand-kpi-card">
              <span class="brand-kpi-label">Volumen Total</span>
              <span class="brand-kpi-val num">${totalReviews.toLocaleString('es-MX')}</span>
              <span class="brand-kpi-sub">opiniones en ${capitalizedMonth}</span>
            </div>
            <div class="brand-kpi-card">
              <span class="brand-kpi-label">Alertas Activas</span>
              <span class="brand-kpi-val num ${activeAlerts > 0 ? 'red' : 'green'}">${activeAlerts}</span>
              <span class="brand-kpi-sub" style="color:${alertsDelta <= 0 ? 'var(--ok)' : 'var(--alerta)'}">${alertsDeltaStr}</span>
            </div>
            <div class="brand-kpi-card">
              <span class="brand-kpi-label">Mejor Región</span>
              <span class="brand-kpi-val green" style="font-size:24px; font-weight:700; padding:10px 0;">
                ${Object.values(regionStats).length ? Object.values(regionStats).sort((a,b) => b.avgRating - a.avgRating)[0].name : '—'}
              </span>
              <span class="brand-kpi-sub">Por promedio mensual</span>
            </div>
          </div>

          <!-- Deficits & Actions -->
          <div class="brand-deficits-alert">
            <div class="brand-deficits-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Acciones Inmediatas & Diagnóstico
            </div>
            <ul class="brand-deficits-list">
              ${deficits.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>

          <!-- Region Performance Table -->
          <div class="brand-region-performance">
            <div class="brand-region-perf-title">Rendimiento por Región (${capitalizedMonth})</div>
            <table class="brand-region-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Región</th>
                  <th>Sucursales</th>
                  <th>Volumen</th>
                  <th>Rating Promedio</th>
                  <th>Alertas</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(regionStats).map(([id, stats]) => {
                  const rat = stats.avgRating;
                  const rClass = rat >= 4.60 ? 'green' : rat >= 4.40 ? 'yellow' : rat > 0 ? 'red' : '';
                  const displayRat = rat > 0 ? `${rat.toFixed(2)}★` : '—';
                  const deltaStr = stats.reviewCount > 0 && stats.delta !== 0
                    ? `<span style="font-size:10px; color:${stats.delta >= 0 ? 'var(--ok)' : 'var(--alerta)'}; margin-left:6px;">(${stats.delta >= 0 ? '+' : ''}${stats.delta.toFixed(2)})</span>`
                    : '';
                  return `
                    <tr>
                      <td><span class="brand-region-badge">${id}</span></td>
                      <td><strong>${stats.name}</strong></td>
                      <td class="num">${stats.branchCount}</td>
                      <td class="num">${stats.reviewCount}</td>
                      <td>
                        <span class="brand-region-rating-num ${rClass}">${displayRat}</span>
                        ${deltaStr}
                      </td>
                      <td class="num ${stats.alerts > 0 ? 'red' : 'green'}" style="font-weight:700;">${stats.alerts}</td>
                      <td>
                        <button class="brand-region-btn" onclick="SelectRegionView.handleSelect('${id}')">Explorar</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Splits Highlights & Red Flags -->
          <div class="brand-highlights-split">
            <!-- Highlights -->
            <div class="brand-split-col">
              <span class="brand-split-title">Líderes de la Marca</span>
              ${highlights.map(h => `
                <div class="brand-branch-item">
                  <div class="brand-branch-info">
                    <span class="brand-branch-name">${h.nombre}</span>
                    <span class="brand-branch-region">${getRegionName(h.region)}</span>
                  </div>
                  <div class="brand-branch-stat">
                    <span class="brand-branch-rating">${h.avg.toFixed(2)}★</span>
                    <span class="brand-branch-reviews">${h.count} reseñas</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Red Flags -->
            <div class="brand-split-col">
              <span class="brand-split-title">Prioridad de Atención</span>
              ${redFlags.length ? redFlags.map(rf => `
                <div class="brand-branch-item" style="border-left: 3px solid var(--alerta);">
                  <div class="brand-branch-info">
                    <span class="brand-branch-name">${rf.nombre}</span>
                    <span class="brand-branch-region">${getRegionName(rf.region)}</span>
                  </div>
                  <div class="brand-branch-stat">
                    <span class="brand-branch-rating" style="color:var(--alerta);">${rf.avg.toFixed(2)}★</span>
                    <span class="brand-branch-reviews" style="color:var(--alerta); font-weight:600;">${rf.alerts} quejas</span>
                  </div>
                </div>
              `).join('') : `
                <div class="brand-branch-item">
                  <div class="brand-branch-info">
                    <span class="brand-branch-name" style="font-weight:normal; font-style:italic; color:var(--text-muted);">Sin sucursales críticas</span>
                  </div>
                </div>
              `}
            </div>
          </div>
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
            <span class="eyebrow" style="color:rgba(245, 239, 230, 0.9); font-weight:700; background:rgba(61,90,71,0.45); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); padding:6px 16px; border-radius:20px; border:1px solid rgba(122,158,138,0.25); letter-spacing:0.08em;">Navegación Regional</span>
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
