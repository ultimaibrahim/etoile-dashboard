/**
 * views/brand.js — Vista de Detalle Corporativo y Análisis de Marca para Directores.
 */

const BrandView = {
  activeModalReviews: [],
  activeModalTitle: '',
  activeModalBranchId: null,

  async render() {
    const app = document.getElementById('app');
    if (!app) return;

    // 1. Seguridad: solo roles de alta dirección (admin, director, regional) pueden acceder
    if (!AppAuth.isAuthenticated()) {
      Router.navigate('#/login');
      return;
    }
    const role = AppAuth.getUserRole();
    if (!['admin', 'director', 'regional'].includes(role)) {
      Router.navigate('#/select-region');
      return;
    }

    // Inyectar estilos específicos para el dashboard corporativo interactivo
    this.injectStyles();

    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;

    // Cargar datos nacionales del mes actual
    const brandReviews = await DataLoader.loadBrandData(year, month);

    // Cargar datos nacionales del mes anterior para comparaciones
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevBrandReviews = await DataLoader.loadBrandData(prevYear, prevMonth);

    // ── 2. CÁLCULO DE KPIs DE MARCA ──
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

    // ── 3. CÁLCULO DE MÉTRICAS REGIONALES CON FÓRMULA DE COMPLEJIDAD OPERATIVA ──
    // Un 4.89 con 11 sucursales tiene mayor peso/dificultad que un 4.89 con 1 sucursal.
    // Fórmula de rendimiento ajustado por complejidad:
    // Score = Promedio * (1 + (Sucursales * 0.02) + (log10(Reseñas + 1) * 0.01))
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

      // Aplicar factor de complejidad operativa
      const branchCount = regionBranches.length;
      const complexityFactor = branchCount > 0 ? (branchCount * 0.018) + (Math.log10(count + 1) * 0.008) : 0;
      const adjustedScore = avg * (1 + complexityFactor);

      regionStats[id] = {
        name,
        branchCount,
        reviewCount: count,
        avgRating: avg,
        delta,
        alerts,
        complexityPercent: (complexityFactor * 100).toFixed(1),
        adjustedScore: avg > 0 ? adjustedScore : 0
      };
    }

    // Ordenar regiones por Rendimiento Ponderado (Ajustado) para encontrar la mejor región
    const rankedRegions = Object.entries(regionStats)
      .filter(([id, stats]) => stats.reviewCount > 0)
      .sort((a, b) => b[1].adjustedScore - a[1].adjustedScore);

    const bestRegionName = rankedRegions.length ? rankedRegions[0][1].name : '—';
    const bestRegionScore = rankedRegions.length ? `${rankedRegions[0][1].adjustedScore.toFixed(2)} pts` : '—';

    // ── 4. RENDIMIENTO DE SUCURSALES (LÍDERES Y FOCOS ROJOS) ──
    const branchStats = [];
    for (const s of SUCURSALES_META_ALL) {
      const bReviews = brandReviews.filter(r => r.sucursal === s.id);
      const count = bReviews.length;
      const avg = count ? bReviews.reduce((sum, r) => sum + r.stars, 0) / count : 0;
      const alerts = bReviews.filter(r => r.stars <= 2).length;

      if (count > 0) {
        // Puntuación de sucursal individual ponderando su volumen
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

    const highlights = [...branchStats]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const redFlags = [...branchStats]
      .filter(b => b.avg < KpiMeta.ratingMinimo)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3);

    // ── 5. ALERTAS OPERATIVAS Y DÉFICITS ──
    const deficits = [];
    const regionsBelowTarget = Object.entries(regionStats)
      .filter(([id, stats]) => stats.reviewCount > 0 && stats.avgRating < KpiMeta.ratingMinimo);
    if (regionsBelowTarget.length > 0) {
      const names = regionsBelowTarget.map(([id, stats]) => `${stats.name} (${stats.avgRating.toFixed(2)}★)`).join(', ');
      deficits.push(`<strong>Regiones bajo meta (menor a ${KpiMeta.ratingMinimo.toFixed(2)}★):</strong> ${names}.`);
    }

    const criticalBranches = branchStats.filter(b => b.avg < 4.30 && b.alerts > 0);
    if (criticalBranches.length > 0) {
      const names = criticalBranches.map(b => `
        <span class="brand-clickable-def" onclick="BrandView.openBranchModal('${b.id}')">${b.nombre} (${b.avg.toFixed(2)}★)</span>
      `).join(', ');
      deficits.push(`<strong>Sucursales críticas (menor a 4.30★ con quejas):</strong> ${names}. Haz clic en su nombre para ver los detalles.`);
    }

    const unansweredCriticalNegatives = brandReviews.filter(r => r.stars <= 2 && (!r.responseText || r.responseText.trim() === '')).length;
    if (unansweredCriticalNegatives > 0) {
      deficits.push(`<strong>Respuestas pendientes:</strong> Hay <span class="brand-clickable-def" onclick="BrandView.openAlertsModal(true)">${unansweredCriticalNegatives} reseñas críticas (1-2★) sin responder</span> en Google Reviews. Haz clic para revisarlas.`);
    }

    if (deficits.length === 0) {
      deficits.push(`<strong>Operación Nacional Estable:</strong> Todas las regiones cumplen con el promedio mínimo de ${KpiMeta.ratingMinimo.toFixed(2)}★ y no hay incidencias pendientes de respuesta.`);
    }

    // ── 6. CONSTRUCCIÓN DE LA INTERFAZ HTML ──
    const monthName = MONTH_NAMES[month - 1];
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const availableMonths = DataLoader.manifest[year] || [month];
    const sortedMonths = [...availableMonths].sort((a, b) => a - b);
    const monthOptions = sortedMonths.map(m => {
      const mName = MONTH_NAMES[m - 1];
      const mCap = mName.charAt(0).toUpperCase() + mName.slice(1);
      return `<option value="${m}" ${m === month ? 'selected' : ''}>${mCap} ${year}</option>`;
    }).join('');

    app.innerHTML = `
      <div class="brand-wrapper">
        <div class="brand-container">
          
          <!-- Botón de regreso y encabezado -->
          <div class="brand-header-actions">
            <button class="brand-back-btn" onclick="Router.navigate('#/select-region')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12,19 5,12 12,5"></polyline></svg>
              <span>Volver a Regiones</span>
            </button>
            <div class="brand-period-selector">
              <select class="brand-month-select" onchange="BrandView.handleMonthSelect(this.value)">
                ${monthOptions}
              </select>
            </div>
          </div>

          <div class="brand-title-section">
            <span class="brand-eyebrow">Consolidado Corporativo Nacional</span>
            <h1 class="brand-main-title">Análisis de Marca étoile</h1>
            <p class="brand-subtitle">Control de calidad operativa, volumen y auditoría de reputación nacional.</p>
          </div>

          <!-- KPI Grid (Con interacción) -->
          <div class="brand-kpi-grid">
            <div class="brand-kpi-card">
              <span class="brand-kpi-label">Rating Global</span>
              <span class="brand-kpi-val num gold">${avgRating ? avgRating.toFixed(2) : '—'}★</span>
              <span class="brand-kpi-sub" style="color:${ratingDelta >= 0 ? 'var(--ok)' : 'var(--alerta)'}">${ratingDeltaStr}</span>
            </div>
            
            <div class="brand-kpi-card brand-interactive-card" onclick="BrandView.openAlertsModal(false)" title="Hacer clic para explorar opiniones">
              <span class="brand-kpi-label">Volumen Total</span>
              <span class="brand-kpi-val num">${totalReviews.toLocaleString('es-MX')}</span>
              <span class="brand-kpi-sub">opiniones en ${capitalizedMonth} (clic para ver)</span>
            </div>
            
            <div class="brand-kpi-card brand-interactive-card alert-card" onclick="BrandView.openAlertsModal(true)" title="Hacer clic para auditar alertas críticas">
              <span class="brand-kpi-label">Alertas Activas</span>
              <span class="brand-kpi-val num ${activeAlerts > 0 ? 'red' : 'green'}">${activeAlerts}</span>
              <span class="brand-kpi-sub" style="color:${alertsDelta <= 0 ? 'var(--ok)' : 'var(--alerta)'}">${alertsDeltaStr} (clic para auditar)</span>
            </div>
            
            <div class="brand-kpi-card">
              <span class="brand-kpi-label">Mejor Región Ponderada</span>
              <span class="brand-kpi-val green" style="font-size:24px; font-weight:700; padding:10px 0;">${bestRegionName}</span>
              <span class="brand-kpi-sub">Score: ${bestRegionScore} (por complejidad)</span>
            </div>
          </div>

          <!-- Acciones de Operación y Diagnóstico -->
          <div class="brand-deficits-alert">
            <div class="brand-deficits-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Acciones Operativas & Diagnóstico Crítico
            </div>
            <ul class="brand-deficits-list">
              ${deficits.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>

          <!-- Tabla de rendimiento con Puntuación de Complejidad Operativa -->
          <div class="brand-region-performance">
            <div class="brand-region-perf-header">
              <div class="brand-region-perf-title">Análisis Operativo por Región (${capitalizedMonth})</div>
              <div class="brand-info-badge" title="La calificación pondera el rating bruto junto al número de sucursales (+1.8% por sucursal) y volumen de reseñas (+0.8% por logaritmo de volumen), premiando la dificultad operacional.">
                ¿Cómo se calcula el Score de Complejidad?
              </div>
            </div>
            <table class="brand-region-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Región</th>
                  <th style="text-align:center;">Sucursales</th>
                  <th style="text-align:center;">Reseñas</th>
                  <th>Rating Bruto</th>
                  <th>Bonus Complejidad</th>
                  <th>Score Ponderado</th>
                  <th style="text-align:center;">Alertas</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(regionStats).map(([id, stats]) => {
                  const scoreVal = stats.adjustedScore;
                  const scoreClass = scoreVal >= 5.0 ? 'gold-score' : scoreVal >= 4.60 ? 'green-score' : scoreVal > 0 ? 'red-score' : '';
                  const displayScore = scoreVal > 0 ? `${scoreVal.toFixed(2)} pts` : '—';
                  const rawRat = stats.avgRating;
                  const deltaStr = stats.reviewCount > 0 && stats.delta !== 0
                    ? `<span style="font-size:10px; color:${stats.delta >= 0 ? 'var(--ok)' : 'var(--alerta)'}; margin-left:4px;">(${stats.delta >= 0 ? '+' : ''}${stats.delta.toFixed(2)})</span>`
                    : '';
                  return `
                    <tr class="brand-row-interactive" onclick="BrandView.openRegionModal('${id}')" title="Clic para auditar opiniones de esta región">
                      <td><span class="brand-region-badge">${id}</span></td>
                      <td><strong>${stats.name}</strong></td>
                      <td class="num text-center">${stats.branchCount}</td>
                      <td class="num text-center">${stats.reviewCount}</td>
                      <td>
                        <strong>${rawRat > 0 ? rawRat.toFixed(2) + '★' : '—'}</strong>
                        ${deltaStr}
                      </td>
                      <td class="num text-green">+${stats.complexityPercent}%</td>
                      <td>
                        <span class="brand-region-score-num ${scoreClass}">${displayScore}</span>
                      </td>
                      <td class="num text-center ${stats.alerts > 0 ? 'red' : 'green'}" style="font-weight:700;">${stats.alerts}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Desglose de Líderes y Focos Rojos con Clicks -->
          <div class="brand-highlights-split">
            
            <!-- Líderes -->
            <div class="brand-split-col">
              <span class="brand-split-title">Líderes Nacionales</span>
              ${highlights.length ? highlights.map((h, idx) => `
                <div class="brand-branch-item brand-item-interactive" onclick="BrandView.openBranchModal('${h.id}')" title="Clic para ver opiniones de ${h.nombre}">
                  <div class="brand-branch-info">
                    <span class="brand-branch-name">${idx + 1}. ${h.nombre}</span>
                    <span class="brand-branch-region">${getRegionName(h.region)}</span>
                  </div>
                  <div class="brand-branch-stat">
                    <span class="brand-branch-rating">${h.avg.toFixed(2)}★</span>
                    <span class="brand-branch-reviews">${h.count} reseñas</span>
                  </div>
                </div>
              `).join('') : `
                <div class="brand-branch-item">
                  <div class="brand-branch-info">
                    <span class="brand-branch-name" style="font-weight:normal; font-style:italic; color:var(--text-muted);">Sin datos suficientes</span>
                  </div>
                </div>
              `}
            </div>

            <!-- Focos Rojos -->
            <div class="brand-split-col">
              <span class="brand-split-title">Prioridad de Atención (Críticas)</span>
              ${redFlags.length ? redFlags.map(rf => `
                <div class="brand-branch-item brand-item-interactive alert-border" onclick="BrandView.openBranchModal('${rf.id}')" title="Clic para auditar quejas de ${rf.nombre}">
                  <div class="brand-branch-info">
                    <span class="brand-branch-name">${rf.nombre}</span>
                    <span class="brand-branch-region">${getRegionName(rf.region)}</span>
                  </div>
                  <div class="brand-branch-stat">
                    <span class="brand-branch-rating" style="color:var(--alerta);">${rf.avg.toFixed(2)}★</span>
                    <span class="brand-branch-reviews" style="color:var(--alerta); font-weight:700;">${rf.alerts} quejas</span>
                  </div>
                </div>
              `).join('') : `
                <div class="brand-branch-item">
                  <div class="brand-branch-info">
                    <span class="brand-branch-name" style="font-weight:normal; font-style:italic; color:var(--text-muted);">Sin focos rojos activos</span>
                  </div>
                </div>
              `}
            </div>

          </div>
        </div>
      </div>
    `;
  },

  // ── 7. INTERACCIONES: MODAL DE ANÁLISIS DE RESEÑAS ──
  async openBranchModal(branchId) {
    const meta = SUCURSALES_META_ALL.find(s => s.id === branchId);
    const branchName = meta ? meta.nombre : branchId;
    
    // Cargar opiniones de la sucursal actual
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const brandReviews = await DataLoader.loadBrandData(year, month);
    const branchReviews = brandReviews.filter(r => r.sucursal === branchId);

    this.activeModalReviews = branchReviews;
    this.activeModalTitle = `Opiniones de ${branchName}`;
    this.activeModalBranchId = branchId;
    this.renderModal('all');
  },

  async openRegionModal(regionCode) {
    const regionName = getRegionName(regionCode);
    
    // Cargar opiniones de la región
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const brandReviews = await DataLoader.loadBrandData(year, month);
    const regionReviews = brandReviews.filter(r => r.region === regionCode);

    this.activeModalReviews = regionReviews;
    this.activeModalTitle = `Opiniones en Región: ${regionName}`;
    this.activeModalBranchId = null; // No corresponde a una sucursal única
    this.renderModal('all');
  },

  async openAlertsModal(onlyUnreplied = false) {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const brandReviews = await DataLoader.loadBrandData(year, month);
    
    // Filtrar reseñas de 1 y 2 estrellas
    let alertReviews = brandReviews.filter(r => r.stars <= 2);
    
    if (onlyUnreplied) {
      alertReviews = alertReviews.filter(r => !r.responseText || r.responseText.trim() === '');
      this.activeModalTitle = `Auditoría: Quejas Críticas sin Responder (Nacional)`;
    } else {
      this.activeModalTitle = `Auditoría: Quejas Críticas de 1-2★ (Nacional)`;
    }

    this.activeModalReviews = alertReviews;
    this.activeModalBranchId = null;
    this.renderModal('all');
  },

  renderModal(tab = 'all') {
    // Eliminar modal previo si existe
    this.closeModal();

    let filtered = [...this.activeModalReviews];
    if (tab === 'alerts') {
      filtered = filtered.filter(r => r.stars <= 2);
    } else if (tab === 'positives') {
      filtered = filtered.filter(r => r.stars >= 4);
    }

    const reviewCardsHtml = filtered.length ? filtered.map(r => {
      const isCritical = r.stars <= 2;
      const cardClass = isCritical ? 'modal-rev-card critical' : 'modal-rev-card';
      const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      const isReplied = r.responseText && r.responseText.trim() !== '';
      const replyStatusHtml = isReplied
        ? `<span class="reply-badge green">Respondido</span>`
        : `<span class="reply-badge red">Sin Respuesta</span>`;
      
      const localGuideHtml = r.isLocalGuide
        ? `<span class="guide-badge">Local Guide</span>`
        : '';

      const branchMeta = SUCURSALES_META_ALL.find(s => s.id === r.sucursal);
      const branchDisplay = branchMeta ? branchMeta.nombre : r.sucursal;

      const replyBoxHtml = isReplied
        ? `<div class="modal-rev-reply"><strong>Respuesta del Propietario:</strong> "${r.responseText}"</div>`
        : '';

      const dateStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Reciente';

      return `
        <div class="${cardClass}">
          <div class="modal-rev-top">
            <div>
              <span class="modal-rev-branch">${branchDisplay}</span>
              <span class="modal-rev-stars">${starsHtml}</span>
            </div>
            <div>
              ${localGuideHtml}
              ${replyStatusHtml}
              <span class="modal-rev-date">${dateStr}</span>
            </div>
          </div>
          <div class="modal-rev-text">"${r.text || 'Sin comentario escrito.'}"</div>
          ${replyBoxHtml}
        </div>
      `;
    }).join('') : `<div style="text-align:center; padding:40px; color:var(--text-dim); font-style:italic;">No se encontraron reseñas en esta categoría.</div>`;

    const shortcutHtml = this.activeModalBranchId
      ? `<button class="modal-shortcut-btn" onclick="BrandView.navigateToBranch('${this.activeModalBranchId}')">Ver Scorecard Completo</button>`
      : '';

    const modalHtml = `
      <div class="brand-modal-overlay" id="brandDetailModal" onclick="if(event.target === this) BrandView.closeModal()">
        <div class="brand-modal-box">
          <div class="brand-modal-header">
            <h2 class="brand-modal-title">${this.activeModalTitle}</h2>
            <button class="brand-modal-close" onclick="BrandView.closeModal()">×</button>
          </div>
          
          <div class="brand-modal-tabs">
            <button class="brand-tab-btn ${tab === 'all' ? 'active' : ''}" onclick="BrandView.renderModal('all')">Todas (${this.activeModalReviews.length})</button>
            <button class="brand-tab-btn ${tab === 'alerts' ? 'active' : ''}" onclick="BrandView.renderModal('alerts')">Quejas 1-2★ (${this.activeModalReviews.filter(r => r.stars <= 2).length})</button>
            <button class="brand-tab-btn ${tab === 'positives' ? 'active' : ''}" onclick="BrandView.renderModal('positives')">Positivas 4-5★ (${this.activeModalReviews.filter(r => r.stars >= 4).length})</button>
          </div>

          <div class="brand-modal-body">
            <div class="brand-modal-reviews-list">
              ${reviewCardsHtml}
            </div>
          </div>

          <div class="brand-modal-footer">
            ${shortcutHtml}
            <button class="brand-modal-close-btn" onclick="BrandView.closeModal()">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden'; // Bloquear scroll de fondo
  },

  closeModal() {
    const el = document.getElementById('brandDetailModal');
    if (el) {
      el.remove();
    }
    document.body.style.overflow = ''; // Restaurar scroll
  },

  navigateToBranch(branchId) {
    this.closeModal();
    Router.navigate(`#/sucursal/${branchId}`);
  },

  handleMonthSelect(monthVal) {
    const month = parseInt(monthVal);
    const currYear = DataLoader.currentYear;
    DataLoader.setMonth(currYear, month);
    this.render();
  },

  injectStyles() {
    if (document.getElementById('brand-dashboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'brand-dashboard-styles';
    style.textContent = `
      .brand-wrapper {
        min-height: 100vh;
        background: linear-gradient(135deg, var(--verde-deep) 0%, var(--bg) 100%);
        padding: 40px 20px;
        box-sizing: border-box;
        overflow-y: auto;
      }
      .brand-container {
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 32px;
        animation: brandEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes brandEntrance {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .brand-header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }
      .brand-back-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: var(--text);
        padding: 10px 18px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .brand-back-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateX(-3px);
      }
      .brand-month-select {
        background: rgba(30, 48, 38, 0.7);
        border: 1px solid rgba(122, 158, 138, 0.3);
        color: var(--text);
        padding: 10px 16px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        backdrop-filter: blur(8px);
      }
      .brand-title-section {
        margin-top: 10px;
      }
      .brand-eyebrow {
        color: var(--oro);
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-size: 11px;
      }
      .brand-main-title {
        font-family: var(--giaza);
        font-size: 42px;
        font-weight: 400;
        color: var(--text);
        margin: 6px 0 2px 0;
      }
      .brand-subtitle {
        color: var(--text-dim);
        font-size: 14px;
        margin: 0;
      }

      /* KPI Cards */
      .brand-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
      }
      .brand-kpi-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 140px;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      .brand-interactive-card {
        cursor: pointer;
      }
      .brand-interactive-card:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.18);
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
      }
      .brand-kpi-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-dim);
      }
      .brand-kpi-val {
        font-size: 38px;
        font-weight: 300;
        margin: 12px 0;
        line-height: 1.1;
      }
      .brand-kpi-val.num {
        font-family: var(--mono);
      }
      .brand-kpi-val.gold { color: var(--oro); }
      .brand-kpi-val.red { color: var(--alerta); }
      .brand-kpi-val.green { color: var(--verde); }
      .brand-kpi-sub {
        font-size: 11px;
        color: var(--text-dim);
      }

      /* Alert/Deficit Panel */
      .brand-deficits-alert {
        background: rgba(235, 94, 85, 0.08);
        border: 1px solid rgba(235, 94, 85, 0.18);
        border-radius: 20px;
        padding: 20px;
        box-sizing: border-box;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      .brand-deficits-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--alerta);
        font-weight: 700;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 12px;
      }
      .brand-deficits-list {
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        line-height: 1.6;
        color: var(--text);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .brand-clickable-def {
        color: var(--oro);
        text-decoration: underline;
        cursor: pointer;
        font-weight: 600;
      }
      .brand-clickable-def:hover {
        color: var(--text);
      }

      /* Performance Table */
      .brand-region-performance {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 24px;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }
      .brand-region-perf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 18px;
      }
      .brand-region-perf-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--text);
      }
      .brand-info-badge {
        font-size: 11px;
        color: var(--oro);
        background: rgba(212,175,55,0.08);
        border: 1px solid rgba(212,175,55,0.2);
        padding: 6px 12px;
        border-radius: 12px;
        cursor: help;
        font-weight: 600;
      }
      .brand-region-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .brand-region-table th {
        text-align: left;
        padding: 12px 16px;
        color: var(--text-dim);
        font-weight: 600;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.04em;
      }
      .brand-region-table td {
        padding: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        color: var(--text);
      }
      .brand-row-interactive {
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .brand-row-interactive:hover {
        background: rgba(255, 255, 255, 0.04);
      }
      .brand-region-badge {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 3px 8px;
        border-radius: 8px;
        font-family: var(--mono);
        font-weight: 600;
        font-size: 10px;
      }
      .num { font-family: var(--mono); }
      .text-center { text-align: center; }
      .text-green { color: var(--verde); font-weight: 600; }
      .brand-region-rating-num {
        font-weight: 700;
        font-family: var(--mono);
      }
      .brand-region-rating-num.green { color: var(--verde); }
      .brand-region-rating-num.yellow { color: var(--oro); }
      .brand-region-rating-num.red { color: var(--alerta); }
      
      .brand-region-score-num {
        font-family: var(--mono);
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
      }
      .brand-region-score-num.gold-score {
        background: rgba(212,175,55,0.15);
        color: var(--oro);
        border: 1px solid rgba(212,175,55,0.3);
      }
      .brand-region-score-num.green-score {
        background: rgba(76,201,240,0.1);
        color: var(--verde);
        border: 1px solid rgba(76,201,240,0.25);
      }
      .brand-region-score-num.red-score {
        background: rgba(235,94,85,0.1);
        color: var(--alerta);
        border: 1px solid rgba(235,94,85,0.2);
      }

      /* Branch Splits */
      .brand-highlights-split {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
      }
      .brand-split-col {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 24px;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .brand-split-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-dim);
        border-bottom: 1px solid rgba(255,255,255,0.06);
        padding-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .brand-branch-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
      }
      .brand-item-interactive {
        cursor: pointer;
      }
      .brand-item-interactive:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.12);
        transform: translateY(-2px);
      }
      .brand-branch-item.alert-border {
        border-left: 4px solid var(--alerta);
      }
      .brand-branch-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .brand-branch-name {
        font-weight: 700;
        color: var(--text);
        font-size: 14px;
      }
      .brand-branch-region {
        font-size: 11px;
        color: var(--text-dim);
      }
      .brand-branch-stat {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      .brand-branch-rating {
        font-family: var(--mono);
        font-weight: 700;
        color: var(--verde);
        font-size: 14px;
      }
      .brand-branch-reviews {
        font-size: 11px;
        color: var(--text-dim);
      }

      /* Premium Interactive Modal */
      .brand-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(10, 20, 15, 0.6);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
        box-sizing: border-box;
        animation: modalFadeIn 0.3s ease forwards;
      }
      .brand-modal-box {
        background: rgba(25, 38, 30, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        width: 100%;
        max-width: 760px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        animation: modalScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalScaleUp {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .brand-modal-header {
        padding: 24px 24px 16px 24px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .brand-modal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--text);
      }
      .brand-modal-close {
        background: none;
        border: none;
        color: var(--text-dim);
        font-size: 24px;
        cursor: pointer;
        transition: color 0.2s ease;
      }
      .brand-modal-close:hover {
        color: var(--text);
      }
      .brand-modal-tabs {
        display: flex;
        gap: 8px;
        padding: 12px 24px;
        background: rgba(255,255,255,0.02);
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .brand-tab-btn {
        background: none;
        border: 1px solid transparent;
        color: var(--text-dim);
        padding: 6px 12px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .brand-tab-btn:hover {
        color: var(--text);
        background: rgba(255,255,255,0.04);
      }
      .brand-tab-btn.active {
        background: rgba(255,255,255,0.08);
        border-color: rgba(255,255,255,0.12);
        color: var(--text);
      }
      .brand-modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }
      .brand-modal-reviews-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      /* Review Item inside modal */
      .modal-rev-card {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 16px;
        padding: 16px;
        box-sizing: border-box;
      }
      .modal-rev-card.critical {
        border-left: 4px solid var(--alerta);
        background: rgba(235,94,85,0.03);
      }
      .modal-rev-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      .modal-rev-branch {
        font-weight: 700;
        font-size: 13px;
        color: var(--text);
        text-transform: uppercase;
        margin-right: 8px;
      }
      .modal-rev-stars {
        color: var(--oro);
        font-size: 12px;
        letter-spacing: 1px;
      }
      .modal-rev-date {
        font-size: 11px;
        font-family: var(--mono);
        color: var(--text-dim);
      }
      .modal-rev-text {
        font-size: 13px;
        color: var(--text);
        line-height: 1.5;
        font-style: italic;
      }
      .modal-rev-reply {
        background: rgba(255,255,255,0.04);
        border-radius: 10px;
        padding: 10px 14px;
        margin-top: 12px;
        font-size: 12px;
        color: var(--text-dim);
        line-height: 1.4;
      }
      .reply-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        margin-right: 6px;
      }
      .reply-badge.green {
        background: rgba(76,201,240,0.12);
        color: var(--verde);
      }
      .reply-badge.red {
        background: rgba(235,94,85,0.12);
        color: var(--alerta);
      }
      .guide-badge {
        font-size: 10px;
        font-weight: 700;
        background: rgba(255,255,255,0.08);
        color: var(--text);
        padding: 2px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        margin-right: 6px;
      }

      .brand-modal-footer {
        padding: 16px 24px;
        border-top: 1px solid rgba(255,255,255,0.06);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .brand-modal-close-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: var(--text);
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .brand-modal-close-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      .modal-shortcut-btn {
        background: var(--verde);
        border: 1px solid var(--verde);
        color: #fff;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .modal-shortcut-btn:hover {
        filter: brightness(1.15);
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
  }
};
