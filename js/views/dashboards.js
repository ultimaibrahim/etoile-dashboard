/**
 * views/dashboards.js — Vista de gráficas: YTD y Volumen con Stacked Bar
 */

const DashboardsView = {
  async render() {
    Charts.destroyAll();
    const currYear = DataLoader.currentYear;
    const currMonth = DataLoader.currentMonth;

    // Load YTD data for current year
    let ytdReviews = [];
    if (DataLoader.manifest && DataLoader.manifest[currYear]) {
      for (const m of DataLoader.manifest[currYear]) {
        const d = await DataLoader.loadMonth(currYear, m);
        if (d && d.reviews) {
          ytdReviews = ytdReviews.concat(d.reviews);
        }
      }
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

    const sortedVol = [...branches].sort((a, b) => b.curr.count - a.curr.count);

    const trends = [...branches].sort((a, b) => b.curr.count - a.curr.count).map(s => {
      const pYtd = Math.max(0, ((s.ytd.avg - 1.0) / 4.0 * 100));
      const pC = Math.max(0, ((s.curr.score - 1.0) / 4.0 * 100));
      const delta = s.curr.score > 0 && s.ytd.avg > 0 ? (s.curr.score - s.ytd.avg).toFixed(2) : '0.00';
      const dClass = Number(delta) > 0 ? 'up' : 'flat';
      const dStr = Number(delta) > 0 ? `+${delta}` : delta;
      const currVal = s.curr.score > 0 ? s.curr.score.toFixed(2) : '—';
      const ytdVal = s.ytd.avg > 0 ? s.ytd.avg.toFixed(2) : '—';
      return `<div class="trend-row">
        <div class="trend-row-header">
          <span class="name">${s.abr}</span>
          <span class="vals num">
            ${ytdVal} → <span class="now">${currVal}</span>
            <span class="delta ${dClass}">${dStr}</span>
          </span>
        </div>
        <div class="trend-stack">
          <div class="trend-track"><div class="bar-fill bar-hist" data-w="${pYtd.toFixed(1)}"></div></div>
          <div class="trend-track"><div class="bar-fill bar-curr" data-w="${pC.toFixed(1)}"></div></div>
        </div>
      </div>`;
    }).join('');

    document.getElementById('app').innerHTML = `
      ${buildTopbar(false)}
      <section class="hero" style="padding:48px 22px;">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Visualización de Datos</span>
            </div>
            <h1 class="display" style="font-size:clamp(36px,8vw,64px);color:var(--crema);line-height:1.05;">
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

      <div class="home-grid-2" style="margin-top: 24px;">
        <section class="section r">
          <div class="section-head" style="display:flex; justify-content:space-between; align-items:flex-end; gap:16px;">
            <div>
              <div class="section-title">Volumen <span class="accent">${capitalizedCurrMonth}</span></div>
              <span class="section-sub">${currGlobal.totalReviews} reseñas · Negativas vs Positivas/Neutrales</span>
            </div>
          </div>
          <div class="chart-card"><div class="chart-wrap"><canvas id="volChart"></canvas></div></div>
        </section>

        <section class="section r">
          <div class="section-head">
            <div class="section-title">Acumulado (YTD) <span class="accent">vs</span> ${capitalizedCurrMonth}</div>
            <span class="section-sub">Comparativa del desempeño del mes contra el promedio del año actual.</span>
          </div>
          <div class="chart-card">
            <div class="legend">
              <div class="legend-item"><span class="legend-swatch hist"></span> YTD ${currYear}</div>
              <div class="legend-item"><span class="legend-swatch curr"></span> ${capitalizedCurrMonth} ${currYear}</div>
            </div>
            ${trends}
          </div>
        </section>
      </div>

      <footer class="footer">
        <span class="brand" style="text-transform:none; font-family:var(--giaza); font-size:18px;">étoile</span> · La Crêpe Parisienne / Grupo MYT<br>
        Dashboard de Reseñas · Región Guadalajara
      </footer>`;

    setTimeout(() => {
      document.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%');

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
    }, 350);

    const ctx = document.getElementById('volChart')?.getContext('2d');
    if (ctx) {
      const labels = sortedVol.map(s => s.abr);
      const warnData = sortedVol.map(s => s.curr.negativeCount);
      const okData = sortedVol.map(s => s.curr.count - s.curr.negativeCount);
      const maxTotal = Math.max(...sortedVol.map(s => s.curr.count)) + 2;
      Charts.stackedVolume(ctx, labels, okData, warnData, maxTotal);
    }

    requestAnimationFrame(() => {
      initReveal();
    });
  },

  toggleMonthDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('dashMonthDropdown');
    if (dropdown) {
      dropdown.classList.toggle('open');
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
