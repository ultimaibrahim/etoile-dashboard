/**
 * charts-echarts.js — Gráficas ECharts de Étoile 2.0 (convive con charts.js hasta migrar todo).
 * Cada función recibe un contenedor DOM (no un canvas) y devuelve el wrapper de ChartWrapper.
 */
const EtoileCharts = {
  heroTrend(el, labels, data) {
    const isDark = typeof darkMode !== 'undefined' && darkMode;
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
  }
};
