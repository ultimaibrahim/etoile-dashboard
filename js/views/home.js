/**
 * views/home.js — Vista principal: mes en curso vs anterior + KPIs.
 */

const HomeView = {
  filter: 'todas',

  async render() {
    Charts.destroyAll();
    const currYear = DataLoader.currentYear;
    const prevYear = DataLoader.previousYear;
    const currMonth = DataLoader.currentMonth;
    const prevMonth = DataLoader.previousMonth;

    await DataLoader.loadMonth(prevYear, prevMonth);
    await DataLoader.loadMonth(currYear, currMonth);

    const prevStats = DataLoader.getAllBranchStats(prevYear, prevMonth);
    const currStats = DataLoader.getAllBranchStats(currYear, currMonth);
    const prevGlobal = DataLoader.getGlobalStats(prevYear, prevMonth);
    const currGlobal = DataLoader.getGlobalStats(currYear, currMonth);

    const currMonthName = new Date(currYear, currMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const prevMonthName = new Date(prevYear, prevMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const capitalizedCurrMonth = currMonthName.charAt(0).toUpperCase() + currMonthName.slice(1);
    const capitalizedPrevMonth = prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1);
    const currMonthShort = capitalizedCurrMonth.substring(0, 3).toUpperCase();

    const branches = SUCURSALES_META.map(meta => {
      const p = prevStats[meta.id];
      const c = currStats[meta.id];
      const alerta = c.negativeCount > 0 || (c.avg > 0 && c.avg < KpiMeta.ratingMinimo);
      return {
        ...meta,
        prev: { score: p.avg, count: p.count },
        curr: { score: c.avg, count: c.count, negativeCount: c.negativeCount },
        alerta,
        statusMayo: alerta ? {
          negativas: c.negativeCount,
          tema: meta.alertTheme || 'Problemas operativos',
          detalle: `${c.negativeCount} reseña${c.negativeCount !== 1 ? 's' : ''} negativa${c.negativeCount !== 1 ? 's' : ''} en ${capitalizedCurrMonth.toLowerCase()}.`
        } : null
      };
    });

    const conAlerta = branches.filter(s => s.alerta);
    const sinAlerta = branches.filter(s => !s.alerta);
    const negativasMayo = conAlerta.reduce((a, s) => a + (s.statusMayo?.negativas || 0), 0);
    const promHistorico = (branches.reduce((a, s) => a + s.historico, 0) / branches.length).toFixed(2);

    let visible = branches;
    if (this.filter === 'alerta') visible = conAlerta;
    else if (this.filter === 'estables') visible = sinAlerta;

    const sorted = [...visible].sort((a, b) => {
      if (a.alerta !== b.alerta) return a.alerta ? -1 : 1;
      return b.curr.count - a.curr.count;
    });

    // KPIs
    const kpiData = await Kpis.computeMonth(currYear, currMonth);
    const kpiSection = this._buildKpiSection(kpiData, currGlobal, prevGlobal, capitalizedCurrMonth, currYear);

    const cards = sorted.map(s => {
      const delta = (s.curr.score - s.historico);
      const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
      const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      const currScoreStr = s.curr.score > 0 ? s.curr.score.toFixed(2) : '—';
      const mayoBlock = s.alerta
        ? `<div class="bc-mayo warn"><span class="mono">${currMonthShort}</span> <span>${s.statusMayo.negativas} negativa${s.statusMayo.negativas !== 1 ? 's' : ''}</span></div>`
        : `<div class="bc-mayo"><span class="mono">${currMonthShort}</span> <span>Sin incidencias</span></div>`;
      return `
      <a class="branch-card" href="#/sucursal/${s.id}">
        <div class="bc-top">
          <div class="bc-name">${s.abr}</div>
          <span class="bc-status ${s.alerta ? 'warn' : 'ok'}" title="${s.alerta ? 'Atención requerida' : 'Estable'}"></span>
        </div>
        <div class="bc-score-row">
          <span class="bc-score num">${currScoreStr}</span>
        </div>
        <div class="bc-stars-line">${s.curr.score > 0 ? starStr(Math.round(s.curr.score)) : '—'}</div>
        <div class="bc-meta">
          <span><strong>${s.curr.count}</strong> reseña${s.curr.count !== 1 ? 's' : ''} ${capitalizedCurrMonth.substring(0,3).toLowerCase()}</span>
          <span class="bc-delta ${dClass} num">${dStr} vs hist</span>
        </div>
        ${mayoBlock}
      </a>`;
    }).join('');



    document.getElementById('app').innerHTML = `
      ${buildTopbar()}
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Promedio Regional · ${capitalizedCurrMonth} ${currYear}</span>
            </div>
            <div class="hero-score">
              <span class="hero-score-num num" id="heroNum">${currGlobal.avgRating.toFixed(2)}</span>
              <div class="hero-score-side">
                <span class="hero-stars">${starStr(Math.round(currGlobal.avgRating))}</span>
                <span class="hero-of">de 5.00</span>
                <span class="hero-trend">${currGlobal.avgRating >= prevGlobal.avgRating ? '↑' : '↓'} ${Math.abs(currGlobal.avgRating - prevGlobal.avgRating).toFixed(2)} vs ${capitalizedPrevMonth} (${prevGlobal.avgRating.toFixed(2)})</span>
              </div>
            </div>
            <div class="hero-live"><span class="pulse-dot"></span> Datos en tiempo real · ${currGlobal.totalReviews} reseñas</div>
          </div>
          <div class="hero-right">
            <div class="hero-stat">
              <span class="hero-stat-val num">${currGlobal.totalReviews}</span>
              <div class="hero-stat-info">
                <span class="hero-stat-label">Reseñas ${capitalizedCurrMonth}</span>
                <span class="hero-stat-sub">${prevGlobal.totalReviews} en ${capitalizedPrevMonth.toLowerCase()}</span>
              </div>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-val num">${branches.length}</span>
              <div class="hero-stat-info">
                <span class="hero-stat-label">Sucursales activas</span>
                <span class="hero-stat-sub">Región Guadalajara</span>
              </div>
            </div>
            <div class="hero-stat warn">
              <span class="hero-stat-val num">${negativasMayo}</span>
              <div class="hero-stat-info">
                <span class="hero-stat-label">Negativas en ${capitalizedCurrMonth}</span>
                <span class="hero-stat-sub">${conAlerta.length} sucursal${conAlerta.length !== 1 ? 'es' : ''} con alerta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      ${negativasMayo > 0 ? `<div class="home-grid-2" style="margin-bottom: 24px; align-items: start;">
        <div class="alert-strip" style="margin-bottom: 0;">
          <div class="alert-icon-box">!</div>
          <div class="alert-content">
            <div class="alert-title">Alerta · ${capitalizedCurrMonth} ${currYear}</div>
            <div class="alert-text">${conAlerta.length} sucursales acumulan ${negativasMayo} reseñas negativas.</div>
            <div class="alert-pills">
              ${conAlerta.map(s => `<button class="alert-pill" onclick="HomeView.openAlertModal('${s.id}')">${s.abr} · ${s.statusMayo.negativas}</button>`).join('')}
            </div>
          </div>
        </div>
        ${this._buildHighlights(sorted, currYear, currMonth)}
      </div>` : `<div style="margin-bottom: 24px;">${this._buildHighlights(sorted, currYear, currMonth)}</div>`}
      ${kpiSection}

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Sucursales <span class="accent">por desempeño</span></div>
          <div class="filter-row">
            <button class="chip ${this.filter === 'todas' ? 'active' : ''}" onclick="HomeView.setFilter('todas')">Todas <span class="chip-count">${branches.length}</span></button>
            <button class="chip ${this.filter === 'alerta' ? 'active' : ''}" onclick="HomeView.setFilter('alerta')">Con alerta <span class="chip-count">${conAlerta.length}</span></button>
            <button class="chip ${this.filter === 'estables' ? 'active' : ''}" onclick="HomeView.setFilter('estables')">Estables <span class="chip-count">${sinAlerta.length}</span></button>
          </div>
        </div>
        <div class="branch-grid">${cards || '<div class="empty-state"><span class="glyph">—</span>Sin sucursales para este filtro</div>'}</div>
      </section>


      <footer class="footer">
        <span class="brand">La <span class="accent">Crêpe</span> Parisienne</span> · Grupo MYT / Grupo Corporativo Alancar<br>
        Dashboard de Reseñas · Región Guadalajara · Fuente: Google Reviews
      </footer>`;

    requestAnimationFrame(() => document.getElementById('heroNum')?.classList.add('in'));
  },

  _buildKpiSection(kpi, curr, prev, monthName, year) {
    const volClass = kpi.volumen.ok >= kpi.volumen.total ? 'optimal' : 'attention';
    const calClass = kpi.calidadTexto.ratio >= KpiMeta.calidadTextoMeta ? 'optimal' : 'attention';
    const ratClass = kpi.ratingMinimo.belowMin.length === 0 ? 'optimal' : 'critical';
    const belowNames = kpi.ratingMinimo.belowMin.map(id => {
      const b = getBranchById(id);
      return b ? b.abr : id;
    }).join(', ');

    return `
      <section class="section r">
        <div class="section-head">
          <div class="section-title">KPIs <span class="accent">${monthName} ${year}</span></div>
          <span class="section-sub">Seguimiento vs metas definidas</span>
        </div>
        <div class="scorecard-grid">
          <div class="scorecard">
            <div class="sc-label">Volumen de reseñas</div>
            <div class="sc-value num">${kpi.volumen.ok}/${kpi.volumen.total}</div>
            <div class="sc-sub">Meta: ≥${kpi.volumen.meta} por sucursal</div>
            <span class="badge badge-${volClass}">${volClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
          </div>
          <div class="scorecard">
            <div class="sc-label">Calidad de reseña</div>
            <div class="sc-value num">${(kpi.calidadTexto.ratio * 100).toFixed(0)}%</div>
            <div class="sc-sub">Meta: ≥${(KpiMeta.calidadTextoMeta * 100).toFixed(0)}% con texto</div>
            <span class="badge badge-${calClass}">${calClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
          </div>
          <div class="scorecard">
            <div class="sc-label">Rating mínimo regional</div>
            <div class="sc-value num">${kpi.ratingMinimo.belowMin.length === 0 ? 'OK' : kpi.ratingMinimo.belowMin.length}</div>
            <div class="sc-sub">Meta: ninguna < ${KpiMeta.ratingMinimo}</div>
            <span class="badge badge-${ratClass}">${ratClass === 'optimal' ? 'Cumple' : 'Crítico'}</span>
            ${kpi.ratingMinimo.belowMin.length > 0 ? `<div style="margin-top:6px;font-size:11px;color:var(--alerta);">${belowNames}</div>` : ''}
          </div>
          <div class="scorecard">
            <div class="sc-label">Resolución causa raíz</div>
            <div class="sc-value num">${kpi.negativas}</div>
            <div class="sc-sub">Negativas mes en curso</div>
            <span class="badge badge-${kpi.negativas === 0 ? 'optimal' : 'attention'}">${kpi.negativas === 0 ? 'Sin incidencias' : 'Revisar'}</span>
          </div>
        </div>
      </section>`;
  },

  async setFilter(f) {
    this.filter = f;
    await this.render();
    initReveal();
  },

  _buildHighlights(branches, year, month) {
    const data = DataLoader.getMonth(year, month);
    if (!data) return '';
    const tops = branches.filter(s => s.curr.score >= 4.80).map(s => s.abr);
    const goodReviews = data.reviews.filter(r => r.stars === 5 && r.text && r.text.length > 30);
    if (goodReviews.length === 0) return '';
    const randomGood = goodReviews[Math.floor(Math.random() * goodReviews.length)];
    return `<div class="chart-card" style="background: var(--verde-deep); color: var(--crema); border: none;">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--sage); margin-bottom: 8px;">Lo más destacado</div>
      <div style="font-family: var(--serif); font-size: 20px; font-style: italic; line-height: 1.4; margin-bottom: 12px;">"${randomGood.text}"</div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 500;">— ${randomGood.sucursal}</span>
        <span style="color: var(--optima);">${starStr(5)}</span>
      </div>
    </div>`;
  },

  openAlertModal(branchId) {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;

    const branchMeta = SUCURSALES_META.find(s => s.id === branchId);
    if (!branchMeta) return;

    const names = [branchMeta.nombre, branchMeta.abr, branchMeta.id === 'gal-gdl' ? 'Galerías GDL' : '', branchMeta.id === 'sta-anita' ? 'Galerías Santa Anita' : ''].filter(Boolean);
    const negatives = data.reviews.filter(r => r.stars <= 3 && names.includes(r.sucursal));

    const modalHtml = `
      <div class="modal-overlay active" id="alertModal">
        <div class="modal-box">
          <div class="modal-header">
            <h2 class="modal-title">Alertas: ${branchMeta.abr}</h2>
            <button class="modal-close" onclick="document.getElementById('alertModal').remove()">×</button>
          </div>
          <div class="modal-body">
            ${negatives.length === 0 ? '<p>No hay reseñas negativas con texto.</p>' : ''}
            ${negatives.map(r => `
              <div class="review-item">
                <div class="ri-head">
                  <div class="ri-score" style="color: var(--alerta)">${starStr(r.stars)}</div>
                  <div class="ri-date">${formatDate(r.publishedAtDate)}</div>
                </div>
                ${r.text ? `<div class="ri-text">"${r.text}"</div>` : `<div class="ri-text" style="color:var(--text-muted);font-style:italic;">(Sin comentario)</div>`}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
};
