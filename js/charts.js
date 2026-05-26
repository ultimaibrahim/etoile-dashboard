/**
 * charts.js — Configuraciones reutilizables de Chart.js.
 */

// Plugins inline personalizados para Chart.js

const targetLinePlugin = {
  id: 'targetLine',
  afterDraw(chart, args, options) {
    const opts = options || chart.options.plugins?.targetLine;
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

    const isDark = typeof darkMode !== 'undefined' && darkMode;

    if (scale.isHorizontal()) {
      // Línea de meta vertical (e.g. en el eje X)
      ctx.moveTo(pixel, top);
      ctx.lineTo(pixel, bottom);
    } else {
      // Línea de meta horizontal (e.g. en el eje Y)
      ctx.moveTo(left, pixel);
      ctx.lineTo(right, pixel);
    }
    ctx.stroke();

    if (opts.label) {
      ctx.fillStyle = opts.color || (isDark ? '#B8902F' : '#c97d10');
      ctx.font = opts.font || 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = scale.isHorizontal() ? 'center' : 'right';
      ctx.textBaseline = scale.isHorizontal() ? 'top' : 'bottom';
      let labelText = opts.label;
      if (window.innerWidth < 500 && labelText.includes('Regional')) {
        labelText = labelText.replace('Regional ', '');
      }
      if (scale.isHorizontal()) {
        ctx.fillText(labelText, pixel, top + 5);
      } else {
        ctx.fillText(labelText, right - 5, pixel - 4);
      }
    }
    ctx.restore();
  }
};

const rankingLabelsPlugin = {
  id: 'rankingLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const metaVal = typeof KpiMeta !== 'undefined' ? KpiMeta.ratingMinimo : 4.60;
    const isDark = typeof darkMode !== 'undefined' && darkMode;
    const isMobile = window.innerWidth < 500;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const val = dataset.data[index];
        if (typeof val === 'undefined' || val === null || val === 0) return;

        const deviation = val - metaVal;
        const sign = deviation >= 0 ? '+' : '';
        const devText = `(${sign}${deviation.toFixed(2)})`;
        const labelText = isMobile ? `${val.toFixed(2)}★` : `${val.toFixed(2)} ★ ${devText}`;

        const { x, y } = bar.tooltipPosition();

        ctx.save();
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        if (deviation >= 0) {
          ctx.fillStyle = isDark ? '#8A9E94' : '#3D5A47';
        } else {
          ctx.fillStyle = isDark ? '#F49090' : '#C62828';
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, x + 6, y);
        ctx.restore();
      });
    });
  }
};

const barLabelsPlugin = {
  id: 'barLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const isDark = typeof darkMode !== 'undefined' && darkMode;

    let total = 0;
    chart.data.datasets.forEach((dataset) => {
      dataset.data.forEach(val => {
        if (typeof val === 'number') total += val;
      });
    });

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const val = dataset.data[index];
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

const Charts = {
  instances: [],

  destroyAll() {
    this.instances.forEach(c => {
      try { c.destroy(); } catch (e) {}
    });
    this.instances = [];
  },

  barVolume(ctx, labels, data, colors) {
    const fontSans = premiumUi ? 'Plus Jakarta Sans, sans-serif' : 'Helvetica Neue, Helvetica, Arial, sans-serif';
    const fontMono = premiumUi ? 'JetBrains Mono, monospace' : 'ui-monospace, SF Mono, Menlo, monospace';

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Reseñas',
          data,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 46
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: darkMode ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: '700' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: c => `${c.raw} reseña${c.raw !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: darkMode ? '#8A9E94' : '#8A877C',
              precision: 0
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: darkMode ? '#9DA89F' : '#6B6960',
              maxRotation: 30
            }
          }
        }
      }
    });
    this.instances.push(chart);
    return chart;
  },

  stackedVolume(ctx, labels, okData, warnData) {
    const fontSans = premiumUi ? 'Plus Jakarta Sans, sans-serif' : 'Helvetica Neue, Helvetica, Arial, sans-serif';
    const fontMono = premiumUi ? 'JetBrains Mono, monospace' : 'ui-monospace, SF Mono, Menlo, monospace';

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Positivas / Neutrales',
            data: okData,
            backgroundColor: darkMode ? 'rgba(122,158,138,0.75)' : 'rgba(61,90,71,0.75)',
            borderRadius: 4,
            yAxisID: 'y',
            maxBarThickness: 20
          },
          {
            label: 'Negativas (1-2★)',
            data: warnData,
            backgroundColor: darkMode ? 'rgba(244,144,144,0.85)' : 'rgba(198,40,40,0.85)',
            borderRadius: 4,
            yAxisID: 'yNeg',
            maxBarThickness: 20
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: darkMode ? '#9DA89F' : '#6B6960',
              maxRotation: 30
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: darkMode ? '#8A9E94' : '#8A877C',
              precision: 0
            },
            title: {
              display: window.innerWidth >= 500,
              text: 'Positivas / Neutrales',
              font: { size: 10, family: fontSans, weight: '600' },
              color: darkMode ? '#8A9E94' : '#8A877C'
            }
          },
          yNeg: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: {
              font: { size: 10, family: fontMono },
              color: darkMode ? 'rgba(244,144,144,0.9)' : 'rgba(198,40,40,0.9)',
              precision: 0
            },
            title: {
              display: window.innerWidth >= 500,
              text: 'Negativas (1-2★)',
              font: { size: 10, family: fontSans, weight: '600' },
              color: darkMode ? 'rgba(244,144,144,0.9)' : 'rgba(198,40,40,0.9)'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: darkMode ? '#9DA89F' : '#6B6960',
              font: { size: 11, family: fontSans },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: darkMode ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: '700' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            mode: 'index',
            intersect: false,
            callbacks: {
              footer: (items) => {
                let total = 0;
                items.forEach(i => total += i.parsed.y);
                return `Total reseñas: ${total}`;
              }
            }
          }
        }
      }
    });
    // Auto-hide tooltip on touch after 5s (fix iOS "stuck" tooltip)
    chart.canvas.addEventListener('touchend', () => {
      setTimeout(() => {
        chart.tooltip.setActiveElements([], {});
        chart.update('none');
      }, 5000);
    }, { passive: true });
    this.instances.push(chart);
    return chart;
  },

  barRanking(ctx, labels, data, colors) {
    const fontSans = premiumUi ? 'Plus Jakarta Sans, sans-serif' : 'Helvetica Neue, Helvetica, Arial, sans-serif';
    const fontMono = premiumUi ? 'JetBrains Mono, monospace' : 'ui-monospace, SF Mono, Menlo, monospace';

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Calificación',
          data,
          backgroundColor: colors,
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 18
        }]
      },
      plugins: [targetLinePlugin, rankingLabelsPlugin],
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: window.innerWidth < 500 ? 46 : 80, top: 15 }
        },
        plugins: {
          legend: { display: false },
          targetLine: {
            scale: 'x',
            value: typeof KpiMeta !== 'undefined' ? KpiMeta.ratingMinimo : 4.60,
            label: 'Meta 4.60',
            borderColor: 'rgba(184, 144, 47, 0.75)',
            borderDash: [4, 4]
          },
          tooltip: {
            backgroundColor: darkMode ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: '700' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: c => `${c.raw.toFixed(2)} ★`
            }
          }
        },
        scales: {
          x: {
            min: 1.0,
            max: 5.0,
            grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: darkMode ? '#8A9E94' : '#8A877C'
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: darkMode ? '#9DA89F' : '#6B6960'
            }
          }
        }
      }
    });
    this.instances.push(chart);
    return chart;
  },

  donutDistribution(ctx, labels, data, colors) {
    const fontSans = premiumUi ? 'Plus Jakarta Sans, sans-serif' : 'Helvetica Neue, Helvetica, Arial, sans-serif';

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: darkMode ? 2 : 1,
          borderColor: darkMode ? '#1C2220' : '#fff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: darkMode ? '#9DA89F' : '#6B6960',
              font: { size: 10, family: fontSans },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: darkMode ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: '700' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            callbacks: {
              label: c => {
                const total = c.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((c.raw / total) * 100).toFixed(0) : 0;
                return ` ${c.label}: ${c.raw} (${pct}%)`;
              }
            }
          }
        }
      }
    });
    this.instances.push(chart);
    return chart;
  },

  starDistributionBar(ctx, labels, data, colors) {
    const fontSans = premiumUi ? 'Plus Jakarta Sans, sans-serif' : 'Helvetica Neue, Helvetica, Arial, sans-serif';
    const fontMono = premiumUi ? 'JetBrains Mono, monospace' : 'ui-monospace, SF Mono, Menlo, monospace';

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 16
        }]
      },
      plugins: [barLabelsPlugin],
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: window.innerWidth < 500 ? 38 : 60, top: 10 }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: darkMode ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: '700' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: c => {
                const total = c.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((c.raw / total) * 100).toFixed(0) : 0;
                return ` ${c.raw} opiniones (${pct}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: darkMode ? '#8A9E94' : '#8A877C',
              precision: 0
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: darkMode ? '#9DA89F' : '#6B6960'
            }
          }
        }
      }
    });
    this.instances.push(chart);
    return chart;
  },

  lineTrend(ctx, labels, data, label, color) {
    const fontSans = premiumUi ? 'Plus Jakarta Sans, sans-serif' : 'Helvetica Neue, Helvetica, Arial, sans-serif';
    const fontMono = premiumUi ? 'JetBrains Mono, monospace' : 'ui-monospace, SF Mono, Menlo, monospace';

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 3,
          pointBackgroundColor: color,
          pointBorderColor: darkMode ? '#1C2220' : '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: false
        }]
      },
      plugins: [targetLinePlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          targetLine: {
            scale: 'y',
            value: typeof KpiMeta !== 'undefined' ? KpiMeta.ratingMinimo : 4.60,
            label: 'Meta Regional 4.60',
            borderColor: 'rgba(184, 144, 47, 0.75)',
            borderDash: [5, 5]
          },
          tooltip: {
            backgroundColor: darkMode ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: '700' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: c => ` ${label}: ${Number(c.raw).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            min: 4.5,
            max: 5.0,
            grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: darkMode ? '#8A9E94' : '#8A877C',
              stepSize: 0.1,
              precision: 1
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: darkMode ? '#9DA89F' : '#6B6960'
            }
          }
        }
      }
    });
    this.instances.push(chart);
    return chart;
  }
};
