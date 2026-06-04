import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DataLoader } from '../services/dataLoader';
import { MONTH_NAMES, KpiMeta, SUCURSALES_META_ALL } from '../lib/data';
import { Review, BranchStats } from '../types';
import Topbar from '../components/Topbar';
import Icon from '../components/Icon';
import { 
  StackedVolumeChart, 
  BarRankingChart, 
  StarDistributionBarChart, 
  LineTrendChart 
} from '../components/DashboardCharts';
import { getConcludedMonthInfo } from '../utils';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface ProactiveAlert {
  type: 'critical' | 'attention' | 'optimal';
  title: string;
  tag: string;
  branch: string;
  icon: 'alert' | 'calendar' | 'starFilled' | 'check';
  desc: string;
}

export const Dashboards: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeRegion,
    darkMode,
    currentYear,
    currentMonth,
    setCurrentPeriod,
    isAuthenticated,
    sucursalesMeta
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [manifest, setManifest] = useState<Record<string, number[]> | null>(null);
  const [concludedPeriod, setConcludedPeriod] = useState<{ year: number; month: number } | null>(null);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);

  // Chart data states
  const [volumeChartData, setVolumeChartData] = useState<{
    labels: string[];
    okData: number[];
    neutralData: number[];
    warnData: number[];
  } | null>(null);

  const [rankingChartData, setRankingChartData] = useState<{
    labels: string[];
    data: number[];
    colors: string[];
  } | null>(null);

  const [distChartData, setDistChartData] = useState<{
    labels: string[];
    data: number[];
    colors: string[];
  } | null>(null);

  const [trendChartData, setTrendChartData] = useState<{
    labels: string[];
    data: number[];
  } | null>(null);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Carga inicial y actualización de datos
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setLoading(true);
      
      const dbManifest = await DataLoader.init(activeRegion);
      setManifest(dbManifest);

      const months = dbManifest[currentYear] || [];
      const sortedMonths = [...months].sort((a, b) => a - b);

      // Cargar todos los meses del año concurrentemente
      const monthDataList = await Promise.all(
        sortedMonths.map(m => DataLoader.loadMonth(currentYear, m, activeRegion))
      );

      // Consolidar todas las reseñas YTD
      let ytdReviews: Review[] = [];
      monthDataList.forEach(d => {
        if (d && d.reviews) {
          ytdReviews = ytdReviews.concat(d.reviews);
        }
      });

      // Estadísticas y KPIs del mes activo
      const currStats = DataLoader.getAllBranchStats(currentYear, currentMonth, sucursalesMeta);
      const currGlobal = DataLoader.getGlobalStats(currentYear, currentMonth);

      // Calcular YTD stats por sucursal
      const ytdStats: Record<string, { count: number; avg: number }> = {};
      sucursalesMeta.forEach(meta => {
        const names = [meta.nombre, meta.abr];
        if (meta.id === 'gal-gdl') names.push('Galerías GDL');
        if (meta.id === 'sta-anita') names.push('Galerías Santa Anita');

        // Filtrado adaptativo para reviews del JSON o DB
        const bReviews = ytdReviews.filter(r => {
          if (!r.id || r.id.length < 15) {
            return names.includes(r.sucursal);
          }
          return r.sucursal === meta.id;
        });

        const count = bReviews.length;
        const avg = count > 0 ? bReviews.reduce((a, r) => a + r.stars, 0) / count : 0;
        ytdStats[meta.id] = { count, avg };
      });

      // Mapear sucursales con sucursalesMeta
      const branches = sucursalesMeta.map(meta => {
        const c = currStats[meta.id] || { avg: 0, count: 0, negativeCount: 0 };
        return {
          ...meta,
          ytd: ytdStats[meta.id] || { count: 0, avg: 0 },
          curr: { score: c.avg, count: c.count, negativeCount: c.negativeCount }
        };
      });

      // Calcular Alertas Operativas Proactivas
      const proactiveAlerts: ProactiveAlert[] = [];
      const maxNegativeCount = Math.max(...branches.map(b => b.curr.negativeCount));

      branches.forEach(b => {
        const currScore = b.curr.score;
        const currCount = b.curr.count;
        const ytdAvg = b.ytd.avg;
        const negativeCount = b.curr.negativeCount;

        // Reseñas negativas sin responder este mes
        const bReviews = DataLoader.getReviewsForBranch(currentYear, currentMonth, b.id);
        const unrepliedCount = bReviews.filter(
          r => r.stars <= 2 && (!r.responseText || r.responseText.trim() === '')
        ).length;

        // 1. Caída de Calificación: currScore < ytdAvg - 0.20
        if (currCount > 0 && ytdAvg > 0 && currScore < ytdAvg - 0.20) {
          proactiveAlerts.push({
            type: 'critical',
            title: 'Caída de Calificación',
            tag: 'Crítico',
            branch: b.nombre,
            icon: 'alert',
            desc: `${b.nombre} promedió ${currScore.toFixed(2)} ★ en el mes, una desviación de -${(ytdAvg - currScore).toFixed(2)} ★ respecto a su promedio histórico del año (${ytdAvg.toFixed(2)} ★).`
          });
        }

        // 2. Bajo la Meta Regional: currScore < 4.60
        if (currCount > 0 && currScore < KpiMeta.ratingMinimo) {
          proactiveAlerts.push({
            type: 'attention',
            title: 'Bajo la Meta Regional',
            tag: 'Atención',
            branch: b.nombre,
            icon: 'alert',
            desc: `${b.nombre} promedió ${currScore.toFixed(2)} ★, quedando por debajo del estándar mínimo de ${KpiMeta.ratingMinimo.toFixed(2)} ★.`
          });
        }

        // 3. Foco de Incidencias: el que tenga más negativas
        if (negativeCount > 0 && negativeCount === maxNegativeCount) {
          proactiveAlerts.push({
            type: 'critical',
            title: 'Foco de Incidencias',
            tag: 'Crítico',
            branch: b.nombre,
            icon: 'alert',
            desc: `${b.nombre} registró la mayor cantidad de quejas del periodo con ${negativeCount} reseña${negativeCount > 1 ? 's' : ''} crítica${negativeCount > 1 ? 's' : ''} (1-2 ★).`
          });
        }

        // 4. Quejas sin Respuesta: unrepliedCount > 0
        if (unrepliedCount > 0) {
          proactiveAlerts.push({
            type: 'attention',
            title: 'Quejas sin Respuesta',
            tag: 'Pendiente',
            branch: b.nombre,
            icon: 'calendar',
            desc: `${b.nombre} cuenta con ${unrepliedCount} reseña${unrepliedCount > 1 ? 's' : ''} crítica${unrepliedCount > 1 ? 's' : ''} de clientes sin respuesta del propietario.`
          });
        }

        // 5. Líder Regional: score >= 4.80 y count >= 3
        if (currScore >= 4.80 && currCount >= 3) {
          proactiveAlerts.push({
            type: 'optimal',
            title: 'Líder Regional',
            tag: 'Destacado',
            branch: b.nombre,
            icon: 'starFilled',
            desc: `${b.nombre} mantiene un nivel sobresaliente con un promedio de ${currScore.toFixed(2)} ★ en ${currCount} opiniones recibidas.`
          });
        }
      });

      if (proactiveAlerts.length === 0) {
        proactiveAlerts.push({
          type: 'optimal',
          title: 'Operación Estable',
          tag: 'Estable',
          branch: 'General',
          icon: 'check',
          desc: 'Sin desviaciones críticas ni alertas de desempeño detectadas en las sucursales para este periodo.'
        });
      }

      setAlerts(proactiveAlerts);

      // --- CONFIGURACIÓN DE GRÁFICOS ---
      // 1. Volumen de reseñas
      const sortedVol = [...branches].sort((a, b) => b.curr.count - a.curr.count);
      const volLabels = sortedVol.map(s => s.abr);
      const okData: number[] = [];
      const neutralData: number[] = [];
      const warnData: number[] = [];

      sortedVol.forEach(s => {
        const bReviews = DataLoader.getReviewsForBranch(currentYear, currentMonth, s.id);
        warnData.push(bReviews.filter(r => r.stars <= 2).length);
        neutralData.push(bReviews.filter(r => r.stars === 3).length);
        okData.push(bReviews.filter(r => r.stars >= 4).length);
      });

      setVolumeChartData({ labels: volLabels, okData, neutralData, warnData });

      // 2. Ranking de calificación
      const sortedRating = [...branches].sort((a, b) => b.curr.score - a.curr.score);
      const rankLabels = sortedRating.map(s => s.abr);
      const rankData = sortedRating.map(s => s.curr.score);
      const rankColors = sortedRating.map(s => {
        if (s.curr.count === 0) return darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        return s.curr.score >= KpiMeta.ratingMinimo
          ? (darkMode ? 'rgba(122,158,138,0.85)' : 'rgba(61,90,71,0.85)')
          : (s.curr.score >= 4.0 
              ? (darkMode ? 'rgba(244,201,130,0.85)' : 'rgba(201,125,16,0.85)') 
              : (darkMode ? 'rgba(244,144,144,0.85)' : 'rgba(198,40,40,0.85)'));
      });

      setRankingChartData({ labels: rankLabels, data: rankData, colors: rankColors });

      // 3. Distribución de estrellas
      const currReviews = DataLoader.getMonth(currentYear, currentMonth)?.reviews || [];
      const starCounts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 estrellas
      currReviews.forEach(r => {
        if (r.stars >= 1 && r.stars <= 5) {
          starCounts[5 - r.stars]++;
        }
      });
      const distColors = darkMode 
        ? ['rgba(122,158,138,0.85)', 'rgba(137,173,152,0.7)', 'rgba(244,201,130,0.85)', 'rgba(244,160,144,0.85)', 'rgba(244,116,116,0.85)']
        : ['rgba(61,90,71,0.85)', 'rgba(122,158,138,0.7)', 'rgba(201,125,16,0.85)', 'rgba(178,58,43,0.85)', 'rgba(198,40,40,0.85)'];

      setDistChartData({
        labels: ['5 ★', '4 ★', '3 ★', '2 ★', '1 ★'],
        data: starCounts,
        colors: distColors
      });

      // 4. Tendencia Regional YTD
      const trendLabels: string[] = [];
      const trendData: number[] = [];
      for (const m of sortedMonths) {
        const monthName = MONTH_NAMES[m - 1].substring(0, 3);
        trendLabels.push(`${monthName} ${currentYear}`);
        const d = DataLoader.getMonth(currentYear, m);
        if (d && d.reviews && d.reviews.length > 0) {
          const avg = d.reviews.reduce((sum, r) => sum + r.stars, 0) / d.reviews.length;
          trendData.push(avg);
        } else {
          trendData.push(0); // Para TypeScript/Vite, evitamos null en arrays numéricos si no lo maneja
        }
      }

      setTrendChartData({ labels: trendLabels, data: trendData });

      // Resumen mensual concluido
      const concluded = getConcludedMonthInfo(dbManifest);
      setConcludedPeriod(concluded);

      setLoading(false);
    };

    fetchData();
  }, [activeRegion, currentYear, currentMonth, darkMode, isAuthenticated]);

  // Cierre de dropdown
  useEffect(() => {
    const handleGlobalClick = () => setMonthDropdownOpen(false);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  if (!isAuthenticated) return null;

  const capitalizedCurrMonth = MONTH_NAMES[currentMonth - 1] || '';
  const activeAlertsCount = alerts.filter(a => a.tag !== 'Estable').length;

  return (
    <>
      {concludedPeriod && (
        <div className="concluded-month-banner" onClick={() => navigate('/')}>
          <span className="cmb-badge">Reporte Mensual</span>
          <div className="cmb-content-wrap">
            <span className="cmb-title">
              El mes de <strong>{MONTH_NAMES[concludedPeriod.month - 1]} {concludedPeriod.year}</strong> ha finalizado. El resumen ejecutivo está listo.
            </span>
            <span className="cmb-link-btn">Ver Resumen →</span>
          </div>
        </div>
      )}

      <Topbar />

      {/* HERO */}
      <section className="hero" style={{ padding: '48px 22px' }}>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-label-row">
              <span className="eyebrow" style={{ color: 'rgba(245,239,230,.55)' }}>Visualización de Datos</span>
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(36px,8vw,64px)', color: '#FAF5EB', lineHeight: '1.05', margin: 0 }}>
              Dashboards Analíticos
            </h1>
          </div>
          <div className="hero-right">
            <Link to="/trimestre/2026-Q1" className="reporte-especial-card">
              <div className="reporte-watermark">
                <Icon name="calendar" size={120} />
              </div>
              <div className="card-tag">Reporte Especial</div>
              <div className="card-title">Resumen Trimestral<br /><span>Q1 2026</span></div>
              <span className="reporte-especial-btn">
                Ver reporte completo
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CONTROLS BAR */}
      <div className="dashboard-controls-bar">
        <div className="controls-bar-left">
          <span className="controls-bar-title">Análisis Mensual</span>
          <span className="controls-bar-sub">Visualizando estadísticas de {capitalizedCurrMonth} {currentYear}</span>
        </div>
        <div className="controls-bar-right">
          <div 
            className={`custom-select ${monthDropdownOpen ? 'open' : ''}`} 
            id="dashMonthDropdown"
            onClick={(e) => {
              e.stopPropagation();
              setMonthDropdownOpen(!monthDropdownOpen);
            }}
          >
            <button className="custom-select-trigger">
              <span className="custom-select-value">{capitalizedCurrMonth} {currentYear}</span>
              <ChevronDown className="custom-select-arrow" size={10} />
            </button>
            <div className="custom-select-options">
              {(manifest && manifest[currentYear] || []).map(m => (
                <div 
                  key={m} 
                  className={`custom-option ${m === currentMonth ? 'active' : ''}`}
                  onClick={() => setCurrentPeriod(currentYear, m)}
                >
                  {MONTH_NAMES[m - 1]} {currentYear}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '20px' }}>
          <div className="custom-select-arrow" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--verde)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px' }}>Cargando analíticos regionales...</p>
        </div>
      ) : (
        <>
          {/* CHARTS GRID */}
          <div className="home-grid-2">
            <section className="section r">
              <div className="section-head">
                <div className="section-title">Volumen de Reseñas <span className="accent">{capitalizedCurrMonth}</span></div>
                <span className="section-sub">Negativas vs Positivas/Neutrales</span>
              </div>
              <div className="chart-card">
                <div className="chart-wrap" style={{ height: '280px' }}>
                  {volumeChartData && (
                    <StackedVolumeChart 
                      labels={volumeChartData.labels}
                      okData={volumeChartData.okData}
                      neutralData={volumeChartData.neutralData}
                      warnData={volumeChartData.warnData}
                      height={280}
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="section r">
              <div className="section-head">
                <div className="section-title">Ranking de Calificación <span className="accent">{capitalizedCurrMonth}</span></div>
                <span className="section-sub">Calificación promedio por sucursal en el mes</span>
              </div>
              <div className="chart-card">
                <div className="chart-wrap" style={{ height: '320px' }}>
                  {rankingChartData && (
                    <BarRankingChart 
                      labels={rankingChartData.labels}
                      data={rankingChartData.data}
                      colors={rankingChartData.colors}
                      height={320}
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="section r">
              <div className="section-head">
                <div className="section-title">Distribución de Estrellas <span className="accent">{capitalizedCurrMonth}</span></div>
                <span className="section-sub">Desglose de calificaciones de 1 a 5 estrellas</span>
              </div>
              <div className="chart-card">
                <div className="chart-wrap" style={{ height: '240px' }}>
                  {distChartData && (
                    <StarDistributionBarChart 
                      labels={distChartData.labels}
                      data={distChartData.data}
                      colors={distChartData.colors}
                      height={240}
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="section r">
              <div className="section-head">
                <div className="section-title">Tendencia Regional <span className="accent">YTD</span></div>
                <span className="section-sub">Evolución de la calificación promedio regional durante el año</span>
              </div>
              <div className="chart-card">
                <div className="chart-wrap" style={{ height: '260px' }}>
                  {trendChartData && (
                    <LineTrendChart 
                      labels={trendChartData.labels}
                      data={trendChartData.data}
                      label="Promedio Regional"
                      color={darkMode ? '#7A9E8A' : '#3D5A47'}
                      height={260}
                    />
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ALERTAS OPERATIVAS PROACTIVAS */}
          <div className="proactive-alerts-container" style={{ marginTop: '24px' }}>
            <div className="proactive-alerts-toggle-container">
              <button 
                className={`alerts-toggle-btn ${alerts.some(a => a.type === 'critical') ? 'has-critical' : ''} ${alertsExpanded ? 'expanded' : ''}`} 
                data-count={activeAlertsCount} 
                onClick={() => setAlertsExpanded(!alertsExpanded)}
              >
                <span className="toggle-icon-wrap">
                  <Icon name="alert" size={16} />
                </span>
                <span className="toggle-text">
                  {alertsExpanded 
                    ? 'Ocultar Alertas Operativas Proactivas' 
                    : activeAlertsCount === 0 
                      ? 'Ver Estado de Operación (Estable)' 
                      : `Ver Alertas Operativas Proactivas (${activeAlertsCount})`}
                </span>
                <span className="toggle-arrow">
                  <ChevronDown size={12} style={{ transform: alertsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                </span>
              </button>
            </div>
            
            <div className={`proactive-alerts-wrapper ${alertsExpanded ? 'expanded' : ''}`} id="proactiveAlertsWrapper">
              <h2 className="proactive-alerts-title">
                <Icon name="alert" size={20} /> Alertas Operativas Proactivas
              </h2>
              <div className="proactive-alerts-grid">
                {alerts.map((a, idx) => (
                  <div key={idx} className={`proactive-alert-card ${a.type}`}>
                    <div className="pac-header">
                      <div className="pac-title-wrap">
                        <span className="pac-icon">
                          <Icon name={a.icon} size={18} />
                        </span>
                        <span className="pac-branch">{a.branch}</span>
                      </div>
                      <span className="pac-tag">{a.tag}</span>
                    </div>
                    <p className="pac-desc">{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <span className="brand" style={{ textTransform: 'none', fontFamily: 'var(--giaza)', fontSize: '18px' }}>étoile</span> · La Crêpe Parisienne / Grupo MYT<br />
        Dashboard de Reseñas · Región {activeRegion}
      </footer>
    </>
  );
};

export default Dashboards;
