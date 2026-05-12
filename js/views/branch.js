/**
 * views/branch.js — Vista de sucursal con scorecard PDF y citas.
 */

const BranchView = {
  activeTab: 'mayo',

  async render(params) {
    const meta = getBranchById(params.id);
    if (!meta) {
      Router.navigate('#/');
      return;
    }

    // Cargar meses disponibles
    for (const m of DataLoader.manifest['2026']) {
      await DataLoader.loadMonth(2026, m);
    }

    const aprilReviews = DataLoader.getReviewsForBranch(2026, 4, meta.id);
    const mayReviews = DataLoader.getReviewsForBranch(2026, 5, meta.id);
    const aprilStats = DataLoader.computeBranchStats(2026, 4, meta.id);
    const mayStats = DataLoader.computeBranchStats(2026, 5, meta.id);

    // Q1 stats
    const q1Info = Q1_DATA.branches[meta.id] || null;

    const alerta = mayStats.negativeCount > 0 || (mayStats.avg > 0 && mayStats.avg < KpiMeta.ratingMinimo);
    const negM = mayStats.negativeCount;

    const delta = mayStats.avg > 0 ? (mayStats.avg - meta.historico) : 0;
    const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
    const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
    const statusDot = alerta ? 'warn' : 'ok';

    const insights = this._buildInsights(meta, mayReviews, mayStats);

    // Scorecard PDF-style
    const scorecardSection = `
      <div class="scorecard-grid" style="margin-bottom:14px;">
        <div class="scorecard">
          <div class="sc-label">Rating histórico</div>
          <div class="sc-value num">${meta.historico.toFixed(1)}</div>
          <div class="sc-sub">Google Maps acumulado</div>
        </div>
        <div class="scorecard">
          <div class="sc-label">Promedio Mayo</div>
          <div class="sc-value num ${mayStats.avg >= 4.8 ? 'gold' : mayStats.avg < 4.5 ? 'down' : ''}">${mayStats.avg > 0 ? mayStats.avg.toFixed(2) : '—'}</div>
          <div class="sc-sub">${mayStats.count} reseñas · ${mayStats.negativeCount} negativas</div>
        </div>
        <div class="scorecard">
          <div class="sc-label">Promedio Q1</div>
          <div class="sc-value num ${q1Info && q1Info.q1Avg >= 4.8 ? 'gold' : q1Info && q1Info.q1Avg < 4.5 ? 'down' : ''}">${q1Info ? q1Info.q1Avg.toFixed(2) : '—'}</div>
          <div class="sc-sub">Ene–Mar 2026</div>
        </div>
        <div class="scorecard">
          <div class="sc-label">Δ vs Histórico</div>
          <div class="sc-value num ${dClass}">${mayStats.avg > 0 ? dStr : '—'}</div>
          <div class="sc-sub">${dClass === 'up' ? '↑ Mejora' : dClass === 'down' ? '↓ Caída' : '→ Estable'}</div>
        </div>
      </div>`;

    // Problemáticas
    const problemSection = meta.problemas.length ? `
      <div class="status-warn-box" style="margin-bottom:14px;">
        <div class="topic">Problemas identificados en reseñas</div>
        <ul class="problem-list">
          ${meta.problemas.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>` : '';

    // Best/worst quotes
    const bestReview = mayReviews.length ? mayReviews.reduce((a, b) => a.stars >= b.stars ? a : b) : null;
    const worstReview = mayReviews.length ? mayReviews.reduce((a, b) => a.stars <= b.stars ? a : b) : null;
    const quoteSection = bestReview ? `
      <div style="display:grid;gap:12px;margin-bottom:14px;">
        <div>
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);font-weight:700;margin-bottom:8px;">Mejor reseña · Mayo</div>
          <div class="quote-block">
            <div class="quote-meta">★ ${bestReview.stars} · ${formatDate(bestReview.publishedAtDate)}${bestReview.isLocalGuide ? ' · Local Guide' : ''}</div>
            "${(bestReview.text || '').substring(0, 220)}${(bestReview.text || '').length > 220 ? '...' : ''}"
          </div>
        </div>
        ${worstReview && worstReview.stars <= 2 ? `
        <div>
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--alerta);font-weight:700;margin-bottom:8px;">Peor reseña · Mayo</div>
          <div class="quote-block warn">
            <div class="quote-meta">★ ${worstReview.stars} · ${formatDate(worstReview.publishedAtDate)}${worstReview.isLocalGuide ? ' · Local Guide' : ''}</div>
            "${(worstReview.text || '').substring(0, 220)}${(worstReview.text || '').length > 220 ? '...' : ''}"
          </div>
        </div>` : ''}
      </div>` : '';

    let statusContent = '';
    if (!alerta) {
      statusContent = `<div class="status-ok-box">
        <div class="check">✓</div>
        <div class="ok-text">
          <strong>Estable</strong>
          Sin incidencias registradas en mayo. La sucursal se mantiene en su línea de rating histórico.
        </div>
      </div>`;
    } else {
      statusContent = `
        <div class="status-warn-box">
          <div class="topic">${meta.alertTheme || 'Problemas operativos'}</div>
          ${negM} reseña${negM !== 1 ? 's' : ''} negativa${negM !== 1 ? 's' : ''} en mayo.
        </div>
        ${this._buildRevList(mayReviews.filter(r => r.stars <= 2))}`;
    }

    const showingReviews = this.activeTab === 'abril' ? aprilReviews : mayReviews;
    const tabMonth = this.activeTab === 'abril' ? 4 : 5;
    const tabStats = this.activeTab === 'abril' ? aprilStats : mayStats;

    document.getElementById('app').innerHTML = `
      ${buildTopbar(true, meta.nombre)}
      <section class="branch-hero">
        <div class="bh-eyebrow">
          <span>Guadalajara</span> · <span>Mayo 2026</span>
          ${alerta ? '<span style="color:#F4A090;">· Alerta activa</span>' : ''}
        </div>
        <h1 class="bh-name">${meta.nombre}</h1>
        <div class="bh-metrics">
          <div class="bh-metric">
            <div class="bh-metric-val gold num">${mayStats.avg > 0 ? mayStats.avg.toFixed(2) : '—'}</div>
            <div class="bh-metric-label">Promedio May</div>
            <div class="bh-metric-sub">${starStr(Math.round(mayStats.avg))}</div>
          </div>
          <div class="bh-metric">
            <div class="bh-metric-val num">${mayStats.count}</div>
            <div class="bh-metric-label">Reseñas May</div>
            <div class="bh-metric-sub">${mayStats.guideCount} Local Guides</div>
          </div>
          <div class="bh-metric">
            <div class="bh-metric-val ${dClass} num">${mayStats.avg > 0 ? dStr : '—'}</div>
            <div class="bh-metric-label">Δ vs Histórico</div>
            <div class="bh-metric-sub">Hist: ${meta.historico.toFixed(1)}</div>
          </div>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Scorecard <span class="accent">${meta.nombre}</span></div>
        </div>
        ${scorecardSection}
        ${problemSection}
        ${quoteSection}
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Insights <span class="accent">Mayo</span></div>
        </div>
        <div class="insight-grid">${insights}</div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Status <span class="accent">Mayo 2026</span></div>
          <span class="section-sub">En curso</span>
        </div>
        <div class="status-panel ${alerta ? 'alert' : ''}">
          <div class="status-header" id="sHdr">
            <div class="status-header-left">
              <div class="status-icon-box ${statusDot}">${alerta ? '!' : '✓'}</div>
              <div>
                <div class="status-title">${alerta ? 'Atención requerida' : 'Sin alertas activas'}</div>
                <div class="status-subtitle">${alerta ? `${negM} reseña${negM !== 1 ? 's' : ''} negativa${negM !== 1 ? 's' : ''} · ${meta.alertTheme || 'Problemas operativos'}` : 'Sin reseñas negativas en mayo'}</div>
              </div>
            </div>
            <span class="status-chevron ${alerta ? 'open' : ''}" id="sChev">▾</span>
          </div>
          <div class="status-body ${alerta ? 'open' : ''}" id="sBody">${statusContent}</div>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Reseñas</div>
          <div class="segmented" role="tablist">
            <button class="seg-btn ${this.activeTab === 'abril' ? 'active' : ''}" data-view="abril">
              Abril
              <span class="count">${aprilReviews.length}</span>
            </button>
            <button class="seg-btn ${this.activeTab === 'mayo' ? 'active' : ''}" data-view="mayo">
              <span class="dot ${alerta ? 'warn' : 'ok'}"></span>
              Mayo
              <span class="count">${mayReviews.length}</span>
            </button>
          </div>
        </div>
        <div class="reviews-panel">
          <div class="reviews-panel-header">
            <span class="rph-title">Reseñas verificadas · ${MONTH_NAMES[tabMonth - 1]}</span>
            <span class="rph-count">${showingReviews.length} ${showingReviews.length === 1 ? 'reseña' : 'reseñas'}</span>
          </div>
          <div class="reviews-list" id="revList">${this._buildRevList(showingReviews.slice(0, 5))}</div>
          ${showingReviews.length > 5 ? `<button class="show-all-btn" id="showAllBtn">Mostrar todas las ${showingReviews.length} reseñas ↓</button>` : ''}
        </div>
      </section>

      <footer class="footer">
        <span class="brand">La <span class="accent">Crêpe</span> Parisienne</span> · ${meta.nombre}<br>
        Dashboard de Reseñas · Región Guadalajara
      </footer>`;

    document.getElementById('sHdr').onclick = () => {
      document.getElementById('sBody').classList.toggle('open');
      document.getElementById('sChev').classList.toggle('open');
    };

    document.querySelectorAll('.seg-btn').forEach(b => {
      b.onclick = async () => {
        this.activeTab = b.dataset.view;
        await this.render(params);
        initReveal();
      };
    });

    const btn = document.getElementById('showAllBtn');
    if (btn) {
      let exp = false;
      btn.onclick = () => {
        exp = !exp;
        document.getElementById('revList').innerHTML = this._buildRevList(exp ? showingReviews : showingReviews.slice(0, 5));
        btn.textContent = exp ? '↑ Mostrar menos' : `Mostrar todas las ${showingReviews.length} reseñas ↓`;
      };
    }
  },

  _buildInsights(meta, reviews, stats) {
    const allText = reviews.map(r => r.text.toLowerCase()).join(' ');
    const items = [];
    const delta = stats.avg > 0 ? (stats.avg - meta.historico).toFixed(2) : '0.00';
    const trendTxt = Number(delta) > 0
      ? `+${delta} sobre histórico (${meta.historico})`
      : Number(delta) < 0
        ? `${delta} bajo histórico`
        : `Sin cambio vs ${meta.historico}`;
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

    return items.slice(0, 5).map(t => `
      <div class="insight-card">
        <span class="insight-marker ${t.cls || ''}">${t.m}</span>
        <div><div class="insight-label">${t.label}</div><div class="insight-val">${t.val}</div></div>
      </div>`).join('');
  },

  _buildRevList(reviews) {
    if (!reviews.length) {
      return `<div class="empty-state"><span class="glyph">—</span>Sin reseñas para mostrar</div>`;
    }
    return reviews.map(r => {
      const low = r.stars <= 2;
      return `<div class="review-item${low ? ' negative' : ''}">
        <div class="rev-author">Reseñante de Google${r.isLocalGuide ? `<span class="rev-guide">Local Guide</span>` : ''}</div>
        <span class="rev-stars${low ? ' low' : ''}">${starStr(r.stars)}</span>
        <div class="rev-meta">${formatDate(r.publishedAtDate)} · ${r.sucursal}</div>
        <div class="rev-text">${(r.text || '').replace(/\n/g, '<br>')}</div>
      </div>`;
    }).join('');
  }
};
