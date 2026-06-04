import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { useApp } from '../context/AppContext';
import { KpiMeta } from '../lib/data';
import {
  targetLinePlugin,
  rankingLabelsPlugin,
  barLabelsPlugin
} from '../utils/chartConfig';

interface ChartProps {
  labels: string[];
  data: number[];
  colors?: string[] | string;
  height?: number;
}

// 1. Gráfico de volumen simple por sucursal (Barras)
export const BarVolumeChart: React.FC<ChartProps> = ({ labels, data, colors, height = 240 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { darkMode } = useApp();

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const fontSans = 'Plus Jakarta Sans, sans-serif';
    const fontMono = 'JetBrains Mono, monospace';
    const isDark = darkMode;

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Reseñas',
          data,
          backgroundColor: colors || (isDark ? 'rgba(122,158,138,0.75)' : 'rgba(61,90,71,0.75)'),
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
            backgroundColor: isDark ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: 'bold' },
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
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: isDark ? '#8A9E94' : '#8A877C',
              precision: 0
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: isDark ? '#9DA89F' : '#6B6960',
              maxRotation: 30
            }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, data, colors, darkMode]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

// 2. Gráfico de volumen apilado por sentimiento (Barras apiladas)
interface StackedVolumeChartProps {
  labels: string[];
  okData: number[];
  neutralData: number[];
  warnData: number[];
  height?: number;
}
export const StackedVolumeChart: React.FC<StackedVolumeChartProps> = ({
  labels,
  okData,
  neutralData,
  warnData,
  height = 280
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { darkMode } = useApp();

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const fontSans = 'Plus Jakarta Sans, sans-serif';
    const fontMono = 'JetBrains Mono, monospace';
    const isDark = darkMode;

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Negativas (1-2★)',
            data: warnData,
            backgroundColor: isDark ? 'rgba(244,144,144,0.85)' : 'rgba(198,40,40,0.85)',
            borderRadius: 0,
            maxBarThickness: 24
          },
          {
            label: 'Neutrales (3★)',
            data: neutralData,
            backgroundColor: isDark ? 'rgba(244,201,130,0.85)' : 'rgba(201,125,16,0.85)',
            borderRadius: 0,
            maxBarThickness: 24
          },
          {
            label: 'Positivas (4-5★)',
            data: okData,
            backgroundColor: isDark ? 'rgba(122,158,138,0.75)' : 'rgba(61,90,71,0.75)',
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
            maxBarThickness: 24
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: isDark ? '#9DA89F' : '#6B6960',
              maxRotation: 30
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: isDark ? '#8A9E94' : '#8A877C',
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: isDark ? '#9DA89F' : '#6B6960',
              font: { size: 11, family: fontSans },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: 'bold' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            mode: 'index',
            intersect: false,
            callbacks: {
              footer: (items) => {
                let total = 0;
                items.forEach(i => { total += (i.parsed.y ?? 0); });
                return `Total reseñas: ${total}`;
              }
            }
          }
        }
      }
    });

    chart.canvas.addEventListener('touchend', () => {
      setTimeout(() => {
        chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
        chart.update('none');
      }, 5000);
    }, { passive: true });

    chartRef.current = chart;

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, okData, neutralData, warnData, darkMode]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

// 3. Ranking de sucursales (Barras Horizontales con meta)
export const BarRankingChart: React.FC<ChartProps> = ({ labels, data, colors, height = 320 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { darkMode } = useApp();

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const fontSans = 'Plus Jakarta Sans, sans-serif';
    const fontMono = 'JetBrains Mono, monospace';
    const isDark = darkMode;

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Calificación',
          data,
          backgroundColor: colors || 'rgba(61,90,71,0.75)',
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
          padding: { right: 20, top: 15 }
        },
        plugins: {
          legend: { display: false },
          targetLine: {
            scale: 'x',
            value: KpiMeta.ratingMinimo,
            label: 'Meta 4.60',
            borderColor: '#c97d10',
            lineWidth: 2,
            borderDash: [4, 4]
          },
          tooltip: {
            backgroundColor: isDark ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: 'bold' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (c: any) => `${Number(c.raw).toFixed(2)} ★`
            }
          }
        } as any,
        scales: {
          x: {
            min: 1.0,
            max: 5.0,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: isDark ? '#8A9E94' : '#8A877C'
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: isDark ? '#9DA89F' : '#6B6960'
            }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, data, colors, darkMode]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

// 4. Distribución de estrellas (Barras horizontales con etiquetas y porcentaje)
export const StarDistributionBarChart: React.FC<ChartProps> = ({ labels, data, colors, height = 240 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { darkMode } = useApp();

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const fontSans = 'Plus Jakarta Sans, sans-serif';
    const fontMono = 'JetBrains Mono, monospace';
    const isDark = darkMode;

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors || 'rgba(61,90,71,0.75)',
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
            backgroundColor: isDark ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: 'bold' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: c => {
                const total = (c.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (((c.raw as number) / total) * 100).toFixed(0) : 0;
                return ` ${c.raw} opiniones (${pct}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: isDark ? '#8A9E94' : '#8A877C',
              precision: 0
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: isDark ? '#9DA89F' : '#6B6960'
            }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, data, colors, darkMode]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

// 5. Tendencia temporal YTD (Línea con meta)
interface LineTrendChartProps extends ChartProps {
  label: string;
  color: string;
}
export const LineTrendChart: React.FC<LineTrendChartProps> = ({ labels, data, label, color, height = 260 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { darkMode } = useApp();

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const fontSans = 'Plus Jakarta Sans, sans-serif';
    const fontMono = 'JetBrains Mono, monospace';
    const isDark = darkMode;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data,
          clip: false,
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 3,
          pointBackgroundColor: color,
          pointBorderColor: isDark ? '#1C2220' : '#fff',
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
        layout: {
          padding: { top: 12, bottom: 8, left: 8, right: 12 }
        },
        plugins: {
          legend: { display: false },
          targetLine: {
            scale: 'y',
            value: KpiMeta.ratingMinimo,
            label: 'Meta Regional 4.60',
            borderColor: '#c97d10',
            lineWidth: 2,
            borderDash: [5, 5]
          },
          tooltip: {
            backgroundColor: isDark ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: 'bold' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (c: any) => ` ${label}: ${Number(c.raw).toFixed(2)}`
            }
          }
        } as any,
        scales: {
          y: {
            min: 4.5,
            max: 5.15,
            grid: {
              color: function(context) {
                if (context.tick && context.tick.value > 5.0) {
                  return 'transparent';
                }
                return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
              }
            },
            ticks: {
              font: { size: 10, family: fontMono },
              color: isDark ? '#8A9E94' : '#8A877C',
              stepSize: 0.1,
              precision: 1,
              callback: function(value) {
                const numeric = Number(value);
                if (numeric > 5.0) return null;
                return numeric.toFixed(1);
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: isDark ? '#9DA89F' : '#6B6960'
            }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, data, label, color, darkMode]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

// 6. Tendencia temporal de una sucursal (Rating)
export const BranchRatingTrendChart: React.FC<ChartProps & { color: string }> = ({ labels, data, color, height = 240 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { darkMode } = useApp();

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const fontSans = 'Plus Jakarta Sans, sans-serif';
    const fontMono = 'JetBrains Mono, monospace';
    const isDark = darkMode;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Rating Promedio',
          data,
          clip: false,
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 3,
          pointBackgroundColor: color,
          pointBorderColor: isDark ? '#151725' : '#fff',
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
        layout: {
          padding: { top: 12, bottom: 8, left: 8, right: 12 }
        },
        plugins: {
          legend: { display: false },
          targetLine: {
            scale: 'y',
            value: KpiMeta.ratingMinimo,
            label: 'Meta 4.60',
            borderColor: '#c97d10',
            lineWidth: 1.5,
            borderDash: [5, 5]
          },
          tooltip: {
            backgroundColor: isDark ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: 'bold' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (c: any) => ` Rating: ${Number(c.raw).toFixed(2)} ★`
            }
          }
        } as any,
        scales: {
          y: {
            min: 2.0,
            max: 5.2,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: isDark ? '#8A9E94' : '#8A877C',
              stepSize: 0.5,
              precision: 1
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: isDark ? '#9DA89F' : '#6B6960'
            }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, data, color, darkMode]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

// 7. Tendencia temporal de volumen de una sucursal
export const BranchVolumeTrendChart: React.FC<ChartProps & { color: string }> = ({ labels, data, color, height = 240 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { darkMode } = useApp();

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const fontSans = 'Plus Jakarta Sans, sans-serif';
    const fontMono = 'JetBrains Mono, monospace';
    const isDark = darkMode;

    let rgbaColor = 'rgba(107, 144, 125, 0.1)';
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      rgbaColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Volumen de Reseñas',
          data,
          clip: false,
          borderColor: color,
          backgroundColor: rgbaColor,
          borderWidth: 3,
          pointBackgroundColor: color,
          pointBorderColor: isDark ? '#151725' : '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true
        }]
      },
      plugins: [targetLinePlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 12, bottom: 8, left: 8, right: 12 }
        },
        plugins: {
          legend: { display: false },
          targetLine: {
            scale: 'y',
            value: KpiMeta.volumenMeta,
            label: `Meta ${KpiMeta.volumenMeta}`,
            borderColor: '#c97d10',
            lineWidth: 1.5,
            borderDash: [5, 5]
          },
          tooltip: {
            backgroundColor: isDark ? '#1C2220' : '#161614',
            titleFont: { family: fontSans, size: 12, weight: 'bold' },
            bodyFont: { family: fontSans, size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (c: any) => ` Reseñas: ${c.raw}`
            }
          }
        } as any,
        scales: {
          y: {
            beginAtZero: true,
            grace: '10%',
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10, family: fontMono },
              color: isDark ? '#8A9E94' : '#8A877C',
              precision: 0
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: fontSans },
              color: isDark ? '#9DA89F' : '#6B6960'
            }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, data, color, darkMode]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
