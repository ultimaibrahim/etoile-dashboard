/**
 * views/branch.js — Vista de sucursal con selector de mes, scorecard de KPIs y reseñas mensuales.
 */

const BranchView = {
  async render(params, isHomeMode = false) {
    this.activeParams = params;
    const meta = getBranchById(params.id);
    if (!meta) {
      Router.navigate('#/');
      return;
    }

    const activeYear = DataLoader.currentYear;
    const activeMonth = DataLoader.currentMonth;

    // Asegurar carga de los meses
    const availableMonths = DataLoader.manifest[activeYear] || [];
    for (const m of availableMonths) {
      await DataLoader.loadMonth(activeYear, m);
    }

    // Carga de mes anterior para comparativas
    let prevMonth = activeMonth - 1;
    let prevYear = activeYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = activeYear - 1;
    }
    const hasPrevMonth = DataLoader.hasMonth(prevYear, prevMonth);
    let prevStats = null;
    if (hasPrevMonth) {
      await DataLoader.loadMonth(prevYear, prevMonth);
      prevStats = DataLoader.computeBranchStats(prevYear, prevMonth, meta.id);
    }

    const reviews = DataLoader.getReviewsForBranch(activeYear, activeMonth, meta.id);
    const stats = DataLoader.computeBranchStats(activeYear, activeMonth, meta.id);

    const monthName = new Date(activeYear, activeMonth - 1).toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const delta = stats.avg > 0 ? (stats.avg - meta.historico) : 0;
    const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
    const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';

    // Evaluación de KPIs (Scorecard)
    const kpiVolClass = stats.count >= KpiMeta.volumenMeta ? 'optimal' : 'attention';
    
    // Calidad de reseña: Mide cuántas reseñas positivas (4 o 5 estrellas) tuvieron texto.
    // Ignora por completo las reseñas negativas para no penalizar el score de calidad.
    const positivas = reviews.filter(r => r.stars >= 4);
    const positivasConTexto = positivas.filter(r => r.text && r.text.trim().length > 5).length;
    
    const hasTextRatio = positivas.length > 0 ? (positivasConTexto / positivas.length) : 0;
    const kpiCalClass = hasTextRatio >= KpiMeta.calidadTextoMeta ? 'optimal' : 'attention';
    const kpiRatClass = stats.avg >= KpiMeta.ratingMinimo || stats.avg === 0 ? 'optimal' : 'critical';

    // Deltas con mes anterior
    const volDiff = prevStats ? (stats.count - prevStats.count) : 0;
    const volDiffStr = volDiff >= 0 ? `+${volDiff}` : `${volDiff}`;
    
    let prevHasTextRatio = 0;
    if (hasPrevMonth) {
      const prevReviews = DataLoader.getReviewsForBranch(prevYear, prevMonth, meta.id);
      const prevPositivas = prevReviews.filter(r => r.stars >= 4);
      const prevPositivasConTexto = prevPositivas.filter(r => r.text && r.text.trim().length > 5).length;
      prevHasTextRatio = prevPositivas.length > 0 ? (prevPositivasConTexto / prevPositivas.length) : 0;
    }
    const calDiff = (hasTextRatio - prevHasTextRatio) * 100;
    const calDiffStr = calDiff >= 0 ? `+${calDiff.toFixed(0)}%` : `${calDiff.toFixed(0)}%`;

    const ratDiff = (prevStats && prevStats.avg > 0) ? (stats.avg - prevStats.avg) : 0;
    const ratDiffStr = ratDiff >= 0 ? `+${ratDiff.toFixed(2)}` : `${ratDiff.toFixed(2)}`;

    const scorecardSection = `
      <div class="scorecard-grid" style="margin-bottom:14px;">
        <div class="scorecard status-${kpiVolClass}">
          <div class="sc-label">Volumen de reseñas</div>
          <div class="sc-value num">${stats.count}</div>
          <div class="kpi-progress"><div class="kpi-progress-bar" style="width:${Math.min(stats.count / KpiMeta.volumenMeta * 100, 100).toFixed(0)}%"></div></div>
          <span class="badge badge-${kpiVolClass}">${kpiVolClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
          <div class="sc-sub" style="margin-top:6px; display:flex; justify-content:space-between; font-size:10px;">
            <span>Meta: ≥${KpiMeta.volumenMeta}</span>
            <span style="color:${volDiff > 0 ? 'var(--verde)' : volDiff < 0 ? 'var(--rojo-soft)' : 'var(--text-muted)'}; font-weight:600;">
              ${volDiffStr} vs anterior
            </span>
          </div>
        </div>
        <div class="scorecard status-${kpiCalClass}">
          <div class="sc-label">Calidad de reseña</div>
          <div class="sc-value num">${(hasTextRatio * 100).toFixed(0)}%</div>
          <div class="kpi-progress"><div class="kpi-progress-bar" style="width:${Math.min(hasTextRatio / KpiMeta.calidadTextoMeta * 100, 100).toFixed(0)}%"></div></div>
          <span class="badge badge-${kpiCalClass}">${kpiCalClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
          <div class="sc-sub" style="margin-top:6px; display:flex; justify-content:space-between; font-size:10px;">
            <span>Meta: ≥${(KpiMeta.calidadTextoMeta * 100).toFixed(0)}%</span>
            <span style="color:${calDiff > 0.5 ? 'var(--verde)' : calDiff < -0.5 ? 'var(--rojo-soft)' : 'var(--text-muted)'}; font-weight:600;">
              ${calDiffStr} vs anterior
            </span>
          </div>
        </div>
        <div class="scorecard status-${kpiRatClass}">
          <div class="sc-label">Rating Mensual</div>
          <div class="sc-value num">${stats.avg > 0 ? stats.avg.toFixed(2) : '—'}</div>
          <div class="kpi-progress"><div class="kpi-progress-bar" style="width:${stats.avg > 0 ? Math.min(stats.avg / KpiMeta.ratingMinimo * 100, 100).toFixed(0) : 0}%"></div></div>
          <span class="badge badge-${kpiRatClass}">${kpiRatClass === 'optimal' ? 'Cumple' : 'Crítico'}</span>
          <div class="sc-sub" style="margin-top:6px; display:flex; justify-content:space-between; font-size:10px;">
            <span>Meta: ≥${KpiMeta.ratingMinimo.toFixed(2)}</span>
            <span style="color:${ratDiff > 0.01 ? 'var(--verde)' : ratDiff < -0.01 ? 'var(--rojo-soft)' : 'var(--text-muted)'}; font-weight:600;">
              ${ratDiffStr} vs anterior
            </span>
          </div>
        </div>
        <div class="scorecard status-${dClass === 'up' ? 'optimal' : dClass === 'down' ? 'attention' : 'optimal'}">
          <div class="sc-label">Δ vs Histórico (${meta.historico.toFixed(1)})</div>
          <div class="sc-value num ${dClass}">${stats.avg > 0 ? dStr : '—'}</div>
          <div class="kpi-progress"><div class="kpi-progress-bar" style="width:100%"></div></div>
          <div class="sc-sub" style="margin-top:6px;">${dClass === 'up' ? '↑ Mejora' : dClass === 'down' ? '↓ Caída' : '→ Estable'}</div>
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
        <div class="check" style="display:flex; align-items:center; justify-content:center; width:20px; height:20px; flex-shrink:0;">${svgIcon('check')}</div>
        <div class="ok-text">
          <strong>Estable</strong>
          Sin incidencias recurrentes de gravedad en este periodo.
        </div>
      </div>`;

    // Calculate Monthly Evolution Trends for current year
    const trendLabels = [];
    const ratingTrendData = [];
    const volumeTrendData = [];
    const sortedMonths = [...availableMonths].sort((a, b) => a - b);
    for (const m of sortedMonths) {
      const monthName = new Date(activeYear, m - 1).toLocaleString('es-ES', { month: 'short' });
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      trendLabels.push(`${capMonth} ${activeYear}`);
      const statsM = DataLoader.computeBranchStats(activeYear, m, meta.id);
      ratingTrendData.push(statsM.count > 0 ? statsM.avg : null);
      volumeTrendData.push(statsM.count);
    }

    const sortedMonthsDesc = [...availableMonths].sort((a, b) => b - a);
    const customOptionsHtml = sortedMonthsDesc.map(m => {
      const monthName = new Date(activeYear, m - 1).toLocaleString('es-ES', { month: 'long' });
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const isActive = m === activeMonth ? ' active' : '';
      return `<div class="custom-option${isActive}" data-value="${m}" onclick="BranchView.selectMonthOption(${m})">${capMonth} ${activeYear}</div>`;
    }).join('');

    const dropdownHtml = `
      <div class="custom-select" id="branchMonthDropdown">
        <button class="custom-select-trigger" onclick="BranchView.toggleMonthDropdown(event)">
          <span class="custom-select-value">${capitalizedMonth} ${activeYear}</span>
          <svg class="custom-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="custom-select-options">
          ${customOptionsHtml}
        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = `
      ${buildTopbar(!isHomeMode, isHomeMode ? '' : meta.nombre)}
      <section class="branch-hero">
        <div class="bh-eyebrow">
          <span>${getRegionName(activeRegion)}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
          <h1 class="bh-name" style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 4px;">
            ${meta.nombre}
            <span style="font-family: var(--mono); color: #E8A020; font-size: 20px; letter-spacing: 2px; font-weight: normal; margin-top: 6px;">
              ${stats.avg > 0 ? starStr(Math.round(stats.avg)) : '—'}
            </span>
          </h1>
          ${meta.isCinemex ? `<div style="margin-bottom: 4px;"><span class="bh-cinemex-badge">${svgIcon('cinema')} Cinemex</span></div>` : ''}
          ${dropdownHtml}
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
        <div class="section-head">
          <div class="section-title">Evolución de KPIs <span class="accent">${activeYear}</span></div>
          <span class="section-sub">Tendencia histórica mensual de calificación y volumen</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:16px; box-shadow:var(--sombra-card);">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px; letter-spacing:0.05em;">Rating Promedio Mensual</div>
            <div style="height:180px; position:relative;">
              <canvas id="branchRatingTrendChart"></canvas>
            </div>
          </div>
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:16px; box-shadow:var(--sombra-card);">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px; letter-spacing:0.05em;">Volumen de Reseñas Mensual</div>
            <div style="height:180px; position:relative;">
              <canvas id="branchVolumeTrendChart"></canvas>
            </div>
          </div>
        </div>
      </section>

      <section class="section r">
        <div class="section-head">
          <div class="section-title">Áreas de Oportunidad <span class="accent">${capitalizedMonth}</span></div>
          <span class="section-sub">Aspectos críticos a mejorar según quejas de 1 a 3 estrellas</span>
        </div>
        ${this._buildOpportunityAreas(reviews, meta.id)}
      </section>

      <section class="section r">
        <div class="section-head" style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div class="section-title">Reseñas</div>
            <span class="section-sub">${reviews.filter(r => r.text && r.text.trim().length > 0).length} verificadas con texto en ${capitalizedMonth} · ${reviews.length} totales</span>
          </div>
        </div>
        <div class="reviews-panel">
          <div class="reviews-list" id="revList">${this._buildRevList(reviews.filter(r => r.text && r.text.trim().length > 0).slice(0, 5))}</div>
          ${reviews.filter(r => r.text && r.text.trim().length > 0).length > 5 ? `<button class="show-all-btn" id="showAllBtn">Mostrar todas las ${reviews.filter(r => r.text && r.text.trim().length > 0).length} reseñas ↓</button>` : ''}
        </div>
      </section>

      <footer class="footer">
        <span class="brand" style="text-transform:none; font-family:var(--giaza); font-size:18px;">étoile</span> · ${meta.nombre}<br>
        Dashboard de Reseñas · Región ${getRegionName(activeRegion)}
      </footer>`;

    // Re-run progress bars animation and load charts after DOM insert
    requestAnimationFrame(() => {
      document.querySelectorAll('.kpi-progress-bar').forEach(bar => {
        const w = bar.style.width;
        bar.style.width = '0%';
        requestAnimationFrame(() => { bar.style.width = w; });
      });
      initReveal();

      // Render Evolution Trend Charts
      setTimeout(() => {
        const ratingCtx = document.getElementById('branchRatingTrendChart')?.getContext('2d');
        const volumeCtx = document.getElementById('branchVolumeTrendChart')?.getContext('2d');
        const color = darkMode ? '#7A9E8A' : '#3D5A47';

        if (ratingCtx) {
          Charts.branchRatingTrend(ratingCtx, trendLabels, ratingTrendData, color);
        }
        if (volumeCtx) {
          Charts.branchVolumeTrend(volumeCtx, trendLabels, volumeTrendData, color);
        }
      }, 100);
    });

    // Close custom select on clicking outside
    const _clickOutsideHandler = (e) => {
      document.querySelectorAll('.custom-select.open').forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    };
    document.removeEventListener('click', window._branchDropdownOutsideHandler);
    window._branchDropdownOutsideHandler = _clickOutsideHandler;
    document.addEventListener('click', _clickOutsideHandler);

    const btn = document.getElementById('showAllBtn');
    if (btn) {
      const reviewsConTexto = reviews.filter(r => r.text && r.text.trim().length > 0);
      let exp = false;
      btn.onclick = () => {
        exp = !exp;
        document.getElementById('revList').innerHTML = this._buildRevList(exp ? reviewsConTexto : reviewsConTexto.slice(0, 5));
        btn.textContent = exp ? '↑ Mostrar menos' : `Mostrar todas las ${reviewsConTexto.length} reseñas ↓`;
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

  _buildOpportunityAreas(reviews, branchId) {
    const negativeReviews = reviews.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);

    let serviceCount = 0;
    let qualityCount = 0;
    let valueCount = 0;

    const serviceRegex = /mesero|lento|espera|atenci[oó]n|servicio|tade|tarde|tardaron|trato|amabilidad/i;
    const qualityRegex = /sabor|fr[ií]o|sucio|malo|crudo|calidad|ingrediente|pelo/i;
    const valueRegex = /caro|precio|porci[oó]n|costo|tama[ñn]o|car[ií]simo|cantidad/i;

    negativeReviews.forEach(r => {
      const txt = r.text || '';
      if (serviceRegex.test(txt)) serviceCount++;
      if (qualityRegex.test(txt)) qualityCount++;
      if (valueRegex.test(txt)) valueCount++;
    });

    const getSeverity = (count) => {
      if (count > 2) return { cls: 'critical', tag: 'Crítico' };
      if (count > 0) return { cls: 'attention', tag: 'Atención' };
      return { cls: 'optimal', tag: 'Óptimo' };
    };

    const serviceSev = getSeverity(serviceCount);
    const qualitySev = getSeverity(qualityCount);
    const valueSev = getSeverity(valueCount);

    const serviceDesc = serviceCount > 0
      ? `Se detectaron <strong>${serviceCount}</strong> comentarios señalando demoras o detalles en la atención (ej. meseros, tiempos de espera).`
      : 'Sin incidencias reportadas sobre tiempos de espera o atención al cliente.';
    
    const qualityDesc = qualityCount > 0
      ? `Se registraron <strong>${qualityCount}</strong> menciones sobre calidad de producto, temperatura de alimentos o higiene.`
      : 'Sin incidencias reportadas sobre el sabor, temperatura o higiene de los alimentos.';

    const valueDesc = valueCount > 0
      ? `Se identificaron <strong>${valueCount}</strong> opiniones cuestionando la relación valor-precio o el tamaño de las porciones.`
      : 'Sin quejas relativas al precio o tamaño de las porciones.';

    const serviceRec = serviceCount > 2
      ? 'Revisar tiempos de despacho y reentrenar al personal en servicio al cliente urgente. Posible falta de personal en horas pico.'
      : serviceCount > 0
        ? 'Monitorear la velocidad de entrega y recordar al equipo el protocolo de bienvenida y trato al cliente.'
        : 'Mantener el estándar actual. Reforzar el reconocimiento al equipo por el excelente trato.';

    const qualityRec = qualityCount > 2
      ? 'Auditar urgentemente la temperatura de los platos, recetas y protocolo de limpieza en cocina. Posible falla en control de calidad.'
      : qualityCount > 0
        ? 'Revisar la temperatura de salida de las crepas y asegurar el apego a la receta estándar.'
        : 'Mantener la constancia en sabor y presentación. Asegurar que las estaciones de trabajo sigan impecables.';

    const valueRec = valueCount > 2
      ? 'Evaluar la relación valor-precio. Garantizar que el gramaje de los ingredientes coincida exactamente con la ficha técnica.'
      : valueCount > 0
        ? 'Asegurar que la presentación de los platos justifique el ticket y vigilar el porcionamiento estándar.'
        : 'El valor percibido es adecuado. Continuar con la consistencia del tamaño y calidad del producto.';

    const serviceAttr = serviceCount > 0
      ? `class="proactive-alert-card ${serviceSev.cls} alert-card-interactive" onclick="BranchView.openProblemCategoryModal('servicio', '${branchId}')" title="Haz clic para auditar comentarios de servicio"`
      : `class="proactive-alert-card ${serviceSev.cls}"`;

    const qualityAttr = qualityCount > 0
      ? `class="proactive-alert-card ${qualitySev.cls} alert-card-interactive" onclick="BranchView.openProblemCategoryModal('calidad', '${branchId}')" title="Haz clic para auditar comentarios de producto"`
      : `class="proactive-alert-card ${qualitySev.cls}"`;

    const valueAttr = valueCount > 0
      ? `class="proactive-alert-card ${valueSev.cls} alert-card-interactive" onclick="BranchView.openProblemCategoryModal('precio', '${branchId}')" title="Haz clic para auditar comentarios de precio"`
      : `class="proactive-alert-card ${valueSev.cls}"`;

    return `
      <div class="proactive-alerts-grid">
        <div ${serviceAttr}>
          <div class="pac-header">
            <div class="pac-title-wrap">
              <span class="pac-icon">${svgIcon(serviceCount > 0 ? 'alert' : 'check')}</span>
              <span class="pac-branch">Servicio y Atención</span>
            </div>
            <span class="pac-tag">${serviceSev.tag}</span>
          </div>
          <p class="pac-desc">${serviceDesc}</p>
          <div class="pac-action-box">
            <strong>Recomendación:</strong> ${serviceRec}
          </div>
        </div>

        <div ${qualityAttr}>
          <div class="pac-header">
            <div class="pac-title-wrap">
              <span class="pac-icon">${svgIcon(qualityCount > 0 ? 'alert' : 'check')}</span>
              <span class="pac-branch">Calidad y Limpieza</span>
            </div>
            <span class="pac-tag">${qualitySev.tag}</span>
          </div>
          <p class="pac-desc">${qualityDesc}</p>
          <div class="pac-action-box">
            <strong>Recomendación:</strong> ${qualityRec}
          </div>
        </div>

        <div ${valueAttr}>
          <div class="pac-header">
            <div class="pac-title-wrap">
              <span class="pac-icon">${svgIcon(valueCount > 0 ? 'alert' : 'check')}</span>
              <span class="pac-branch">Precio y Porción</span>
            </div>
            <span class="pac-tag">${valueSev.tag}</span>
          </div>
          <p class="pac-desc">${valueDesc}</p>
          <div class="pac-action-box">
            <strong>Recomendación:</strong> ${valueRec}
          </div>
        </div>
      </div>
    `;
  },

  _buildRevList(reviews) {
    if (!reviews.length) {
      return `<div class="empty-state"><span class="glyph">—</span>Sin reseñas para mostrar en este mes</div>`;
    }
    return reviews.map(r => {
      const low = r.stars <= 3;
      return `<div class="review-item${low ? ' negative' : ''}" onclick="HomeView.openReviewDetailModal('${r.globalId}')" style="cursor: pointer;">
        <div class="rev-author">Reseñante de Google${r.isLocalGuide ? `<span class="rev-guide">Local Guide</span>` : ''}</div>
        <span class="rev-stars${low ? ' low' : ''}">${starStr(r.stars)}</span>
        <div class="rev-meta">${formatDate(r.publishedAtDate)} · ${r.sucursal}</div>
        <div class="rev-text">${(r.text || '').replace(/\n/g, '<br>')}</div>
      </div>`;
    }).join('');
  },

  toggleMonthDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('branchMonthDropdown');
    if (dropdown) {
      dropdown.classList.toggle('open');
    }
  },

  async selectMonthOption(month) {
    const dropdown = document.getElementById('branchMonthDropdown');
    if (dropdown) {
      dropdown.classList.remove('open');
    }
    const activeYear = DataLoader.currentYear;
    DataLoader.setMonth(activeYear, month);
    await this.render(this.activeParams);
    initReveal();
  },

  openProblemCategoryModal(category, branchId) {
    const activeYear = DataLoader.currentYear;
    const activeMonth = DataLoader.currentMonth;
    const branchReviews = DataLoader.getReviewsForBranch(activeYear, activeMonth, branchId);
    
    let regex;
    let title;
    if (category === 'servicio') {
      regex = /mesero|lento|espera|atenci[oó]n|servicio|tade|tarde|tardaron|trato|amabilidad/i;
      title = 'Opiniones sobre Servicio y Atención';
    } else if (category === 'calidad') {
      regex = /sabor|fr[ií]o|sucio|malo|crudo|calidad|ingrediente|pelo/i;
      title = 'Opiniones sobre Calidad y Limpieza';
    } else if (category === 'precio') {
      regex = /caro|precio|porci[oó]n|costo|tama[ñn]o|car[ií]simo|cantidad/i;
      title = 'Opiniones sobre Precio y Porción';
    }
    
    const matchedReviews = branchReviews.filter(r => r.text && regex.test(r.text));
    this.openProblemDetailModal(title, matchedReviews);
  },

  openProblemDetailModal(title, reviews) {
    // Freeze background scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const reviewCards = reviews.length ? reviews.map(r => {
      const isNeg = r.stars <= 2;
      const starsHtml = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      const dateStr = r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Reciente';
      return `
        <div class="modal-rev-card ${isNeg ? 'critical' : ''}" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:12px 16px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px;">
            <span style="color:var(--oro); letter-spacing:1px;">${starsHtml}</span>
            <span style="color:var(--text-dim); font-family:var(--mono);">${dateStr}</span>
          </div>
          <div style="font-size:13px; font-style:italic; line-height:1.4; color:var(--text);">"${r.text}"</div>
          ${r.responseFromOwnerText ? `<div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:8px 12px; margin-top:8px; font-size:12px; color:var(--text-dim);"><strong>Respuesta:</strong> "${r.responseFromOwnerText}"</div>` : ''}
        </div>
      `;
    }).join('') : '<div style="text-align:center; padding:30px; color:var(--text-dim); font-style:italic;">No hay opiniones en esta categoría.</div>';

    const modalHtml = `
      <div class="brand-modal-overlay" id="problemDetailModal" onclick="if(event.target === this) { document.getElementById('problemDetailModal').remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 20, 15, 0.6); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box;">
        <div class="brand-modal-box" style="background: rgba(25, 38, 30, 0.9); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; width: 100%; max-width: 580px; max-height: 80vh; display: flex; flex-direction: column; box-sizing: border-box; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4); animation: modalScaleUp 0.3s ease;">
          <div class="brand-modal-header" style="padding: 20px 24px 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
            <h2 class="brand-modal-title" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text);">${title}</h2>
            <button class="brand-modal-close" onclick="document.getElementById('problemDetailModal').remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = '';" style="background: none; border: none; color: var(--text-dim); font-size: 24px; cursor: pointer;">×</button>
          </div>
          <div class="brand-modal-body" style="padding: 20px 24px; overflow-y: auto; flex: 1;">
            <div class="brand-modal-reviews-list">
              ${reviewCards}
            </div>
          </div>
          <div class="brand-modal-footer" style="padding: 14px 24px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: flex-end;">
            <button class="brand-modal-close-btn" onclick="document.getElementById('problemDetailModal').remove(); document.documentElement.style.overflow = ''; document.body.style.overflow = '';" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); color: var(--text); padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer;">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
};
