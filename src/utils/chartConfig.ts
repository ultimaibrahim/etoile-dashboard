import { Chart, Plugin } from 'chart.js/auto';
import { KpiMeta } from '../lib/data';

// Plugin para dibujar líneas de meta
export const targetLinePlugin: Plugin = {
  id: 'targetLine',
  afterDraw(chart, _args, options) {
    const opts = options || (chart.options.plugins as any)?.targetLine;
    if (!opts || typeof opts.value === 'undefined') return;
    const { ctx, chartArea: { left, right, top, bottom }, scales } = chart;
    const scaleId = opts.scale || 'y';
    const scale = scales[scaleId];
    if (!scale) return;

    const pixel = scale.getPixelForValue(opts.value);
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = opts.lineWidth || 1.5;
    ctx.strokeStyle = opts.borderColor || 'rgba(184, 144, 47, 0.75)'; // `--oro`
    ctx.setLineDash(opts.borderDash || [5, 5]);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (scale.isHorizontal()) {
      // Línea de meta vertical
      ctx.moveTo(pixel, top);
      ctx.lineTo(pixel, bottom);
    } else {
      // Línea de meta horizontal
      ctx.moveTo(left, pixel);
      ctx.lineTo(right, pixel);
    }
    ctx.stroke();

    if (opts.label) {
      ctx.fillStyle = opts.color || (isDark ? '#B8902F' : '#c97d10');
      ctx.font = opts.font || 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = scale.isHorizontal() ? 'center' : 'right';
      ctx.textBaseline = 'bottom';
      let labelText = opts.label;
      if (window.innerWidth < 500 && labelText.includes('Regional')) {
        labelText = labelText.replace('Regional ', '');
      }
      if (scale.isHorizontal()) {
        ctx.fillText(labelText, pixel, top - 4);
      } else {
        ctx.fillText(labelText, right - 5, pixel - 4);
      }
    }
    ctx.restore();
  }
};

// Plugin para dibujar calificaciones y desviaciones en el ranking
export const rankingLabelsPlugin: Plugin = {
  id: 'rankingLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const metaVal = KpiMeta.ratingMinimo;
    const isMobile = window.innerWidth < 500;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar: any, index) => {
        const val = dataset.data[index] as number;
        if (typeof val === 'undefined' || val === null || val === 0) return;

        const deviation = val - metaVal;
        const sign = deviation >= 0 ? '+' : '';
        const devText = `(${sign}${deviation.toFixed(2)})`;
        const labelText = isMobile ? `${val.toFixed(2)}★` : `${val.toFixed(2)} ★ ${devText}`;

        const { y } = bar.tooltipPosition();
        const startX = chart.chartArea.left + 8;

        ctx.save();
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, startX, y);
        ctx.restore();
      });
    });
  }
};

// Plugin para dibujar volumen y porcentaje
export const barLabelsPlugin: Plugin = {
  id: 'barLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    let total = 0;
    chart.data.datasets.forEach((dataset) => {
      dataset.data.forEach(val => {
        if (typeof val === 'number') total += val;
      });
    });

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar: any, index) => {
        const val = dataset.data[index] as number;
        if (typeof val !== 'number' || val === null) return;

        const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
        const labelText = `${val} (${pct}%)`;

        const { x, y } = bar.tooltipPosition();

        ctx.save();
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = isDark ? '#9DA89F' : '#6B6960';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, x + 6, y);
        ctx.restore();
      });
    });
  }
};
