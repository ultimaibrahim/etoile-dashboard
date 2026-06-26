/**
 * views/home.js — Vista principal: mes en curso vs anterior + KPIs + Feed.
 */

const HomeView = {
  filter: 'todas',
  highlightIdx: 0,
  searchQuery: '',
  sortBy: 'default',
  carouselPool: [],
  carouselStartIndex: 0,
  carouselBatchSize: 8,
  autoplayInterval: null,
  scrollFraction: 0,
  isPaused: false,
  scrollAnimationFrame: null,
  scrollAnimationActive: false,

  async render() {
    if (typeof SUCURSALES_META !== 'undefined' && SUCURSALES_META.length === 1) {
      await BranchView.render({ id: SUCURSALES_META[0].id }, true);
      return;
    }
    Charts.destroyAll();

    // Render skeleton loaders immediately while loading data
    this.renderSkeleton();

    const currYear = DataLoader.currentYear;
    const prevYear = DataLoader.previousYear;
    const currMonth = DataLoader.currentMonth;
    const prevMonth = DataLoader.previousMonth;

    // Load YTD months concurrently for current year to calculate sparklines
    const ytdMonths = (DataLoader.manifest && DataLoader.manifest[currYear]) 
      ? [...DataLoader.manifest[currYear]].filter(m => m <= currMonth).sort((a,b) => a - b)
      : [currMonth];

    const hasPrevMonth = DataLoader.hasMonth(prevYear, prevMonth);
    const loadPromises = ytdMonths.map(m => DataLoader.loadMonth(currYear, m));
    if (hasPrevMonth) {
      loadPromises.push(DataLoader.loadMonth(prevYear, prevMonth));
    }
    await Promise.all(loadPromises);

    const prevStats = hasPrevMonth ? DataLoader.getAllBranchStats(prevYear, prevMonth) : {};
    const currStats = DataLoader.getAllBranchStats(currYear, currMonth);
    const prevGlobal = hasPrevMonth ? DataLoader.getGlobalStats(prevYear, prevMonth) : { totalReviews: 0, avgRating: 0, withText: 0 };
    const currGlobal = DataLoader.getGlobalStats(currYear, currMonth);

    const currMonthName = new Date(currYear, currMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const prevMonthName = new Date(prevYear, prevMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const capitalizedCurrMonth = currMonthName.charAt(0).toUpperCase() + currMonthName.slice(1);
    const capitalizedPrevMonth = prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1);
    const currMonthShort = capitalizedCurrMonth.substring(0, 3).toUpperCase();

    const branches = SUCURSALES_META.map(meta => {
      const p = prevStats[meta.id] || { avg: 0, count: 0 };
      const c = currStats[meta.id] || { avg: 0, count: 0, negativeCount: 0 };
      const branchReviews = DataLoader.getReviewsForBranch(currYear, currMonth, meta.id);
      const negativeWithTextCount = branchReviews.filter(r => r.stars <= 2 && r.text && r.text.trim().length > 0).length;
      const hasAlert = negativeWithTextCount > 0;
      return {
        ...meta,
        prev: { score: p.avg, count: p.count },
        curr: { score: c.avg, count: c.count, negativeCount: negativeWithTextCount },
        hasAlert,
        alerta: hasAlert,
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
      const scoreA = a.curr.score + (a.curr.count > 0 ? 0.15 * Math.log2(a.curr.count) : 0);
      const scoreB = b.curr.score + (b.curr.count > 0 ? 0.15 * Math.log2(b.curr.count) : 0);
      return scoreB - scoreA;
    });

    // KPIs
    const kpiData = await Kpis.computeMonth(currYear, currMonth);
    const prevKpi = hasPrevMonth ? await Kpis.computeMonth(prevYear, prevMonth) : null;

    // Compute YTD KPIs for sparklines
    const ytdKpiPromises = ytdMonths.map(m => Kpis.computeMonth(currYear, m));
    const ytdKpis = await Promise.all(ytdKpiPromises);

    const sparklines = {
      volumen: ytdKpis.map(k => k.volumen.ok),
      calidad: ytdKpis.map(k => k.calidadTexto.ratio * 100),
      rating: ytdKpis.map(k => k.global.avgRating),
      respuestas: ytdKpis.map(k => k.tasaRespuesta.value * 100)
    };

    const kpiSection = this._buildKpiSection(kpiData, currStats, prevKpi, capitalizedCurrMonth, currYear, capitalizedPrevMonth, hasPrevMonth, sparklines);

    // Reviews data for Feed
    const currentData = DataLoader.getMonth(currYear, currMonth);
    const reviewsList = currentData ? currentData.reviews : [];

    // Set up infinite carousel pool
    const textReviews = reviewsList.filter(r => r.text && r.text.trim().length > 5);
    const negativesPool = textReviews.filter(r => r.stars <= 2 && r.text.length > 10);
    const positivesPool = textReviews.filter(r => r.stars === 5 && r.text.length > 20);
    const restPool = textReviews.filter(r => !negativesPool.includes(r) && !positivesPool.includes(r));
    
    // Combine and shuffle the pool for randomization
    const combinedPool = [...negativesPool, ...positivesPool, ...restPool];
    for (let i = combinedPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedPool[i], combinedPool[j]] = [combinedPool[j], combinedPool[i]];
    }

    // Limit to maximum 40 reviews in the carousel pool to avoid rendering too many items
    if (combinedPool.length > 40) {
      combinedPool.length = 40;
    }

    this.carouselPool = combinedPool.map((r, index) => {
      r.carouselId = index;
      return r;
    });
    this.carouselBatchSize = 8;
    this.carouselStartIndex = 0;

    // Render all elements of the pool. If size > 3, duplicate them for seamless wrapping.
    let activeReviews = [];
    if (this.carouselPool.length > 0) {
      if (this.carouselPool.length > 3) {
        activeReviews = [...this.carouselPool, ...this.carouselPool];
      } else {
        activeReviews = [...this.carouselPool];
      }
    }
    const countWithText = textReviews.length;

    const avgRating = currGlobal.avgRating;
    const cards = sorted.map(s => {
      const delta = (s.curr.score - s.historico);
      const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
      const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      const currScoreStr = s.curr.score > 0 ? s.curr.score.toFixed(2) : '—';
      const mayoBlock = s.hasAlert
        ? `<div class="bc-mayo warn"><span class="mono">${currMonthShort}</span> <span>${s.curr.negativeCount} negativa${s.curr.negativeCount !== 1 ? 's' : ''}</span></div>`
        : `<div class="bc-mayo"><span class="mono">${currMonthShort}</span> <span>Sin incidencias</span></div>`;

      let hoverClass = ' stable-green';
      let statusClass = 'ok';
      let statusTitle = 'Estable';
      if (s.alerta) {
        if (s.curr.score >= KpiMeta.ratingMinimo) {
          hoverClass = ' alerta-orange';
          statusClass = 'warn-orange';
          statusTitle = 'Atención requerida';
        } else {
          hoverClass = ' alerta-red';
          statusClass = 'warn-red';
          statusTitle = 'Crítico';
        }
      }
      return `
      <a class="branch-card${hoverClass}" href="#/sucursal/${s.id}">
        ${svgIcon('fleur')}
        <div class="bc-top">
          <div class="bc-name">${s.abr}</div>
          <div class="bc-card-stars">${s.curr.score > 0 ? starStr(Math.round(s.curr.score)) : '—'}</div>
          <span class="bc-status ${statusClass}" title="${statusTitle}"></span>
        </div>
        <div class="bc-score-row">
          <span class="bc-score num">${currScoreStr}</span>
        </div>
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
        <div class="alert-strip alert-box-sunken clickable r" onclick="HomeView.openAllAlertsModal()">
          <div class="watermark-stars" style="opacity: 0.05;">
            ${svgIcon('starFilled')}
            ${svgIcon('star')}
            ${svgIcon('star')}
            ${svgIcon('star')}
            ${svgIcon('star')}
          </div>
          <div class="alert-header-row" style="display:flex; align-items:center; gap:12px; margin-bottom:12px; z-index:1; position:relative;">
            <div class="alert-icon-box" style="margin-top:0;">${svgIcon('alert')}</div>
            <div class="alert-title" style="margin-bottom:0;">Alerta Activa · ${capitalizedCurrMonth} ${currYear}</div>
          </div>
          <div class="alert-content" style="z-index:1; position:relative; flex-grow:1; display:flex; flex-direction:column; justify-content:space-between;">
            <div class="alert-text">${conAlerta.length} sucursal${conAlerta.length !== 1 ? 'es' : ''} con alerta activa (${totalNegativasActivas} reseñas negativas). Reportar a Marketing.</div>
            <div style="border-top: 1px solid var(--border); margin-top: 16px; padding-top: 16px;">
              <div class="alert-pills" style="margin-top:0;">
                ${conAlerta.map(s => `<button class="alert-pill" onclick="event.stopPropagation(); HomeView.openAlertModal('${s.id}')">${s.abr} · ${s.curr.negativeCount}</button>`).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      alertBannerHtml = `
        <div class="alert-strip ok-box-sunken r">
          <div class="alert-header-row" style="display:flex; align-items:center; gap:12px; margin-bottom:12px; z-index:1; position:relative;">
            <div class="alert-icon-box" style="margin-top:0;">${svgIcon('check')}</div>
            <div class="alert-title" style="margin-bottom:0;">Operación Estable</div>
          </div>
          <div class="alert-content" style="z-index:1; position:relative; flex-grow:1; display:flex; flex-direction:column; justify-content:flex-start;">
            <div class="alert-text">Sin alertas registradas en ${capitalizedCurrMonth} ${currYear}. Todo bajo control.</div>
          </div>
        </div>
      `;
    }

    const sortedMonths = [...(DataLoader.manifest[currYear] || [])].sort((a, b) => a - b);
    const customOptionsHtml = sortedMonths.map(m => {
      const monthName = MONTH_NAMES[m - 1];
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const isActive = m === currMonth ? ' active' : '';
      return `<div class="custom-option${isActive}" data-value="${m}" onclick="HomeView.selectHeroMonthOption(${m})">${capMonth} ${currYear}</div>`;
    }).join('');

    const dropdownHtml = `
      <div class="hero-month-select-container">
        <div class="custom-select" id="heroMonthDropdown">
          <button class="custom-select-trigger" onclick="HomeView.toggleHeroMonthDropdown(event)">
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
    `;

    const trendHtml = hasPrevMonth
      ? `<span class="hero-trend" style="${currGlobal.avgRating >= prevGlobal.avgRating ? 'background:rgba(122,216,154,.12);border-color:rgba(122,216,154,.25);color:#A7DBB9;' : 'background:rgba(178,58,43,.12);border-color:rgba(178,58,43,.25);color:#F4A090;'}">${currGlobal.avgRating >= prevGlobal.avgRating ? '↑' : '↓'} ${Math.abs(currGlobal.avgRating - prevGlobal.avgRating).toFixed(2)} vs ${capitalizedPrevMonth} (${prevGlobal.avgRating.toFixed(2)})</span>`
      : `<span class="hero-trend" style="background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.1);color:#FAF5EB;">Meta: 4.50★</span>`;

    const prevVolSubHtml = hasPrevMonth
      ? `<span class="hero-stat-sub">${prevGlobal.totalReviews} en ${capitalizedPrevMonth.toLowerCase()}</span>`
      : `<span class="hero-stat-sub">Meta: 4.5+ estrellas</span>`;

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

    // Mensaje de bienvenida personalizado para roles corporativos / regionales (Idea 4)
    const userName = (typeof AppAuth !== 'undefined' && AppAuth.profile?.nombre) || 'Usuario';
    const userRole = (typeof AppAuth !== 'undefined' && AppAuth.getUserRole()) || 'admin';
    const roleMap = { admin: 'Administrador', director: 'Director', regional: 'Gerente Regional', zonal: 'Gerente Zonal' };
    const roleLabel = roleMap[userRole] || userRole;

    const welcomeBannerHtml = `
      <div class="welcome-banner-home" style="margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 14px; width: 100%;">
        <div style="font-family: var(--sans); font-size: 18px; font-weight: 700; color: #FAF5EB; margin-bottom: 4px;">¡Hola, ${userName}!</div>
        <div style="font-size: 12.5px; color: rgba(245, 239, 230, 0.75); line-height: 1.4;">
          Bienvenido al portal regional (${roleLabel}). Actualmente hay <strong>${totalNegativasActivas}</strong> quejas críticas activas en la región.
        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = `
      ${concludedBannerHtml}
      ${buildTopbar()}
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-left">
            ${welcomeBannerHtml}
            <div class="hero-label-row" style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:16px;">
              <span class="eyebrow" style="color:rgba(245,239,230,.55);">Promedio Regional</span>
              ${dropdownHtml}
            </div>
            <div class="hero-score">
              <span class="hero-score-num num" id="heroNum">${currGlobal.avgRating.toFixed(2)}</span>
              <div class="hero-score-side">
                <span class="hero-stars">${starStr(Math.round(currGlobal.avgRating))}</span>
                <span class="hero-of">de 5.00</span>
                ${trendHtml}
              </div>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-stat">
              <span class="hero-stat-val num">${currGlobal.totalReviews}</span>
              <div class="hero-stat-info">
                <span class="hero-stat-label">Reseñas ${capitalizedCurrMonth}</span>
                ${prevVolSubHtml}
              </div>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-val num">${branches.length}</span>
              <div class="hero-stat-info">
                <span class="hero-stat-label">Sucursales</span>
                <span class="hero-stat-sub">Región ${activeRegion}</span>
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
          ${this._buildHeroDiagnosis(conAlerta, currGlobal, branches, currStats)}
        </div>
      </section>

      <div class="home-grid-2" style="margin-top: 24px; margin-bottom: 24px;">
        ${alertBannerHtml}
        ${this._buildHighlights(branches, currYear, currMonth)}
      </div>

      ${kpiSection}

      <section class="section r">
        <div class="section-head" style="margin-bottom: 8px;">
          <div class="section-title">Evaluación <span class="accent">de sucursales</span></div>
        </div>

        <div class="branch-controls-bar">
          <div class="filter-row">
            <button class="chip ${this.filter === 'todas' ? 'active' : ''}" onclick="HomeView.setFilter('todas')">Todas <span class="chip-count">${branches.length}</span></button>
            <button class="chip ${this.filter === 'alerta' ? 'active' : ''}" onclick="HomeView.setFilter('alerta')">Con alerta <span class="chip-count">${conAlerta.length}</span></button>
            <button class="chip ${this.filter === 'estables' ? 'active' : ''}" onclick="HomeView.setFilter('estables')">Estables <span class="chip-count">${sinAlerta.length}</span></button>
          </div>
          
          <div class="controls-right">
            <div class="search-wrapper">
              <span class="search-icon-svg">${svgIcon('search')}</span>
              <input type="text" class="branch-search-input" id="branchSearchInput" placeholder="Buscar sucursal…" value="${this.searchQuery}" oninput="HomeView.handleBranchSearch(this.value)">
            </div>
            
            <div class="custom-select" id="branchSortDropdown">
              <button class="custom-select-trigger" onclick="HomeView.toggleSortDropdown(event)">
                <span class="custom-select-label">Orden:</span>
                <span class="custom-select-value" id="sortValLabel">${this.getSortLabel(this.sortBy)}</span>
                <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="custom-select-options">
                <div class="custom-option${this.sortBy === 'default' ? ' active' : ''}" data-value="default" onclick="HomeView.selectSortOption('default', 'Predeterminado')">Predeterminado</div>
                <div class="custom-option${this.sortBy === 'rating-desc' ? ' active' : ''}" data-value="rating-desc" onclick="HomeView.selectSortOption('rating-desc', 'Mayor Rating')">Mayor Rating</div>
                <div class="custom-option${this.sortBy === 'rating-asc' ? ' active' : ''}" data-value="rating-asc" onclick="HomeView.selectSortOption('rating-asc', 'Menor Rating')">Menor Rating</div>
                <div class="custom-option${this.sortBy === 'volume-desc' ? ' active' : ''}" data-value="volume-desc" onclick="HomeView.selectSortOption('volume-desc', 'Mayor Volumen')">Mayor Volumen</div>
              </div>
            </div>
          </div>
        </div>

        <div class="branch-grid" id="branchGrid">${cards || '<div class="empty-state"><span class="glyph">—</span>Sin sucursales para este filtro</div>'}</div>
      </section>

      ${this._buildReviewFeed(activeReviews, countWithText)}

      <footer class="footer">
        <span class="brand" style="text-transform:none; font-family:var(--giaza); font-size:18px;">étoile</span> · La Crêpe Parisienne / Grupo MYT<br>
        Dashboard de Reseñas · Región ${getRegionName(activeRegion)} · Fuente: Google Reviews
      </footer>`;

    requestAnimationFrame(() => {
      document.getElementById('heroNum')?.classList.add('in');
      initReveal();

      // Close custom selects on clicking outside
      const _clickOutsideHandler = (e) => {
        document.querySelectorAll('.custom-select.open').forEach(dropdown => {
          if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
          }
        });
      };
      document.removeEventListener('click', window._customSelectsOutsideHandler);
      window._customSelectsOutsideHandler = _clickOutsideHandler;
      document.addEventListener('click', _clickOutsideHandler);

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

      // Animate KPI progress bars: start at 0 → target width
      document.querySelectorAll('.kpi-progress-bar').forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        bar.style.transition = 'none';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bar.style.transition = '';
            bar.style.width = targetWidth;
          });
        });
      });

      // Start Carousel Autoplay
      HomeView.initAutoplay();

      // Check for welcome onboarding / walkthrough (Idea 3)
      if (localStorage.getItem('lcp_walkthrough_seen') !== 'true') {
        setTimeout(() => {
          if (typeof LcpWalkthrough !== 'undefined') {
            LcpWalkthrough.showWelcomeOnboarding(userName, userRole);
          }
        }, 1000);
      }

      // Pause carousel autoplay on hover, click, or touch hold
      const carouselOuter = document.querySelector('.review-feed-carousel-outer');
      if (carouselOuter) {
        carouselOuter.addEventListener('mouseenter', () => { HomeView.isPaused = true; });
        carouselOuter.addEventListener('mouseleave', () => { HomeView.isPaused = false; });
        carouselOuter.addEventListener('mousedown', () => { HomeView.isPaused = true; });
        carouselOuter.addEventListener('mouseup', () => { HomeView.isPaused = false; });
        
        // Touch events for mobile
        carouselOuter.addEventListener('touchstart', () => { HomeView.isPaused = true; }, { passive: true });
        carouselOuter.addEventListener('touchend', () => { HomeView.isPaused = false; }, { passive: true });
        carouselOuter.addEventListener('touchcancel', () => { HomeView.isPaused = false; }, { passive: true });
      }
    });
  },

  _buildKpiSection(kpi, currStats, prevKpi, monthName, year, prevMonthName, hasPrevMonth, sparklines) {
    const missingVol = [];
    for (const meta of SUCURSALES_META) {
      const stats = currStats[meta.id] || { count: 0 };
      if (stats.count < kpi.volumen.meta) {
        missingVol.push(meta.abr);
      }
    }
    const volClass = missingVol.length === 0 ? 'optimal' : 'attention';
    const volValue = `${kpi.volumen.ok} de ${kpi.volumen.total}`;
    const volSub = missingVol.length > 0 ? `No cumplen: ${missingVol.join(', ')}` : 'Todas cumplen la meta';

    const calClass = kpi.calidadTexto.ratio >= KpiMeta.calidadTextoMeta ? 'optimal' : 'attention';
    const calValue = `${(kpi.calidadTexto.ratio * 100).toFixed(0)}% con texto`;
    const calTrend = (hasPrevMonth && prevKpi) ? kpi.calidadTexto.ratio - prevKpi.calidadTexto.ratio : 0;
    const calTrendStr = (hasPrevMonth && prevKpi)
      ? (calTrend > 0.005 
        ? `<span class="kpi-arrow up">↑</span> +${(calTrend * 100).toFixed(0)}% vs ${prevMonthName}` 
        : calTrend < -0.005 
          ? `<span class="kpi-arrow down">↓</span> ${(calTrend * 100).toFixed(0)}% vs ${prevMonthName}` 
          : 'Sin cambios vs mes anterior')
      : `Meta: ${(KpiMeta.calidadTextoMeta * 100).toFixed(0)}% con texto`;

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

    // Generate sparklines SVGs
    const volSpark = createSparklineSVG(sparklines?.volumen || [], 110, 32, volClass === 'optimal' ? '#7A9E8A' : '#c97d10');
    const calSpark = createSparklineSVG(sparklines?.calidad || [], 110, 32, calClass === 'optimal' ? '#7A9E8A' : '#c97d10');
    const ratSpark = createSparklineSVG(sparklines?.rating || [], 110, 32, ratClass === 'optimal' ? '#7A9E8A' : '#c62828');
    const negSpark = createSparklineSVG(sparklines?.respuestas || [], 110, 32, negClass === 'optimal' ? '#7A9E8A' : '#c62828');

    return `
      <section class="section r">
        <div class="section-head">
          <div class="section-title">KPIs de Operación</div>
          <span class="section-sub">Seguimiento de cumplimiento contra objetivos regionales</span>
        </div>
        <div class="scorecard-grid">
          <!-- Volumen de reseñas: Click opens sidebar -->
          <div class="scorecard status-${volClass} kpi-interactive-card" role="button" tabindex="0" aria-label="Volumen de reseñas: ${volValue}. ${volSub}. Presiona para abrir feed de opiniones." onclick="HomeView.openFullFeedModal('todas')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
            <div class="sc-header-row">
              <span class="sc-label">Volumen de reseñas</span>
              <span class="sc-chevron">→</span>
            </div>
            <div class="sc-value-row">
              <div class="sc-value num">${volValue}</div>
              <div class="sc-sparkline">${volSpark}</div>
            </div>
            <div class="sc-sub" style="margin-bottom: 8px;">${volSub}</div>
            <div class="kpi-progress"><div class="kpi-progress-bar" style="width:${(kpi.volumen.ok / kpi.volumen.total * 100).toFixed(0)}%"></div></div>
            <span class="badge badge-${volClass}">${volClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
          </div>

          <!-- Calidad de reseña: Click opens sidebar -->
          <div class="scorecard status-${calClass} kpi-interactive-card" role="button" tabindex="0" aria-label="Calidad de reseña: ${calValue}. ${calTrendStr.replace(/<[^>]*>/g, '')}. Presiona para abrir feed de positivas." onclick="HomeView.openFullFeedModal('positivas')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
            <div class="sc-header-row">
              <span class="sc-label">Calidad de reseña</span>
              <span class="sc-chevron">→</span>
            </div>
            <div class="sc-value-row">
              <div class="sc-value num">${calValue}</div>
              <div class="sc-sparkline">${calSpark}</div>
            </div>
            <div class="sc-sub" style="margin-bottom: 8px;">${calTrendStr}</div>
            <div class="kpi-progress"><div class="kpi-progress-bar" style="width:${Math.min(kpi.calidadTexto.ratio / KpiMeta.calidadTextoMeta * 100, 100).toFixed(0)}%"></div></div>
            <span class="badge badge-${calClass}">${calClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
          </div>

          <!-- Rating mínimo regional: Collapsible as before -->
          <div class="scorecard status-${ratClass}" role="button" tabindex="0" aria-expanded="false" aria-label="Rating mínimo regional: ${ratValue}. ${ratSub}. Presiona para ver detalles." onclick="this.classList.toggle('active'); this.setAttribute('aria-expanded', this.classList.contains('active') ? 'true' : 'false')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
            <div class="sc-header-row">
              <span class="sc-label">Rating mínimo regional</span>
              <span class="sc-chevron">▼</span>
            </div>
            <div class="sc-value-row">
              <div class="sc-value num">${ratValue}</div>
              <div class="sc-sparkline">${ratSpark}</div>
            </div>
            <div class="kpi-progress"><div class="kpi-progress-bar" style="width:${((kpi.volumen.total - kpi.ratingMinimo.belowMin.length) / kpi.volumen.total * 100).toFixed(0)}%"></div></div>
            <span class="badge badge-${ratClass}">${ratClass === 'optimal' ? 'Cumple' : 'Crítico'}</span>
            <div class="sc-details-wrapper">
              <div class="sc-details-inner">
                <div class="sc-sub">${ratSub}</div>
              </div>
            </div>
          </div>

          <!-- Respuestas a Negativas: Click opens sidebar -->
          <div class="scorecard status-${negClass} kpi-interactive-card" role="button" tabindex="0" aria-label="Respuestas a reseñas negativas: ${negValue}. ${negSub}. Presiona para abrir feed de quejas sin responder." onclick="HomeView.openFullFeedModal('negativas', true)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
            <div class="sc-header-row">
              <span class="sc-label">Respuestas a Negativas</span>
              <span class="sc-chevron">→</span>
            </div>
            <div class="sc-value-row">
              <div class="sc-value num">${negValue}</div>
              <div class="sc-sparkline">${negSpark}</div>
            </div>
            <div class="sc-sub" style="margin-bottom: 8px;">${negSub}</div>
            <div class="kpi-progress"><div class="kpi-progress-bar" style="width:${(kpi.tasaRespuesta.totalNegativas === 0 ? 100 : (kpi.tasaRespuesta.conRespuesta / kpi.tasaRespuesta.totalNegativas * 100)).toFixed(0)}%"></div></div>
            <span class="badge badge-${negClass}">${negClass === 'optimal' ? 'Sin pendientes' : 'Atención'}</span>
          </div>
        </div>
      </section>
    `;
  },

  async setFilter(f) {
    this.filter = f;
    this.searchQuery = '';
    this.sortBy = 'default';
    await this.render();
    initReveal();
  },

  handleBranchSearch(query) {
    this.searchQuery = query.toLowerCase();
    this._updateBranchGrid();
  },

  handleBranchSort(value) {
    this.sortBy = value;
    this._updateBranchGrid();
  },

  _updateBranchGrid() {
    const currYear = DataLoader.currentYear;
    const currMonth = DataLoader.currentMonth;
    const currStats = DataLoader.getAllBranchStats(currYear, currMonth);
    const currMonthName = new Date(currYear, currMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const capitalizedCurrMonth = currMonthName.charAt(0).toUpperCase() + currMonthName.slice(1);
    const currMonthShort = capitalizedCurrMonth.substring(0, 3).toUpperCase();

    let branches = SUCURSALES_META.map(meta => {
      const c = currStats[meta.id] || { avg: 0, count: 0, negativeCount: 0 };
      const branchReviews = DataLoader.getReviewsForBranch(currYear, currMonth, meta.id);
      const negativeWithTextCount = branchReviews.filter(r => r.stars <= 2 && r.text && r.text.trim().length > 0).length;
      return { ...meta, curr: { score: c.avg, count: c.count, negativeCount: negativeWithTextCount }, alerta: negativeWithTextCount > 0 };
    });

    // Apply chip filter
    if (this.filter === 'alerta') branches = branches.filter(s => s.alerta);
    else if (this.filter === 'estables') branches = branches.filter(s => !s.alerta);

    // Apply search
    if (this.searchQuery) {
      branches = branches.filter(s =>
        s.nombre.toLowerCase().includes(this.searchQuery) ||
        s.abr.toLowerCase().includes(this.searchQuery)
      );
    }

    // Apply sort
    switch (this.sortBy) {
      case 'rating-desc': branches.sort((a, b) => b.curr.score - a.curr.score); break;
      case 'rating-asc': branches.sort((a, b) => a.curr.score - b.curr.score); break;
      case 'volume-desc': branches.sort((a, b) => b.curr.count - a.curr.count); break;
      default: branches.sort((a, b) => {
        const scoreA = a.curr.score + (a.curr.count > 0 ? 0.15 * Math.log2(a.curr.count) : 0);
        const scoreB = b.curr.score + (b.curr.count > 0 ? 0.15 * Math.log2(b.curr.count) : 0);
        return scoreB - scoreA;
      }); break;
    }

    const currGlobal = DataLoader.getGlobalStats(currYear, currMonth);
    const avgRating = currGlobal.avgRating;
    const cards = branches.map(s => {
      const delta = (s.curr.score - s.historico);
      const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
      const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      const currScoreStr = s.curr.score > 0 ? s.curr.score.toFixed(2) : '—';
      const mayoBlock = s.alerta
        ? `<div class="bc-mayo warn"><span class="mono">${currMonthShort}</span> <span>${s.curr.negativeCount} negativa${s.curr.negativeCount !== 1 ? 's' : ''}</span></div>`
        : `<div class="bc-mayo"><span class="mono">${currMonthShort}</span> <span>Sin incidencias</span></div>`;

      let hoverClass = ' stable-green';
      let statusClass = 'ok';
      let statusTitle = 'Estable';
      if (s.alerta) {
        if (s.curr.score >= KpiMeta.ratingMinimo) {
          hoverClass = ' alerta-orange';
          statusClass = 'warn-orange';
          statusTitle = 'Atención requerida';
        } else {
          hoverClass = ' alerta-red';
          statusClass = 'warn-red';
          statusTitle = 'Crítico';
        }
      }
      const isCinemex = s.isCinemex || false;
      return `
      <a class="branch-card${hoverClass}${isCinemex ? ' cinemex-card' : ''}" href="#/sucursal/${s.id}">
        ${svgIcon('fleur')}
        ${isCinemex ? `<div class="bc-cinemex-badge">${svgIcon('cinema')} Cinemex</div>` : ''}
        <div class="bc-top">
          <div class="bc-name">${s.abr}</div>
          <div class="bc-card-stars">${s.curr.score > 0 ? starStr(Math.round(s.curr.score)) : '—'}</div>
          <span class="bc-status ${statusClass}" title="${statusTitle}"></span>
        </div>
        <div class="bc-score-row"><span class="bc-score num">${currScoreStr}</span></div>
        <div class="bc-meta"><span><strong>${s.curr.count}</strong> reseña${s.curr.count !== 1 ? 's' : ''} ${capitalizedCurrMonth.substring(0,3).toLowerCase()}</span><span class="bc-delta ${dClass} num">${dStr} vs hist</span></div>
        ${mayoBlock}
      </a>`;
    }).join('');

    const grid = document.getElementById('branchGrid');
    if (grid) grid.innerHTML = cards || '<div class="empty-state"><span class="glyph">—</span>Sin sucursales para este filtro</div>';
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

  _buildHeroDiagnosis(conAlerta, currGlobal, branches, currStats) {
    const STANDARD = KpiMeta.ratingMinimo; // 4.60
    if (conAlerta.length > 0) {
      const names = conAlerta.map(s => s.abr).join(', ');
      return `
        <div class="hero-diagnosis status-critical">
          <span class="hero-diagnosis-icon">${svgIcon('alert')}</span>
          <span class="hero-diagnosis-text"><strong>FOCO OPERATIVO:</strong> Incidencias en ${names}. Reportar a Marketing para atención inmediata.</span>
        </div>`;
    }
    if (currGlobal.avgRating < STANDARD) {
      const worst = branches.reduce((min, b) => {
        const s = currStats[b.id] || { avg: 0 };
        return (s.avg > 0 && s.avg < (min.score || 99)) ? { name: b.abr, score: s.avg } : min;
      }, { name: '—', score: 99 });
      return `
        <div class="hero-diagnosis status-warn">
          <span class="hero-diagnosis-icon">${svgIcon('barChart')}</span>
          <span class="hero-diagnosis-text"><strong>FOCO OPERATIVO:</strong> Promedio regional por debajo del objetivo (${STANDARD.toFixed(2)}★). ${worst.name} registra el desempeño más bajo (${worst.score.toFixed(2)}★).</span>
        </div>`;
    }
    return `
      <div class="hero-diagnosis status-optimal">
        <span class="hero-diagnosis-icon">${svgIcon('check')}</span>
        <span class="hero-diagnosis-text"><strong>OPERACIÓN ESTABLE:</strong> Todas las sucursales cumplen con el estándar regional (${STANDARD.toFixed(2)}★). Mantener consistencia operativa.</span>
      </div>`;
  },

  _buildReviewFeed(activeReviews, countWithText) {
    const isCarouselDisabled = this.carouselPool.length <= 3;
    const cards = activeReviews.map(r => {
      const isNeg = r.stars <= 3;
      const cardClass = isNeg ? 'review-card neg' : 'review-card';
      const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      const timeStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '';
      const branchMeta = SUCURSALES_META_ALL.find(s => s.id === r.sucursal);
      const branchDisplayName = branchMeta ? branchMeta.abr : r.sucursal;
      return `
        <div class="${cardClass}" onclick="HomeView.openReviewDetailModal(${r.carouselId})">
          <div class="rc-head">
            <span class="rc-branch">${branchDisplayName}</span>
            <span class="rc-date">${timeStr}</span>
          </div>
          <div class="rc-stars">${starsHtml}</div>
          <p class="rc-text">"${r.text}"</p>
        </div>
      `;
    }).join('');

    return `
      <section class="section review-feed-section r">
        <div class="section-head" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div class="section-title">Actividad Reciente <span class="accent">de reseñas</span></div>
            <span class="section-sub">Extracto del pulso de la operación en ${getRegionName(activeRegion)}</span>
          </div>
          <button class="show-all-btn-link" onclick="HomeView.openFullFeedModal()">Ver todas con texto (${countWithText}) →</button>
        </div>
        <div class="review-feed-carousel-outer${isCarouselDisabled ? ' carousel-disabled' : ''}" style="position: relative; width: 100%; margin-top: 14px;">
          <button class="carousel-arrow prev" onclick="HomeView.scrollCarousel('prev')" aria-label="Anterior">${svgIcon('arrow')}</button>
          <div class="review-feed-carousel-wrapper" style="margin-top: 0;">
            <div class="review-feed-grid" id="reviewFeedGrid">
              ${cards || '<div class="empty-state">Sin reseñas con texto en este periodo</div>'}
            </div>
          </div>
          <button class="carousel-arrow next" onclick="HomeView.scrollCarousel('next')" aria-label="Siguiente">${svgIcon('arrow')}</button>
        </div>
      </section>
    `;
  },

  openFullFeedModal(initialSentiment = 'todas', onlyUnreplied = false) {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;
    
    this.feedSentiment = initialSentiment;
    this.feedBranch = 'todas';
    this.feedOnlyUnreplied = onlyUnreplied;
    
    // Freeze background scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
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
              <div class="custom-select" id="sidebarSentimentDropdown">
                <button class="custom-select-trigger" onclick="HomeView.toggleSidebarSentimentDropdown(event)">
                  <span class="custom-select-value" id="sentimentValLabel">${this.getSentimentLabel(initialSentiment)}</span>
                  <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div class="custom-select-options">
                  <div class="custom-option ${initialSentiment === 'todas' ? 'active' : ''}" data-value="todas" onclick="HomeView.selectSidebarSentimentOption('todas', 'Todas las calificaciones')">Todas las calificaciones</div>
                  <div class="custom-option ${initialSentiment === 'positivas' ? 'active' : ''}" data-value="positivas" onclick="HomeView.selectSidebarSentimentOption('positivas', 'Positivas (4-5★)')">Positivas (4-5★)</div>
                  <div class="custom-option ${initialSentiment === 'neutras' ? 'active' : ''}" data-value="neutras" onclick="HomeView.selectSidebarSentimentOption('neutras', 'Neutras (3★)')">Neutras (3★)</div>
                  <div class="custom-option ${initialSentiment === 'negativas' ? 'active' : ''}" data-value="negativas" onclick="HomeView.selectSidebarSentimentOption('negativas', 'Negativas (1-2★)')">Negativas (1-2★)</div>
                </div>
              </div>
            </div>
            
            <div class="filter-group">
              <label>Sucursal</label>
              <div class="custom-select" id="sidebarBranchDropdown">
                <button class="custom-select-trigger" onclick="HomeView.toggleSidebarBranchDropdown(event)">
                  <span class="custom-select-value" id="sidebarBranchValLabel">Todas las sucursales</span>
                  <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div class="custom-select-options">
                  <div class="custom-option active" data-value="todas" onclick="HomeView.selectSidebarBranchOption('todas', 'Todas las sucursales')">Todas las sucursales</div>
                  ${SUCURSALES_META.map(s => `<div class="custom-option" data-value="${s.nombre}" onclick="HomeView.selectSidebarBranchOption('${s.nombre}', '${s.abr}')">${s.abr}</div>`).join('')}
                </div>
              </div>
            </div>

            <div class="filter-group" style="display:flex; align-items:center; gap:8px; margin-top: 14px; grid-column: 1 / -1;">
              <input type="checkbox" id="sidebarUnrepliedCheckbox" ${this.feedOnlyUnreplied ? 'checked' : ''} onchange="HomeView.toggleSidebarUnreplied(this.checked)" style="cursor:pointer; width:16px; height:16px; accent-color:var(--oro);">
              <label for="sidebarUnrepliedCheckbox" style="margin:0; font-size:12px; color:var(--text); cursor:pointer; font-weight:600;">Solo pendientes de respuesta</label>
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

  getSentimentLabel(val) {
    const labels = {
      'todas': 'Todas las calificaciones',
      'positivas': 'Positivas (4-5★)',
      'neutras': 'Neutras (3★)',
      'negativas': 'Negativas (1-2★)'
    };
    return labels[val] || 'Todas las calificaciones';
  },

  toggleSidebarUnreplied(checked) {
    this.feedOnlyUnreplied = checked;
    this.filterSidebarReviews();
  },

  closeSidebar() {
    const overlay = document.getElementById('feedSidebarOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
    // Restore scrolling
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  },

  openReviewDetailModal(carouselId) {
    let r;
    if (typeof carouselId === 'string' && carouselId.includes('-')) {
      r = DataLoader.getReviewByGlobalId(carouselId);
    } else {
      r = this.carouselPool.find(item => item.carouselId === carouselId);
    }
    if (!r) return;

    // Freeze background scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Pause continuous scroll
    HomeView.isPaused = true;

    const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
    const dateStr = r.publishedAtDate ? formatDate(r.publishedAtDate) : 'Sin fecha';
    
    // Check if isLocalGuide
    const localGuideBadge = r.isLocalGuide 
      ? `<span class="local-guide-badge">${svgIcon('starFilled')} Local Guide</span>`
      : '';
      
    // Reply/Owner response
    const responseHtml = r.responseFromOwnerText
      ? `<div class="modal-owner-response"><strong>Respuesta del Propietario:</strong> "${r.responseFromOwnerText}"</div>`
      : '';

    const branchMeta = SUCURSALES_META_ALL.find(s => s.id === r.sucursal);
    const branchDisplayName = branchMeta ? branchMeta.nombre : r.sucursal;

    const modalHtml = `
      <div class="modal-overlay active" id="reviewDetailModal" onclick="if(event.target === this) HomeView.closeReviewDetailModal()">
        <div class="modal-box">
          <div class="modal-header">
            <h2 class="modal-title">Detalle de Reseña</h2>
            <button class="modal-close" onclick="HomeView.closeReviewDetailModal()">×</button>
          </div>
          <div class="modal-body">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span style="font-weight:700; font-size:14px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text);">${branchDisplayName}</span>
                  <span style="color:var(--oro); font-size:14px; letter-spacing:1px; display:inline-flex; align-items:center;">${starsHtml}</span>
                </div>
                <div style="font-size:11px; font-family:var(--mono); color:var(--text-dim); margin-top:2px;">${dateStr}</div>
              </div>
              ${localGuideBadge}
            </div>
            
            <blockquote class="modal-quote">"${r.text}"</blockquote>
            
            ${responseHtml}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Remove any stale handler first
    if (window._escReviewDetailHandler) {
      document.removeEventListener('keydown', window._escReviewDetailHandler);
    }
    
    window._escReviewDetailHandler = (e) => {
      if (e.key === 'Escape') {
        HomeView.closeReviewDetailModal();
      }
    };
    document.addEventListener('keydown', window._escReviewDetailHandler);
  },



  closeReviewDetailModal() {
    const modal = document.getElementById('reviewDetailModal');
    if (modal) {
      modal.remove();
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    if (window._escReviewDetailHandler) {
      document.removeEventListener('keydown', window._escReviewDetailHandler);
      window._escReviewDetailHandler = null;
    }
    // Resume continuous scroll
    HomeView.isPaused = false;
  },

  filterSidebarReviews() {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;

    const sentiment = this.feedSentiment || 'todas';
    const branchNameFilter = this.feedBranch || 'todas';

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

    if (this.feedOnlyUnreplied) {
      filtered = filtered.filter(r => !r.responseFromOwnerText || r.responseFromOwnerText.trim().length === 0);
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
      const branchMeta = SUCURSALES_META_ALL.find(s => s.id === r.sucursal);
      const branchDisplayName = branchMeta ? branchMeta.abr : r.sucursal;
      return `
        <div class="sidebar-review-card ${isNeg ? 'neg' : ''}" onclick="HomeView.openReviewDetailModal('${r.globalId}')">
          <div class="src-head">
            <span class="src-branch">${branchDisplayName}</span>
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

    const branchReviews = DataLoader.getReviewsForBranch(year, month, branchId);
    const negatives = branchReviews.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);

    // Freeze background scrolling when opening the modal
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const monthName = MONTH_NAMES[month - 1] || '';
    const modalHtml = `
      <div class="modal-overlay active" id="alertModal" onclick="if(event.target === this) { this.remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }">
        <div class="modal-box">
          <div class="modal-header">
            <h2 class="modal-title">Alertas: ${branchMeta.abr}</h2>
            <button class="modal-close" onclick="document.getElementById('alertModal').remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = '';">×</button>
          </div>
          <div class="modal-body">
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Las siguientes reseñas negativas requieren reporte a Marketing para su resolución.</p>
            <div class="copy-report-container">
              <button id="copyAlertBtn" class="copy-report-btn" onclick="HomeView.copyAlertSummary('${branchId}')">
                ${svgIcon('clipboard')} Copiar Resumen para Marketing
              </button>
            </div>
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
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
        document.removeEventListener('keydown', _escHandler);
      }
    };
    document.addEventListener('keydown', _escHandler);
  },

  async copyAlertSummary(branchId) {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;
    const branchMeta = SUCURSALES_META.find(s => s.id === branchId);
    if (!branchMeta) return;
    const branchReviews = DataLoader.getReviewsForBranch(year, month, branchId);
    const negatives = branchReviews.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);
    const monthName = MONTH_NAMES[month - 1] || '';
    let text = `étoile GDL — Reporte de Incidencias — ${branchMeta.abr} ${monthName} ${year}\n`;
    text += `${negatives.length} reseña${negatives.length !== 1 ? 's' : ''} crítica${negatives.length !== 1 ? 's' : ''}:\n\n`;
    negatives.forEach((r, i) => {
      const dateStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin fecha';
      text += `${i + 1}. ${dateStr} (${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}): "${r.text}"\n`;
    });
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById('copyAlertBtn');
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '✓ Copiado al portapapeles';
        btn.style.background = 'var(--ok)';
        btn.style.color = '#fff';
        setTimeout(() => { 
          btn.innerHTML = original; 
          btn.style.background = ''; 
          btn.style.color = ''; 
        }, 2500);
      }
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  },

  openAllAlertsModal() {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const monthName = MONTH_NAMES[month - 1] || '';
    let branchesHtml = '';
    let hasIncidents = false;

    SUCURSALES_META.forEach(branchMeta => {
      const branchReviews = DataLoader.getReviewsForBranch(year, month, branchMeta.id);
      const negatives = branchReviews.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);
      if (negatives.length > 0) {
        hasIncidents = true;
        branchesHtml += `
          <div class="branch-incident-group" style="margin-bottom: 20px;">
            <h3 style="font-size:14px; font-weight:700; color:var(--text); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
              <span class="bc-status warn-red" style="margin-top:0; width:8px; height:8px;"></span>
              ${branchMeta.nombre} (${negatives.length})
            </h3>
            ${negatives.map(r => `
              <div class="review-item" style="border-left: 2px solid var(--alerta); padding-left:12px; margin-bottom:12px; margin-left:8px;">
                <div class="ri-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <div class="ri-score" style="color: var(--alerta); font-size:11px;">${starStr(r.stars)}</div>
                  <div class="ri-date" style="font-size:11px; color:var(--text-muted);">${formatDate(r.publishedAtDate)}</div>
                </div>
                <div class="ri-text" style="font-size:13px; line-height:1.4; font-style:italic;">"${r.text}"</div>
              </div>
            `).join('')}
          </div>
        `;
      }
    });

    const modalHtml = `
      <div class="modal-overlay active" id="alertModal" onclick="if(event.target === this) { this.remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }">
        <div class="modal-box" style="max-height: 85vh; display: flex; flex-direction: column;">
          <div class="modal-header" style="flex-shrink: 0;">
            <h2 class="modal-title">Todas las Alertas: ${monthName} ${year}</h2>
            <button class="modal-close" onclick="document.getElementById('alertModal').remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = '';">×</button>
          </div>
          <div class="modal-body" style="overflow-y: auto; flex-grow: 1; padding-top: 14px;">
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Consolidado de reseñas críticas en la región durante el mes. Reportar a Marketing.</p>
            ${hasIncidents ? `
              <div class="copy-report-container">
                <button id="copyAllAlertsBtn" class="copy-report-btn" onclick="HomeView.copyAllAlertsSummary()">
                  ${svgIcon('clipboard')} Copiar Reporte Consolidado
                </button>
              </div>
              ${branchesHtml}
            ` : '<p style="text-align:center; padding:20px; color:var(--text-muted);">No hay reseñas negativas registradas este mes.</p>'}
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
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
        document.removeEventListener('keydown', _escHandler);
      }
    };
    document.addEventListener('keydown', _escHandler);
  },

  async copyAllAlertsSummary() {
    const year = DataLoader.currentYear;
    const month = DataLoader.currentMonth;
    const data = DataLoader.getMonth(year, month);
    if (!data) return;
    const monthName = MONTH_NAMES[month - 1] || '';

    let text = `étoile GDL — Reporte Consolidado de Incidencias — ${monthName} ${year}\n\n`;
    let totalCount = 0;

    SUCURSALES_META.forEach(branchMeta => {
      const branchReviews = DataLoader.getReviewsForBranch(year, month, branchMeta.id);
      const negatives = branchReviews.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);
      if (negatives.length > 0) {
        totalCount += negatives.length;
        text += `• ${branchMeta.nombre} (${negatives.length} reseña${negatives.length !== 1 ? 's' : ''} crítica${negatives.length !== 1 ? 's' : ''}):\n`;
        negatives.forEach((r, i) => {
          const dateStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin fecha';
          text += `  ${i + 1}. ${dateStr} (${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}): "${r.text}"\n`;
        });
        text += '\n';
      }
    });

    if (totalCount === 0) {
      text += 'Sin incidencias registradas.';
    }

    try {
      await navigator.clipboard.writeText(text.trim());
      const btn = document.getElementById('copyAllAlertsBtn');
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '✓ Copiado al portapapeles';
        btn.style.background = 'var(--ok)';
        btn.style.color = '#fff';
        setTimeout(() => { 
          btn.innerHTML = original; 
          btn.style.background = ''; 
          btn.style.color = ''; 
        }, 2500);
      }
    } catch (e) {
      console.warn('Copy failed:', e);
    }
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

    const branchMeta = SUCURSALES_META_ALL.find(s => s.id === rev.sucursal);
    const branchDisplayName = branchMeta ? branchMeta.nombre : rev.sucursal;

    return `
      <div class="chart-card highlight-box r" id="highlightCard" style="display:flex; flex-direction:column; justify-content:space-between; position:relative; min-height:220px; overflow:hidden;">
        <div class="watermark-stars" style="position:absolute; right:-20px; bottom:-20px; font-size:120px; opacity:0.08; color:var(--oro); pointer-events:none;">★</div>
        <div class="highlight-header-row" style="display:flex; align-items:center; gap:12px; margin-bottom:12px; z-index:1; position:relative;">
          <div class="highlight-icon-box" style="width:36px; height:36px; border-radius:50%; background:rgba(184,144,47,0.1); color:var(--oro); display:grid; place-items:center; flex-shrink:0;">
            ${svgIcon('starFilled')}
          </div>
          <div class="highlight-title" style="font-weight:700; font-size:14px; color:var(--sage); text-transform:uppercase; letter-spacing:.06em; margin-bottom:0;">Lo más destacado</div>
        </div>
        <div style="font-size: 15px; line-height: 1.5; font-style:italic; margin-bottom: 12px; position: relative; z-index: 1; flex-grow:1;" data-rev-text>"${rev.text}"</div>
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; margin-top: auto; padding-top:12px; border-top: 1px solid var(--border);">
          <span style="font-size: 13px; font-weight: 500; color: var(--text-muted); display:flex; align-items:center; gap:6px;"><span style="display:inline-block;width:12px;height:1px;background:var(--border);"></span>${branchDisplayName}</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="color:var(--oro);font-size:13px;letter-spacing:1px;">${'★'.repeat(5)}</span>
            ${hasMore ? `<button onclick="HomeView.nextHighlight()" style="background:transparent;border:1px solid var(--border);color:var(--text);font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;cursor:pointer;letter-spacing:.03em;transition:background .15s, border-color .15s;display:flex;align-items:center;gap:4px;" onmouseover="this.style.background='var(--bg)';this.style.borderColor='var(--text-dim)'" onmouseout="this.style.background='transparent';this.style.borderColor='var(--border)'">Siguiente ›</button>` : ''}
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
  },

  toggleSortDropdown(event) {
    event.stopPropagation();
    if (window.innerWidth < 600) {
      const options = [
        { value: 'default', label: 'Predeterminado', active: this.sortBy === 'default' },
        { value: 'rating-desc', label: 'Mayor Rating', active: this.sortBy === 'rating-desc' },
        { value: 'rating-asc', label: 'Menor Rating', active: this.sortBy === 'rating-asc' },
        { value: 'volume-desc', label: 'Mayor Volumen', active: this.sortBy === 'volume-desc' }
      ];
      showBottomSheet('Ordenar Sucursales', options, (val) => {
        const labels = {
          'default': 'Predeterminado',
          'rating-desc': 'Mayor Rating',
          'rating-asc': 'Menor Rating',
          'volume-desc': 'Mayor Volumen'
        };
        HomeView.selectSortOption(val, labels[val]);
      });
    } else {
      const dropdown = document.getElementById('branchSortDropdown');
      if (dropdown) {
        dropdown.classList.toggle('open');
      }
    }
  },

  selectSortOption(val, labelText) {
    this.sortBy = val;
    const labelEl = document.getElementById('sortValLabel');
    if (labelEl) labelEl.textContent = labelText;
    
    // Update active class on options
    const dropdown = document.getElementById('branchSortDropdown');
    if (dropdown) {
      dropdown.querySelectorAll('.custom-option').forEach(opt => {
        if (opt.getAttribute('data-value') === val) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
      dropdown.classList.remove('open');
    }
    
    this._updateBranchGrid();
  },

  getSortLabel(val) {
    const map = {
      'default': 'Predeterminado',
      'rating-desc': 'Mayor Rating',
      'rating-asc': 'Menor Rating',
      'volume-desc': 'Mayor Volumen'
    };
    return map[val] || 'Predeterminado';
  },

  initAutoplay() {
    this.clearAutoplay();
    if (this.carouselPool.length > 3) {
      this.startContinuousScroll();
    }
  },

  clearAutoplay() {
    this.stopContinuousScroll();
  },

  startContinuousScroll() {
    this.stopContinuousScroll();
    const grid = document.getElementById('reviewFeedGrid');
    if (!grid || this.carouselPool.length <= 3) return;

    this.scrollFraction = grid.scrollLeft;
    this.isPaused = false;
    this.scrollAnimationActive = true;

    const animate = () => {
      if (!this.scrollAnimationActive) return;
      const gridEl = document.getElementById('reviewFeedGrid');
      if (!gridEl) {
        this.scrollAnimationActive = false;
        return;
      }

      const halfWidth = gridEl.scrollWidth / 2;
      
      // Wrap around check for continuous loop (works for auto-scroll and manual drag)
      if (gridEl.scrollLeft >= halfWidth) {
        gridEl.scrollLeft -= halfWidth;
        this.scrollFraction = gridEl.scrollLeft;
      } else if (gridEl.scrollLeft < 5 && this.isPaused) {
        // If they dragged to the very beginning, wrap to the second copy
        gridEl.scrollLeft += halfWidth;
        this.scrollFraction = gridEl.scrollLeft;
      }

      if (!this.isPaused) {
        // Sync scroll fraction if external scroll occurred (drag/swipe, arrow click)
        if (Math.abs(gridEl.scrollLeft - this.scrollFraction) > 1.5) {
          this.scrollFraction = gridEl.scrollLeft;
        }

        // Slow continuous scroll speed (0.6px per frame)
        const speed = 0.6;
        this.scrollFraction += speed;

        gridEl.scrollLeft = Math.floor(this.scrollFraction);
      }

      this.scrollAnimationFrame = requestAnimationFrame(animate);
    };

    this.scrollAnimationFrame = requestAnimationFrame(animate);
  },

  stopContinuousScroll() {
    this.scrollAnimationActive = false;
    if (this.scrollAnimationFrame) {
      cancelAnimationFrame(this.scrollAnimationFrame);
      this.scrollAnimationFrame = null;
    }
  },

  scrollCarousel(direction) {
    const grid = document.getElementById('reviewFeedGrid');
    if (!grid || this.carouselPool.length <= 3) return;
    
    const halfWidth = grid.scrollWidth / 2;
    const scrollAmount = 296; // card width + gap (280 + 16)
    
    this.isPaused = true;
    
    if (direction === 'next') {
      if (grid.scrollLeft >= halfWidth - 10) {
        grid.scrollLeft -= halfWidth;
      }
      grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      if (grid.scrollLeft <= 10) {
        grid.scrollLeft += halfWidth;
      }
      grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
    
    clearTimeout(this.carouselResumeTimeout);
    this.carouselResumeTimeout = setTimeout(() => {
      this.scrollFraction = grid.scrollLeft;
      this.isPaused = false;
    }, 400); // Wait for smooth scroll to finish before resuming
  },

  toggleHeroMonthDropdown(event) {
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
        HomeView.selectHeroMonthOption(parseInt(val));
      });
    } else {
      const dropdown = document.getElementById('heroMonthDropdown');
      if (dropdown) {
        dropdown.classList.toggle('open');
      }
    }
  },

  selectHeroMonthOption(month) {
    const dropdown = document.getElementById('heroMonthDropdown');
    if (dropdown) {
      dropdown.classList.remove('open');
    }
    const currYear = DataLoader.currentYear;
    DataLoader.setMonth(currYear, month);
    this.render();
  },

  toggleSidebarSentimentDropdown(event) {
    event.stopPropagation();
    if (window.innerWidth < 600) {
      const options = [
        { value: 'todas', label: 'Todas las calificaciones', active: this.feedSentiment === 'todas' },
        { value: 'positivas', label: 'Positivas (4-5★)', active: this.feedSentiment === 'positivas' },
        { value: 'neutras', label: 'Neutras (3★)', active: this.feedSentiment === 'neutras' },
        { value: 'negativas', label: 'Negativas (1-2★)', active: this.feedSentiment === 'negativas' }
      ];
      showBottomSheet('Filtrar por Calificación', options, (val) => {
        const labels = {
          'todas': 'Todas las calificaciones',
          'positivas': 'Positivas (4-5★)',
          'neutras': 'Neutras (3★)',
          'negativas': 'Negativas (1-2★)'
        };
        HomeView.selectSidebarSentimentOption(val, labels[val]);
      });
    } else {
      const dropdown = document.getElementById('sidebarSentimentDropdown');
      const branchDropdown = document.getElementById('sidebarBranchDropdown');
      if (branchDropdown) branchDropdown.classList.remove('open');
      if (dropdown) {
        dropdown.classList.toggle('open');
      }
    }
  },

  selectSidebarSentimentOption(val, labelText) {
    this.feedSentiment = val;
    const labelEl = document.getElementById('sentimentValLabel');
    if (labelEl) labelEl.textContent = labelText;

    const dropdown = document.getElementById('sidebarSentimentDropdown');
    if (dropdown) {
      dropdown.querySelectorAll('.custom-option').forEach(opt => {
        if (opt.getAttribute('data-value') === val) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
      dropdown.classList.remove('open');
    }
    this.filterSidebarReviews();
  },

  toggleSidebarBranchDropdown(event) {
    event.stopPropagation();
    if (window.innerWidth < 600) {
      const options = [
        { value: 'todas', label: 'Todas las sucursales', active: this.feedBranch === 'todas' },
        ...SUCURSALES_META.map(s => ({
          value: s.nombre,
          label: s.abr,
          active: this.feedBranch === s.nombre
        }))
      ];
      showBottomSheet('Filtrar por Sucursal', options, (val) => {
        const branchMeta = SUCURSALES_META.find(s => s.nombre === val);
        const label = branchMeta ? branchMeta.abr : 'Todas las sucursales';
        HomeView.selectSidebarBranchOption(val, label);
      });
    } else {
      const dropdown = document.getElementById('sidebarBranchDropdown');
      const sentimentDropdown = document.getElementById('sidebarSentimentDropdown');
      if (sentimentDropdown) sentimentDropdown.classList.remove('open');
      if (dropdown) {
        dropdown.classList.toggle('open');
      }
    }
  },

  selectSidebarBranchOption(val, labelText) {
    this.feedBranch = val;
    const labelEl = document.getElementById('sidebarBranchValLabel');
    if (labelEl) labelEl.textContent = labelText;

    const dropdown = document.getElementById('sidebarBranchDropdown');
    if (dropdown) {
      dropdown.querySelectorAll('.custom-option').forEach(opt => {
        if (opt.getAttribute('data-value') === val) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
      dropdown.classList.remove('open');
    }
    this.filterSidebarReviews();
  },

  renderSkeleton() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
      ${buildTopbar()}
      <div style="max-width:1200px; margin:0 auto; padding:24px; box-sizing:border-box; display:flex; flex-direction:column; gap:24px;">
        <!-- Hero Skeleton -->
        <div class="skeleton" style="height: 200px; border-radius: 20px;"></div>
        
        <!-- Alerts and Highlights Skeletons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 12px;">
          <div class="skeleton" style="height: 120px; border-radius: 20px;"></div>
          <div class="skeleton" style="height: 120px; border-radius: 20px;"></div>
        </div>
        
        <!-- KPIs Skeletons -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 12px;">
          <div class="skeleton" style="height: 110px; border-radius: 14px;"></div>
          <div class="skeleton" style="height: 110px; border-radius: 14px;"></div>
          <div class="skeleton" style="height: 110px; border-radius: 14px;"></div>
          <div class="skeleton" style="height: 110px; border-radius: 14px;"></div>
        </div>
        
        <!-- Branch Grid Skeletons -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-top: 24px;">
          <div class="skeleton" style="height: 160px; border-radius: 16px;"></div>
          <div class="skeleton" style="height: 160px; border-radius: 16px;"></div>
          <div class="skeleton" style="height: 160px; border-radius: 16px;"></div>
          <div class="skeleton" style="height: 160px; border-radius: 16px;"></div>
        </div>
      </div>
    `;
    
    app.classList.remove('fade-out');
  }
};
