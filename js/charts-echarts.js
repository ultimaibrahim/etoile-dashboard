/**
 * charts-echarts.js — Gráficas ECharts de Étoile 2.0 (reemplazan a charts.js / Chart.js).
 * Cada función recibe un contenedor DOM (no un canvas) y devuelve el wrapper de ChartWrapper.
 * Mismas firmas y mismo aspecto que las versiones de Chart.js: tooltip crystal, línea de meta, colores por tema.
 */
const EC = {
  sans: 'Plus Jakarta Sans, sans-serif',
  mono: 'JetBrains Mono, monospace',
  oro: '#E5B842',

  isDark() { return typeof darkMode !== 'undefined' && darkMode; },

  pal() {
    const d = this.isDark();
    return {
      dark: d,
      axisMono: d ? '#8A9E94' : '#8A877C',
      axisSans: d ? '#9DA89F' : '#6B6960',
      grid: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      gridSoft: d ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)',
      goalText: d ? '#E5B842' : '#B8902F',
      ptBorder: d ? '#1C2220' : '#fff'
    };
  },

  /** Resuelve una variable CSS a su color real (un canvas no entiende `var(--x)`) */
  cssVar(name, fallback) {
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; } catch (e) { return fallback; }
  },

  esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
  isMobile() { return window.innerWidth < 500; },

  metaRating() { return typeof KpiMeta !== 'undefined' ? KpiMeta.ratingMinimo : 4.60; },
  metaVolumen() { return typeof KpiMeta !== 'undefined' ? KpiMeta.volumenMeta : 15; },

  /** Tarjeta HTML del tooltip: rows = [{ color, text }] */
  card(title, rows, footer) {
    const body = rows.map(r => `<div class="ct-row"><span class="ct-indicator" style="background:${r.color || 'var(--oro)'}"></span><span class="ct-label">${r.text}</span></div>`).join('');
    return `<div class="etoile-tip-card">${title ? `<div class="ct-header">${this.esc(title)}</div>` : ''}<div class="ct-body">${body}</div>${footer ? `<div class="ct-footer">${footer}</div>` : ''}</div>`;
  },

  tooltip(formatter, trigger = 'axis') {
    return {
      trigger, appendToBody: true, confine: true, className: 'etoile-tip',
      backgroundColor: 'transparent', borderWidth: 0, padding: 0, extraCssText: 'box-shadow:none;',
      transitionDuration: 0.12,
      axisPointer: { type: trigger === 'axis' ? 'line' : 'none', lineStyle: { color: this.isDark() ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)', type: 'dashed' } },
      formatter
    };
  },

  /** Ejes de categorías y de valores con el estilo de Étoile */
  catAxis(labels, p, extra = {}) {
    return Object.assign({
      type: 'category', data: labels,
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
      axisLabel: { fontSize: 10, fontFamily: this.sans, color: p.axisSans }
    }, extra);
  },
  valAxis(p, extra = {}) {
    return Object.assign({
      type: 'value',
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: p.grid } },
      axisLabel: { fontSize: 10, fontFamily: this.mono, color: p.axisMono }
    }, extra);
  },

  /** Línea de meta punteada con etiqueta (equivale al plugin targetLine) */
  goalLine(axis, value, label, lineColor, width, dash, p, position) {
    return {
      silent: true, symbol: 'none', animation: false,
      data: [{ [axis]: value }],
      lineStyle: { color: lineColor, width, type: dash },
      label: { show: true, formatter: label, position, color: p.goalText, fontWeight: 'bold', fontSize: 10, fontFamily: this.sans }
    };
  },

  /** Entrada escalonada de barras (cada una llega un instante después de la anterior) */
  stagger(ms = 35) { return { animationDuration: 750, animationEasing: 'cubicOut', animationDelay: (i) => i * ms }; },

  /** Estado "atenuado" de lo que no está resaltado (se usa al vincular gráficas o al enfocar una barra) */
  blur() { return { itemStyle: { opacity: 0.32 } }; },

  /**
   * Vincula dos gráficas de barras por nombre de categoría: pasar el cursor por una sucursal en una
   * la resalta (y atenúa el resto) en la otra. Es la interacción que hace sentir las gráficas como un solo sistema.
   */
  linkHover(a, b) {
    if (!a || !b) return;
    const cats = (api) => {
      const o = api.chart.getOption();
      const ax = (o.xAxis && o.xAxis[0] && o.xAxis[0].type === 'category') ? o.xAxis[0] : o.yAxis[0];
      return ax.data || [];
    };
    const wire = (from, to) => {
      const toCats = cats(to);
      from.chart.on('mouseover', e => {
        if (e.componentType !== 'series') return;
        const idx = toCats.indexOf(e.name);
        if (idx >= 0) to.chart.dispatchAction({ type: 'highlight', dataIndex: idx });
      });
      from.chart.on('mouseout', () => to.chart.dispatchAction({ type: 'downplay' }));
    };
    wire(a, b); wire(b, a);
  },

  /** En pantallas táctiles el tooltip se oculta a los 5 s (evita el tooltip "pegado" en iOS) */
  autoHideTip(api) {
    if (!api || !window.matchMedia || !matchMedia('(pointer: coarse)').matches) return;
    let t = null;
    api.chart.getZr().on('click', () => {
      clearTimeout(t);
      t = setTimeout(() => api.chart.dispatchAction({ type: 'hideTip' }), 5000);
    });
  },

  setCursor(api, fn) {
    const zr = api.chart.getZr();
    zr.on('mousemove', e => zr.setCursorStyle(fn(e) ? 'pointer' : 'default'));
  },

  /** Etiquetas del eje X: todas visibles; se rotan 30° cuando no caben horizontalmente (como hacía Chart.js) */
  xLabels(el, labels, p, hideOverlap) {
    const perLabel = (el && el.clientWidth ? el.clientWidth : 600) / Math.max(1, labels.length);
    const longest = labels.reduce((m, l) => Math.max(m, String(l).length), 0);
    const rotate = perLabel < longest * 6.4 ? 30 : 0;
    return { fontSize: 10, fontFamily: this.sans, color: p.axisSans, interval: 0, rotate, hideOverlap: !!hideOverlap };
  },

  rgba(hex, a, fallback) {
    if (typeof hex === 'string' && hex.startsWith('#') && hex.length >= 7) {
      return `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;
    }
    return fallback;
  },

  /** Serie de línea de tendencia (compartida por lineTrend y las dos de sucursal) */
  trendSeries({ data, color, border, area, goal, marks = false }) {
    return {
      type: 'line', data, smooth: 0.35, clip: false,
      symbol: 'circle', symbolSize: 8,
      lineStyle: { width: 3, color },
      itemStyle: { color, borderColor: border, borderWidth: 2 },
      emphasis: { scale: 1.5 },
      areaStyle: area ? { color: area } : undefined,
      markLine: goal,
      // Mejor y peor punto con su valor: el hallazgo queda señalado en la propia gráfica
      markPoint: marks ? {
        symbol: 'pin', symbolSize: 40, animationDelay: 600, silent: true,
        label: { color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: this.sans, formatter: pt => Number(pt.value).toFixed(2) },
        data: [
          { type: 'max', name: 'Mejor', itemStyle: { color: '#3D7A55' } },
          { type: 'min', name: 'Más bajo', itemStyle: { color: '#c62828' } }
        ]
      } : undefined
    };
  }
};

const EtoileCharts = {
  heroTrend(el, labels, data) {
    const isDark = EC.isDark();
    const hasData = data.some(v => v !== null && v !== undefined);
    return ChartWrapper.mount(el, {
      state: hasData ? 'ready' : 'empty',
      emptyText: '',
      option: {
        animationDuration: 600,
        grid: { left: 0, right: 0, top: 0, bottom: 0 },
        xAxis: { type: 'category', data: labels, show: false, boundaryGap: false },
        yAxis: { type: 'value', min: 3.5, max: 5.1, show: false },
        tooltip: { show: false },
        series: [{
          type: 'line', data, smooth: 0.4, showSymbol: false, silent: true, connectNulls: true,
          lineStyle: { width: 2, color: isDark ? 'rgba(122,158,138,0.4)' : 'rgba(245,239,230,0.25)' },
          areaStyle: { color: isDark ? 'rgba(122,158,138,0.08)' : 'rgba(245,239,230,0.06)' }
        }]
      }
    });
  },

  barVolume(el, labels, data, colors) {
    const p = EC.pal();
    const api = ChartWrapper.mount(el, {
      state: labels.length ? 'ready' : 'empty',
      option: {
        animationDuration: 700,
        grid: { left: 8, right: 12, top: 12, bottom: 8, containLabel: true },
        tooltip: EC.tooltip(items => {
          const it = items[0];
          return EC.card(it.axisValueLabel, [{ color: 'var(--oro)', text: `${it.value} reseña${it.value !== 1 ? 's' : ''}` }]);
        }),
        xAxis: EC.catAxis(labels, p, { axisLabel: EC.xLabels(el, labels, p, false) }),
        yAxis: EC.valAxis(p, { min: 0, minInterval: 1 }),
        series: [{
          type: 'bar', barMaxWidth: 46,
          data: data.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: 6 } }))
        }]
      }
    });
    EC.autoHideTip(api);
    return api;
  },

  stackedVolume(el, labels, okData, neutralData, warnData, onSelect) {
    const p = EC.pal();
    const d = p.dark;
    const defs = [
      { name: 'Negativas (1-2★)', data: warnData, color: d ? 'rgba(244,144,144,0.85)' : 'rgba(198,40,40,0.85)' },
      { name: 'Neutrales (3★)', data: neutralData, color: d ? 'rgba(244,201,130,0.85)' : 'rgba(201,125,16,0.85)' },
      { name: 'Positivas (4-5★)', data: okData, color: d ? 'rgba(122,158,138,0.75)' : 'rgba(61,90,71,0.75)' }
    ];
    const api = ChartWrapper.mount(el, {
      state: labels.length ? 'ready' : 'empty',
      option: {
        ...EC.stagger(30),
        grid: { left: 8, right: 12, top: (el && el.clientWidth < 420) ? 62 : 36, bottom: 8, containLabel: true },
        legend: {
          top: 0, icon: 'circle', itemWidth: 9, itemHeight: 9, itemGap: 18,
          textStyle: { color: p.axisSans, fontSize: 11, fontFamily: EC.sans }
        },
        tooltip: EC.tooltip(items => {
          let total = 0;
          // Chart.js listaba el dataset de arriba hacia abajo (positivas primero); se conserva ese orden
          const rows = [...items].reverse().map(i => { total += i.value || 0; return { color: i.color, text: `${i.seriesName}: ${i.value}` }; });
          return EC.card(items[0].axisValueLabel, rows, `Total reseñas: ${total}`);
        }),
        xAxis: EC.catAxis(labels, p, { axisLabel: EC.xLabels(el, labels, p, false) }),
        yAxis: EC.valAxis(p, { min: 0, minInterval: 1 }),
        series: defs.map((s, i) => ({
          name: s.name, type: 'bar', stack: 'total', barMaxWidth: 24, barCategoryGap: '25%',
          cursor: onSelect ? 'pointer' : 'default',
          data: s.data,
          itemStyle: { color: s.color, borderRadius: i === 2 ? [4, 4, 0, 0] : 0 },
          emphasis: { focus: 'self' }, blur: EC.blur()
        }))
      }
    });
    if (api && onSelect) api.chart.on('click', e => onSelect(e.dataIndex, e.seriesIndex));
    EC.autoHideTip(api);
    return api;
  },

  barRanking(el, labels, data, colors, onSelect) {
    const p = EC.pal();
    const meta = EC.metaRating();
    const mobile = EC.isMobile();
    const api = ChartWrapper.mount(el, {
      state: labels.length ? 'ready' : 'empty',
      option: {
        ...EC.stagger(45),
        grid: { left: 5, right: 35, top: 26, bottom: 5, containLabel: true },
        tooltip: EC.tooltip(items => EC.card(items[0].name, [{ color: 'var(--oro)', text: `${Number(items[0].value).toFixed(2)} ★` }])),
        xAxis: EC.valAxis(p, { min: 1, max: 5, interval: 0.5, splitLine: { lineStyle: { color: p.gridSoft } }, axisLabel: { fontSize: 10, fontFamily: EC.mono, color: p.axisMono, formatter: v => v.toFixed(1) } }),
        yAxis: EC.catAxis(labels, p, { inverse: true }),
        series: [{
          type: 'bar', barMaxWidth: 18, cursor: onSelect ? 'pointer' : 'default',
          emphasis: { focus: 'self' }, blur: EC.blur(),
          data: data.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: 4 } })),
          label: {
            show: true, position: 'insideLeft', distance: 8, color: '#ffffff', fontWeight: 'bold', fontSize: 10, fontFamily: EC.sans,
            formatter: e => {
              const v = e.value;
              if (v === undefined || v === null || v === 0) return '';
              const dev = v - meta;
              return mobile ? `${v.toFixed(2)}★` : `${v.toFixed(2)} ★ (${dev >= 0 ? '+' : ''}${dev.toFixed(2)})`;
            }
          },
          markLine: EC.goalLine('xAxis', meta, 'Meta 4.60', EC.oro, 2, [4, 4], p, 'start')
        }]
      }
    });
    if (api && onSelect) api.chart.on('click', e => { if (e.componentType === 'series') onSelect(e.dataIndex); });
    EC.autoHideTip(api);
    return api;
  },

  donutDistribution(el, labels, data, colors, opts = {}) {
    const p = EC.pal();
    const { decimals = 0, unit = '', legendSize = 10, legendGap = 12 } = opts;
    const total = data.reduce((a, b) => a + b, 0);
    const api = ChartWrapper.mount(el, {
      state: total > 0 ? 'ready' : 'empty',
      option: {
        animationDuration: 700,
        legend: { orient: 'vertical', right: 0, top: 'middle', icon: 'circle', itemWidth: 10, itemHeight: 10, itemGap: legendGap, textStyle: { color: p.axisSans, fontSize: legendSize, fontFamily: EC.sans } },
        tooltip: EC.tooltip(e => {
          const pct = total > 0 ? ((e.value / total) * 100).toFixed(decimals) : 0;
          return EC.card(null, [{ color: e.color, text: ` ${EC.esc(e.name)}: ${e.value}${unit} (${pct}%)` }]);
        }, 'item'),
        series: [{
          type: 'pie', radius: ['59%', '98%'], center: ['40%', '50%'], label: { show: false }, labelLine: { show: false },
          itemStyle: { borderWidth: p.dark ? 2 : 1, borderColor: p.dark ? '#1C2220' : '#fff' },
          emphasis: { scaleSize: 4 },
          data: labels.map((l, i) => ({ name: l, value: data[i], itemStyle: { color: colors[i] } }))
        }]
      }
    });
    EC.autoHideTip(api);
    return api;
  },

  starDistributionBar(el, labels, data, colors, onSelect) {
    const p = EC.pal();
    const total = data.reduce((a, b) => a + b, 0);
    const pct = v => (total > 0 ? ((v / total) * 100).toFixed(0) : 0);
    const api = ChartWrapper.mount(el, {
      state: labels.length ? 'ready' : 'empty',
      option: {
        ...EC.stagger(60),
        grid: { left: 5, right: EC.isMobile() ? 38 : 60, top: 10, bottom: 5, containLabel: true },
        tooltip: EC.tooltip(items => EC.card(items[0].name, [{ color: 'var(--oro)', text: ` ${items[0].value} opiniones (${pct(items[0].value)}%)` }])),
        xAxis: EC.valAxis(p, { min: 0, minInterval: 1 }),
        yAxis: EC.catAxis(labels, p, { inverse: true }),
        series: [{
          type: 'bar', barMaxWidth: 16,
          data: data.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: 4 } })),
          label: { show: true, position: 'right', color: p.axisSans, fontWeight: 'bold', fontSize: 10, fontFamily: EC.sans, formatter: e => `${e.value} (${pct(e.value)}%)` }
        }]
      }
    });
    if (api) {
      // Chart.js seleccionaba por fila ('index', intersect:false): se conserva, clic en cualquier punto de la fila
      const rowAt = e => {
        const pt = [e.offsetX, e.offsetY];
        if (!api.chart.containPixel({ gridIndex: 0 }, pt)) return -1;
        const idx = api.chart.convertFromPixel({ yAxisIndex: 0 }, e.offsetY);
        return typeof idx === 'number' && idx >= 0 && idx < labels.length ? Math.round(idx) : -1;
      };
      if (onSelect) api.chart.getZr().on('click', e => { const i = rowAt(e); if (i >= 0) onSelect(i); });
      EC.setCursor(api, e => onSelect && rowAt(e) >= 0);
    }
    EC.autoHideTip(api);
    return api;
  },

  lineTrend(el, labels, data, label, color) {
    const p = EC.pal();
    const meta = EC.metaRating();
    let goalLabel = 'Meta Regional 4.60';
    if (EC.isMobile()) goalLabel = goalLabel.replace('Regional ', '');
    // Rejilla propia: Chart.js ocultaba la línea y la etiqueta por encima de 5.0 (eje hasta 5.15)
    const gridLines = [4.5, 4.6, 4.7, 4.8, 4.9, 5.0].map(v => ({ yAxis: v }));
    const api = ChartWrapper.mount(el, {
      state: data.some(v => v !== null && v !== undefined) ? 'ready' : 'empty',
      option: {
        animationDuration: 800,
        grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true },
        tooltip: EC.tooltip(items => EC.card(items[0].axisValueLabel, [{ color: 'var(--oro)', text: ` ${EC.esc(label)}: ${Number(items[0].value).toFixed(2)}` }])),
        xAxis: EC.catAxis(labels, p, { boundaryGap: false, axisLabel: EC.xLabels(el, labels, p, EC.isMobile()) }),
        yAxis: EC.valAxis(p, {
          min: 4.5, max: 5.15, interval: 0.1, splitLine: { show: false },
          axisLabel: { fontSize: 10, fontFamily: EC.mono, color: p.axisMono, formatter: v => (v > 5.0001 ? '' : v.toFixed(1)) }
        }),
        series: [
          { type: 'line', data: [], silent: true, tooltip: { show: false }, markLine: { silent: true, symbol: 'none', animation: false, label: { show: false }, lineStyle: { color: p.grid, width: 1, type: 'solid' }, data: gridLines } },
          EC.trendSeries({ data, color, border: p.ptBorder, marks: data.filter(v => typeof v === 'number').length >= 4, goal: EC.goalLine('yAxis', meta, goalLabel, '#c97d10', 2, [5, 5], p, 'insideEndTop') })
        ]
      }
    });
    EC.autoHideTip(api);
    return api;
  },

  branchRatingTrend(el, labels, data, color) {
    const p = EC.pal();
    const meta = EC.metaRating();
    const api = ChartWrapper.mount(el, {
      state: data.some(v => v !== null && v !== undefined) ? 'ready' : 'empty',
      option: {
        animationDuration: 800,
        grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
        tooltip: EC.tooltip(items => EC.card(items[0].axisValueLabel, [{ color: 'var(--oro)', text: ` Rating: ${Number(items[0].value).toFixed(2)} ★` }])),
        xAxis: EC.catAxis(labels, p, { boundaryGap: false, axisLabel: EC.xLabels(el, labels, p, EC.isMobile()) }),
        yAxis: EC.valAxis(p, { min: 2.0, max: 5.2, interval: 0.5, axisLabel: { fontSize: 10, fontFamily: EC.mono, color: p.axisMono, formatter: v => v.toFixed(1) } }),
        series: [EC.trendSeries({
          data, color, border: p.dark ? '#151725' : '#fff',
          marks: data.filter(v => typeof v === 'number').length >= 4,
          goal: EC.goalLine('yAxis', meta, 'Meta 4.60', '#c97d10', 1.5, [5, 5], p, 'insideEndBottom')
        })]
      }
    });
    EC.autoHideTip(api);
    return api;
  },

  branchVolumeTrend(el, labels, data, color) {
    const p = EC.pal();
    const meta = EC.metaVolumen();
    const maxData = Math.max(0, ...data.filter(v => typeof v === 'number'));
    const api = ChartWrapper.mount(el, {
      state: data.some(v => v !== null && v !== undefined) ? 'ready' : 'empty',
      option: {
        animationDuration: 800,
        grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
        tooltip: EC.tooltip(items => EC.card(items[0].axisValueLabel, [{ color: 'var(--oro)', text: ` Reseñas: ${items[0].value}` }])),
        xAxis: EC.catAxis(labels, p, { boundaryGap: false, axisLabel: EC.xLabels(el, labels, p, EC.isMobile()) }),
        // +10% de holgura sobre el máximo y la meta siempre visible (antes la línea de meta podía quedar fuera del eje)
        yAxis: EC.valAxis(p, { min: 0, minInterval: 1, max: Math.ceil(Math.max(maxData, meta) * 1.1) }),
        series: [EC.trendSeries({
          data, color, border: p.dark ? '#151725' : '#fff',
          area: EC.rgba(color, 0.15, 'rgba(107, 144, 125, 0.1)'),
          goal: EC.goalLine('yAxis', meta, `Meta ${meta}`, EC.oro, 1.5, [5, 5], p, 'insideEndTop')
        })]
      }
    });
    EC.autoHideTip(api);
    return api;
  },

  /** Barras verticales con un valor decimal por categoría (brand: rendimiento ajustado por región) */
  barScore(el, labels, data, colors, opts = {}) {
    const p = EC.pal();
    const { unit = ' pts', title = 'Score' } = opts;
    const api = ChartWrapper.mount(el, {
      state: labels.length ? 'ready' : 'empty',
      option: {
        animationDuration: 700,
        grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
        tooltip: EC.tooltip(items => EC.card(items[0].axisValueLabel, [{ color: 'var(--oro)', text: ` ${title}: ${Number(items[0].value).toFixed(2)}${unit}` }])),
        xAxis: EC.catAxis(labels, p, { axisLabel: { fontSize: 11, fontFamily: EC.sans, color: p.axisSans, interval: 0, rotate: EC.xLabels(el, labels, p, false).rotate } }),
        yAxis: EC.valAxis(p, { min: 0 }),
        series: [{
          type: 'bar', barMaxWidth: 32,
          data: data.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: 8 } }))
        }]
      }
    });
    EC.autoHideTip(api);
    return api;
  },

  /** Radar de equilibrio operativo (compare): indicadores 0-100, hasta dos series */
  radar(el, labels, series) {
    const p = EC.pal();
    const api = ChartWrapper.mount(el, {
      state: series.some(s => s.data.some(v => v !== null && v !== undefined)) ? 'ready' : 'empty',
      option: {
        animationDuration: 800,
        tooltip: EC.tooltip(e => {
          const rows = labels.map((l, i) => ({ color: e.color, text: `${EC.esc(l)}: ${Number(e.value[i]).toFixed(0)}` }));
          return EC.card(e.name, rows);
        }, 'item'),
        radar: {
          indicator: labels.map(l => ({ name: l, max: 100, min: 0 })),
          radius: '78%', splitNumber: 5, shape: 'polygon', startAngle: 90, clockwise: true,
          axisName: { color: p.dark ? '#EDE6D8' : '#1A1A1A', fontSize: 11, fontWeight: 600, fontFamily: EC.sans },
          axisLine: { lineStyle: { color: p.dark ? 'rgba(237,230,216,0.1)' : 'rgba(22,22,20,0.08)' } },
          splitLine: { lineStyle: { color: p.dark ? 'rgba(237,230,216,0.08)' : 'rgba(22,22,20,0.06)' } },
          splitArea: { show: false }
        },
        series: [{
          type: 'radar', symbol: 'circle', symbolSize: 9,
          data: [...series].reverse().map(s => ({
            name: s.name, value: s.data,
            lineStyle: { color: s.color, width: 2.5, type: s.dash ? [5, 4] : 'solid' },
            areaStyle: { color: s.fill },
            itemStyle: { color: s.point, borderColor: '#ffffff', borderWidth: 2 },
            emphasis: { itemStyle: { color: '#ffffff', borderColor: s.color } }
          }))
        }]
      }
    });
    EC.autoHideTip(api);
    return api;
  },

  /**
   * Quejas por hora local (0-23) — complejidad adaptativa:
   *  · móvil/angosto: solo barras de quejas + franja pico (se lee en 3 segundos);
   *  · ancho (≥ 560 px): suma las franjas de turno y la tasa de queja por hora (quejas / reseñas con texto).
   * h = Patterns.hourly(...), hl = Patterns.headline(h)
   */
  hourComplaints(el, h, hl) {
    const p = EC.pal();
    const rich = !!(el && el.clientWidth >= 560);
    const pad = Patterns.pad;
    const labels = Array.from({ length: 24 }, (_, i) => pad(i));
    const red = p.dark ? 'rgba(244,144,144,0.85)' : 'rgba(198,40,40,0.85)';
    const gold = p.dark ? '#E5B842' : '#B8902F';
    const rate = h.tot.map((t, i) => (t >= 3 ? Math.round((1000 * h.neg[i]) / t) / 10 : null));   // solo con muestra mínima

    // Tinte alterno para que cada turno se distinga del contiguo
    const tint = (i) => (p.dark ? [0.03, 0.075, 0.03][i] : [0.05, 0.11, 0.05][i]);
    const bands = rich ? Patterns.TURNOS.map((t, i) => [
      { xAxis: pad(t.from), name: t.label, itemStyle: { color: p.dark ? `rgba(255,255,255,${tint(i)})` : `rgba(184,144,47,${tint(i)})` }, label: { position: 'insideTop', distance: 4, color: p.axisSans, fontSize: 10, fontWeight: 600, fontFamily: EC.sans } },
      { xAxis: pad(t.to) }
    ]) : [];
    const w = hl && hl.enough ? hl.window : null;
    const peak = w ? [[
      { xAxis: pad(w.start), name: `Pico ${pad(w.start)}–${pad(w.end + 1)} h`, itemStyle: { color: p.dark ? 'rgba(244,144,144,0.14)' : 'rgba(198,40,40,0.10)' }, label: { position: 'insideTop', distance: 20, color: red, fontWeight: 'bold', fontSize: 10, fontFamily: EC.sans } },
      { xAxis: pad(w.end) }
    ]] : [];

    const series = [{
      name: 'Quejas', type: 'bar', barMaxWidth: 22, data: h.neg,
      itemStyle: { color: red, borderRadius: [4, 4, 0, 0] },
      markArea: { silent: true, data: [...bands, ...peak] }
    }];
    if (rich) {
      series.push({
        name: 'Tasa de queja', type: 'line', yAxisIndex: 1, data: rate, connectNulls: false,
        symbol: 'circle', symbolSize: 7, lineStyle: { width: 2, color: gold },
        itemStyle: { color: gold, borderColor: p.ptBorder, borderWidth: 1.5 }
      });
    }

    const api = ChartWrapper.mount(el, {
      state: h.nNeg > 0 ? 'ready' : 'empty',
      emptyText: 'Sin quejas con texto en este periodo',
      option: {
        ...EC.stagger(22),
        grid: { left: 8, right: rich ? 40 : 12, top: rich ? 40 : 18, bottom: 8, containLabel: true },
        legend: rich ? { top: 0, icon: 'circle', itemWidth: 9, itemHeight: 9, itemGap: 18, textStyle: { color: p.axisSans, fontSize: 11, fontFamily: EC.sans } } : { show: false },
        tooltip: EC.tooltip(items => {
          const i = items[0].dataIndex;
          const rows = [{ color: red, text: `Quejas: ${h.neg[i]}` }, { color: 'var(--oro)', text: `Reseñas con texto: ${h.tot[i]}` }];
          if (h.tot[i] >= 3) rows.push({ color: gold, text: `Tasa de queja: ${rate[i]}%` });
          return EC.card(`${pad(i)}:00 – ${pad(i)}:59`, rows);
        }),
        xAxis: EC.catAxis(labels, p, { axisLabel: { fontSize: 10, fontFamily: EC.mono, color: p.axisMono, interval: rich ? 0 : 2 } }),
        yAxis: rich
          ? [EC.valAxis(p, { min: 0, minInterval: 1, max: v => Math.max(3, Math.ceil(v.max * 1.3)) }), EC.valAxis(p, { min: 0, max: 100, splitLine: { show: false }, axisLabel: { fontSize: 10, fontFamily: EC.mono, color: p.axisMono, formatter: v => `${v}%` } })]
          : EC.valAxis(p, { min: 0, minInterval: 1, max: v => Math.max(3, Math.ceil(v.max * 1.3)) }),
        series
      }
    });
    EC.autoHideTip(api);
    return api;
  },
};
