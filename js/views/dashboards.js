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
            <a href="#/trimestre/2026-Q1" class="chart-card highlight-box" style="display: flex; flex-direction: column; gap: 12px; text-decoration: none; align-items: flex-start; justify-content: center; height: 100%; border: 1px solid rgba(255,255,255,0.1) !important; background: rgba(255,255,255,0.05) !important;">
              <div class="watermark-stars" style="opacity: 0.15;">
                ${svgIcon('calendar')}
              </div>
              <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--sage);">Reporte Especial</div>
              <div style="font-family: var(--serif); font-size: 24px; line-height: 1.2;">Resumen Trimestral<br><span style="color:var(--crema); opacity:0.8;">Q1 2026</span></div>
              <span class="trend-badge" style="margin-top: 8px; background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.1); color: var(--crema);">Ver reporte completo →</span>
            </a>
          </div>
        </div>
      </section>

      <div class="home-grid-2" style="margin-top: 32px;">
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
        <span class="brand" style="text-transform:none; font-family:var(--serif); font-size:18px; font-style:italic;">étoile</span> · Grupo MYT / Grupo Corporativo Alancar<br>
        Dashboard de Reseñas · Región Guadalajara
      </footer>`;

    setTimeout(() => document.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%'), 350);

    const ctx = document.getElementById('volChart')?.getContext('2d');
    if (ctx) {
      const labels = sortedVol.map(s => s.abr);
      const warnData = sortedVol.map(s => s.curr.negativeCount);
      const okData = sortedVol.map(s => s.curr.count - s.curr.negativeCount);
      const maxTotal = Math.max(...sortedVol.map(s => s.curr.count)) + 2;
      Charts.stackedVolume(ctx, labels, okData, warnData, maxTotal);
    }
  }
};
