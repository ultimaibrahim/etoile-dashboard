/**
 * views/quarter.js — Vista trimestral con acordeón, ranking y comparativas.
 */

const QuarterView = {
  async render(params) {
    const qParam = parseQuarterParam(params.q || '2026-Q1');
    if (!qParam) {
      Router.navigate('#/');
      return;
    }

    const { year, quarter } = qParam;
    const months = getQuarterMonths(quarter);

    // Cargar todos los meses del trimestre
    for (const m of months) {
      await DataLoader.loadMonth(year, m);
    }

    // Cargar trimestre anterior para comparativa
    const prevQ = quarter > 1 ? quarter - 1 : null;
    const prevMonths = prevQ ? getQuarterMonths(prevQ) : [];
    for (const m of prevMonths) {
      if (DataLoader.hasMonth(year, m)) {
        await DataLoader.loadMonth(year, m);
      }
    }

    // Ranking del trimestre
    const branchQStats = SUCURSALES_META.map(meta => {
      let totalStars = 0, totalCount = 0, totalNeg = 0;
      const monthVals = [];
      for (const m of months) {
        const stats = DataLoader.computeBranchStats(year, m, meta.id);
        totalStars += stats.avg * stats.count;
        totalCount += stats.count;
        totalNeg += stats.negativeCount;
        monthVals.push({ month: m, avg: stats.avg, count: stats.count });
      }
      const qAvg = totalCount > 0 ? totalStars / totalCount : 0;
      // Get best and worst review of the quarter
      let allRevs = [];
      for (const m of months) {
        allRevs = allRevs.concat(DataLoader.getReviewsForBranch(year, m, meta.id));
      }
      const best = allRevs.length ? allRevs.reduce((a, b) => a.stars >= b.stars ? a : b) : null;
      const worst = allRevs.length ? allRevs.reduce((a, b) => a.stars <= b.stars ? a : b) : null;
      return { ...meta, qAvg, totalCount, totalNeg, monthVals, best, worst };
    }).sort((a, b) => b.qAvg - a.qAvg);

    // Quarter comparison
    let prevQAvg = null;
    if (prevQ) {
      let pStars = 0, pCount = 0;
      for (const m of prevMonths) {
        const g = DataLoader.getGlobalStats(year, m);
        pStars += g.avgRating * g.totalReviews;
        pCount += g.totalReviews;
      }
      prevQAvg = pCount > 0 ? pStars / pCount : 0;
    }

    const currQTotal = branchQStats.reduce((a, b) => a + b.totalCount, 0);
    const currQAvg = branchQStats.reduce((a, b) => a + b.qAvg * b.totalCount, 0) / (currQTotal || 1);

    const rankingRows = branchQStats.map((s, i) => {
      const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const delta = s.qAvg - s.historico;
      const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
      const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      const status = s.qAvg >= 4.8 ? 'optimal' : s.qAvg >= 4.5 ? 'attention' : 'critical';
      return `
        <tr>
          <td><span class="rank-badge ${rankCls}">${i + 1}</span></td>
          <td><strong>${s.nombre}</strong></td>
          <td class="num">${s.qAvg.toFixed(2)}</td>
          <td class="num">${s.totalCount}</td>
          <td class="num">${s.totalNeg}</td>
          <td><span class="badge badge-${status}">${Kpis.statusLabel(status)}</span></td>
          <td class="num"><span class="sc-delta ${dClass}">${dStr}</span></td>
        </tr>`;
    }).join('');

    const evolutionRows = branchQStats.map(s => {
      const cells = s.monthVals.map(mv => {
        const val = mv.count > 0 ? mv.avg.toFixed(2) : '—';
        return `<td class="num">${val}</td>`;
      }).join('');
      const prevCells = prevMonths.map(pm => {
        const stats = DataLoader.computeBranchStats(year, pm, s.id);
        const val = stats.count > 0 ? stats.avg.toFixed(2) : '—';
        return `<td class="num" style="color:var(--text-dim);">${val}</td>`;
      }).join('');
      return `<tr><td><strong>${s.abr}</strong></td>${prevCells}${cells}<td class="num" style="font-weight:700;">${s.qAvg.toFixed(2)}</td></tr>`;
    }).join('');

    const prevHeaders = prevMonths.map(m => `<th class="num">${MONTH_NAMES[m - 1]}</th>`).join('');
    const currHeaders = months.map(m => `<th class="num">${MONTH_NAMES[m - 1]}</th>`).join('');

    // Accordion content for each branch
    const accordionItems = branchQStats.map((s, i) => {
      const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const bestBlock = s.best ? `
        <div class="quote-block">
          <div class="quote-meta">★ ${s.best.stars} · ${s.best.sucursal} · ${formatDate(s.best.publishedAtDate)}</div>
          "${s.best.text.substring(0, 200)}${s.best.text.length > 200 ? '...' : ''}"
        </div>` : '<p style="color:var(--text-muted);font-size:13px;">Sin reseñas destacadas</p>';
      const worstBlock = s.worst && s.worst.stars <= 2 ? `
        <div class="quote-block warn">
          <div class="quote-meta">★ ${s.worst.stars} · ${s.worst.sucursal} · ${formatDate(s.worst.publishedAtDate)}</div>
          "${s.worst.text.substring(0, 200)}${s.worst.text.length > 200 ? '...' : ''}"
        </div>` : '';
      return `
        <div class="accordion-item">
          <div class="accordion-header" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.accordion-chevron').classList.toggle('open')">
            <div>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="rank-badge ${rankCls}">${i + 1}</span>
                <span class="accordion-title">${s.nombre}</span>
              </div>
              <div class="accordion-sub">${s.totalCount} reseñas · Promedio ${s.qAvg.toFixed(2)} · ${s.totalNeg} negativas</div>
            </div>
            <span class="accordion-chevron">▾</span>
          </div>
          <div class="accordion-body">
            <div style="display:grid;gap:12px;margin-bottom:16px;">
              <div class="scorecard-grid" style="grid-template-columns:repeat(3,1fr);gap:10px;">
                <div class="scorecard" style="padding:14px;">
                  <div class="sc-label">Promedio Q${quarter}</div>
                  <div class="sc-value num ${s.qAvg >= 4.8 ? 'gold' : s.qAvg >= 4.5 ? '' : 'down'}">${s.qAvg.toFixed(2)}</div>
                </div>
                <div class="scorecard" style="padding:14px;">
                  <div class="sc-label">Reseñas</div>
                  <div class="sc-value num">${s.totalCount}</div>
                </div>
                <div class="scorecard" style="padding:14px;">
                  <div class="sc-label">Δ vs Histórico</div>
                  <div class="sc-value num ${(s.qAvg - s.historico) > 0 ? 'up' : 'down'}">${(s.qAvg - s.historico) > 0 ? '+' : ''}${(s.qAvg - s.historico).toFixed(2)}</div>
                </div>
              </div>
              <div>
                <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);font-weight:700;margin-bottom:8px;">Mejor reseña del trimestre</div>
                ${bestBlock}
              </div>
              ${worstBlock ? `<div>
                <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--alerta);font-weight:700;margin-bottom:8px;">Peor reseña del trimestre</div>
                ${worstBlock}
              </div>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');

    document.getElementById('app').innerHTML = `
      ${buildTopbar(true, `Trimestre Q${quarter} 2026`)}
      <section class="hero" style="padding:48px 22px;">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Comparativa Trimestral</span>
            </div>
            <h1 class="display" style="font-size:clamp(48px,10vw,96px);color:var(--crema);line-height:1;">Q${quarter} 2026</h1>
            <div style="display:flex;gap:18px;margin-top:18px;flex-wrap:wrap;">
              <div class="hero-stat" style="background:rgba(245,239,230,.06);border:1px solid rgba(245,239,230,.1);border-radius:12px;padding:14px 16px;">
                <span class="hero-stat-val num">${currQAvg.toFixed(2)}</span>
                <div class="hero-stat-info">
                  <span class="hero-stat-label">Promedio regional</span>
                </div>
              </div>
              <div class="hero-stat" style="background:rgba(245,239,230,.06);border:1px solid rgba(245,239,230,.1);border-radius:12px;padding:14px 16px;">
                <span class="hero-stat-val num">${currQTotal}</span>
                <div class="hero-stat-info">
                  <span class="hero-stat-label">Reseñas totales</span>
                </div>
              </div>
              ${prevQAvg ? `
              <div class="hero-stat" style="background:rgba(245,239,230,.06);border:1px solid rgba(245,239,230,.1);border-radius:12px;padding:14px 16px;">
                <span class="hero-stat-val num">${prevQAvg.toFixed(2)}</span>
                <div class="hero-stat-info">
                  <span class="hero-stat-label">Q${prevQ} anterior</span>
                  <span class="hero-stat-sub">Δ ${(currQAvg - prevQAvg) > 0 ? '+' : ''}${(currQAvg - prevQAvg).toFixed(2)}</span>
                </div>
              </div>` : ''}
            </div>
          </div>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Ranking <span class="accent">Q${quarter}</span></div>
        </div>
        <div class="chart-card" style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Sucursal</th>
                <th class="num">Promedio</th>
                <th class="num">Reseñas</th>
                <th class="num">Negativas</th>
                <th>Estado</th>
                <th class="num">Δ Hist</th>
              </tr>
            </thead>
            <tbody>
              ${rankingRows}
            </tbody>
          </table>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Evolución <span class="accent">mensual</span></div>
        </div>
        <div class="chart-card" style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sucursal</th>
                ${prevHeaders}
                ${currHeaders}
                <th class="num">Prom Q${quarter}</th>
              </tr>
            </thead>
            <tbody>
              ${evolutionRows}
            </tbody>
          </table>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Detalle <span class="accent">por sucursal</span></div>
        </div>
        ${accordionItems}
      </section>

      <footer class="footer">
        <span class="brand">La <span class="accent">Crêpe</span> Parisienne</span> · Dashboard de Reseñas<br>
        Región Guadalajara
      </footer>`;
  }
};
