/**
 * views/dashboards.js — Vista de gráficas: YTD, Alertas Proactivas y 4 Gráficas Analíticas
 */

const DashboardsView = {
  async render() {
    Charts.destroyAll();
    const currYear = DataLoader.currentYear;
    const currMonth = DataLoader.currentMonth;

    // Load YTD data for current year concurrently
    let ytdReviews = [];
    if (DataLoader.manifest && DataLoader.manifest[currYear]) {
      const months = DataLoader.manifest[currYear];
      const monthDataList = await Promise.all(
        months.map(m => DataLoader.loadMonth(currYear, m))
      );
      monthDataList.forEach(d => {
        if (d && d.reviews) {
          ytdReviews = ytdReviews.concat(d.reviews);
        }
      });
    }

    const currStats = DataLoader.getAllBranchStats(currYear, currMonth);
    const currGlobal = DataLoader.getGlobalStats(currYear, currMonth);

    const currMonthName = new Date(currYear, currMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const capitalizedCurrMonth = currMonthName.charAt(0).toUpperCase() + currMonthName.slice(1);

    const sortedMonths = [...(DataLoader.manifest[currYear] || [])].sort((a, b) => a - b);
    const customOptionsHtml = sortedMonths.map(m => {
      const monthName = MONTH_NAMES[m - 1];
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const isActive = m === currMonth ? ' active' : '';
      return `<div class="custom-option${isActive}" data-value="${m}" onclick="DashboardsView.selectMonthOption(${m})">${capMonth} ${currYear}</div>`;
    }).join('');

    // Compute YTD avg per branch
    const ytdStats = {};
    SUCURSALES_META.forEach(meta => {
      const names = [meta.nombre, meta.abr];
      if (meta.id === 'gal-gdl') names.push('Galerías GDL');
      if (meta.id === 'sta-anita') names.push('Galerías Santa Anita');
      const bReviews = ytdReviews.filter(r => names.includes(r.sucursal));
      const count = bReviews.length;
      const avg = count > 0 ? bReviews.reduce((a, r) => a + r.stars, 0) / count : 0;
      ytdStats[meta.id] = { count, avg };
    });

    const branches = SUCURSALES_META.map(meta => {
      const c = currStats[meta.id];
      const alerta = c.negativeCount > 0 || (c.avg > 0 && c.avg < KpiMeta.ratingMinimo);
      return {
        ...meta,
        ytd: ytdStats[meta.id],
        curr: { score: c.avg, count: c.count, negativeCount: c.negativeCount },
        alerta
      };
    });

    // Compute Proactive Operational Alerts
    const alerts = [];
    const maxNegativeCount = Math.max(...branches.map(b => b.curr.negativeCount));

    branches.forEach(b => {
      const currScore = b.curr.score;
      const currCount = b.curr.count;
      const ytdAvg = b.ytd.avg;
      const negativeCount = b.curr.negativeCount;

      // Count unreplied negative reviews in current month
      const bReviews = DataLoader.getReviewsForBranch(currYear, currMonth, b.id);
      const unrepliedCount = bReviews.filter(r => r.stars <= 2 && (!r.responseFromOwnerText || r.responseFromOwnerText.trim() === '')).length;

      // 1. Rating Drop: currScore < ytdAvg - 0.20
      if (currCount > 0 && ytdAvg > 0 && currScore < ytdAvg - 0.20) {
        alerts.push({
          type: 'critical',
          title: 'Caída de Calificación',
          tag: 'Crítico',
          branch: b.nombre,
          icon: 'alert',
          desc: `${b.nombre} promedió ${currScore.toFixed(2)} ★ en el mes, una desviación de -${(ytdAvg - currScore).toFixed(2)} ★ respecto a su promedio histórico del año (${ytdAvg.toFixed(2)} ★).`
        });
      }

      // 2. Low Performer: currScore < 4.60
      if (currCount > 0 && currScore < KpiMeta.ratingMinimo) {
        alerts.push({
          type: 'attention',
          title: 'Bajo la Meta Regional',
          tag: 'Atención',
          branch: b.nombre,
          icon: 'alert',
          desc: `${b.nombre} promedió ${currScore.toFixed(2)} ★, quedando por debajo del estándar mínimo de ${KpiMeta.ratingMinimo.toFixed(2)} ★.`
        });
      }

      // 3. Foco de Incidencias: highest negative count (if negativeCount > 0)
      if (negativeCount > 0 && negativeCount === maxNegativeCount) {
        alerts.push({
          type: 'critical',
          title: 'Foco de Incidencias',
          tag: 'Crítico',
          branch: b.nombre,
          icon: 'alert',
          desc: `${b.nombre} registró la mayor cantidad de quejas del periodo con ${negativeCount} reseña${negativeCount > 1 ? 's' : ''} crítica${negativeCount > 1 ? 's' : ''} (1-2 ★).`
        });
      }

      // 4. Quejas sin Respuesta: unrepliedCount > 0
      if (unrepliedCount > 0) {
        alerts.push({
          type: 'attention',
          title: 'Quejas sin Respuesta',
          tag: 'Pendiente',
          branch: b.nombre,
          icon: 'calendar',
          desc: `${b.nombre} cuenta con ${unrepliedCount} reseña${unrepliedCount > 1 ? 's' : ''} crítica${unrepliedCount > 1 ? 's' : ''} de clientes sin respuesta del propietario.`
        });
      }

      // 5. Líder Regional: score >= 4.80 y count >= 3
      if (currScore >= 4.80 && currCount >= 3) {
        alerts.push({
          type: 'optimal',
          title: 'Líder Regional',
          tag: 'Destacado',
          branch: b.nombre,
          icon: 'starFilled',
          desc: `${b.nombre} mantiene un nivel sobresaliente con un promedio de ${currScore.toFixed(2)} ★ en ${currCount} opiniones recibidas.`
        });
      }
    });

    // Fallback if no alerts
    if (alerts.length === 0) {
      alerts.push({
        type: 'optimal',
        title: 'Operación Estable',
        tag: 'Estable',
        branch: 'General GDL',
        icon: 'check',
        desc: 'Sin desviaciones críticas ni alertas de desempeño detectadas en las sucursales para este periodo.'
      });
    }

    const activeAlertsCount = alerts.filter(a => a.tag !== 'Estable').length;

    const alertsHtml = alerts.map(a => `
      <div class="proactive-alert-card ${a.type}">
        <div class="pac-header">
          <div class="pac-title-wrap">
            <span class="pac-icon">${svgIcon(a.icon)}</span>
            <span class="pac-branch">${a.branch}</span>
          </div>
          <span class="pac-tag">${a.tag}</span>
        </div>
        <p class="pac-desc">${a.desc}</p>
      </div>
    `).join('');

    const concluded = getConcludedMonthInfo();
    let concludedBannerHtml = '';
    if (concluded) {
      const monthName = MONTH_NAMES[concluded.month - 1];
      concludedBannerHtml = `
        <div class="concluded-month-banner" onclick="showConcludedMonthModal(${concluded.year}, ${concluded.month})">
          <span class="cmb-badge">Reporte Mensual</span>
          <div class="cmb-content-wrap">
            <span class="cmb-title">El mes de <strong>${monthName} ${concluded.year}</strong> ha finalizado. El resumen ejecutivo está listo.</span>
            <span class="cmb-link-btn">Ver Resumen →</span>
          </div>
        </div>
      `;
    }

    document.getElementById('app').innerHTML = `
      ${concludedBannerHtml}
      ${buildTopbar(false)}
      <section class="hero" style="padding:48px 22px;">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Visualización de Datos</span>
            </div>
            <h1 class="display" style="font-size:clamp(36px,8vw,64px);color:#FAF5EB;line-height:1.05;">
              Dashboards Analíticos
            </h1>
          </div>
          <div class="hero-right">
            <a href="#/trimestre/2026-Q1" class="reporte-especial-card">
              <div class="reporte-watermark">
                ${svgIcon('calendar')}
              </div>
              <div class="card-tag">Reporte Especial</div>
              <div class="card-title">Resumen Trimestral<br><span>Q1 2026</span></div>
              <span class="reporte-especial-btn">
                Ver reporte completo
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </a>
          </div>
        </div>
      </section>

      <div class="dashboard-controls-bar">
        <div class="controls-bar-left">
          <span class="controls-bar-title">Análisis Mensual</span>
          <span class="controls-bar-sub">Visualizando estadísticas de ${capitalizedCurrMonth} ${currYear}</span>
        </div>
        <div class="controls-bar-right">
          <div class="custom-select" id="dashMonthDropdown">
            <button class="custom-select-trigger" onclick="DashboardsView.toggleMonthDropdown(event)">
              <span class="custom-select-value">${capitalizedCurrMonth} ${currYear}</span>
              <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="custom-select-options">
              ${customOptionsHtml}
            </div>
          </div>
        </div>
      </div>

      <div class="home-grid-2">
        <section class="section r">
          <div class="section-head">
            <div class="section-title">Volumen de Reseñas <span class="accent">${capitalizedCurrMonth}</span></div>
            <span class="section-sub">${currGlobal.totalReviews} reseñas · Negativas vs Positivas/Neutrales</span>
          </div>
          <div class="chart-card"><div class="chart-wrap"><canvas id="volChart"></canvas></div></div>
        </section>

        <section class="section r">
          <div class="section-head">
            <div class="section-title">Ranking de Calificación <span class="accent">${capitalizedCurrMonth}</span></div>
            <span class="section-sub">Calificación promedio por sucursal en el mes.</span>
          </div>
          <div class="chart-card"><div class="chart-wrap"><canvas id="rankingChart"></canvas></div></div>
        </section>

        <section class="section r">
          <div class="section-head">
            <div class="section-title">Distribución de Estrellas <span class="accent">${capitalizedCurrMonth}</span></div>
            <span class="section-sub">Desglose de calificaciones de 1 a 5 estrellas.</span>
          </div>
          <div class="chart-card"><div class="chart-wrap"><canvas id="distChart"></canvas></div></div>
        </section>

        <section class="section r">
          <div class="section-head">
            <div class="section-title">Tendencia Regional <span class="accent">YTD</span></div>
            <span class="section-sub">Evolución de la calificación promedio regional durante el año.</span>
          </div>
          <div class="chart-card"><div class="chart-wrap"><canvas id="trendChart"></canvas></div></div>
        </section>
      </div>

      <div class="proactive-alerts-container">
        <div class="proactive-alerts-toggle-container">
          <button class="alerts-toggle-btn ${alerts.some(a => a.type === 'critical') ? 'has-critical' : ''}" data-count="${activeAlertsCount}" onclick="DashboardsView.toggleAlerts(event)">
            <span class="toggle-icon-wrap">${svgIcon('alert')}</span>
            <span class="toggle-text">Ver Alertas Operativas Proactivas (${activeAlertsCount})</span>
            <span class="toggle-arrow">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
        <div class="proactive-alerts-wrapper" id="proactiveAlertsWrapper">
          <h2 class="proactive-alerts-title">${svgIcon('alert')} Alertas Operativas Proactivas</h2>
          <div class="proactive-alerts-grid">
            ${alertsHtml}
          </div>
        </div>
      </div>

      <footer class="footer">
        <span class="brand" style="text-transform:none; font-family:var(--giaza); font-size:18px;">étoile</span> · La Crêpe Parisienne / Grupo MYT<br>
        Dashboard de Reseñas · Región ${activeRegion === 'GDL' ? 'Guadalajara' : 'CDMX'}
      </footer>`;

    setTimeout(() => {
      // Close custom select on clicking outside
      const _clickOutsideHandler = (e) => {
        const dropdown = document.getElementById('dashMonthDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      };
      document.removeEventListener('click', window._dashMonthDropdownOutsideHandler);
      window._dashMonthDropdownOutsideHandler = _clickOutsideHandler;
      document.addEventListener('click', _clickOutsideHandler);

      // Render Charts
      // 1. Volume Chart
      const sortedVol = [...branches].sort((a, b) => b.curr.count - a.curr.count);
      const ctxVol = document.getElementById('volChart')?.getContext('2d');
      if (ctxVol) {
        const labels = sortedVol.map(s => s.abr);
        const warnData = [];    // 1-2★
        const neutralData = []; // 3★
        const okData = [];      // 4-5★

        sortedVol.forEach(s => {
          const bReviews = DataLoader.getReviewsForBranch(currYear, currMonth, s.id);
          const negatives = bReviews.filter(r => r.stars <= 2).length;
          const neutrals = bReviews.filter(r => r.stars === 3).length;
          const positives = bReviews.filter(r => r.stars >= 4).length;

          warnData.push(negatives);
          neutralData.push(neutrals);
          okData.push(positives);
        });

        Charts.stackedVolume(ctxVol, labels, okData, neutralData, warnData);
      }

      // 2. Ranking Chart
      const sortedRating = [...branches].sort((a, b) => b.curr.score - a.curr.score);
      const ctxRanking = document.getElementById('rankingChart')?.getContext('2d');
      if (ctxRanking) {
        const labels = sortedRating.map(s => s.abr);
        const data = sortedRating.map(s => s.curr.score);
        const colors = sortedRating.map(s => {
          if (s.curr.count === 0) return darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
          return s.curr.score >= KpiMeta.ratingMinimo
            ? (darkMode ? 'rgba(122,158,138,0.85)' : 'rgba(61,90,71,0.85)')
            : (s.curr.score >= 4.0 
                ? (darkMode ? 'rgba(244,201,130,0.85)' : 'rgba(201,125,16,0.85)') 
                : (darkMode ? 'rgba(244,144,144,0.85)' : 'rgba(198,40,40,0.85)'));
        });
        Charts.barRanking(ctxRanking, labels, data, colors);
      }

      // 3. Distribution Chart
      const ctxDist = document.getElementById('distChart')?.getContext('2d');
      if (ctxDist) {
        const currMonthData = DataLoader.getMonth(currYear, currMonth);
        const currReviews = currMonthData ? currMonthData.reviews : [];
        const starCounts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1
        currReviews.forEach(r => {
          if (r.stars >= 1 && r.stars <= 5) {
            starCounts[5 - r.stars]++;
          }
        });
        const labels = ['5 ★', '4 ★', '3 ★', '2 ★', '1 ★'];
        const colors = darkMode 
          ? ['rgba(122,158,138,0.85)', 'rgba(137,173,152,0.7)', 'rgba(244,201,130,0.85)', 'rgba(244,160,144,0.85)', 'rgba(244,116,116,0.85)']
          : ['rgba(61,90,71,0.85)', 'rgba(122,158,138,0.7)', 'rgba(201,125,16,0.85)', 'rgba(178,58,43,0.85)', 'rgba(198,40,40,0.85)'];
        Charts.starDistributionBar(ctxDist, labels, starCounts, colors);
      }

      // 4. Trend Chart
      const ctxTrend = document.getElementById('trendChart')?.getContext('2d');
      if (ctxTrend) {
        const trendLabels = [];
        const trendData = [];
        for (const m of sortedMonths) {
          const monthName = MONTH_NAMES[m - 1].substring(0, 3);
          trendLabels.push(`${monthName} ${currYear}`);
          const d = DataLoader.getMonth(currYear, m);
          if (d && d.reviews && d.reviews.length > 0) {
            const avg = d.reviews.reduce((sum, r) => sum + r.stars, 0) / d.reviews.length;
            trendData.push(avg);
          } else {
            trendData.push(null);
          }
        }
        const color = darkMode ? '#7A9E8A' : '#3D5A47';
        Charts.lineTrend(ctxTrend, trendLabels, trendData, 'Promedio Regional', color);
      }
    }, 350);

    requestAnimationFrame(() => {
      initReveal();
    });
  },

  toggleAlerts(event) {
    const btn = event.currentTarget;
    const wrapper = document.getElementById('proactiveAlertsWrapper');
    if (!btn || !wrapper) return;

    const isExpanded = btn.classList.toggle('expanded');
    wrapper.classList.toggle('expanded');

    const textEl = btn.querySelector('.toggle-text');
    const count = btn.dataset.count || '0';

    if (isExpanded) {
      textEl.textContent = 'Ocultar Alertas Operativas Proactivas';
    } else {
      if (count === '0') {
        textEl.textContent = 'Ver Estado de Operación (Estable)';
      } else {
        textEl.textContent = `Ver Alertas Operativas Proactivas (${count})`;
      }
    }
  },

  toggleMonthDropdown(event) {
    event.stopPropagation();
    if (window.innerWidth < 600) {
      const currYear = DataLoader.currentYear;
      const currMonth = DataLoader.currentMonth;
      const availableMonths = DataLoader.manifest[currYear] || [];
      const sortedMonths = [...availableMonths].sort((a, b) => a - b);
      const options = sortedMonths.map(m => {
        const monthName = MONTH_NAMES[m - 1];
        const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        return {
          value: m,
          label: `${capMonth} ${currYear}`,
          active: m === currMonth
        };
      });
      showBottomSheet('Seleccionar Periodo', options, (val) => {
        DashboardsView.selectMonthOption(parseInt(val));
      });
    } else {
      const dropdown = document.getElementById('dashMonthDropdown');
      if (dropdown) {
        dropdown.classList.toggle('open');
      }
    }
  },

  async selectMonthOption(month) {
    const dropdown = document.getElementById('dashMonthDropdown');
    if (dropdown) {
      dropdown.classList.remove('open');
    }
    const currYear = DataLoader.currentYear;
    DataLoader.setMonth(currYear, month);

    // Asegurar que el mes seleccionado y todos los meses YTD estén cargados
    // antes de renderizar (pueden no estar en caché si no se habían visitado).
    const monthsToLoad = DataLoader.manifest[currYear] || [];
    await Promise.all(monthsToLoad.map(m => DataLoader.loadMonth(currYear, m)));

    await this.render();
    initReveal();
  }
};
