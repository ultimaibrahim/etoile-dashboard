/**
 * views/compare.js — Módulo Comparador Head-to-Head de Sucursales (#/comparar)
 * Permite enfrentar dos tiendas frente a frente con estética Crystal & Squircle,
 * contrastando calificaciones, deltas porcentuales, Radar Operativo de 5 dimensiones
 * y veredicto ejecutivo automatizado.
 */

const CompareView = {
  branchA: null,
  branchB: null,
  radarChartInstance: null,

  async render(params = {}) {
    Charts.destroyAll();
    if (this.radarChartInstance) {
      try { this.radarChartInstance.destroy(); } catch (e) {}
      this.radarChartInstance = null;
    }

    const app = document.getElementById('app');
    if (!app) return;

    const currYear = DataLoader.currentYear;
    const currMonth = DataLoader.currentMonth;
    const monthData = await DataLoader.loadMonth(currYear, currMonth);
    const allReviews = (monthData && monthData.reviews) ? monthData.reviews : [];

    const monthName = new Date(currYear, currMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Obtener catálogo unificado de sucursales
    const branches = (typeof SUCURSALES_META_ALL !== 'undefined' && Array.isArray(SUCURSALES_META_ALL))
      ? SUCURSALES_META_ALL
      : (typeof SUCURSALES_META !== 'undefined' && Array.isArray(SUCURSALES_META) ? SUCURSALES_META : []);

    if (branches.length === 0) {
      app.innerHTML = `<div class="empty-state">No se encontró catálogo de sucursales.</div>`;
      return;
    }

    // Determinar sucursales a comparar
    const paramA = params.a || (new URLSearchParams(window.location.hash.split('?')[1] || '')).get('a');
    const paramB = params.b || (new URLSearchParams(window.location.hash.split('?')[1] || '')).get('b');

    const defaultA = branches.find(b => b.id === 'andares') || branches[0];
    const defaultB = branches.find(b => b.id === 'gal-gdl' || b.id === 'galerias-gdl') || branches[1] || branches[0];

    const metaA = (paramA ? branches.find(b => b.id === paramA) : null) || defaultA;
    const metaB = (paramB ? branches.find(b => b.id === paramB) : null) || defaultB;

    this.branchA = metaA.id;
    this.branchB = metaB.id;

    // Métricas para Sucursal A
    const statsA = this._computeBranchStats(metaA, allReviews, currYear, currMonth);
    // Métricas para Sucursal B
    const statsB = this._computeBranchStats(metaB, allReviews, currYear, currMonth);

    // Deltas comparativos
    const ratingDelta = (statsA.avg - statsB.avg).toFixed(2);
    const ratingDeltaAbs = Math.abs(Number(ratingDelta)).toFixed(2);
    const volumeDelta = statsA.count - statsB.count;
    const volumeDeltaAbs = Math.abs(volumeDelta);
    const responseDelta = (statsA.responseRate - statsB.responseRate).toFixed(1);

    // Veredicto Ejecutivo Automatizado
    const verdictHtml = this._generateVerdict(metaA, statsA, metaB, statsB, ratingDelta);

    // Selector options
    const optionsA = branches.map(b => {
      const isSel = b.id === metaA.id ? 'selected' : '';
      const reg = typeof getRegionName === 'function' ? getRegionName(b.region) : b.region;
      return `<option value="${b.id}" ${isSel}>${escapeHtml(b.nombre)} (${reg})</option>`;
    }).join('');

    const optionsB = branches.map(b => {
      const isSel = b.id === metaB.id ? 'selected' : '';
      const reg = typeof getRegionName === 'function' ? getRegionName(b.region) : b.region;
      return `<option value="${b.id}" ${isSel}>${escapeHtml(b.nombre)} (${reg})</option>`;
    }).join('');

    const html = `
      ${buildTopbar(false, 'Comparador Head-to-Head')}
      
      <div class="compare-view-container">
        <!-- Encabezado de la Vista -->
        <div class="compare-header">
          <div class="compare-eyebrow">Analítica Comparativa Avanzada · ${capitalizedMonth} ${currYear}</div>
          <h1 class="compare-title">Comparador Head-to-Head</h1>
          <p class="compare-subtitle">Contraste operativo entre tiendas, matrices de fricción y radar de 5 dimensiones del servicio.</p>
        </div>

        <!-- Selectores de Sucursales -->
        <div class="compare-selectors-bar">
          <div class="compare-sel-box box-a">
            <span class="sel-indicator-dot dot-a"></span>
            <label for="compareSelectA" class="compare-sel-label">Tienda A (Esmeralda):</label>
            <select id="compareSelectA" class="compare-select" onchange="CompareView.onSelectChange()">
              ${optionsA}
            </select>
          </div>

          <div class="compare-vs-badge">VS</div>

          <div class="compare-sel-box box-b">
            <span class="sel-indicator-dot dot-b"></span>
            <label for="compareSelectB" class="compare-sel-label">Tienda B (Oro Champagne):</label>
            <select id="compareSelectB" class="compare-select" onchange="CompareView.onSelectChange()">
              ${optionsB}
            </select>
          </div>
        </div>

        <!-- Split Hero Cards -->
        <div class="compare-hero-split">
          <!-- Card Tienda A -->
          <div class="compare-branch-card card-a">
            <div class="cbc-header">
              <span class="cbc-tag tag-a">Tienda A</span>
              <span class="cbc-region">${metaA.region || 'GDL'}</span>
            </div>
            <h2 class="cbc-name">${escapeHtml(metaA.nombre)}</h2>
            <div class="cbc-rating-row">
              <span class="cbc-score">${statsA.avg > 0 ? statsA.avg.toFixed(2) : '—'}</span>
              <div class="cbc-stars-wrap">
                <span class="cbc-stars">${statsA.avg > 0 ? starStr(Math.round(statsA.avg)) : ''}</span>
                <span class="cbc-reviews-count">${statsA.count} opiniones en el mes</span>
              </div>
            </div>
            <div class="cbc-meta-grid">
              <div class="cbc-meta-item">
                <span class="cmi-label">Histórico</span>
                <span class="cmi-val">${metaA.historico ? metaA.historico.toFixed(2) : '—'}★</span>
              </div>
              <div class="cbc-meta-item">
                <span class="cmi-label">Respuesta Propietario</span>
                <span class="cmi-val">${statsA.responseRate}%</span>
              </div>
              <div class="cbc-meta-item">
                <span class="cmi-label">Quejas (≤2★)</span>
                <span class="cmi-val ${statsA.negativeCount > 0 ? 'alert-val' : 'ok-val'}">${statsA.negativeCount}</span>
              </div>
            </div>
            <a href="#/sucursal/${metaA.id}" class="cbc-view-link">Ver ficha completa de ${escapeHtml(metaA.nombre)} →</a>
          </div>

          <!-- Delta Central Flotante -->
          <div class="compare-delta-pill">
            <div class="cdp-title">Diferencial</div>
            <div class="cdp-main ${Number(ratingDelta) >= 0 ? 'positive' : 'negative'}">
              ${Number(ratingDelta) > 0 ? `+${ratingDeltaAbs}★ A` : (Number(ratingDelta) < 0 ? `+${ratingDeltaAbs}★ B` : '= Paridad')}
            </div>
            <div class="cdp-sub">
              ${volumeDelta > 0 ? `+${volumeDeltaAbs} res. en A` : (volumeDelta < 0 ? `+${volumeDeltaAbs} res. en B` : 'Mismo volumen')}
            </div>
          </div>

          <!-- Card Tienda B -->
          <div class="compare-branch-card card-b">
            <div class="cbc-header">
              <span class="cbc-tag tag-b">Tienda B</span>
              <span class="cbc-region">${metaB.region || 'GDL'}</span>
            </div>
            <h2 class="cbc-name">${escapeHtml(metaB.nombre)}</h2>
            <div class="cbc-rating-row">
              <span class="cbc-score">${statsB.avg > 0 ? statsB.avg.toFixed(2) : '—'}</span>
              <div class="cbc-stars-wrap">
                <span class="cbc-stars">${statsB.avg > 0 ? starStr(Math.round(statsB.avg)) : ''}</span>
                <span class="cbc-reviews-count">${statsB.count} opiniones en el mes</span>
              </div>
            </div>
            <div class="cbc-meta-grid">
              <div class="cbc-meta-item">
                <span class="cmi-label">Histórico</span>
                <span class="cmi-val">${metaB.historico ? metaB.historico.toFixed(2) : '—'}★</span>
              </div>
              <div class="cbc-meta-item">
                <span class="cmi-label">Respuesta Propietario</span>
                <span class="cmi-val">${statsB.responseRate}%</span>
              </div>
              <div class="cbc-meta-item">
                <span class="cmi-label">Quejas (≤2★)</span>
                <span class="cmi-val ${statsB.negativeCount > 0 ? 'alert-val' : 'ok-val'}">${statsB.negativeCount}</span>
              </div>
            </div>
            <a href="#/sucursal/${metaB.id}" class="cbc-view-link">Ver ficha completa de ${escapeHtml(metaB.nombre)} →</a>
          </div>
        </div>

        <!-- Radar Chart de 5 Dimensiones + Tabla Matriz -->
        <div class="compare-analytics-grid">
          <div class="compare-chart-card">
            <div class="ccc-head">
              <h3 class="ccc-title">Radar de Equilibrio Operativo (5 Ejes)</h3>
              <span class="ccc-sub">Índices normalizados (0-100) en pilares clave de experiencia del cliente</span>
            </div>
            <div class="compare-radar-wrap">
              <canvas id="compareRadarChart"></canvas>
            </div>
            <div class="compare-radar-legend">
              <div class="crl-item"><span class="crl-color color-a"></span> ${escapeHtml(metaA.nombre)}</div>
              <div class="crl-item"><span class="crl-color color-b"></span> ${escapeHtml(metaB.nombre)}</div>
            </div>
          </div>

          <div class="compare-table-card">
            <div class="ccc-head">
              <h3 class="ccc-title">Contraste Numérico Directo</h3>
              <span class="ccc-sub">Comparativa dimensional parámetro por parámetro</span>
            </div>
            <div class="compare-matrix-table-wrap">
              <table class="compare-matrix-table">
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th>${escapeHtml(metaA.nombre)}</th>
                    <th>${escapeHtml(metaB.nombre)}</th>
                    <th>Líder</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Calificación Mes</strong></td>
                    <td><strong>${statsA.avg.toFixed(2)}★</strong></td>
                    <td><strong>${statsB.avg.toFixed(2)}★</strong></td>
                    <td><span class="win-badge ${statsA.avg >= statsB.avg ? 'win-a' : 'win-b'}">${statsA.avg >= statsB.avg ? metaA.nombre : metaB.nombre}</span></td>
                  </tr>
                  <tr>
                    <td>Calificación Histórica</td>
                    <td>${metaA.historico ? metaA.historico.toFixed(2) : '—'}★</td>
                    <td>${metaB.historico ? metaB.historico.toFixed(2) : '—'}★</td>
                    <td><span class="win-badge ${(metaA.historico || 0) >= (metaB.historico || 0) ? 'win-a' : 'win-b'}">${(metaA.historico || 0) >= (metaB.historico || 0) ? metaA.nombre : metaB.nombre}</span></td>
                  </tr>
                  <tr>
                    <td>Volumen Opiniones</td>
                    <td>${statsA.count}</td>
                    <td>${statsB.count}</td>
                    <td><span class="win-badge ${statsA.count >= statsB.count ? 'win-a' : 'win-b'}">${statsA.count >= statsB.count ? metaA.nombre : metaB.nombre}</span></td>
                  </tr>
                  <tr>
                    <td>Tasa Quejas Críticas (≤2★)</td>
                    <td>${statsA.negativePct}%</td>
                    <td>${statsB.negativePct}%</td>
                    <td><span class="win-badge ${statsA.negativePct <= statsB.negativePct ? 'win-a' : 'win-b'}">${statsA.negativePct <= statsB.negativePct ? metaA.nombre : metaB.nombre}</span></td>
                  </tr>
                  <tr>
                    <td>Tasa Respuesta Propietario</td>
                    <td>${statsA.responseRate}%</td>
                    <td>${statsB.responseRate}%</td>
                    <td><span class="win-badge ${statsA.responseRate >= statsB.responseRate ? 'win-a' : 'win-b'}">${statsA.responseRate >= statsB.responseRate ? metaA.nombre : metaB.nombre}</span></td>
                  </tr>
                  <tr>
                    <td>Satisfacción en Servicio</td>
                    <td>${statsA.serviceScore}%</td>
                    <td>${statsB.serviceScore}%</td>
                    <td><span class="win-badge ${statsA.serviceScore >= statsB.serviceScore ? 'win-a' : 'win-b'}">${statsA.serviceScore >= statsB.serviceScore ? metaA.nombre : metaB.nombre}</span></td>
                  </tr>
                  <tr>
                    <td>Calidad de Producto</td>
                    <td>${statsA.qualityScore}%</td>
                    <td>${statsB.qualityScore}%</td>
                    <td><span class="win-badge ${statsA.qualityScore >= statsB.qualityScore ? 'win-a' : 'win-b'}">${statsA.qualityScore >= statsB.qualityScore ? metaA.nombre : metaB.nombre}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Veredicto Automatizado -->
        <div class="compare-verdict-box">
          <div class="cvb-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--oro);"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <h3 class="cvb-title">Veredicto Ejecutivo de Desempeño</h3>
          </div>
          <div class="cvb-content">
            ${verdictHtml}
          </div>
        </div>
      </div>
    `;

    app.innerHTML = html;

    // Renderizar Radar Chart tras inyección DOM
    requestAnimationFrame(() => {
      this._renderRadarChart(metaA, statsA, metaB, statsB);
    });
  },

  _computeBranchStats(meta, allReviews, year, month) {
    const isBranchMatch = (r) => {
      if (typeof isSameBranch === 'function') return isSameBranch(r.sucursal, meta.id);
      return (r.sucursal || '').toLowerCase() === (meta.id || '').toLowerCase();
    };

    const bReviews = allReviews.filter(isBranchMatch);
    const count = bReviews.length;
    const totalStars = bReviews.reduce((sum, r) => sum + (r.stars || 0), 0);
    const avg = count > 0 ? Number((totalStars / count).toFixed(2)) : (meta.historico || 0);

    // Regla Inamovible LCP: Omitir reviews sin texto fuera de volumen bruto y calidad (avg)
    const textReviews = bReviews.filter(r => r.text && r.text.trim().length > 0);
    const textCount = textReviews.length;

    const negatives = textReviews.filter(r => r.stars <= 2);
    const negativeCount = negatives.length;
    const negativePct = textCount > 0 ? Number(((negativeCount / textCount) * 100).toFixed(1)) : 0;

    const repliedCount = bReviews.filter(r => r.responseFromOwnerText && r.responseFromOwnerText.trim().length > 0).length;
    const responseRate = count > 0 ? Number(((repliedCount / count) * 100).toFixed(1)) : 0;

    // Menciones de servicio, calidad y precio (exclusivo sobre opiniones con texto)
    let serviceComplaints = 0;
    let qualityComplaints = 0;
    let valueComplaints = 0;

    negatives.forEach(r => {
      const text = (r.text || '').toLowerCase();
      if (/mesero|lento|espera|atenci[oó]n|servicio|tarde|tardaron|trato|amabilidad/i.test(text)) serviceComplaints++;
      if (/sabor|fr[ií]o|sucio|malo|crudo|calidad|ingrediente|pelo/i.test(text)) qualityComplaints++;
      if (/caro|precio|porci[oó]n|costo|tama[ñn]o|car[ií]simo|cantidad/i.test(text)) valueComplaints++;
    });

    // Puntuaciones normalizadas 0-100 para el radar
    const csatScore = Math.min(100, Math.max(0, Math.round((avg / 5) * 100)));
    const serviceScore = textCount > 0 ? Math.max(20, Math.round(100 - (serviceComplaints / textCount) * 150)) : 85;
    const qualityScore = textCount > 0 ? Math.max(20, Math.round(100 - (qualityComplaints / textCount) * 150)) : 85;
    const valueScore = textCount > 0 ? Math.max(20, Math.round(100 - (valueComplaints / textCount) * 150)) : 85;

    return {
      avg,
      count,
      negativeCount,
      negativePct,
      responseRate,
      csatScore,
      serviceScore,
      qualityScore,
      valueScore
    };
  },

  _generateVerdict(metaA, statsA, metaB, statsB, delta) {
    const deltaNum = Number(delta);
    let leadText = '';

    if (deltaNum > 0.05) {
      leadText = `<strong>${escapeHtml(metaA.nombre)}</strong> supera a <strong>${escapeHtml(metaB.nombre)}</strong> con una ventaja de <strong>+${deltaNum.toFixed(2)}★</strong> en calificación promedio durante el periodo.`;
    } else if (deltaNum < -0.05) {
      leadText = `<strong>${escapeHtml(metaB.nombre)}</strong> aventaja a <strong>${escapeHtml(metaA.nombre)}</strong> con una diferencia de <strong>+${Math.abs(deltaNum).toFixed(2)}★</strong> en calificación del cliente.`;
    } else {
      leadText = `Ambas sucursales se encuentran en <strong>paridad técnica de satisfacción</strong> con una diferencia mínima de ${Math.abs(deltaNum).toFixed(2)}★.`;
    }

    const respAdvantage = statsA.responseRate > statsB.responseRate + 5
      ? `${metaA.nombre} destaca notablemente en protocolo post-servicio con una tasa de respuesta del ${statsA.responseRate}% (vs ${statsB.responseRate}% en ${metaB.nombre}).`
      : statsB.responseRate > statsA.responseRate + 5
        ? `${metaB.nombre} muestra mayor rigor en seguimiento a quejas con un ${statsB.responseRate}% de respuestas activas.`
        : `Ambas tiendas mantienen una tasa de respuesta a opiniones alineada (${statsA.responseRate}% vs ${statsB.responseRate}%).`;

    const frictionAdvantage = statsA.negativePct < statsB.negativePct
      ? `En control de incidencias críticas, ${metaA.nombre} presenta menor tasa de quejas (solo el ${statsA.negativePct}% del total de sus opiniones).`
      : statsB.negativePct < statsA.negativePct
        ? `En resiliencia operativa, ${metaB.nombre} registra una menor proporción de opiniones negativas (${statsB.negativePct}% vs ${statsA.negativePct}%).`
        : `Ambas tiendas registran una proporción semejante de incidencias críticas.`;

    return `<p>${leadText} ${frictionAdvantage} ${respAdvantage}</p>`;
  },

  _renderRadarChart(metaA, statsA, metaB, statsB) {
    const canvas = document.getElementById('compareRadarChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    const isDark = typeof darkMode !== 'undefined' && darkMode;

    const labels = [
      'CSAT General',
      'Servicio & Atención',
      'Calidad Producto',
      'Percepción Valor',
      'Tasa de Respuesta'
    ];

    const dataA = [
      statsA.csatScore,
      statsA.serviceScore,
      statsA.qualityScore,
      statsA.valueScore,
      statsA.responseRate
    ];

    const dataB = [
      statsB.csatScore,
      statsB.serviceScore,
      statsB.qualityScore,
      statsB.valueScore,
      statsB.responseRate
    ];

    this.radarChartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: metaA.nombre,
            data: dataA,
            borderColor: '#E5B842',
            backgroundColor: 'rgba(229, 184, 66, 0.22)',
            pointBackgroundColor: '#F7D779',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#E5B842',
            borderWidth: 2.5,
            pointRadius: 4.5
          },
          {
            label: metaB.nombre,
            data: dataB,
            borderColor: '#5CE1A6',
            borderDash: [5, 4],
            backgroundColor: 'rgba(92, 225, 166, 0.2)',
            pointBackgroundColor: '#A7F3D0',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#5CE1A6',
            borderWidth: 2.5,
            pointRadius: 4.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          r: {
            angleLines: {
              color: isDark ? 'rgba(237, 230, 216, 0.1)' : 'rgba(22, 22, 20, 0.08)'
            },
            grid: {
              color: isDark ? 'rgba(237, 230, 216, 0.08)' : 'rgba(22, 22, 20, 0.06)'
            },
            pointLabels: {
              color: isDark ? '#EDE6D8' : '#1A1A1A',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
                weight: '600'
              }
            },
            ticks: {
              display: false,
              min: 0,
              max: 100,
              stepSize: 20
            }
          }
        }
      }
    });
  },

  onSelectChange() {
    const selA = document.getElementById('compareSelectA');
    const selB = document.getElementById('compareSelectB');
    if (!selA || !selB) return;

    const valA = selA.value;
    const valB = selB.value;
    window.location.hash = `#/comparar?a=${encodeURIComponent(valA)}&b=${encodeURIComponent(valB)}`;
  }
};
