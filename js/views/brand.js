/**
 * views/brand.js — Vista de Detalle Corporativo y Análisis de Marca para Directores.
 */

const BrandView = {
  activeTab: 'resumen', // 'resumen', 'comparativa', 'alertas'
  activeModalReviews: [],
  activeModalTitle: '',
  activeModalBranchId: null,
  activeDeficitBranchId: null,

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

    // Reset tab to 'resumen' if entering from another page
    if (Router.current !== '#/brand') {
      this.activeTab = 'resumen';
    }

    // Render skeleton immediately during data fetching
    this.renderSkeleton();

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

    // Ordenar regiones por Rendimiento Ponderado (Ajustado)
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

    // ── 5. CÁLCULO DE ALERTAS OPERATIVAS Y DÉFICITS ──
    const criticalBranchesCount = branchStats.filter(b => b.avg < 4.30 && b.alerts > 0).length;
    const unansweredCriticalNegatives = brandReviews.filter(r => r.stars <= 2 && (!r.responseText || r.responseText.trim() === '')).length;
    const monthName = MONTH_NAMES[month - 1];
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const availableMonths = DataLoader.manifest[year] || [month];
    const sortedMonths = [...availableMonths].sort((a, b) => a - b);
    
    // Custom select dropdown HTML
    const customOptionsHtml = sortedMonths.map(m => {
      const mName = MONTH_NAMES[m - 1];
      const mCap = mName.charAt(0).toUpperCase() + mName.slice(1);
      const isActive = m === month ? ' active' : '';
      return `<div class="custom-option${isActive}" data-value="${m}" onclick="BrandView.selectMonthOption(${m})">${mCap} ${year}</div>`;
    }).join('');

    const dropdownHtml = `
      <div class="brand-month-select-container">
        <div class="custom-select" id="brandMonthDropdown">
          <button class="custom-select-trigger" onclick="BrandView.toggleMonthDropdown(event)">
            <span class="custom-select-value">${capitalizedMonth} ${year}</span>
            <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="custom-select-options">
            ${customOptionsHtml}
          </div>
        </div>
      </div>
    `;

    // ── 6. RENDER SUB-DASHBOARD CONTENIDO BASADO EN LA PESTAÑA ACTIVA ──
    let tabContentHtml = '';

    if (this.activeTab === 'resumen') {
      tabContentHtml = `
        <!-- KPI Grid (Con interacción) -->
        <div class="brand-kpi-grid">
          <div class="brand-kpi-card">
            <span class="brand-kpi-label">Rating Global</span>
            <span class="brand-kpi-val num gold">${avgRating ? avgRating.toFixed(2) : '—'}★</span>
            <span class="brand-kpi-sub" style="color:${ratingDelta >= 0 ? 'var(--ok)' : 'var(--alerta)'}">${ratingDeltaStr}</span>
          </div>
          
          <div class="brand-kpi-card brand-interactive-card" onclick="BrandView.openAllReviewsModal()" title="Hacer clic para explorar opiniones">
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

        <!-- Acciones de Operación y Diagnóstico (Con botón interactivo) -->
        <div class="brand-deficits-alert">
          <div class="brand-deficits-title-row">
            <div class="brand-deficits-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Acciones Operativas & Diagnóstico Crítico
            </div>
            <button class="brand-audit-btn" onclick="BrandView.openDeficitsAuditModal()">
              Auditar Sucursales con Alertas
            </button>
          </div>
          <div class="brand-deficits-summary">
            Hay <strong>${criticalBranchesCount}</strong> sucursal${criticalBranchesCount !== 1 ? 'es' : ''} en estado crítico y <strong>${unansweredCriticalNegatives}</strong> queja${unansweredCriticalNegatives !== 1 ? 's' : ''} crítica${unansweredCriticalNegatives !== 1 ? 's' : ''} sin responder. Haz clic en el botón para auditar las sucursales y ver el detalle de por qué están en este estado.
          </div>
        </div>

        <!-- Tabla de rendimiento con Puntuación de Complejidad Operativa -->
        <div class="brand-region-performance">
          <div class="brand-region-perf-header">
            <div class="brand-region-perf-title">Análisis Operativo por Región (${capitalizedMonth})</div>
            <div class="brand-info-badge" onclick="BrandView.openComplexityExplanatoryModal()" style="cursor: pointer;" title="Hacer clic para ver la explicación detallada">
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
                <th>Factor de Escala</th>
                <th>Rendimiento Ajustado</th>
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
              <div class="brand-branch-item brand-item-interactive" onclick="BrandView.openBranchSummaryModal('${h.id}')" title="Clic para ver diagnóstico de ${h.nombre}">
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
              <div class="brand-branch-item brand-item-interactive alert-border" onclick="BrandView.openBranchSummaryModal('${rf.id}')" title="Clic para ver diagnóstico de ${rf.nombre}">
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
      `;
    } else if (this.activeTab === 'comparativa') {
      tabContentHtml = `
        <div class="brand-charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 24px;">
          <div class="brand-chart-card" style="background: var(--surface-2); border: 1px solid var(--border); border-radius: 24px; padding: 24px; min-height: 380px; display: flex; flex-direction: column; box-shadow: var(--sombra-card);">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.04em;">Rendimiento Ajustado por Región</h3>
            <div style="flex: 1; position: relative; min-height: 280px;">
              <canvas id="brandComparisonChart"></canvas>
            </div>
          </div>
          <div class="brand-chart-card" style="background: var(--surface-2); border: 1px solid var(--border); border-radius: 24px; padding: 24px; min-height: 380px; display: flex; flex-direction: column; box-shadow: var(--sombra-card);">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.04em;">Participación de Volumen por Región</h3>
            <div style="flex: 1; position: relative; min-height: 280px;">
              <canvas id="brandVolumeChart"></canvas>
            </div>
          </div>
        </div>
      `;

      // Inicializar los gráficos interactivos en el DOM
      setTimeout(() => {
        const comparisonCtx = document.getElementById('brandComparisonChart');
        const volumeCtx = document.getElementById('brandVolumeChart');
        if (comparisonCtx && volumeCtx) {
          const sortedRegionsList = Object.entries(regionStats)
            .filter(([_, stats]) => stats.reviewCount > 0)
            .sort((a, b) => b[1].adjustedScore - a[1].adjustedScore);
          
          const labels = sortedRegionsList.map(([_, stats]) => stats.name);
          const scores = sortedRegionsList.map(([_, stats]) => stats.adjustedScore);
          const volumes = sortedRegionsList.map(([_, stats]) => stats.reviewCount);
          
          const colors = sortedRegionsList.map((_, idx) => {
            return idx === 0 ? 'var(--oro)' : 'var(--verde-soft)';
          });

          const fontSans = premiumUi ? 'Plus Jakarta Sans, sans-serif' : 'Helvetica Neue, Helvetica, Arial, sans-serif';
          const fontMono = premiumUi ? 'JetBrains Mono, monospace' : 'ui-monospace, SF Mono, Menlo, monospace';
          
          const comparisonChart = new Chart(comparisonCtx, {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: 'Rendimiento Ajustado',
                data: scores,
                backgroundColor: colors,
                borderRadius: 8,
                maxBarThickness: 32
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: darkMode ? '#1C2220' : '#161614',
                  titleFont: { family: fontSans, size: 12, weight: '700' },
                  bodyFont: { family: fontSans, size: 11 },
                  padding: 10,
                  callbacks: {
                    label: c => ` Score: ${c.raw.toFixed(2)} pts`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                  ticks: {
                    font: { size: 10, family: fontMono },
                    color: darkMode ? '#8A9E94' : '#8A877C'
                  }
                },
                x: {
                  grid: { display: false },
                  ticks: {
                    font: { size: 11, family: fontSans },
                    color: darkMode ? '#9DA89F' : '#6B6960'
                  }
                }
              }
            }
          });
          Charts.instances.push(comparisonChart);

          const volumeColors = [
            '#2F4A3A',
            '#3D5A47',
            '#6B907D',
            '#B8902F',
            '#B23A2B',
            '#E8DCC7'
          ];
          
          const volumeChart = new Chart(volumeCtx, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [{
                data: volumes,
                backgroundColor: volumeColors.slice(0, labels.length),
                borderWidth: darkMode ? 2 : 1,
                borderColor: darkMode ? '#151725' : '#fff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '60%',
              plugins: {
                legend: {
                  display: true,
                  position: 'right',
                  labels: {
                    color: darkMode ? '#9DA89F' : '#6B6960',
                    font: { size: 11, family: fontSans },
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 14
                  }
                },
                tooltip: {
                  backgroundColor: darkMode ? '#1C2220' : '#161614',
                  titleFont: { family: fontSans, size: 12, weight: '700' },
                  bodyFont: { family: fontSans, size: 11 },
                  padding: 10,
                  callbacks: {
                    label: c => {
                      const total = c.dataset.data.reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? ((c.raw / total) * 100).toFixed(1) : 0;
                      return ` ${c.label}: ${c.raw} opiniones (${pct}%)`;
                    }
                  }
                }
              }
            }
          });
          Charts.instances.push(volumeChart);
        }
      }, 50);
    } else if (this.activeTab === 'alertas') {
      let serviceAlerts = 0;
      let qualityAlerts = 0;
      let valueAlerts = 0;

      const serviceRegex = /mesero|lento|espera|atenci[oó]n|servicio|tade|tarde|tardaron|trato|amabilidad/i;
      const qualityRegex = /sabor|fr[ií]o|sucio|malo|crudo|calidad|ingrediente|pelo/i;
      const valueRegex = /caro|precio|porci[oó]n|costo|tama[ño]|car[ií]simo|cantidad/i;

      const negativeReviews = brandReviews.filter(r => r.stars <= 2);
      negativeReviews.forEach(r => {
        const text = r.text || '';
        if (serviceRegex.test(text)) serviceAlerts++;
        if (qualityRegex.test(text)) qualityAlerts++;
        if (valueRegex.test(text)) valueAlerts++;
      });

      const unrepliedList = brandReviews.filter(r => r.stars <= 2 && (!r.responseText || r.responseText.trim() === ''));
      const unrepliedListHtml = unrepliedList.length ? unrepliedList.map(r => {
        const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
        const branchMeta = SUCURSALES_META_ALL.find(s => s.id === r.sucursal);
        const branchDisplay = branchMeta ? branchMeta.nombre : r.sucursal;
        const dateStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Reciente';
        const localGuideHtml = r.isLocalGuide ? `<span class="guide-badge">Local Guide</span>` : '';
        
        return `
          <div class="modal-rev-card critical brand-item-interactive" onclick="BrandView.openBranchSummaryModal('${r.sucursal}')" title="Clic para diagnosticar sucursal" style="cursor: pointer; margin-bottom: 12px;">
            <div class="modal-rev-top">
              <div>
                <span class="modal-rev-branch">${branchDisplay}</span>
                <span class="modal-rev-stars">${starsHtml}</span>
              </div>
              <div>
                ${localGuideHtml}
                <span class="reply-badge red">Sin Respuesta</span>
                <span class="modal-rev-date">${dateStr}</span>
              </div>
            </div>
            <div class="modal-rev-text">"${r.text || 'Sin comentario escrito.'}"</div>
          </div>
        `;
      }).join('') : `<div style="text-align:center; padding:40px; color:var(--text-muted); font-style:italic;">100% de quejas respondidas. ¡Buen trabajo de operación!</div>`;

      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Resumen de Alertas por Categoría -->
          <div class="brand-alert-categories-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div class="brand-kpi-card" style="min-height: 120px;">
              <span class="brand-kpi-label">Servicio y Atención</span>
              <span class="brand-kpi-val num red" style="color: var(--alerta); font-weight: 700; margin: 8px 0;">${serviceAlerts}</span>
              <span class="brand-kpi-sub">quejas detectadas este mes</span>
            </div>
            <div class="brand-kpi-card" style="min-height: 120px;">
              <span class="brand-kpi-label">Producto y Calidad</span>
              <span class="brand-kpi-val num red" style="color: var(--alerta); font-weight: 700; margin: 8px 0;">${qualityAlerts}</span>
              <span class="brand-kpi-sub">quejas detectadas este mes</span>
            </div>
            <div class="brand-kpi-card" style="min-height: 120px;">
              <span class="brand-kpi-label">Precio y Porción</span>
              <span class="brand-kpi-val num red" style="color: var(--alerta); font-weight: 700; margin: 8px 0;">${valueAlerts}</span>
              <span class="brand-kpi-sub">quejas detectadas este mes</span>
            </div>
          </div>

          <!-- Listado de Alertas sin Responder -->
          <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: 24px; padding: 24px; box-sizing: border-box; backdrop-filter: blur(16px); box-shadow: var(--sombra-card);">
            <div style="font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
              <span>Quejas Críticas sin Responder (Nacional)</span>
              <span style="font-size: 12px; background: rgba(235,94,85,0.12); color: var(--alerta); padding: 4px 8px; border-radius: 8px; font-family: var(--mono); font-weight: 700;">${unrepliedList.length} pendientes</span>
            </div>
            
            <div class="brand-modal-reviews-list" style="max-height: 500px; overflow-y: auto; padding-right: 8px;">
              ${unrepliedListHtml}
            </div>
          </div>
        </div>
      `;
    }

    // Inyectar el diseño de la región
    app.innerHTML = `
      ${buildTopbar(true, 'étoile corporativo', true)}
      
      <div class="main-content" style="max-width: 1200px; margin: 0 auto; padding: 24px; box-sizing: border-box; display: flex; flex-direction: column; gap: 32px;">
        
        <!-- Controles de Período y Títulos -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <span class="brand-eyebrow">Consolidado Corporativo Nacional</span>
            <h1 class="brand-main-title" style="margin: 4px 0 2px 0;">Brand Dashboard: La Crêpe Parisienne</h1>
            <p class="brand-subtitle">Control de reputación corporativa y auditoría nacional.</p>
          </div>
          <div class="brand-period-selector">
            ${dropdownHtml}
          </div>
        </div>

        ${tabContentHtml}
      </div>
    `;

    // Close custom select on clicking outside
    const _clickOutsideHandler = (e) => {
      document.querySelectorAll('.custom-select.open').forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    };
    document.removeEventListener('click', window._brandDropdownOutsideHandler);
    window._brandDropdownOutsideHandler = _clickOutsideHandler;
    document.addEventListener('click', _clickOutsideHandler);
  },

  // ── 7. ACCIONES DE NAVEGACIÓN Y TABS ──
  switchTab(tab) {
    this.activeTab = tab;
    // Destroy previous charts before switching
    if (typeof Charts !== 'undefined') {
      Charts.destroyAll();
    }
    this.render();
  },

  toggleMonthDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('brandMonthDropdown');
    if (dropdown) {
      dropdown.classList.toggle('open');
    }
  },

  selectMonthOption(month) {
    const dropdown = document.getElementById('brandMonthDropdown');
    if (dropdown) {
      dropdown.classList.remove('open');
    }
    const currYear = DataLoader.currentYear;
    DataLoader.setMonth(currYear, month);
    this.render();
  },

  // ── 8. MODALES DE ANÁLISIS DE RESEÑAS ──
  async openBranchModal(branchId) {
    const meta = SUCURSALES_META_ALL.find(s => s.id === branchId);
    const branchName = meta ? meta.nombre : branchId;
    
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
    
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const brandReviews = await DataLoader.loadBrandData(year, month);
    const regionReviews = brandReviews.filter(r => r.region === regionCode);

    this.activeModalReviews = regionReviews;
    this.activeModalTitle = `Opiniones en Región: ${regionName}`;
    this.activeModalBranchId = null;
    this.renderModal('all');
  },

  async openAlertsModal(onlyUnreplied = false) {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const brandReviews = await DataLoader.loadBrandData(year, month);
    
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

  async openAllReviewsModal() {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const brandReviews = await DataLoader.loadBrandData(year, month);

    this.activeModalReviews = brandReviews;
    this.activeModalTitle = `Opiniones del Mes (Nacional)`;
    this.activeModalBranchId = null;
    this.renderModal('all');
  },

  renderModal(tab = 'all') {
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
      
      const localGuideHtml = r.isLocalGuide ? `<span class="guide-badge">Local Guide</span>` : '';
      const branchMeta = SUCURSALES_META_ALL.find(s => s.id === r.sucursal);
      const branchDisplay = branchMeta ? branchMeta.nombre : r.sucursal;
      const replyBoxHtml = isReplied ? `<div class="modal-rev-reply"><strong>Respuesta del Propietario:</strong> "${r.responseText}"</div>` : '';
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
    document.body.style.overflow = 'hidden';
  },

  // ── 9. MODAL DE AUDITORÍA DE DÉFICITS (DRILL-DOWN) ──
  openDeficitsAuditModal() {
    this.activeDeficitBranchId = null;
    this.renderDeficitsModal();
  },

  async renderDeficitsModal() {
    this.closeModal();

    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const brandReviews = await DataLoader.loadBrandData(year, month);

    if (this.activeDeficitBranchId) {
      this.renderDeficitBranchDrilldown(this.activeDeficitBranchId, brandReviews);
      return;
    }

    const criticalBranches = [];
    const belowTargetBranches = [];
    const unrepliedAlertsMap = {};

    for (const s of SUCURSALES_META_ALL) {
      const bReviews = brandReviews.filter(r => r.sucursal === s.id);
      const count = bReviews.length;
      const avg = count ? bReviews.reduce((sum, r) => sum + r.stars, 0) / count : 0;
      const alerts = bReviews.filter(r => r.stars <= 2).length;
      const unreplied = bReviews.filter(r => r.stars <= 2 && (!r.responseText || r.responseText.trim() === '')).length;

      if (count > 0) {
        if (avg < 4.30 && alerts > 0) {
          criticalBranches.push({ ...s, avg, count, alerts });
        } else if (avg < KpiMeta.ratingMinimo) {
          belowTargetBranches.push({ ...s, avg, count, alerts });
        }
        if (unreplied > 0) {
          unrepliedAlertsMap[s.id] = { ...s, count: unreplied, avg, totalAlerts: alerts };
        }
      }
    }

    const criticalHtml = criticalBranches.length ? criticalBranches.map(b => `
      <div class="def-audit-card critical" onclick="BrandView.drillDownDeficit('${b.id}')" title="Haz clic para diagnosticar">
        <div class="def-audit-card-info">
          <strong>${b.nombre}</strong>
          <span>${getRegionName(b.region)}</span>
        </div>
        <div class="def-audit-card-stat">
          <span class="def-stat-rating">${b.avg.toFixed(2)}★</span>
          <span class="def-stat-sub">${b.alerts} quejas</span>
        </div>
      </div>
    `).join('') : '<div class="def-empty-state">Sin sucursales críticas en este mes.</div>';

    const belowTargetHtml = belowTargetBranches.length ? belowTargetBranches.map(b => `
      <div class="def-audit-card warning" onclick="BrandView.drillDownDeficit('${b.id}')" title="Haz clic para diagnosticar">
        <div class="def-audit-card-info">
          <strong>${b.nombre}</strong>
          <span>${getRegionName(b.region)}</span>
        </div>
        <div class="def-audit-card-stat">
          <span class="def-stat-rating">${b.avg.toFixed(2)}★</span>
          <span class="def-stat-sub">${b.count} opiniones</span>
        </div>
      </div>
    `).join('') : '<div class="def-empty-state">Todas las sucursales estables cumplen la meta de 4.60★.</div>';

    const unrepliedHtml = Object.keys(unrepliedAlertsMap).length ? Object.values(unrepliedAlertsMap).map(b => `
      <div class="def-audit-card alert-bg" onclick="BrandView.drillDownDeficit('${b.id}')" title="Haz clic para diagnosticar">
        <div class="def-audit-card-info">
          <strong>${b.nombre}</strong>
          <span>${getRegionName(b.region)}</span>
        </div>
        <div class="def-audit-card-stat">
          <span class="def-stat-rating" style="color:var(--alerta);">${b.count} pendientes</span>
          <span class="def-stat-sub">de ${b.totalAlerts} quejas</span>
        </div>
      </div>
    `).join('') : '<div class="def-empty-state">100% de quejas respondidas.</div>';

    const modalHtml = `
      <div class="brand-modal-overlay" id="brandDetailModal" onclick="if(event.target === this) BrandView.closeModal()">
        <div class="brand-modal-box" style="max-width: 620px;">
          <div class="brand-modal-header">
            <h2 class="brand-modal-title">Auditoría de Alertas y Déficits Operativos</h2>
            <button class="brand-modal-close" onclick="BrandView.closeModal()">×</button>
          </div>
          
          <div class="brand-modal-body" style="padding: 20px;">
            <p style="font-size:12px; color:var(--text-dim); margin-top:0; margin-bottom: 20px; line-height:1.4;">
              Selecciona una sucursal del listado para realizar un diagnóstico detallado, leer las quejas recibidas y ver su estado de respuestas.
            </p>
            
            <div class="def-group-section">
              <span class="def-group-title red">Sucursales Críticas (Calificación &lt; 4.30★ con alertas)</span>
              <div class="def-group-grid">${criticalHtml}</div>
            </div>
            
            <div class="def-group-section" style="margin-top:24px;">
              <span class="def-group-title gold">Bajo Meta Mínima (Calificación &lt; 4.60★)</span>
              <div class="def-group-grid">${belowTargetHtml}</div>
            </div>
            
            <div class="def-group-section" style="margin-top:24px;">
              <span class="def-group-title red">Respuestas Pendientes en Alertas (1-2★)</span>
              <div class="def-group-grid">${unrepliedHtml}</div>
            </div>
          </div>
          
          <div class="brand-modal-footer">
            <button class="brand-modal-close-btn" onclick="BrandView.closeModal()">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
  },

  drillDownDeficit(branchId) {
    this.activeDeficitBranchId = branchId;
    this.renderDeficitsModal();
  },

  async renderDeficitBranchDrilldown(branchId, brandReviews) {
    const meta = SUCURSALES_META_ALL.find(s => s.id === branchId);
    const branchName = meta ? meta.nombre : branchId;

    const branchReviews = brandReviews.filter(r => r.sucursal === branchId);
    const count = branchReviews.length;
    const avg = count ? branchReviews.reduce((sum, r) => sum + r.stars, 0) / count : 0;
    const alerts = branchReviews.filter(r => r.stars <= 2);
    const unreplied = alerts.filter(r => !r.responseText || r.responseText.trim() === '').length;

    let reasons = [];
    if (avg < 4.30) {
      reasons.push(`<span class="def-reason-badge red">Crítico</span> Su calificación de <strong>${avg.toFixed(2)}★</strong> está en estado crítico.`);
    } else if (avg < KpiMeta.ratingMinimo) {
      reasons.push(`<span class="def-reason-badge warning">Bajo Meta</span> Su promedio es de <strong>${avg.toFixed(2)}★</strong>, por debajo del objetivo nacional de ${KpiMeta.ratingMinimo.toFixed(2)}★.`);
    }
    if (unreplied > 0) {
      reasons.push(`<span class="def-reason-badge red">Respuestas pendientes</span> Tiene <strong>${unreplied}</strong> quejas críticas (1-2★) sin contestar.`);
    }

    const reviewCardsHtml = branchReviews.length ? branchReviews.map(r => {
      const isCritical = r.stars <= 2;
      const cardClass = isCritical ? 'modal-rev-card critical' : 'modal-rev-card';
      const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      const isReplied = r.responseText && r.responseText.trim() !== '';
      const replyStatusHtml = isReplied
        ? `<span class="reply-badge green">Respondido</span>`
        : `<span class="reply-badge red">Sin Respuesta</span>`;
      
      const localGuideHtml = r.isLocalGuide ? `<span class="guide-badge">Local Guide</span>` : '';
      const replyBoxHtml = isReplied ? `<div class="modal-rev-reply"><strong>Respuesta del Propietario:</strong> "${r.responseText}"</div>` : '';
      const dateStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Reciente';

      return `
        <div class="${cardClass}">
          <div class="modal-rev-top">
            <div>
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
    }).join('') : '<div style="text-align:center; padding:20px; color:var(--text-dim); font-style:italic;">Sin opiniones este mes.</div>';

    const modalHtml = `
      <div class="brand-modal-overlay" id="brandDetailModal" onclick="if(event.target === this) BrandView.closeModal()">
        <div class="brand-modal-box">
          <div class="brand-modal-header" style="flex-direction:row; align-items:center; justify-content:space-between; gap:16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <button class="def-back-btn" onclick="BrandView.openDeficitsAuditModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12,19 5,12 12,5"></polyline></svg>
                <span>Volver</span>
              </button>
              <h2 class="brand-modal-title">Diagnóstico: ${branchName}</h2>
            </div>
            <button class="brand-modal-close" onclick="BrandView.closeModal()">×</button>
          </div>
          
          <div class="brand-modal-body" style="padding:20px;">
            <div class="def-branch-header-stats" style="display:flex; gap:12px; margin-bottom:20px;">
              <div style="background:var(--surface); border:1px solid var(--border); padding:10px 16px; border-radius:12px; flex:1; text-align:center;">
                <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Calificación</div>
                <div style="font-size:20px; font-weight:700; color:${avg < 4.3 ? 'var(--alerta)' : avg < 4.6 ? 'var(--oro)' : 'var(--verde)'};">${avg.toFixed(2)}★</div>
              </div>
              <div style="background:var(--surface); border:1px solid var(--border); padding:10px 16px; border-radius:12px; flex:1; text-align:center;">
                <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Reseñas</div>
                <div style="font-size:20px; font-weight:700; font-family:var(--mono);">${count}</div>
              </div>
              <div style="background:var(--surface); border:1px solid var(--border); padding:10px 16px; border-radius:12px; flex:1; text-align:center;">
                <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Sin Responder</div>
                <div style="font-size:20px; font-weight:700; color:var(--alerta); font-family:var(--mono);">${unreplied}</div>
              </div>
            </div>

            <div class="def-reasons-box" style="background:var(--alerta-bg); border:1px solid rgba(178,58,43,0.18); border-radius:16px; padding:16px; margin-bottom:24px;">
              <div style="font-weight:700; font-size:12px; text-transform:uppercase; color:var(--alerta); margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Motivos de Alerta
              </div>
              <div style="display:flex; flex-direction:column; gap:8px; font-size:12.5px; color:var(--text); line-height:1.4;">
                ${reasons.map(r => `<div>${r}</div>`).join('')}
              </div>
            </div>

            <div style="font-weight:700; font-size:13px; color:var(--text-dim); margin-bottom:12px;">Reseñas del Mes</div>
            <div class="brand-modal-reviews-list">
              ${reviewCardsHtml}
            </div>
          </div>
          
          <div class="brand-modal-footer">
            <button class="modal-shortcut-btn" onclick="BrandView.navigateToBranch('${branchId}')">Ver Scorecard Completo</button>
            <button class="brand-modal-close-btn" onclick="BrandView.closeModal()">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
  },

  // ── 10. MODAL EXPLICATIVO DE SCORE DE COMPLEJIDAD ──
  openComplexityExplanatoryModal() {
    this.closeModal();

    const modalHtml = `
      <div class="brand-modal-overlay" id="brandDetailModal" onclick="if(event.target === this) BrandView.closeModal()">
        <div class="brand-modal-box" style="max-width: 550px;">
          <div class="brand-modal-header">
            <h2 class="brand-modal-title">¿Cómo se calcula el Rendimiento Ajustado?</h2>
            <button class="brand-modal-close" onclick="BrandView.closeModal()">×</button>
          </div>
          <div class="brand-modal-body" style="padding: 24px; line-height: 1.6; color: var(--text);">
            <p style="font-size: 13.5px; margin-top: 0; margin-bottom: 16px;">
              El <strong>Rendimiento Ajustado</strong> no es un simple promedio de estrellas. Diseñamos este indicador para evaluar de manera justa el esfuerzo de los equipos regionales, ponderando la dificultad de su operación (Escala).
            </p>
            <p style="font-size: 13.5px; margin-bottom: 20px;">
              No requiere el mismo esfuerzo operar <strong>3 sucursales</strong> que coordinar una estructura compleja de <strong>11 sucursales</strong>. Por ello, aplicamos un <strong>Factor de Complejidad Operativa</strong> que premia dos variables:
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
              <div style="display: flex; gap: 12px; background: var(--surface); border: 1px solid var(--border); padding: 14px; border-radius: 12px;">
                <div style="font-size: 20px; color: var(--oro); font-weight: 800; line-height:1;">1.</div>
                <div>
                  <strong style="color: var(--text); font-size:13.5px;">Factor de Sucursales (Tamaño):</strong>
                  <div style="font-size: 12.5px; color: var(--text-dim); margin-top: 2px;">
                    Se añade un **+1.8%** de puntaje bonus por cada sucursal en la región. A mayor cantidad de puntos de venta, mayor es el reto de estandarización.
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 12px; background: var(--surface); border: 1px solid var(--border); padding: 14px; border-radius: 12px;">
                <div style="font-size: 20px; color: var(--oro); font-weight: 800; line-height:1;">2.</div>
                <div>
                  <strong style="color: var(--text); font-size:13.5px;">Factor de Exposición (Volumen):</strong>
                  <div style="font-size: 12.5px; color: var(--text-dim); margin-top: 2px;">
                    Se añade un bonus logarítmico de **+0.8%** por la magnitud del flujo de reseñas de los clientes. A mayor cantidad de reseñas recibidas, mayor es la visibilidad y riesgo de variaciones de calidad.
                  </div>
                </div>
              </div>
            </div>

            <div style="background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.18); border-radius: 14px; padding: 16px; font-family: var(--mono); font-size: 12px; text-align: center; color: var(--oro);">
              Rendimiento Ajustado = Rating Bruto × (1 + Factor)
            </div>
          </div>
          <div class="brand-modal-footer">
            <button class="brand-modal-close-btn" onclick="BrandView.closeModal()">Entendido</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
  },

  // ── 11. DIAGNÓSTICO RÁPIDO DE SUCURSAL (QUICK AUDIT) ──
  async openBranchSummaryModal(branchId) {
    this.closeModal();

    const meta = SUCURSALES_META_ALL.find(s => s.id === branchId);
    const branchName = meta ? meta.nombre : branchId;
    const regionName = meta ? getRegionName(meta.region) : '';

    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const brandReviews = await DataLoader.loadBrandData(year, month);
    const branchReviews = brandReviews.filter(r => r.sucursal === branchId);

    const count = branchReviews.length;
    const avg = count ? branchReviews.reduce((sum, r) => sum + r.stars, 0) / count : 0;
    
    // Categorize negative reviews (1-2 stars)
    const negatives = branchReviews.filter(r => r.stars <= 2);
    const alertsCount = negatives.length;
    
    let serviceCount = 0;
    let qualityCount = 0;
    let valueCount = 0;

    const serviceRegex = /mesero|lento|espera|atenci[oó]n|servicio|tade|tarde|tardaron|trato|amabilidad/i;
    const qualityRegex = /sabor|fr[ií]o|sucio|malo|crudo|calidad|ingrediente|pelo/i;
    const valueRegex = /caro|precio|porci[oó]n|costo|tama[ño]|car[ií]simo|cantidad/i;

    negatives.forEach(r => {
      const text = r.text || '';
      if (serviceRegex.test(text)) serviceCount++;
      if (qualityRegex.test(text)) qualityCount++;
      if (valueRegex.test(text)) valueCount++;
    });

    const reviewsConTexto = branchReviews.filter(r => r.text && r.text.trim().length > 0);
    const recentReviewsHtml = reviewsConTexto.length ? reviewsConTexto.slice(0, 3).map(r => {
      const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      const isCritical = r.stars <= 2;
      const cardClass = isCritical ? 'modal-rev-card critical' : 'modal-rev-card';
      const dateStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Reciente';
      return `
        <div class="${cardClass}" style="padding: 12px; margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:11.5px;">
            <span style="color:var(--oro);">${starsHtml}</span>
            <span style="color:var(--text-dim); font-family:var(--mono);">${dateStr}</span>
          </div>
          <div style="font-size:12.5px; font-style:italic; color:var(--text); line-height:1.45;">"${r.text}"</div>
        </div>
      `;
    }).join('') : '<div style="text-align:center; padding:10px; font-size:12px; color:var(--text-dim); font-style:italic;">Sin comentarios con opiniones este mes.</div>';

    const modalHtml = `
      <div class="brand-modal-overlay" id="brandDetailModal" onclick="if(event.target === this) BrandView.closeModal()">
        <div class="brand-modal-box" style="max-width: 560px;">
          <div class="brand-modal-header" style="flex-direction:row; justify-content:space-between; align-items:center;">
            <div>
              <span class="brand-eyebrow" style="font-size: 9px; display:block;">Diagnóstico Rápido de Sucursal</span>
              <h2 class="brand-modal-title" style="margin-top: 2px; font-size:18px;">${branchName}</h2>
              <span style="font-size: 11px; color: var(--text-dim);">${regionName}</span>
            </div>
            <button class="brand-modal-close" onclick="BrandView.closeModal()">×</button>
          </div>
          
          <div class="brand-modal-body" style="padding: 20px;">
            <!-- KPIS Mini -->
            <div style="display:flex; gap:12px; margin-bottom:20px;">
              <div style="background:var(--surface); border:1px solid var(--border); padding:10px 14px; border-radius:12px; flex:1; text-align:center;">
                <div style="font-size:9px; color:var(--text-dim); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Rating del Mes</div>
                <div style="font-size:18px; font-weight:700; color:${avg < 4.3 ? 'var(--alerta)' : avg < 4.6 ? 'var(--oro)' : 'var(--verde)'};">${avg > 0 ? avg.toFixed(2) + '★' : '—'}</div>
              </div>
              <div style="background:var(--surface); border:1px solid var(--border); padding:10px 14px; border-radius:12px; flex:1; text-align:center;">
                <div style="font-size:9px; color:var(--text-dim); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Volumen Total</div>
                <div style="font-size:18px; font-weight:700; font-family:var(--mono);">${count}</div>
              </div>
              <div style="background:var(--surface); border:1px solid var(--border); padding:10px 14px; border-radius:12px; flex:1; text-align:center;">
                <div style="font-size:9px; color:var(--text-dim); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Quejas Activas</div>
                <div style="font-size:18px; font-weight:700; color:${alertsCount > 0 ? 'var(--alerta)' : 'var(--verde)'}; font-family:var(--mono);">${alertsCount}</div>
              </div>
            </div>

            <!-- Categories of Alertas -->
            <div style="margin-bottom: 24px;">
              <div style="font-weight:700; font-size:12px; color:var(--text-dim); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.04em;">Distribución de Alertas</div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); border:1px solid var(--border); padding:8px 12px; border-radius:10px;">
                  <span style="font-size:12.5px; font-weight:600; color:var(--text);"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--alerta); margin-right:8px;"></span>Servicio y Atención</span>
                  <span style="font-family:var(--mono); font-size:12px; font-weight:700; color:${serviceCount > 0 ? 'var(--alerta)' : 'var(--text-muted)'}">${serviceCount} menciones</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); border:1px solid var(--border); padding:8px 12px; border-radius:10px;">
                  <span style="font-size:12.5px; font-weight:600; color:var(--text);"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--alerta); margin-right:8px;"></span>Producto y Calidad</span>
                  <span style="font-family:var(--mono); font-size:12px; font-weight:700; color:${qualityCount > 0 ? 'var(--alerta)' : 'var(--text-muted)'}">${qualityCount} menciones</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); border:1px solid var(--border); padding:8px 12px; border-radius:10px;">
                  <span style="font-size:12.5px; font-weight:600; color:var(--text);"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--alerta); margin-right:8px;"></span>Precio y Porción</span>
                  <span style="font-family:var(--mono); font-size:12px; font-weight:700; color:${valueCount > 0 ? 'var(--alerta)' : 'var(--text-muted)'}">${valueCount} menciones</span>
                </div>
              </div>
            </div>

            <!-- Recent Comments -->
            <div>
              <div style="font-weight:700; font-size:12px; color:var(--text-dim); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.04em;">Comentarios Recientes</div>
              <div style="display:flex; flex-direction:column;">
                ${recentReviewsHtml}
              </div>
            </div>
          </div>
          
          <div class="brand-modal-footer">
            <button class="modal-shortcut-btn" onclick="BrandView.navigateToBranch('${branchId}')">Ver Scorecard Completo</button>
            <button class="brand-modal-close-btn" onclick="BrandView.closeModal()">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const el = document.getElementById('brandDetailModal');
    if (el) {
      el.remove();
    }
    document.body.style.overflow = '';
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

  // ── 12. ESTILOS ESPECÍFICOS Y TEMAS ──
  injectStyles() {
    if (document.getElementById('brand-dashboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'brand-dashboard-styles';
    style.textContent = `
      .brand-period-selector {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .brand-month-select-container {
        position: relative;
        display: inline-block;
      }
      
      #brandMonthDropdown .custom-select-trigger {
        background: var(--surface-2);
        border: 1px solid var(--border-strong);
        color: var(--text);
        border-radius: 20px;
        padding: 8px 16px;
      }
      #brandMonthDropdown .custom-select-trigger:hover {
        background: var(--surface);
        border-color: var(--sage);
      }
      #brandMonthDropdown .custom-select-options {
        right: 0;
        left: auto;
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
        font-size: 38px;
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
        background: var(--surface-2);
        border: 1px solid var(--border);
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
        box-shadow: var(--sombra-card);
      }
      .brand-kpi-card.alert-card {
        border-left: 4px solid var(--alerta);
      }
      .brand-interactive-card {
        cursor: pointer;
      }
      .brand-interactive-card:hover {
        background: var(--surface);
        border-color: var(--sage);
        transform: translateY(-4px);
        box-shadow: var(--sombra-lg);
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
      [data-theme="dark"] .brand-kpi-val.green { color: #A7DBB9; }
      .brand-kpi-sub {
        font-size: 11px;
        color: var(--text-dim);
      }

      /* Alert/Deficit Panel */
      .brand-deficits-alert {
        background: var(--alerta-bg);
        border: 1px solid rgba(178, 58, 43, 0.15);
        border-left: 4px solid var(--alerta);
        border-radius: 20px;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .brand-deficits-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
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
      }
      [data-theme="dark"] .brand-deficits-title {
        color: #F4A090;
      }
      .brand-audit-btn {
        background: rgba(178, 58, 43, 0.12);
        border: 1px solid rgba(178, 58, 43, 0.25);
        color: var(--alerta);
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      [data-theme="dark"] .brand-audit-btn {
        color: #F4A090;
        border-color: rgba(178, 58, 43, 0.4);
      }
      .brand-audit-btn:hover {
        background: var(--alerta);
        color: #fff;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(178,58,43,0.2);
      }
      .brand-deficits-summary {
        font-size: 13px;
        line-height: 1.6;
        color: var(--text);
      }

      /* Performance Table */
      .brand-region-performance {
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: var(--sombra-card);
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
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      .brand-info-badge:hover {
        background: rgba(212,175,55,0.14);
        transform: translateY(-1px);
      }
      .brand-region-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .brand-region-table th {
        text-align: left;
        padding: 12px 16px;
        color: var(--text-muted);
        font-weight: 600;
        border-bottom: 1px solid var(--border-strong);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.04em;
      }
      .brand-region-table td {
        padding: 16px;
        border-bottom: 1px solid var(--border);
        color: var(--text);
      }
      .brand-row-interactive {
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .brand-row-interactive:hover {
        background: var(--surface);
      }
      .brand-region-badge {
        background: var(--surface);
        border: 1px solid var(--border);
        padding: 3px 8px;
        border-radius: 8px;
        font-family: var(--mono);
        font-weight: 600;
        font-size: 10px;
        color: var(--text-muted);
      }
      .num { font-family: var(--mono); }
      .text-center { text-align: center; }
      .text-green { color: var(--ok); font-weight: 600; }
      [data-theme="dark"] .text-green { color: #A7DBB9; }
      
      .brand-region-score-num {
        font-family: var(--mono);
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
      }
      .brand-region-score-num.gold-score {
        background: rgba(212,175,55,0.12);
        color: var(--oro);
        border: 1px solid rgba(212,175,55,0.25);
      }
      .brand-region-score-num.green-score {
        background: var(--ok-bg);
        color: var(--ok);
        border: 1px solid rgba(61,138,95,0.25);
      }
      [data-theme="dark"] .brand-region-score-num.green-score {
        color: #A7DBB9;
      }
      .brand-region-score-num.red-score {
        background: var(--alerta-bg);
        color: var(--alerta);
        border: 1px solid rgba(178,58,43,0.25);
      }
      [data-theme="dark"] .brand-region-score-num.red-score {
        color: #F4A090;
      }

      /* Branch Splits */
      .brand-highlights-split {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
      }
      .brand-split-col {
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: var(--sombra-card);
      }
      .brand-split-title {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-muted);
        border-bottom: 1px solid var(--border);
        padding-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .brand-branch-item {
        background: var(--surface);
        border: 1px solid var(--border);
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
        background: var(--surface-2);
        border-color: var(--sage);
        transform: translateY(-2px);
        box-shadow: var(--sombra);
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
        color: var(--text-muted);
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
        color: var(--ok);
        font-size: 14px;
      }
      [data-theme="dark"] .brand-branch-rating {
        color: #A7DBB9;
      }
      .brand-branch-reviews {
        font-size: 11px;
        color: var(--text-muted);
      }

      /* Premium Interactive Modal (Theme adaptive) */
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
        background: var(--surface-2);
        border: 1px solid var(--border-strong);
        border-radius: 24px;
        width: 100%;
        max-width: 760px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        box-shadow: var(--sombra-lg);
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
        border-bottom: 1px solid var(--border);
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
        color: var(--text-muted);
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
        background: rgba(0,0,0,0.02);
        border-bottom: 1px solid var(--border);
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
        background: var(--border);
      }
      .brand-tab-btn.active {
        background: var(--border-strong);
        border-color: var(--border-strong);
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
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 16px;
        box-sizing: border-box;
      }
      .modal-rev-card.critical {
        border-left: 4px solid var(--alerta);
        background: var(--alerta-bg);
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
        background: var(--surface-2);
        border-radius: 10px;
        padding: 10px 14px;
        margin-top: 12px;
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.4;
        border: 1px solid var(--border);
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
        background: var(--ok-bg);
        color: var(--ok);
      }
      [data-theme="dark"] .reply-badge.green {
        color: #A7DBB9;
      }
      .reply-badge.red {
        background: var(--alerta-bg);
        color: var(--alerta);
      }
      [data-theme="dark"] .reply-badge.red {
        color: #F4A090;
      }
      .guide-badge {
        font-size: 10px;
        font-weight: 700;
        background: var(--border);
        color: var(--text);
        padding: 2px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        margin-right: 6px;
      }

      .brand-modal-footer {
        padding: 16px 24px;
        border-top: 1px solid var(--border);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .brand-modal-close-btn {
        background: var(--border);
        border: 1px solid var(--border-strong);
        color: var(--text);
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .brand-modal-close-btn:hover {
        background: var(--border-strong);
      }
      .modal-shortcut-btn {
        background: var(--ok);
        border: 1px solid var(--ok);
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

      /* Deficits Audit Modal Styles */
      .def-group-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .def-group-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        border-bottom: 1px solid var(--border);
        padding-bottom: 6px;
      }
      .def-group-title.red { color: var(--alerta); }
      .def-group-title.gold { color: var(--oro); }
      .def-group-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 4px;
      }
      .def-audit-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .def-audit-card:hover {
        background: var(--surface-2);
        border-color: var(--sage);
        transform: translateY(-1px);
      }
      .def-audit-card.critical {
        border-left: 4px solid var(--alerta);
      }
      .def-audit-card.warning {
        border-left: 4px solid var(--oro);
      }
      .def-audit-card.alert-bg {
        border-left: 4px solid var(--alerta);
        background: var(--alerta-bg);
      }
      .def-audit-card.alert-bg:hover {
        background: var(--surface-2);
      }
      .def-audit-card-info {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .def-audit-card-info strong {
        font-size: 13.5px;
        color: var(--text);
      }
      .def-audit-card-info span {
        font-size: 11px;
        color: var(--text-dim);
      }
      .def-audit-card-stat {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 3px;
      }
      .def-stat-rating {
        font-family: var(--mono);
        font-weight: 700;
        font-size: 13.5px;
      }
      .def-stat-sub {
        font-size: 10px;
        color: var(--text-dim);
      }
      .def-empty-state {
        font-size: 12px;
        color: var(--text-dim);
        font-style: italic;
        padding: 8px 12px;
      }
      .def-back-btn {
        background: var(--border);
        border: 1px solid var(--border-strong);
        color: var(--text);
        padding: 6px 12px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .def-back-btn:hover {
        background: var(--border-strong);
        transform: translateX(-2px);
      }
      .def-reason-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        margin-right: 6px;
        display: inline-block;
      }
      .def-reason-badge.red {
        background: var(--alerta-bg);
        color: var(--alerta);
        border: 1px solid rgba(178,58,43,0.3);
      }
      .def-reason-badge.warning {
        background: rgba(212,175,55,0.15);
        color: var(--oro);
        border: 1px solid rgba(212,175,55,0.3);
      }
    `;
    document.head.appendChild(style);
  },

  renderSkeleton() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
      ${buildTopbar(true, 'étoile corporativo', true)}
      <div style="max-width:1200px; margin:0 auto; padding:24px; box-sizing:border-box; display:flex; flex-direction:column; gap:32px;">
        <!-- Header control skeleton -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div class="skeleton" style="height:12px; width:150px; margin-bottom:8px;"></div>
            <div class="skeleton" style="height:32px; width:280px; margin-bottom:8px;"></div>
            <div class="skeleton" style="height:14px; width:200px;"></div>
          </div>
          <div class="skeleton" style="height:40px; width:150px; border-radius:14px;"></div>
        </div>
        
        <!-- KPIs Skeletons -->
        <div class="brand-kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
          <div class="skeleton" style="height: 140px; border-radius: 20px;"></div>
          <div class="skeleton" style="height: 140px; border-radius: 20px;"></div>
          <div class="skeleton" style="height: 140px; border-radius: 20px;"></div>
          <div class="skeleton" style="height: 140px; border-radius: 20px;"></div>
        </div>

        <!-- Deficit Alert Skeleton -->
        <div class="skeleton" style="height: 80px; border-radius: 20px;"></div>
        
        <!-- Table Skeleton -->
        <div class="skeleton" style="height: 350px; border-radius: 24px;"></div>
      </div>
    `;
    
    app.classList.remove('fade-out');
  }
};
