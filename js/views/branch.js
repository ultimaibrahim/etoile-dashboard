/**
 * views/branch.js — Vista de sucursal con selector de mes, scorecard de KPIs y reseñas mensuales.
 */

const BranchView = {
  activeYear: 2026,
  activeMonth: null,

  async render(params) {
    const meta = getBranchById(params.id);
    if (!meta) {
      Router.navigate('#/');
      return;
    }

    if (!this.activeMonth) {
      this.activeMonth = DataLoader.currentMonth;
    }

    // Asegurar carga de los meses
    const availableMonths = DataLoader.manifest[this.activeYear] || [];
    for (const m of availableMonths) {
      await DataLoader.loadMonth(this.activeYear, m);
    }

    const reviews = DataLoader.getReviewsForBranch(this.activeYear, this.activeMonth, meta.id);
    const stats = DataLoader.computeBranchStats(this.activeYear, this.activeMonth, meta.id);
    const q1Info = Q1_DATA.branches[meta.id] || null;

    const monthName = new Date(this.activeYear, this.activeMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const delta = stats.avg > 0 ? (stats.avg - meta.historico) : 0;
    const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
    const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';

    // Evaluación de KPIs (Scorecard)
    const kpiVolClass = stats.count >= KpiMeta.volumenMeta ? 'optimal' : 'attention';
    const hasTextRatio = stats.count > 0 ? (reviews.filter(r => r.text && r.text.length > 5).length / stats.count) : 0;
    const kpiCalClass = hasTextRatio >= KpiMeta.calidadTextoMeta ? 'optimal' : 'attention';
    const kpiRatClass = stats.avg >= KpiMeta.ratingMinimo || stats.avg === 0 ? 'optimal' : 'critical';

    const scorecardSection = `
      <div class="scorecard-grid" style="margin-bottom:14px;">
        <div class="scorecard">
          <div class="sc-label">Volumen de reseñas</div>
          <div class="sc-value num">${stats.count}</div>
          <div class="sc-sub">Meta: ≥${KpiMeta.volumenMeta} nuevas</div>
          <span class="badge badge-${kpiVolClass}">${kpiVolClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
        </div>
        <div class="scorecard">
          <div class="sc-label">Calidad de reseña</div>
          <div class="sc-value num">${(hasTextRatio * 100).toFixed(0)}%</div>
          <div class="sc-sub">Meta: ≥${(KpiMeta.calidadTextoMeta * 100).toFixed(0)}% con texto</div>
          <span class="badge badge-${kpiCalClass}">${kpiCalClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
        </div>
        <div class="scorecard">
          <div class="sc-label">Rating Mensual</div>
          <div class="sc-value num">${stats.avg > 0 ? stats.avg.toFixed(2) : '—'}</div>
          <div class="sc-sub">Meta: ≥${KpiMeta.ratingMinimo.toFixed(2)}</div>
          <span class="badge badge-${kpiRatClass}">${kpiRatClass === 'optimal' ? 'Cumple' : 'Crítico'}</span>
        </div>
        <div class="scorecard">
          <div class="sc-label">Δ vs Histórico (${meta.historico.toFixed(1)})</div>
          <div class="sc-value num ${dClass}">${stats.avg > 0 ? dStr : '—'}</div>
          <div class="sc-sub">${dClass === 'up' ? '↑ Mejora' : dClass === 'down' ? '↓ Caída' : '→ Estable'}</div>
        </div>
      </div>`;

    // Dynamic Insights
    const dynamic = computeDynamicInsights(reviews);
    const insightsHtml = this._buildInsights(meta, reviews, stats);
    const problemSection = dynamic.problemas.length > 0 ? `
      <div class="status-warn-box" style="margin-bottom:14px;">
        <div class="topic">Alerta: ${dynamic.alertTheme}</div>
        <ul class="problem-list">
          ${dynamic.problemas.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>` : `<div class="status-ok-box" style="margin-bottom:14px;">
        <div class="check">✓</div>
        <div class="ok-text">
          <strong>Estable</strong>
          Sin incidencias recurrentes de gravedad en este periodo.
        </div>
      </div>`;

    const selectorOptions = availableMonths.map(m => {
      const name = new Date(this.activeYear, m - 1).toLocaleString('es-ES', { month: 'long' });
      const capName = name.charAt(0).toUpperCase() + name.slice(1);
      return `<option value="${m}" ${m === this.activeMonth ? 'selected' : ''}>${capName} ${this.activeYear}</option>`;
    }).join('');

    document.getElementById('app').innerHTML = `
      ${buildTopbar(true, meta.nombre)}
      <section class="branch-hero">
        <div class="bh-eyebrow">
          <span>Guadalajara</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <h1 class="bh-name">${meta.nombre}</h1>
          <select id="monthSelect" style="padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-family: var(--sans); font-weight: 500; font-size: 14px; outline: none; cursor: pointer;">
            ${selectorOptions}
          </select>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Scorecard <span class="accent">${capitalizedMonth}</span></div>
          <span class="section-sub">Evaluación de KPIs operativos</span>
        </div>
        ${scorecardSection}
        ${problemSection}
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Insights <span class="accent">${capitalizedMonth}</span></div>
        </div>
        <div class="insight-grid">${insightsHtml}</div>
      </section>

      <section class="section r">
        <div class="section-head" style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div class="section-title">Reseñas</div>
            <span class="section-sub">${reviews.length} verificadas en ${capitalizedMonth}</span>
          </div>
        </div>
        <div class="reviews-panel">
          <div class="reviews-list" id="revList">${this._buildRevList(reviews.slice(0, 5))}</div>
          ${reviews.length > 5 ? `<button class="show-all-btn" id="showAllBtn">Mostrar todas las ${reviews.length} reseñas ↓</button>` : ''}
        </div>
      </section>

      <footer class="footer">
        <span class="brand">La <span class="accent">Crêpe</span> Parisienne</span> · ${meta.nombre}<br>
        Dashboard de Reseñas · Región Guadalajara
      </footer>`;

    document.getElementById('monthSelect').onchange = async (e) => {
      this.activeMonth = parseInt(e.target.value);
      await this.render(params);
      initReveal();
    };

    const btn = document.getElementById('showAllBtn');
    if (btn) {
      let exp = false;
      btn.onclick = () => {
        exp = !exp;
        document.getElementById('revList').innerHTML = this._buildRevList(exp ? reviews : reviews.slice(0, 5));
        btn.textContent = exp ? '↑ Mostrar menos' : `Mostrar todas las ${reviews.length} reseñas ↓`;
      };
    }
  },

  _buildInsights(meta, reviews, stats) {
    const allText = reviews.map(r => r.text ? r.text.toLowerCase() : '').join(' ');
    const items = [];
    const delta = stats.avg > 0 ? (stats.avg - meta.historico).toFixed(2) : '0.00';
    const trendTxt = Number(delta) > 0
      ? `+${delta} sobre histórico (${meta.historico.toFixed(1)})`
      : Number(delta) < 0
        ? `${delta} bajo histórico`
        : `Sin cambio vs ${meta.historico.toFixed(1)}`;
    items.push({ m: 'Δ', label: 'Tendencia', val: trendTxt, cls: 'gold' });

    if (/(amable|atentos?|servicio|atenci[oó]n|amabilidad)/.test(allText))
      items.push({ m: '01', label: 'Tema dominante', val: 'Atención y servicio al cliente' });
    if (/(rique?[aá]|delici|bueno|sabor|rico|exquisit)/.test(allText))
      items.push({ m: '02', label: 'Producto', val: 'Sabor y calidad mencionados positivamente' });

    const names = [...new Set((allText.match(/\b(valentina|osvaldo|oswaldo|arely|vale|areli|daniela|ulises|ale|amanda|bryan|brayan|roman|sergio|jacqueline|valeria|gael|alejandra|brandon|dylan|iker|denisse|andy|paulina|victor|cesar|lizbeth)\b/g) || []))]
      .map(n => n[0].toUpperCase() + n.slice(1));
    if (names.length) items.push({ m: '03', label: 'Personal destacado', val: names.join(' · ') });

    if (/(r[aá]pido|tiempo|eficiente|rapidez)/.test(allText))
      items.push({ m: '04', label: 'Operación', val: 'Rapidez y eficiencia comentadas' });

    const guides = reviews.filter(r => r.isLocalGuide).length;
    if (guides) items.push({ m: 'LG', label: 'Local Guides', val: `${guides} de ${reviews.length} reseñas son de Local Guides` });

    if (items.length === 1) {
       items.push({ m: '--', label: 'Sin insights de texto', val: 'Las reseñas del mes no contienen suficientes palabras clave.'});
    }

    return items.slice(0, 5).map(t => `
      <div class="insight-card">
        <span class="insight-marker ${t.cls || ''}">${t.m}</span>
        <div><div class="insight-label">${t.label}</div><div class="insight-val">${t.val}</div></div>
      </div>`).join('');
  },

  _buildRevList(reviews) {
    if (!reviews.length) {
      return `<div class="empty-state"><span class="glyph">—</span>Sin reseñas para mostrar en este mes</div>`;
    }
    return reviews.map(r => {
      const low = r.stars <= 3;
      return `<div class="review-item${low ? ' negative' : ''}">
        <div class="rev-author">Reseñante de Google${r.isLocalGuide ? `<span class="rev-guide">Local Guide</span>` : ''}</div>
        <span class="rev-stars${low ? ' low' : ''}">${starStr(r.stars)}</span>
        <div class="rev-meta">${formatDate(r.publishedAtDate)} · ${r.sucursal}</div>
        <div class="rev-text">${(r.text || '').replace(/\n/g, '<br>')}</div>
      </div>`;
    }).join('');
  }
};
