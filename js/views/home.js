/**
 * views/home.js — Vista principal: mes en curso vs anterior + KPIs.
 */

const HomeView = {
  filter: 'todas',

  async render() {
    Charts.destroyAll();
    // Cargar todos los meses disponibles
    for (const m of DataLoader.manifest['2026']) {
      await DataLoader.loadMonth(2026, m);
    }

    const prevMonth = 4; // Abril
    const currMonth = 5; // Mayo

    const prevStats = DataLoader.getAllBranchStats(2026, prevMonth);
    const currStats = DataLoader.getAllBranchStats(2026, currMonth);
    const prevGlobal = DataLoader.getGlobalStats(2026, prevMonth);
    const currGlobal = DataLoader.getGlobalStats(2026, currMonth);

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
          detalle: `${c.negativeCount} reseña${c.negativeCount !== 1 ? 's' : ''} negativa${c.negativeCount !== 1 ? 's' : ''} en mayo.`
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
    const kpiData = await Kpis.computeMonth(2026, currMonth);
    const kpiSection = this._buildKpiSection(kpiData, currGlobal, prevGlobal);

    const cards = sorted.map(s => {
      const delta = (s.curr.score - s.historico);
      const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
      const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      const currScoreStr = s.curr.score > 0 ? s.curr.score.toFixed(2) : '—';
      const mayoBlock = s.alerta
        ? `<div class="bc-mayo warn"><span class="mono">MAY</span> <span>${s.statusMayo.negativas} negativa${s.statusMayo.negativas !== 1 ? 's' : ''}</span></div>`
        : `<div class="bc-mayo"><span class="mono">MAY</span> <span>Sin incidencias</span></div>`;
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
          <span><strong>${s.curr.count}</strong> reseña${s.curr.count !== 1 ? 's' : ''} may</span>
          <span class="bc-delta ${dClass} num">${dStr} vs hist</span>
        </div>
        ${mayoBlock}
      </a>`;
    }).join('');

    const trends = [...branches].sort((a, b) => b.curr.count - a.curr.count).map(s => {
      const pH = Math.max(0, ((s.historico - 3.5) / 1.5 * 100));
      const pC = Math.max(0, ((s.curr.score - 3.5) / 1.5 * 100));
      const delta = s.curr.score > 0 ? (s.curr.score - s.historico).toFixed(2) : '0.00';
      const dClass = Number(delta) > 0 ? 'up' : 'flat';
      const dStr = Number(delta) > 0 ? `+${delta}` : delta;
      const currVal = s.curr.score > 0 ? s.curr.score.toFixed(2) : '—';
      return `<div class="trend-row">
        <div class="trend-row-header">
          <span class="name">${s.abr}</span>
          <span class="vals num">
            ${s.historico.toFixed(1)} → <span class="now">${currVal}</span>
            <span class="delta ${dClass}">${dStr}</span>
          </span>
        </div>
        <div class="trend-stack">
          <div class="trend-track"><div class="bar-fill bar-hist" data-w="${pH.toFixed(1)}"></div></div>
          <div class="trend-track"><div class="bar-fill bar-curr" data-w="${pC.toFixed(1)}"></div></div>
        </div>
      </div>`;
    }).join('');

    document.getElementById('app').innerHTML = `
      ${buildTopbar()}
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Promedio Regional · Mayo 2026</span>
            </div>
            <div class="hero-score">
              <span class="hero-score-num num" id="heroNum">${currGlobal.avgRating.toFixed(2)}</span>
              <div class="hero-score-side">
                <span class="hero-stars">${starStr(Math.round(currGlobal.avgRating))}</span>
                <span class="hero-of">de 5.00</span>
                <span class="hero-trend">${currGlobal.avgRating >= prevGlobal.avgRating ? '↑' : '↓'} ${Math.abs(currGlobal.avgRating - prevGlobal.avgRating).toFixed(2)} vs Abril (${prevGlobal.avgRating.toFixed(2)})</span>
              </div>
            </div>
            <div class="hero-live"><span class="pulse-dot"></span> Datos en tiempo real · ${currGlobal.totalReviews} reseñas</div>
          </div>
          <div class="hero-right">
            <div class="hero-stat">
              <span class="hero-stat-val num">${currGlobal.totalReviews}</span>
              <div class="hero-stat-info">
                <span class="hero-stat-label">Reseñas Mayo</span>
                <span class="hero-stat-sub">${prevGlobal.totalReviews} en abril</span>
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
                <span class="hero-stat-label">Negativas en Mayo</span>
                <span class="hero-stat-sub">${conAlerta.length} sucursal${conAlerta.length !== 1 ? 'es' : ''} con alerta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      ${kpiSection}

      ${negativasMayo > 0 ? `<div class="alert-strip">
        <div class="alert-icon-box">!</div>
        <div class="alert-content">
          <div class="alert-title">Alerta · Mayo 2026 · primeros 11 días</div>
          <div class="alert-text">${conAlerta.length} sucursales acumulan ${negativasMayo} reseñas negativas. Patrón común: <strong>calidad de ingredientes</strong> y <strong>errores en pedidos</strong>.</div>
          <div class="alert-pills">
            ${conAlerta.map(s => `<span class="alert-pill">${s.abr} · ${s.statusMayo.negativas}</span>`).join('')}
          </div>
        </div>
      </div>` : ''}

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

      <div class="home-grid-2">
        <section class="section r">
          <div class="section-head">
            <div class="section-title">Histórico <span class="accent">vs</span> Mayo 2026</div>
          </div>
          <div class="chart-card">
            <div class="legend">
              <div class="legend-item"><span class="legend-swatch hist"></span> Histórico (anual)</div>
              <div class="legend-item"><span class="legend-swatch curr"></span> Mayo 2026</div>
            </div>
            ${trends}
          </div>
        </section>

        <section class="section r">
          <div class="section-head">
            <div class="section-title">Volumen <span class="accent">Mayo</span></div>
            <span class="section-sub">${currGlobal.totalReviews} reseñas · ${branches.length} sucursales</span>
          </div>
          <div class="chart-card"><div class="chart-wrap"><canvas id="volChart"></canvas></div></div>
        </section>
      </div>

      <footer class="footer">
        <span class="brand">La <span class="accent">Crêpe</span> Parisienne</span> · Grupo MYT / Grupo Corporativo Alancar<br>
        Dashboard de Reseñas · Región Guadalajara · Fuente: Google Reviews
      </footer>`;

    requestAnimationFrame(() => document.getElementById('heroNum')?.classList.add('in'));
    setTimeout(() => document.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%'), 350);

    const ctx = document.getElementById('volChart')?.getContext('2d');
    if (ctx) {
      const sortedVol = [...branches].sort((a, b) => b.curr.count - a.curr.count);
      Charts.barVolume(
        ctx,
        sortedVol.map(s => s.abr),
        sortedVol.map(s => s.curr.count),
        sortedVol.map((s, i) => {
          if (s.alerta) return darkMode ? 'rgba(244,160,144,0.75)' : 'rgba(178,58,43,0.7)';
          return i === 0
            ? (darkMode ? 'rgba(181,207,195,0.9)' : 'rgba(47,74,58,0.88)')
            : (darkMode ? 'rgba(122,158,138,0.55)' : 'rgba(107,144,125,0.55)');
        })
      );
    }
  },

  _buildKpiSection(kpi, curr, prev) {
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
          <div class="section-title">KPIs <span class="accent">Mayo 2026</span></div>
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
  }
};
