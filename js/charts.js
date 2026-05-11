/**
 * charts.js — Configuraciones reutilizables de Chart.js.
 */

const Charts = {
  instances: [],

  destroyAll() {
    this.instances.forEach(c => {
      try { c.destroy(); } catch (e) {}
    });
    this.instances = [];
  },

  barVolume(ctx, labels, data, colors) {
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
            titleFont: { family: 'Helvetica Neue, Helvetica, Arial', size: 12, weight: '700' },
            bodyFont: { family: 'Helvetica Neue, Helvetica, Arial', size: 11 },
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
              font: { size: 10, family: 'ui-monospace, SF Mono, Menlo' },
              color: darkMode ? '#8A9E94' : '#8A877C',
              precision: 0
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: 'Helvetica Neue, Helvetica' },
              color: darkMode ? '#9DA89F' : '#6B6960',
              maxRotation: 30
            }
          }
        }
      }
    });
    this.instances.push(chart);
    return chart;
  }
};
