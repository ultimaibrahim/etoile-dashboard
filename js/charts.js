/**
 * charts.js — Restos de Chart.js durante la transición a ECharts (Étoile 2.0).
 * Las gráficas de dashboards, sucursal y home ya viven en js/charts-echarts.js.
 * Chart.js solo se usa aún en compare.js y brand.js (se retira en beta.3); este archivo conserva:
 *  - el tooltip crystal global de Chart.js, y
 *  - Charts.destroyAll()/instances, que el Router y las vistas siguen llamando (también libera los ChartWrapper de ECharts).
 */

/**
 * Generador de Tooltips Crystal Squircle flotantes en el DOM
 * Sustituye el canvas tooltip nativo por una tarjeta flotante HTML con glassmorphism
 */
function crystalTooltipHandler(context) {
  const { chart, tooltip } = context;
  let tooltipEl = document.getElementById('chartjs-crystal-tooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-crystal-tooltip';
    tooltipEl.className = 'crystal-tooltip-float';
    document.body.appendChild(tooltipEl);
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    tooltipEl.style.pointerEvents = 'none';
    return;
  }

  if (tooltip.body) {
    const titleLines = tooltip.title || [];
    const bodyLines = tooltip.body.map(b => b.lines);

    let innerHtml = '';

    if (titleLines.length > 0) {
      innerHtml += `<div class="ct-header">${titleLines.join(' ')}</div>`;
    }

    innerHtml += '<div class="ct-body">';
    bodyLines.forEach((body, i) => {
      const colors = tooltip.labelColors && tooltip.labelColors[i] ? tooltip.labelColors[i] : {};
      const colorBg = colors.backgroundColor || 'var(--oro)';
      const text = body.join(' ');

      innerHtml += `
        <div class="ct-row">
          <span class="ct-indicator" style="background:${colorBg}"></span>
          <span class="ct-label">${text}</span>
        </div>
      `;
    });
    innerHtml += '</div>';

    tooltipEl.innerHTML = innerHtml;
  }

  const canvasRect = chart.canvas.getBoundingClientRect();
  tooltipEl.style.opacity = '1';
  tooltipEl.style.pointerEvents = 'none';

  // Posicionamiento inteligente relativo a ventana
  const left = canvasRect.left + window.pageXOffset + tooltip.caretX;
  const top = canvasRect.top + window.pageYOffset + tooltip.caretY;

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

// Configurar comportamiento predeterminado en Chart.js
if (typeof Chart !== 'undefined' && Chart.defaults && Chart.defaults.plugins) {
  Chart.defaults.plugins.tooltip.enabled = false;
  Chart.defaults.plugins.tooltip.external = crystalTooltipHandler;
}

const Charts = {
  instances: [],

  destroyAll() {
    this.instances.forEach(c => {
      try { c.destroy(); } catch (e) {}
    });
    this.instances = [];
    if (typeof ChartWrapper !== 'undefined') ChartWrapper.disposeAll();
    const tooltipEl = document.getElementById('chartjs-crystal-tooltip');
    if (tooltipEl) tooltipEl.style.opacity = '0';
  }
};
