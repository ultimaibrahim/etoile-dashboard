/**
 * views/home.js — Vista principal: mes en curso vs anterior + KPIs + Feed.
 */

const HomeView = {
  filter: 'todas',
  highlightIdx: 0,

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
      const p = prevStats[meta.id] || { avg: 0, count: 0 };
      const c = currStats[meta.id] || { avg: 0, count: 0, negativeCount: 0 };
      const isAttended = localStorage.getItem(`attended_${meta.id}_${currYear}_${currMonth}`) === 'true';
      const branchReviews = DataLoader.getReviewsForBranch(currYear, currMonth, meta.id);
      const negativeWithTextCount = branchReviews.filter(r => r.stars <= 2 && r.text && r.text.trim().length > 0).length;
      const hasAlert = negativeWithTextCount > 0;
      const alerta = hasAlert && !isAttended;
      return {
        ...meta,
        prev: { score: p.avg, count: p.count },
        curr: { score: c.avg, count: c.count, negativeCount: negativeWithTextCount },
        hasAlert,
        isAttended,
        alerta,
        statusMayo: hasAlert ? {
          negativas: negativeWithTextCount,
          tema: meta.alertTheme || 'Problemas operativos',
          detalle: `${negativeWithTextCount} reseña${negativeWithTextCount !== 1 ? 's' : ''} negativa${negativeWithTextCount !== 1 ? 's' : ''} en ${capitalizedCurrMonth.toLowerCase()}.`
        } : null
      };
    });

    const conAlerta = branches.filter(s => s.alerta);
    const sinAlerta = branches.filter(s => !s.alerta);
    const totalNegativasActivas = conAlerta.reduce((a, s) => a + (s.statusMayo?.negativas || 0), 0);
    const totalNegativasTotal = branches.reduce((a, s) => a + s.curr.negativeCount, 0);
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
    const prevKpi = await Kpis.computeMonth(prevYear, prevMonth);
    const kpiSection = this._buildKpiSection(kpiData, currStats, prevKpi, capitalizedCurrMonth, currYear, capitalizedPrevMonth);

    // Reviews data for Feed
    const currentData = DataLoader.getMonth(currYear, currMonth);
    const reviewsList = currentData ? currentData.reviews : [];

    const cards = sorted.map(s => {
      const delta = (s.curr.score - s.historico);
      const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
      const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      const currScoreStr = s.curr.score > 0 ? s.curr.score.toFixed(2) : '—';
      const mayoBlock = s.hasAlert
        ? (s.isAttended 
          ? `<div class="bc-mayo" style="background:var(--ok-bg); border:1px solid rgba(61,138,95,.2); color:var(--ok);"><span class="mono">${currMonthShort}</span> <span>✓ Atendido (${s.curr.negativeCount} neg)</span></div>`
          : `<div class="bc-mayo warn"><span class="mono">${currMonthShort}</span> <span>${s.curr.negativeCount} negativa${s.curr.negativeCount !== 1 ? 's' : ''}</span></div>`)
        : `<div class="bc-mayo"><span class="mono">${currMonthShort}</span> <span>Sin incidencias</span></div>`;
      return `
      <a class="branch-card${s.alerta ? ' alerta' : ''}" href="#/sucursal/${s.id}">
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

    // Dynamic Alert Strip / Banner
    let alertBannerHtml = '';
    if (conAlerta.length > 0) {
      alertBannerHtml = `
        <div class="alert-strip alert-box-sunken">
          <div class="watermark-stars">
            ${svgIcon('starFilled')}
            ${svgIcon('star')}
            ${svgIcon('star')}
            ${svgIcon('star')}
            ${svgIcon('star')}
          </div>
          <div class="alert-icon-box">!</div>
          <div class="alert-content">
            <div class="alert-title">Alerta Activa · ${capitalizedCurrMonth} ${currYear}</div>
            <div class="alert-text">${conAlerta.length} sucursal${conAlerta.length !== 1 ? 'es' : ''} con alerta activa (${totalNegativasActivas} reseñas negativas sin atender).</div>
            <div class="alert-pills">
              ${conAlerta.map(s => `<button class="alert-pill" onclick="HomeView.openAlertModal('${s.id}')">${s.abr} · ${s.curr.negativeCount}</button>`).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      const attendedBranches = branches.filter(s => s.hasAlert && s.isAttended);
      if (attendedBranches.length > 0) {
        alertBannerHtml = `
          <div class="alert-strip ok-box-sunken">
            <div class="alert-icon-box" style="background:var(--ok); color:white; display:flex; align-items:center; justify-content:center; font-weight:700;">✓</div>
            <div class="alert-content">
              <div class="alert-title" style="color:var(--ok); font-weight:700;">✓ Alertas Atendidas</div>
              <div class="alert-text">Todas las incidencias de ${capitalizedCurrMonth} han sido atendidas (${attendedBranches.map(s => s.abr).join(', ')}).</div>
            </div>
          </div>
        `;
      } else {
        alertBannerHtml = `
          <div class="alert-strip ok-box-sunken">
            <div class="alert-icon-box" style="background:var(--ok); color:white; display:flex; align-items:center; justify-content:center; font-weight:700;">✓</div>
            <div class="alert-content">
              <div class="alert-title" style="color:var(--ok); font-weight:700;">✓ Operación Estable</div>
              <div class="alert-text">Sin alertas registradas en ${capitalizedCurrMonth} ${currYear}. Todo bajo control.</div>
            </div>
          </div>
        `;
      }
    }

    const sortedMonths = [...(DataLoader.manifest[currYear] || [])].sort((a, b) => a - b);
    const selectOptions = sortedMonths.map(m => {
      const monthName = MONTH_NAMES[m];
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return `<option value="${m}" ${m === currMonth ? 'selected' : ''}>${capMonth} ${currYear}</option>`;
    }).join('');

    const dropdownHtml = `
      <div class="hero-month-select-container">
        <select id="heroMonthSelect" class="hero-month-select" onchange="HomeView.handleMonthSelect(this.value)">
          ${selectOptions}
        </select>
      </div>
    `;

    document.getElementById('app').innerHTML = `
      ${buildTopbar()}
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-left">
            <div class="hero-label-row" style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:16px;">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Promedio Regional</span>
              ${dropdownHtml}
            </div>
            <div class="hero-score">
              <span class="hero-score-num num" id="heroNum">${currGlobal.avgRating.toFixed(2)}</span>
              <div class="hero-score-side">
                <span class="hero-stars">${starStr(Math.round(currGlobal.avgRating))}</span>
                <span class="hero-of">de 5.00</span>
                <span class="hero-trend" style="${currGlobal.avgRating >= prevGlobal.avgRating ? 'background:rgba(122,216,154,.12);border-color:rgba(122,216,154,.25);color:#A7DBB9;' : 'background:rgba(178,58,43,.12);border-color:rgba(178,58,43,.25);color:#F4A090;'}">${currGlobal.avgRating >= prevGlobal.avgRating ? '↑' : '↓'} ${Math.abs(currGlobal.avgRating - prevGlobal.avgRating).toFixed(2)} vs ${capitalizedPrevMonth} (${prevGlobal.avgRating.toFixed(2)})</span>
              </div>
            </div>
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
                <span class="hero-stat-label">Sucursales</span>
                <span class="hero-stat-sub">Región GDL</span>
              </div>
            </div>
            <div class="hero-stat ${totalNegativasActivas > 0 ? 'warn' : ''}">
              <span class="hero-stat-val num">${totalNegativasActivas}</span>
              <div class="hero-stat-info">
                <span class="hero-stat-label">Negativas Activas</span>
                <span class="hero-stat-sub">De ${totalNegativasTotal} totales</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="home-grid-2" style="margin-top: 24px; margin-bottom: 24px;">
        ${alertBannerHtml}
        ${this._buildHighlights(branches, currYear, currMonth)}
      </div>

      ${kpiSection}

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Evaluación <span class="accent">de sucursales</span></div>
          <div class="filter-row">
            <button class="chip ${this.filter === 'todas' ? 'active' : ''}" onclick="HomeView.setFilter('todas')">Todas <span class="chip-count">${branches.length}</span></button>
            <button class="chip ${this.filter === 'alerta' ? 'active' : ''}" onclick="HomeView.setFilter('alerta')">Con alerta <span class="chip-count">${conAlerta.length}</span></button>
            <button class="chip ${this.filter === 'estables' ? 'active' : ''}" onclick="HomeView.setFilter('estables')">Estables <span class="chip-count">${sinAlerta.length}</span></button>
          </div>
        </div>
        <div class="branch-grid">${cards || '<div class="empty-state"><span class="glyph">—</span>Sin sucursales para este filtro</div>'}</div>
      </section>

      ${this._buildReviewFeed(reviewsList, currYear, currMonth)}

      <footer class="footer">
        <span class="brand" style="text-transform:none; font-family:var(--giaza); font-size:18px;">étoile</span> · La Crêpe Parisienne / Grupo MYT<br>
        Dashboard de Reseñas · Región Guadalajara · Fuente: Google Reviews
      </footer>`;

    requestAnimationFrame(() => {
      document.getElementById('heroNum')?.classList.add('in');
      initReveal();

      // Counting animation for hero rating
      const heroNumEl = document.getElementById('heroNum');
      if (heroNumEl) {
        const targetVal = currGlobal.avgRating;
        let startVal = 3.0;
        const duration = 1800;
        let startTimestamp = null;
        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          const val = progress * (targetVal - startVal) + startVal;
          heroNumEl.textContent = val.toFixed(2);
          if (progress < 1) {
            window.requestAnimationFrame(step);
          } else {
            heroNumEl.textContent = targetVal.toFixed(2);
          }
        };
        window.requestAnimationFrame(step);
      }
    });
  },

  _buildKpiSection(kpi, currStats, prevKpi, monthName, year, prevMonthName) {
    const missingVol = [];
    for (const meta of SUCURSALES_META) {
      const stats = currStats[meta.id] || { count: 0 };
      if (stats.count < kpi.volumen.meta) {
        missingVol.push(meta.abr);
      }
    }
    const volClass = missingVol.length === 0 ? 'optimal' : 'attention';
    const volValue = `${kpi.volumen.ok} de ${kpi.volumen.total}`;
    const volSub = missingVol.length > 0 ? `Faltan: ${missingVol.join(', ')}` : 'Todas cumplen la meta';

    const calClass = kpi.calidadTexto.ratio >= KpiMeta.calidadTextoMeta ? 'optimal' : 'attention';
    const calValue = `${(kpi.calidadTexto.ratio * 100).toFixed(0)}% con texto`;
    const calTrend = prevKpi ? kpi.calidadTexto.ratio - prevKpi.calidadTexto.ratio : 0;
    const calTrendStr = calTrend > 0.005 
      ? `↑ +${(calTrend * 100).toFixed(0)}% vs ${prevMonthName.substring(0,3)}` 
      : calTrend < -0.005 
        ? `↓ ${(calTrend * 100).toFixed(0)}% vs ${prevMonthName.substring(0,3)}` 
        : 'Sin cambios vs mes anterior';

    const ratClass = kpi.ratingMinimo.belowMin.length === 0 ? 'optimal' : 'critical';
    const belowDetails = kpi.ratingMinimo.belowMin.map(id => {
      const b = getBranchById(id);
      const s = currStats[id] || { avg: 0 };
      return b ? `${b.abr} (${s.avg.toFixed(2)}★)` : id;
    });
    const ratValue = kpi.ratingMinimo.belowMin.length === 0 ? '✓ Óptimo' : `${kpi.ratingMinimo.belowMin.length} crítica${kpi.ratingMinimo.belowMin.length > 1 ? 's' : ''}`;
    const ratSub = kpi.ratingMinimo.belowMin.length > 0 ? `${belowDetails.join(', ')}` : `Meta: ninguna < ${KpiMeta.ratingMinimo}`;

    const unanswered = kpi.tasaRespuesta.totalNegativas - kpi.tasaRespuesta.conRespuesta;
    const negClass = unanswered === 0 ? 'optimal' : 'critical';
    const negValue = `${unanswered} sin responder`;
    const negSub = `De ${kpi.tasaRespuesta.totalNegativas} negativas totales`;

    return `
      <section class="section r">
        <div class="section-head">
          <div class="section-title">KPIs de Operación</div>
          <span class="section-sub">Seguimiento de cumplimiento contra objetivos regionales</span>
        </div>
        <div class="scorecard-grid">
          <div class="scorecard">
            <div class="sc-label">Volumen de reseñas</div>
            <div class="sc-value num" style="font-size:18px; font-weight:700; color:var(--text);">${volValue}</div>
            <div class="sc-sub" style="font-size:12px; margin-bottom:8px; line-height:1.4;">${volSub}</div>
            <span class="badge badge-${volClass}">${volClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
            <button onclick="document.querySelector('.branch-grid').scrollIntoView({behavior: 'smooth'})" style="background:transparent; border:none; color:var(--sage); font-size:11px; cursor:pointer; padding:0; text-align:left; font-weight:700; margin-top:8px;">Ver detalle sucursales →</button>
          </div>
          <div class="scorecard">
            <div class="sc-label">Calidad de reseña</div>
            <div class="sc-value num" style="font-size:18px; font-weight:700; color:var(--text);">${calValue}</div>
            <div class="sc-sub" style="font-size:12px; margin-bottom:8px; line-height:1.4;">${calTrendStr}</div>
            <span class="badge badge-${calClass}">${calClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
          </div>
          <div class="scorecard">
            <div class="sc-label">Rating mínimo regional</div>
            <div class="sc-value num" style="font-size:18px; font-weight:700; color:var(--text);">${ratValue}</div>
            <div class="sc-sub" style="font-size:12px; margin-bottom:8px; line-height:1.4;">${ratSub}</div>
            <span class="badge badge-${ratClass}">${ratClass === 'optimal' ? 'Cumple' : 'Crítico'}</span>
          </div>
          <div class="scorecard">
            <div class="sc-label">Resolución causa raíz</div>
            <div class="sc-value num" style="font-size:18px; font-weight:700; color:var(--text);">${negValue}</div>
            <div class="sc-sub" style="font-size:12px; margin-bottom:8px; line-height:1.4;">${negSub}</div>
            <span class="badge badge-${negClass}">${negClass === 'optimal' ? 'Sin pendientes' : 'Atención'}</span>
          </div>
        </div>
      </section>`;
  },

  async setFilter(f) {
    this.filter = f;
    await this.render();
    initReveal();
  },

  changeMonth(direction) {
    const currYear = DataLoader.currentYear;
    const currMonth = DataLoader.currentMonth;
    const availableMonths = DataLoader.manifest[currYear] || [];
    const sortedMonths = [...availableMonths].sort((a, b) => a - b);
    const currentIdx = sortedMonths.indexOf(currMonth);
    
    let newIdx = currentIdx;
    if (direction === 'prev') {
      newIdx = currentIdx - 1;
    } else if (direction === 'next') {
      newIdx = currentIdx + 1;
    }

    if (newIdx >= 0 && newIdx < sortedMonths.length) {
      DataLoader.setMonth(currYear, sortedMonths[newIdx]);
      this.render();
    }
  },

  handleMonthSelect(val) {
    const month = parseInt(val);
    const currYear = DataLoader.currentYear;
    DataLoader.setMonth(currYear, month);
    this.render();
  },

  markAsAttended(branchId) {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    localStorage.setItem(`attended_${branchId}_${year}_${month}`, 'true');
    document.getElementById('alertModal')?.remove();
    this.render();
  },

  _buildReviewFeed(reviews, year, month) {
    const negatives = reviews.filter(r => r.stars <= 2 && r.text && r.text.length > 10);
    const positives = reviews.filter(r => r.stars === 5 && r.text && r.text.length > 20);
    
    const feedReviews = [];
    if (negatives.length > 0) {
      feedReviews.push(...negatives.slice(0, 3));
    }
    while (feedReviews.length < 8 && positives.length > 0) {
      const nextPos = positives.find(p => !feedReviews.includes(p));
      if (nextPos) {
        feedReviews.push(nextPos);
      } else {
        break;
      }
    }
    
    const textReviews = reviews.filter(r => r.text && r.text.length > 5);
    while (feedReviews.length < 8 && textReviews.length > 0) {
      const nextRev = textReviews.find(r => !feedReviews.includes(r));
      if (nextRev) {
        feedReviews.push(nextRev);
      } else {
        break;
      }
    }

    const cards = feedReviews.map(r => {
      const isNeg = r.stars <= 3;
      const cardClass = isNeg ? 'review-card neg' : 'review-card';
      const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      const timeStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '';
      return `
        <div class="${cardClass}">
          <div class="rc-head">
            <span class="rc-branch">${r.sucursal}</span>
            <span class="rc-date">${timeStr}</span>
          </div>
          <div class="rc-stars">${starsHtml}</div>
          <p class="rc-text">"${r.text}"</p>
          ${isNeg ? `<button class="rc-action-btn" onclick="HomeView.analyzeCausaRaiz('${r.sucursal}', '${r.text.replace(/'/g, "\\'")}')">Analizar causa raíz</button>` : ''}
        </div>
      `;
    }).join('');

    const countWithText = reviews.filter(r => r.text && r.text.trim().length > 0).length;

    return `
      <section class="section review-feed-section r">
        <div class="section-head" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div class="section-title">Actividad Reciente <span class="accent">de reseñas</span></div>
            <span class="section-sub">Extracto del pulso de la operación en Guadalajara</span>
          </div>
          <button class="show-all-btn-link" onclick="HomeView.openFullFeedModal()">Ver todas con texto (${countWithText}) →</button>
        </div>
        <div class="review-feed-carousel-wrapper">
          <div class="review-feed-grid">
            ${cards || '<div class="empty-state">Sin reseñas con texto en este periodo</div>'}
          </div>
        </div>
      </section>
    `;
  },

  analyzeCausaRaiz(branchName, reviewText) {
    const modalHtml = `
      <div class="modal-overlay active" id="causaRaizModal">
        <div class="modal-box" style="max-width: 500px;">
          <div class="modal-header">
            <h2 class="modal-title">Análisis de Causa Raíz</h2>
            <button class="modal-close" onclick="document.getElementById('causaRaizModal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div style="background:var(--alerta-bg); border-left:4px solid var(--alerta); padding:12px; border-radius:8px; margin-bottom:18px;">
              <strong style="color:var(--alerta); font-size:13px; display:block; margin-bottom:4px;">${branchName}</strong>
              <p style="font-style:italic; margin:0; font-size:13.5px; line-height:1.4;">"${reviewText}"</p>
            </div>
            <h3 style="font-size:14px; margin-bottom:12px; font-weight:600; color:var(--text);">Acciones recomendadas para la sucursal:</h3>
            <ul style="padding-left:18px; line-height:1.6; font-size:13px; color:var(--text-muted); margin-bottom:20px;">
              <li><strong>Contactar al cliente:</strong> Responder en Google My Business en menos de 48 horas.</li>
              <li><strong>Revisión interna:</strong> Verificar el personal de turno y el flujo de servicio en esa fecha.</li>
              <li><strong>Alineación en junta:</strong> Abordar la queja específica en la próxima minuta de sucursal.</li>
            </ul>
            <button class="show-all-btn" style="width:100%;" onclick="document.getElementById('causaRaizModal').remove()">Cerrar análisis</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  openFullFeedModal() {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;
    
    const sidebarHtml = `
      <div class="sidebar-overlay" id="feedSidebarOverlay" onclick="if(event.target===this) HomeView.closeSidebar()">
        <div class="feed-sidebar">
          <div class="sidebar-header">
            <h2 class="sidebar-title">Feed de Reseñas</h2>
            <button class="sidebar-close" onclick="HomeView.closeSidebar()">×</button>
          </div>
          
          <div class="sidebar-filters">
            <div class="filter-group">
              <label>Sentimiento</label>
              <select id="feedFilterSentiment" onchange="HomeView.filterSidebarReviews()">
                <option value="todas">Todas las calificaciones</option>
                <option value="positivas">Positivas (4-5★)</option>
                <option value="neutras">Neutras (3★)</option>
                <option value="negativas">Negativas (1-2★)</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Sucursal</label>
              <select id="feedFilterBranch" onchange="HomeView.filterSidebarReviews()">
                <option value="todas">Todas las sucursales</option>
                ${SUCURSALES_META.map(s => `<option value="${s.nombre}">${s.abr}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div class="sidebar-content" id="sidebarReviewsContainer">
            <!-- Reviews loaded dynamically -->
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', sidebarHtml);
    
    // Trigger animation
    const overlay = document.getElementById('feedSidebarOverlay');
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    this.filterSidebarReviews();

    const _escSidebarHandler = (e) => {
      if (e.key === 'Escape') {
        HomeView.closeSidebar();
        document.removeEventListener('keydown', _escSidebarHandler);
      }
    };
    document.addEventListener('keydown', _escSidebarHandler);
  },

  closeSidebar() {
    const overlay = document.getElementById('feedSidebarOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  },

  filterSidebarReviews() {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;

    const sentiment = document.getElementById('feedFilterSentiment').value;
    const branchNameFilter = document.getElementById('feedFilterBranch').value;

    let filtered = data.reviews.filter(r => r.text && r.text.trim().length > 0);

    if (sentiment === 'positivas') {
      filtered = filtered.filter(r => r.stars >= 4);
    } else if (sentiment === 'neutras') {
      filtered = filtered.filter(r => r.stars === 3);
    } else if (sentiment === 'negativas') {
      filtered = filtered.filter(r => r.stars <= 2);
    }

    if (branchNameFilter !== 'todas') {
      filtered = filtered.filter(r => r.sucursal === branchNameFilter);
    }

    const container = document.getElementById('sidebarReviewsContainer');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">No se encontraron reseñas con estos filtros</div>';
      return;
    }

    container.innerHTML = filtered.map(r => {
      const isNeg = r.stars <= 2;
      const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      const timeStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '';
      return `
        <div class="sidebar-review-card ${isNeg ? 'neg' : ''}">
          <div class="src-head">
            <span class="src-branch">${r.sucursal}</span>
            <span class="src-date">${timeStr}</span>
          </div>
          <div class="src-stars">${starsHtml}</div>
          <p class="src-text">"${r.text}"</p>
          ${r.responseFromOwnerText ? `<div class="src-response"><strong>Respuesta:</strong> "${r.responseFromOwnerText}"</div>` : ''}
        </div>
      `;
    }).join('');
  },

  openAlertModal(branchId) {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;

    const branchMeta = SUCURSALES_META.find(s => s.id === branchId);
    if (!branchMeta) return;

    const names = [branchMeta.nombre, branchMeta.abr, branchMeta.id === 'gal-gdl' ? 'Galerías GDL' : '', branchMeta.id === 'sta-anita' ? 'Galerías Santa Anita' : ''].filter(Boolean);
    const negatives = data.reviews.filter(r => r.stars <= 3 && names.includes(r.sucursal) && r.text && r.text.trim().length > 0);

    // Freeze background scrolling when opening the modal
    document.body.style.overflow = 'hidden';

    const modalHtml = `
      <div class="modal-overlay active" id="alertModal" onclick="if(event.target === this) { this.remove(); document.body.style.overflow = ''; }">
        <div class="modal-box">
          <div class="modal-header">
            <h2 class="modal-title">Alertas: ${branchMeta.abr}</h2>
            <button class="modal-close" onclick="document.getElementById('alertModal').remove(); document.body.style.overflow = '';">×</button>
          </div>
          <div class="modal-body">
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Las siguientes reseñas negativas o promedio bajo requieren atención inmediata en tienda.</p>
            ${negatives.length === 0 ? '<p>No hay reseñas negativas con texto.</p>' : ''}
            ${negatives.map(r => `
              <div class="review-item" style="border-left: 2px solid var(--alerta); padding-left:12px; margin-bottom:12px;">
                <div class="ri-head">
                  <div class="ri-score" style="color: var(--alerta)">${starStr(r.stars)}</div>
                  <div class="ri-date">${formatDate(r.publishedAtDate)}</div>
                </div>
                <div class="ri-text">"${r.text}"</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const _escHandler = (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('alertModal');
        if (modal) {
          modal.remove();
          document.body.style.overflow = '';
        }
        document.removeEventListener('keydown', _escHandler);
      }
    };
    document.addEventListener('keydown', _escHandler);
  },

  _buildHighlights(branches, year, month) {
    const data = DataLoader.getMonth(year, month);
    if (!data) return '';
    const goodReviews = data.reviews.filter(r => r.stars === 5 && r.text && r.text.length > 30);
    if (goodReviews.length === 0) return '';
    
    if (this.highlightIdx === 0 && goodReviews.length > 1) {
      this.highlightIdx = Math.floor(Math.random() * goodReviews.length);
    }

    const idx = this.highlightIdx % goodReviews.length;
    const rev = goodReviews[idx];
    const hasMore = goodReviews.length > 1;
    return `
      <div class="chart-card highlight-box r" id="highlightCard" style="display:flex; flex-direction:column; justify-content:space-between; position:relative; min-height:220px; overflow:hidden;">
        <div class="watermark-stars" style="position:absolute; right:-20px; bottom:-20px; font-size:120px; opacity:0.04; color:var(--text); pointer-events:none;">★</div>
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--sage); margin-bottom: 8px;">Lo más destacado</div>
        <div style="font-size: 15px; line-height: 1.5; font-style:italic; margin-bottom: 12px; position: relative; z-index: 1;" data-rev-text>"${rev.text}"</div>
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; margin-top: auto; padding-top:12px; border-top: 1px solid rgba(245,239,230,.06);">
          <span style="font-size: 13px; font-weight: 500; color: rgba(245,239,230,.65); display:flex; align-items:center; gap:6px;"><span style="display:inline-block;width:12px;height:1px;background:rgba(245,239,230,.4);"></span>${rev.sucursal}</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="color:#E8955A;font-size:13px;letter-spacing:1px;">${'★'.repeat(5)}</span>
            ${hasMore ? `<button onclick="HomeView.nextHighlight()" style="background:transparent;border:1px solid rgba(245,239,230,0.35);color:var(--crema);font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;cursor:pointer;letter-spacing:.03em;transition:background .15s, border-color .15s;display:flex;align-items:center;gap:4px;" onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.borderColor='rgba(245,239,230,.7)'" onmouseout="this.style.background='transparent';this.style.borderColor='rgba(245,239,230,0.35)'">Siguiente ›</button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  nextHighlight() {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    const goodReviews = data ? data.reviews.filter(r => r.stars === 5 && r.text && r.text.length > 30) : [];
    const card = document.getElementById('highlightCard');
    if (!card || goodReviews.length <= 1) return;

    let newIdx = Math.floor(Math.random() * goodReviews.length);
    if (newIdx === (this.highlightIdx % goodReviews.length)) {
      newIdx = (newIdx + 1) % goodReviews.length;
    }
    this.highlightIdx = newIdx;

    card.style.transition = 'opacity 0.2s ease';
    card.style.opacity = '0';
    setTimeout(() => {
      const idx = this.highlightIdx % goodReviews.length;
      const rev = goodReviews[idx];
      const textEl = card.querySelector('[data-rev-text]');
      if (textEl) textEl.textContent = `"${rev.text}"`;
      
      const allBranches = SUCURSALES_META.map(m => ({ ...m }));
      const newCard = this._buildHighlights(allBranches, year, month);
      const tmp = document.createElement('div');
      tmp.innerHTML = newCard;
      const newEl = tmp.firstElementChild;
      if (newEl) {
        newEl.style.opacity = '0';
        newEl.style.transform = 'translateY(8px)';
        card.replaceWith(newEl);
        requestAnimationFrame(() => {
          newEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          newEl.style.opacity = '1';
          newEl.style.transform = 'translateY(0)';
        });
      }
    }, 200);
  }
};
