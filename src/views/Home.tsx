import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DataLoader } from '../services/dataLoader';
import { Kpis } from '../services/kpis';
import { starStr, formatDate, computeDynamicInsights, getConcludedMonthInfo } from '../utils';
import { KpiMeta, REGION_NAME_MAP, MONTH_NAMES } from '../lib/data';
import { Review, BranchStats } from '../types';
import Topbar from '../components/Topbar';
import RatingStars from '../components/RatingStars';
import QuoteBlock from '../components/QuoteBlock';
import Scorecard from '../components/Scorecard';
import ReviewItem from '../components/ReviewItem';
import Icon from '../components/Icon';
import { ChevronDown } from 'lucide-react';

export const Home: React.FC = () => {
  const {
    activeRegion,
    darkMode,
    homeFilter,
    setHomeFilter,
    currentYear,
    currentMonth,
    setCurrentPeriod,
    sucursalesMeta,
    isAuthenticated,
    userProfile
  } = useApp();

  const navigate = useNavigate();

  // Estados de carga y datos
  const [loading, setLoading] = useState(true);
  const [manifest, setManifest] = useState<Record<string, number[]> | null>(null);
  const [currGlobal, setCurrGlobal] = useState({ totalReviews: 0, avgRating: 0, withText: 0 });
  const [prevGlobal, setPrevGlobal] = useState({ totalReviews: 0, avgRating: 0, withText: 0 });
  const [currStats, setCurrStats] = useState<Record<string, BranchStats>>({});
  const [prevStats, setPrevStats] = useState<Record<string, BranchStats>>({});
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [prevKpi, setPrevKpi] = useState<any>(null);
  const [sparklines, setSparklines] = useState<any>(null);

  // Controles
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [filter, setFilter] = useState('todas');

  // Dropdowns del DOM
  const [heroDropdownOpen, setHeroDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Modales y Sidebar
  const [showConcludedModal, setShowConcludedModal] = useState(false);
  const [concludedPeriod, setConcludedPeriod] = useState<{ year: number, month: number } | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [activeBranchAlertId, setActiveBranchAlertId] = useState<string | null>(null);
  const [showAllAlertsModal, setShowAllAlertsModal] = useState(false);
  const [showFullFeedSidebar, setShowFullFeedSidebar] = useState(false);
  
  // Filtros del Sidebar
  const [sidebarSentiment, setSidebarSentiment] = useState('todas');
  const [sidebarBranch, setSidebarBranch] = useState('todas');
  const [sidebarSentimentOpen, setSidebarSentimentOpen] = useState(false);
  const [sidebarBranchOpen, setSidebarBranchOpen] = useState(false);

  // Copiado
  const [copiedBranchId, setCopiedBranchId] = useState<string | null>(null);
  const [copiedAllAlerts, setCopiedAllAlerts] = useState(false);

  // Elementos y Animaciones del Carrusel
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [carouselPool, setCarouselPool] = useState<Review[]>([]);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);
  const carouselBatchSize = 8;
  const [carouselTransition, setCarouselTransition] = useState(true);
  const isPausedRef = useRef(false);
  const scrollFractionRef = useRef(0);
  const scrollAnimationFrameRef = useRef<number | null>(null);

  // Comprobar autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Carga inicial de datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const dbManifest = await DataLoader.init(activeRegion);
      setManifest(dbManifest);

      // Si el mes actual del context no está en el manifest de la región activa, poner el último disponible
      const years = Object.keys(dbManifest).map(Number).sort((a, b) => b - a);
      if (years.length > 0) {
        const latestYear = years[0];
        const months = [...dbManifest[latestYear]].sort((a, b) => b - a);
        if (months.length > 0) {
          const latestMonth = months[0];
          // Evitar bucle si ya coincide
          if (latestYear !== currentYear || latestMonth !== currentMonth) {
            setCurrentPeriod(latestYear, latestMonth);
            return; // Esperar al siguiente trigger por dependencia de currentYear/currentMonth
          }
        }
      }

      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const hasPrev = DataLoader.hasMonth(prevYear, prevMonth);

      // Cargar meses concurrentemente
      const ytdMonths = dbManifest[currentYear] 
        ? [...dbManifest[currentYear]].filter(m => m <= currentMonth).sort((a, b) => a - b)
        : [currentMonth];

      const loadPromises = ytdMonths.map(m => DataLoader.loadMonth(currentYear, m, activeRegion));
      if (hasPrev) {
        loadPromises.push(DataLoader.loadMonth(prevYear, prevMonth, activeRegion));
      }
      await Promise.all(loadPromises);

      // Leer estadísticas y KPIs
      const currentData = DataLoader.getMonth(currentYear, currentMonth);
      const reviews = currentData ? currentData.reviews : [];
      setReviewsList(reviews);

      const computedStats = DataLoader.getAllBranchStats(currentYear, currentMonth, sucursalesMeta);
      setCurrStats(computedStats);

      const currGlob = DataLoader.getGlobalStats(currentYear, currentMonth);
      setCurrGlobal(currGlob);

      if (hasPrev) {
        const prevStatsObj = DataLoader.getAllBranchStats(prevYear, prevMonth, sucursalesMeta);
        setPrevStats(prevStatsObj);
        const prevGlob = DataLoader.getGlobalStats(prevYear, prevMonth);
        setPrevGlobal(prevGlob);
        const computedPrevKpi = await Kpis.computeMonth(prevYear, prevMonth, activeRegion, sucursalesMeta);
        setPrevKpi(computedPrevKpi);
      } else {
        setPrevStats({});
        setPrevGlobal({ totalReviews: 0, avgRating: 0, withText: 0 });
        setPrevKpi(null);
      }

      // KPIs
      const computedKpi = await Kpis.computeMonth(currentYear, currentMonth, activeRegion, sucursalesMeta);
      setKpiData(computedKpi);

      // Sparklines YTD
      const ytdKpiPromises = ytdMonths.map(m => Kpis.computeMonth(currentYear, m, activeRegion, sucursalesMeta));
      const ytdKpis = await Promise.all(ytdKpiPromises);

      setSparklines({
        volumen: ytdKpis.map(k => k.volumen.ok),
        calidad: ytdKpis.map(k => k.calidadTexto.ratio * 100),
        rating: ytdKpis.map(k => k.global.avgRating),
        respuestas: ytdKpis.map(k => k.tasaRespuesta.value * 100)
      });

      // Checar si hay mes concluido
      const concluded = getConcludedMonthInfo(dbManifest);
      setConcludedPeriod(concluded);

      setLoading(false);
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [activeRegion, currentYear, currentMonth, isAuthenticated]);

  // Cerrar dropdowns interactivos al hacer click fuera
  useEffect(() => {
    const handleGlobalClick = () => {
      setHeroDropdownOpen(false);
      setSortDropdownOpen(false);
      setSidebarSentimentOpen(false);
      setSidebarBranchOpen(false);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Construir pool del carrusel e iniciar autoplay continuo
  useEffect(() => {
    if (loading || reviewsList.length === 0) return;

    const textReviews = reviewsList.filter(r => r.text && r.text.trim().length > 5);
    const negativesPool = textReviews.filter(r => r.stars <= 2 && r.text && r.text.length > 10);
    const positivesPool = textReviews.filter(r => r.stars === 5 && r.text && r.text.length > 20);
    const restPool = textReviews.filter(r => !negativesPool.includes(r) && !positivesPool.includes(r));

    const pool = [...negativesPool, ...positivesPool, ...restPool];
    setCarouselPool(pool);
    setCarouselStartIndex(0);
  }, [reviewsList, loading]);

  // Manejar el desplazamiento continuo con requestAnimationFrame
  useEffect(() => {
    if (loading || carouselPool.length === 0) return;

    const grid = carouselRef.current;
    if (!grid) return;

    // Reiniciar posición de scroll
    grid.scrollLeft = 0;
    scrollFractionRef.current = 0;
    isPausedRef.current = false;
    
    let scrollAnimationActive = true;

    const animate = () => {
      if (!scrollAnimationActive || !carouselRef.current) return;

      if (!isPausedRef.current) {
        // Sincronizar scroll por fricción externa
        if (Math.abs(carouselRef.current.scrollLeft - scrollFractionRef.current) > 1.5) {
          scrollFractionRef.current = carouselRef.current.scrollLeft;
        }

        // Velocidad 0.6px por frame
        scrollFractionRef.current += 0.6;

        const maxScrollLeft = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
        if (scrollFractionRef.current >= maxScrollLeft - 1) {
          isPausedRef.current = true;
          // Rotar lote al final
          setCarouselTransition(false);
          setTimeout(() => {
            setCarouselStartIndex(prev => (prev + carouselBatchSize) % carouselPool.length);
            carouselRef.current!.scrollLeft = 0;
            scrollFractionRef.current = 0;
            setCarouselTransition(true);
            setTimeout(() => {
              isPausedRef.current = false;
            }, 350);
          }, 300);
        } else {
          carouselRef.current.scrollLeft = Math.floor(scrollFractionRef.current);
        }
      }

      scrollAnimationFrameRef.current = requestAnimationFrame(animate);
    };

    scrollAnimationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      scrollAnimationActive = false;
      if (scrollAnimationFrameRef.current) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
    };
  }, [carouselPool, loading]);

  if (!isAuthenticated) return null;

  // Lógica de cálculo de sucursales y alertas activas
  const capitalizedCurrMonth = MONTH_NAMES[currentMonth - 1] || '';
  const currMonthShort = capitalizedCurrMonth.substring(0, 3).toUpperCase();
  const prevMonthName = MONTH_NAMES[currentMonth === 1 ? 11 : currentMonth - 2] || '';

  const branches = sucursalesMeta.map(meta => {
    const p = prevStats[meta.id] || { avg: 0, count: 0 };
    const c = currStats[meta.id] || { avg: 0, count: 0, negativeCount: 0 };
    const branchReviews = DataLoader.getReviewsForBranch(currentYear, currentMonth, meta.id);
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

  // Filtrado de la cuadrícula de sucursales
  let visibleBranches = branches;
  if (filter === 'alerta') visibleBranches = conAlerta;
  else if (filter === 'estables') visibleBranches = sinAlerta;

  // Buscador
  if (searchQuery.trim().length > 0) {
    visibleBranches = visibleBranches.filter(s =>
      s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.abr.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Ordenación
  switch (sortBy) {
    case 'rating-desc':
      visibleBranches.sort((a, b) => b.curr.score - a.curr.score);
      break;
    case 'rating-asc':
      visibleBranches.sort((a, b) => a.curr.score - b.curr.score);
      break;
    case 'volume-desc':
      visibleBranches.sort((a, b) => b.curr.count - a.curr.count);
      break;
    default:
      visibleBranches.sort((a, b) => {
        const scoreA = a.curr.score + (a.curr.count > 0 ? 0.15 * Math.log2(a.curr.count) : 0);
        const scoreB = b.curr.score + (b.curr.count > 0 ? 0.15 * Math.log2(b.curr.count) : 0);
        return scoreB - scoreA;
      });
      break;
  }

  // Lote de reseñas del carrusel
  const activeCarouselReviews: Review[] = [];
  if (carouselPool.length > 0) {
    for (let i = 0; i < carouselBatchSize; i++) {
      const idx = (carouselStartIndex + i) % carouselPool.length;
      if (carouselPool[idx] && !activeCarouselReviews.includes(carouselPool[idx])) {
        activeCarouselReviews.push(carouselPool[idx]);
      }
    }
  }

  // Lógica de copiado de alertas individuales para Marketing
  const handleCopyAlert = async (branchId: string) => {
    const branchMeta = sucursalesMeta.find(s => s.id === branchId);
    if (!branchMeta) return;
    const branchReviews = DataLoader.getReviewsForBranch(currentYear, currentMonth, branchId);
    const negatives = branchReviews.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);
    
    let text = `étoile ${activeRegion} — Reporte de Incidencias — ${branchMeta.abr} ${capitalizedCurrMonth} ${currentYear}\n`;
    text += `${negatives.length} reseña${negatives.length !== 1 ? 's' : ''} crítica${negatives.length !== 1 ? 's' : ''}:\n\n`;
    negatives.forEach((r, i) => {
      text += `${i + 1}. ${formatDate(r.publishedAtDate)} (${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}): "${r.text}"\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopiedBranchId(branchId);
      setTimeout(() => setCopiedBranchId(null), 2500);
    } catch (err) {
      console.warn("Fallo al copiar reporte al portapapeles:", err);
    }
  };

  // Lógica de copiado de alertas consolidadas para Marketing
  const handleCopyAllAlerts = async () => {
    let text = `étoile ${activeRegion} — Reporte Consolidado de Incidencias — ${capitalizedCurrMonth} ${currentYear}\n\n`;
    let totalCount = 0;

    sucursalesMeta.forEach(branchMeta => {
      const branchReviews = DataLoader.getReviewsForBranch(currentYear, currentMonth, branchMeta.id);
      const negatives = branchReviews.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);
      if (negatives.length > 0) {
        totalCount += negatives.length;
        text += `• ${branchMeta.nombre} (${negatives.length} reseña${negatives.length !== 1 ? 's' : ''} crítica${negatives.length !== 1 ? 's' : ''}):\n`;
        negatives.forEach((r, i) => {
          text += `  ${i + 1}. ${formatDate(r.publishedAtDate)} (${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}): "${r.text}"\n`;
        });
        text += '\n';
      }
    });

    if (totalCount === 0) text += 'Sin incidencias registradas.';

    try {
      await navigator.clipboard.writeText(text.trim());
      setCopiedAllAlerts(true);
      setTimeout(() => setCopiedAllAlerts(false), 2500);
    } catch (err) {
      console.warn("Fallo al copiar consolidado:", err);
    }
  };

  // Filtrado de reseñas dentro del Sidebar lateral
  const getSidebarFilteredReviews = () => {
    let list = reviewsList.filter(r => r.text && r.text.trim().length > 0);
    if (sidebarSentiment === 'positivas') {
      list = list.filter(r => r.stars >= 4);
    } else if (sidebarSentiment === 'neutras') {
      list = list.filter(r => r.stars === 3);
    } else if (sidebarSentiment === 'negativas') {
      list = list.filter(r => r.stars <= 2);
    }

    if (sidebarBranch !== 'todas') {
      list = list.filter(r => r.sucursal === sidebarBranch);
    }
    return list;
  };

  const sidebarFiltered = getSidebarFilteredReviews();

  // Scroll manual del carrusel por flechas
  const handleScrollCarousel = (direction: 'prev' | 'next') => {
    const grid = carouselRef.current;
    if (!grid) return;
    
    isPausedRef.current = true;
    const maxScrollLeft = grid.scrollWidth - grid.clientWidth;

    if (direction === 'next') {
      if (grid.scrollLeft >= maxScrollLeft - 10) {
        setCarouselTransition(false);
        setCarouselStartIndex(prev => (prev + carouselBatchSize) % carouselPool.length);
        grid.scrollLeft = 0;
        scrollFractionRef.current = 0;
        setCarouselTransition(true);
        setTimeout(() => { isPausedRef.current = false; }, 350);
      } else {
        grid.scrollBy({ left: 296, behavior: 'smooth' });
        setTimeout(() => { scrollFractionRef.current = grid.scrollLeft; isPausedRef.current = false; }, 400);
      }
    } else {
      if (grid.scrollLeft <= 10) {
        setCarouselTransition(false);
        const poolSize = carouselPool.length;
        setCarouselStartIndex(prev => (prev - carouselBatchSize + poolSize) % poolSize);
        setTimeout(() => {
          grid.scrollLeft = grid.scrollWidth - grid.clientWidth;
          scrollFractionRef.current = grid.scrollLeft;
          setCarouselTransition(true);
          setTimeout(() => { isPausedRef.current = false; }, 350);
        }, 50);
      } else {
        grid.scrollBy({ left: -296, behavior: 'smooth' });
        setTimeout(() => { scrollFractionRef.current = grid.scrollLeft; isPausedRef.current = false; }, 400);
      }
    }
  };

  // Elementos de Diagnóstico de Hero
  const renderHeroDiagnosis = () => {
    const STANDARD = KpiMeta.ratingMinimo;
    if (conAlerta.length > 0) {
      const names = conAlerta.map(s => s.abr).join(', ');
      return (
        <div className="hero-diagnosis status-critical">
          <span className="hero-diagnosis-icon">
            <Icon name="alert" />
          </span>
          <span className="hero-diagnosis-text">
            <strong>FOCO OPERATIVO:</strong> Incidencias en {names}. Reportar a Marketing para atención inmediata.
          </span>
        </div>
      );
    }

    if (currGlobal.avgRating < STANDARD) {
      const worst = branches.reduce((min, b) => {
        const s = currStats[b.id] || { avg: 0 };
        return (s.avg > 0 && s.avg < (min.score || 99)) ? { name: b.abr, score: s.avg } : min;
      }, { name: '—', score: 99 });
      return (
        <div className="hero-diagnosis status-warn">
          <span className="hero-diagnosis-icon">
            <Icon name="barChart" />
          </span>
          <span className="hero-diagnosis-text">
            <strong>FOCO OPERATIVO:</strong> Promedio regional por debajo del objetivo ({STANDARD.toFixed(2)}★). {worst.name} registra el desempeño más bajo ({worst.score.toFixed(2)}★).
          </span>
        </div>
      );
    }

    return (
      <div className="hero-diagnosis status-optimal">
        <span className="hero-diagnosis-icon">
          <Icon name="check" />
        </span>
        <span className="hero-diagnosis-text">
          <strong>OPERACIÓN ESTABLE:</strong> Todas las sucursales cumplen con el estándar regional ({STANDARD.toFixed(2)}★). Mantener consistencia operativa.
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Banner de mes concluido si existe */}
      {concludedPeriod && (
        <div className="concluded-month-banner" onClick={() => setShowConcludedModal(true)}>
          <span className="cmb-badge">Reporte Mensual</span>
          <div className="cmb-content-wrap">
            <span className="cmb-title">
              El mes de <strong>{MONTH_NAMES[concludedPeriod.month - 1]} {concludedPeriod.year}</strong> ha finalizado. El resumen ejecutivo está listo.
            </span>
            <span className="cmb-link-btn">Ver Resumen →</span>
          </div>
        </div>
      )}

      {/* Topbar Header */}
      <Topbar />

      {/* Carga principal */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
          <div className="custom-select-arrow" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--verde)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px' }}>Cargando datos regionales...</p>
        </div>
      ) : (
        <>
          {/* HERO */}
          <section className="hero">
            <div className="hero-inner">
              <div className="hero-left">
                <div className="hero-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '16px' }}>
                  <span className="eyebrow" style={{ color: 'rgba(245,239,230,.55)' }}>Promedio Regional</span>
                  
                  {/* Selector interactivo de mes en Hero */}
                  <div className="hero-month-select-container">
                    <div className={`custom-select ${heroDropdownOpen ? 'open' : ''}`} id="heroMonthDropdown">
                      <button 
                        className="custom-select-trigger" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroDropdownOpen(!heroDropdownOpen);
                        }}
                      >
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
                <div className="hero-score">
                  <span className="hero-score-num num in" id="heroNum">{currGlobal.avgRating.toFixed(2)}</span>
                  <div className="hero-score-side">
                    <span className="hero-stars">
                      <RatingStars rating={currGlobal.avgRating} />
                    </span>
                    <span className="hero-of">de 5.00</span>
                    
                    {prevGlobal.totalReviews > 0 ? (
                      <span 
                        className="hero-trend" 
                        style={
                          currGlobal.avgRating >= prevGlobal.avgRating 
                            ? { background: 'rgba(122,216,154,.12)', borderColor: 'rgba(122,216,154,.25)', color: '#A7DBB9' }
                            : { background: 'rgba(178,58,43,.12)', borderColor: 'rgba(178,58,43,.25)', color: '#F4A090' }
                        }
                      >
                        {currGlobal.avgRating >= prevGlobal.avgRating ? '↑' : '↓'} {Math.abs(currGlobal.avgRating - prevGlobal.avgRating).toFixed(2)} vs {prevMonthName} ({prevGlobal.avgRating.toFixed(2)})
                      </span>
                    ) : (
                      <span className="hero-trend" style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', color: '#FAF5EB' }}>
                        Meta: 4.50★
                      </span>
                    )}

                  </div>
                </div>
              </div>
              <div className="hero-right">
                <div className="hero-stat">
                  <span className="hero-stat-val num">{currGlobal.totalReviews}</span>
                  <div className="hero-stat-info">
                    <span className="hero-stat-label">Reseñas {capitalizedCurrMonth}</span>
                    {prevGlobal.totalReviews > 0 ? (
                      <span className="hero-stat-sub">{prevGlobal.totalReviews} en {prevMonthName.toLowerCase()}</span>
                    ) : (
                      <span className="hero-stat-sub">Meta: 4.5+ estrellas</span>
                    )}
                  </div>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-val num">{sucursalesMeta.length}</span>
                  <div className="hero-stat-info">
                    <span className="hero-stat-label">Sucursales</span>
                    <span className="hero-stat-sub">Región {REGION_NAME_MAP[activeRegion]}</span>
                  </div>
                </div>
                <div className="hero-stat={totalNegativasActivas > 0 ? 'warn' : ''}">
                  <span className="hero-stat-val num">{totalNegativasActivas}</span>
                  <div className="hero-stat-info">
                    <span className="hero-stat-label">Negativas Activas</span>
                    <span className="hero-stat-sub">De {totalNegativasTotal} totales</span>
                  </div>
                </div>
              </div>

              {renderHeroDiagnosis()}
            </div>
          </section>

          {/* ALERTA Y LO MÁS DESTACADO GRID */}
          <div className="home-grid-2" style={{ marginTop: '24px', marginBottom: '24px' }}>
            
            {conAlerta.length > 0 ? (
              <div className="alert-strip alert-box-sunken clickable" onClick={() => setShowAllAlertsModal(true)}>
                <div className="watermark-stars" style={{ opacity: 0.05 }}>
                  <Icon name="starFilled" />
                  <Icon name="star" />
                  <Icon name="star" />
                  <Icon name="star" />
                  <Icon name="star" />
                </div>
                <div className="alert-header-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', zIndex: 1, position: 'relative' }}>
                  <div className="alert-icon-box" style={{ marginTop: 0 }}>
                    <Icon name="alert" />
                  </div>
                  <div className="alert-title" style={{ marginBottom: 0 }}>
                    Alerta Activa · {capitalizedCurrMonth} {currentYear}
                  </div>
                </div>
                <div className="alert-content" style={{ zIndex: 1, position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="alert-text">
                    {conAlerta.length} sucursal{conAlerta.length !== 1 ? 'es' : ''} con alerta activa ({totalNegativasActivas} reseñas negativas). Reportar a Marketing.
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
                    <div className="alert-pills" style={{ marginTop: 0 }}>
                      {conAlerta.map(s => (
                        <button 
                          key={s.id} 
                          className="alert-pill" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBranchAlertId(s.id);
                          }}
                        >
                          {s.abr} · {s.curr.negativeCount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert-strip ok-box-sunken">
                <div className="alert-header-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', zIndex: 1, position: 'relative' }}>
                  <div className="alert-icon-box" style={{ marginTop: 0 }}>
                    <Icon name="check" />
                  </div>
                  <div className="alert-title" style={{ marginBottom: 0 }}>
                    Operación Estable
                  </div>
                </div>
                <div className="alert-content" style={{ zIndex: 1, position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <div className="alert-text">Sin alertas registradas en {capitalizedCurrMonth} {currentYear}. Todo bajo control.</div>
                </div>
              </div>
            )}

            {/* Componente Lo más destacado */}
            <QuoteBlock reviews={reviewsList} />

          </div>

          {/* KPIs DE OPERACIÓN */}
          {kpiData && sparklines && (
            <section className="section r in">
              <div className="section-head">
                <div className="section-title">KPIs de Operación</div>
                <span className="section-sub">Seguimiento de cumplimiento contra objetivos regionales</span>
              </div>
              <div className="scorecard-grid">
                <Scorecard 
                  title="Volumen de reseñas"
                  value={`${kpiData.volumen.ok} de ${kpiData.volumen.total}`}
                  status={kpiData.volumen.ok === kpiData.volumen.total ? 'optimal' : 'attention'}
                  progress={(kpiData.volumen.ok / kpiData.volumen.total) * 100}
                  badgeLabel={kpiData.volumen.ok === kpiData.volumen.total ? 'Cumple' : 'Atención'}
                  subText={kpiData.volumen.ok === kpiData.volumen.total ? 'Todas cumplen la meta' : `No cumplen: ${sucursalesMeta.filter(s => (currStats[s.id]?.count || 0) < KpiMeta.volumenMeta).map(s => s.abr).join(', ')}`}
                  sparklineData={sparklines.volumen}
                  onClickDetail={() => document.querySelector('.branch-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  detailButtonLabel="Ver detalle sucursales →"
                />
                <Scorecard 
                  title="Calidad de reseña"
                  value={`${(kpiData.calidadTexto.ratio * 100).toFixed(0)}% con texto`}
                  status={kpiData.calidadTexto.ratio >= KpiMeta.calidadTextoMeta ? 'optimal' : 'attention'}
                  progress={Math.min((kpiData.calidadTexto.ratio / KpiMeta.calidadTextoMeta) * 100, 100)}
                  badgeLabel={kpiData.calidadTexto.ratio >= KpiMeta.calidadTextoMeta ? 'Cumple' : 'Atención'}
                  subText={prevKpi ? `${(kpiData.calidadTexto.ratio - prevKpi.calidadTexto.ratio >= 0 ? '+' : '')}${((kpiData.calidadTexto.ratio - prevKpi.calidadTexto.ratio) * 100).toFixed(0)}% vs mes anterior` : `Meta: ${(KpiMeta.calidadTextoMeta * 100).toFixed(0)}% con texto`}
                  sparklineData={sparklines.calidad}
                />
                <Scorecard 
                  title="Rating mínimo regional"
                  value={kpiData.ratingMinimo.belowMin.length === 0 ? '✓ Óptimo' : `${kpiData.ratingMinimo.belowMin.length} críticas`}
                  status={kpiData.ratingMinimo.belowMin.length === 0 ? 'optimal' : 'critical'}
                  progress={((kpiData.volumen.total - kpiData.ratingMinimo.belowMin.length) / kpiData.volumen.total) * 100}
                  badgeLabel={kpiData.ratingMinimo.belowMin.length === 0 ? 'Cumple' : 'Crítico'}
                  subText={kpiData.ratingMinimo.belowMin.length > 0 ? `Bajo la meta: ${kpiData.ratingMinimo.belowMin.map((id: string) => `${sucursalesMeta.find(s => s.id === id)?.abr} (${currStats[id]?.avg.toFixed(2)}★)`).join(', ')}` : `Meta: ninguna < ${KpiMeta.ratingMinimo}`}
                  sparklineData={sparklines.rating}
                />
                <Scorecard 
                  title="Respuestas a Negativas"
                  value={`${kpiData.tasaRespuesta.totalNegativas - kpiData.tasaRespuesta.conRespuesta} sin responder`}
                  status={(kpiData.tasaRespuesta.totalNegativas - kpiData.tasaRespuesta.conRespuesta) === 0 ? 'optimal' : 'critical'}
                  progress={kpiData.tasaRespuesta.totalNegativas === 0 ? 100 : (kpiData.tasaRespuesta.conRespuesta / kpiData.tasaRespuesta.totalNegativas) * 100}
                  badgeLabel={(kpiData.tasaRespuesta.totalNegativas - kpiData.tasaRespuesta.conRespuesta) === 0 ? 'Sin pendientes' : 'Atención'}
                  subText={`De ${kpiData.tasaRespuesta.totalNegativas} negativas totales`}
                  sparklineData={sparklines.respuestas}
                />
              </div>
            </section>
          )}

          {/* GRID DE EVALUACIÓN DE SUCURSALES */}
          <section className="section r in">
            <div className="section-head" style={{ marginBottom: '8px' }}>
              <div className="section-title">
                Evaluación <span className="accent">de sucursales</span>
              </div>
            </div>

            <div className="branch-controls-bar">
              <div className="filter-row">
                <button 
                  className={`chip ${filter === 'todas' ? 'active' : ''}`} 
                  onClick={() => { setFilter('todas'); setSearchQuery(''); }}
                >
                  Todas <span className="chip-count">{branches.length}</span>
                </button>
                <button 
                  className={`chip ${filter === 'alerta' ? 'active' : ''}`} 
                  onClick={() => { setFilter('alerta'); setSearchQuery(''); }}
                >
                  Con alerta <span className="chip-count">{conAlerta.length}</span>
                </button>
                <button 
                  className={`chip ${filter === 'estables' ? 'active' : ''}`} 
                  onClick={() => { setFilter('estables'); setSearchQuery(''); }}
                >
                  Estables <span className="chip-count">{sinAlerta.length}</span>
                </button>
              </div>
              
              <div className="controls-right">
                <div className="search-wrapper">
                  <span className="search-icon-svg">
                    <Icon name="search" />
                  </span>
                  <input 
                    type="text" 
                    className="branch-search-input" 
                    placeholder="Buscar sucursal…" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Selector de ordenación personalizado */}
                <div className={`custom-select ${sortDropdownOpen ? 'open' : ''}`} id="branchSortDropdown">
                  <button 
                    className="custom-select-trigger" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortDropdownOpen(!sortDropdownOpen);
                    }}
                  >
                    <span className="custom-select-label">Orden:</span>
                    <span className="custom-select-value">
                      {sortBy === 'rating-desc' ? 'Mayor Rating' : sortBy === 'rating-asc' ? 'Menor Rating' : sortBy === 'volume-desc' ? 'Mayor Volumen' : 'Predeterminado'}
                    </span>
                    <ChevronDown className="custom-select-arrow" size={10} />
                  </button>
                  <div className="custom-select-options">
                    <div className={`custom-option ${sortBy === 'default' ? 'active' : ''}`} onClick={() => setSortBy('default')}>Predeterminado</div>
                    <div className={`custom-option ${sortBy === 'rating-desc' ? 'active' : ''}`} onClick={() => setSortBy('rating-desc')}>Mayor Rating</div>
                    <div className={`custom-option ${sortBy === 'rating-asc' ? 'active' : ''}`} onClick={() => setSortBy('rating-asc')}>Menor Rating</div>
                    <div className={`custom-option ${sortBy === 'volume-desc' ? 'active' : ''}`} onClick={() => setSortBy('volume-desc')}>Mayor Volumen</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="branch-grid" id="branchGrid">
              {visibleBranches.length > 0 ? (
                visibleBranches.map(s => {
                  const delta = (s.curr.score - s.historico);
                  const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
                  const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
                  const currScoreStr = s.curr.score > 0 ? s.curr.score.toFixed(2) : '—';

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

                  return (
                    <Link key={s.id} className={`branch-card${hoverClass}`} to={`/sucursal/${s.id}`}>
                      <div className="bc-top">
                        <div className="bc-name">{s.abr}</div>
                        <div className="bc-card-stars">
                          {s.curr.score > 0 ? starStr(Math.round(s.curr.score)) : '—'}
                        </div>
                        <span className={`bc-status ${statusClass}`} title={statusTitle}></span>
                      </div>
                      <div className="bc-score-row">
                        <span className="bc-score num">{currScoreStr}</span>
                      </div>
                      <div className="bc-meta">
                        <span>
                          <strong>{s.curr.count}</strong> reseña{s.curr.count !== 1 ? 's' : ''} {capitalizedCurrMonth.substring(0, 3).toLowerCase()}
                        </span>
                        <span className={`bc-delta ${dClass} num`}>
                          {dStr} vs hist
                        </span>
                      </div>
                      {s.hasAlert ? (
                        <div className="bc-mayo warn">
                          <span className="mono">{currMonthShort}</span> 
                          <span>{s.curr.negativeCount} negativa{s.curr.negativeCount !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="bc-mayo">
                          <span className="mono">{currMonthShort}</span> 
                          <span>Sin incidencias</span>
                        </div>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="empty-state">
                  <span className="glyph">—</span>Sin sucursales para este filtro
                </div>
              )}
            </div>
          </section>

          {/* CARRUSEL DE ACTIVIDAD RECIENTE */}
          <section className="section review-feed-section r in">
            <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div className="section-title">
                  Actividad Reciente <span className="accent">de reseñas</span>
                </div>
                <span className="section-sub">Extracto del pulso de la operación en {REGION_NAME_MAP[activeRegion]}</span>
              </div>
              <button className="show-all-btn-link" onClick={() => setShowFullFeedSidebar(true)}>
                Ver todas con texto ({reviewsList.filter(r => r.text && r.text.trim().length > 5).length}) →
              </button>
            </div>
            
            <div 
              className="review-feed-carousel-outer" 
              style={{ position: 'relative', width: '100%', marginTop: '14px' }}
              onMouseEnter={() => { isPausedRef.current = true; }}
              onMouseLeave={() => { isPausedRef.current = false; }}
            >
              <button className="carousel-arrow prev" onClick={() => handleScrollCarousel('prev')} aria-label="Anterior">
                <Icon name="arrow" />
              </button>
              
              <div className="review-feed-carousel-wrapper" style={{ marginTop: 0 }}>
                <div 
                  ref={carouselRef}
                  className="review-feed-grid" 
                  id="reviewFeedGrid"
                  style={{ 
                    transition: carouselTransition ? 'opacity 0.3s ease' : 'none',
                    opacity: carouselTransition ? 1 : 0 
                  }}
                >
                  {activeCarouselReviews.length > 0 ? (
                    activeCarouselReviews.map(r => (
                      <ReviewItem 
                        key={r.globalId} 
                        review={r} 
                        type="carousel" 
                        onClick={() => setSelectedReview(r)} 
                      />
                    ))
                  ) : (
                    <div className="empty-state">Sin reseñas con texto en este periodo</div>
                  )}
                </div>
              </div>
              
              <button className="carousel-arrow next" onClick={() => handleScrollCarousel('next')} aria-label="Siguiente">
                <Icon name="arrow" />
              </button>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="footer">
            <span className="brand" style={{ transform: 'none', fontFamily: 'var(--giaza)', fontSize: '18px' }}>
              étoile
            </span> · La Crêpe Parisienne / Grupo MYT
            <br />
            Dashboard de Reseñas · Región {REGION_NAME_MAP[activeRegion]} · Fuente: Google Reviews
          </footer>
        </>
      )}

      {/* ══ MODALES E INTERACCIONES ══ */}

      {/* 1. Modal ejecutivo del mes concluido */}
      {showConcludedModal && concludedPeriod && (
        <div 
          className="modal-overlay active" 
          id="concludedMonthModal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConcludedModal(false);
            }
          }}
        >
          <div className="modal-box" style={{ maxWidth: '680px', width: '90%' }}>
            <div className="modal-header">
              <div>
                <span className="cmb-badge" style={{ marginBottom: '4px', background: 'var(--verde)', color: '#FAF5EB', border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block' }}>
                  Análisis Operativo {activeRegion}
                </span>
                <h2 className="modal-title" style={{ fontFamily: 'var(--serif)', fontSize: '24px', color: 'var(--text)', margin: 0 }}>
                  Resumen Ejecutivo — {MONTH_NAMES[concludedPeriod.month - 1]} {concludedPeriod.year}
                </h2>
              </div>
              <button className="modal-close" onClick={() => setShowConcludedModal(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ paddingTop: '16px' }}>
              {/* KPIs del mes concluido */}
              <div className="scorecard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div className="scorecard status-optimal" style={{ padding: '14px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                  <div className="sc-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Rating Promedio</div>
                  <div className="sc-value num" style={{ fontSize: '28px', margin: '6px 0', color: 'var(--text)', fontWeight: 700 }}>
                    {DataLoader.getGlobalStats(concludedPeriod.year, concludedPeriod.month).avgRating.toFixed(2)}★
                  </div>
                  <div className="sc-sub" style={{ fontSize: '10px', color: 'var(--verde)', fontWeight: 600 }}>
                    Concluido
                  </div>
                </div>
                <div className="scorecard status-optimal" style={{ padding: '14px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                  <div className="sc-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Volumen Reseñas</div>
                  <div className="sc-value num" style={{ fontSize: '28px', margin: '6px 0', color: 'var(--text)', fontWeight: 700 }}>
                    {DataLoader.getGlobalStats(concludedPeriod.year, concludedPeriod.month).totalReviews}
                  </div>
                  <div className="sc-sub" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Totales cargadas
                  </div>
                </div>
              </div>

              {/* Recomendaciones Operativas */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                  Acciones Recomendadas
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Marketing & Respuesta:</strong> Revisar respuestas en Google Business Profile para las reseñas del mes concluido.
                  </li>
                  <li>
                    <strong>Consistencia Operativa:</strong> Mantener estándares de hospitalidad memorable étoile en todas las unidades.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal detallado de una reseña individual */}
      {selectedReview && (
        <div 
          className="modal-overlay active" 
          id="reviewDetailModal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedReview(null);
            }
          }}
        >
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Detalle de Reseña</h2>
              <button className="modal-close" onClick={() => setSelectedReview(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)' }}>
                      {selectedReview.sucursal}
                    </span>
                    <span style={{ color: 'var(--oro)', fontSize: '14px', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center' }}>
                      <RatingStars rating={selectedReview.stars} />
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {formatDate(selectedReview.publishedAtDate)}
                  </div>
                </div>
                {selectedReview.isLocalGuide && (
                  <span className="local-guide-badge">
                    <Icon name="starFilled" size={14} /> Local Guide
                  </span>
                )}
              </div>
              
              <blockquote className="modal-quote">"{selectedReview.text}"</blockquote>
              
              {selectedReview.responseText && (
                <div className="modal-owner-response">
                  <strong>Respuesta del Propietario:</strong> "{selectedReview.responseText}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal de Alerta Individual por Sucursal */}
      {activeBranchAlertId && (
        <div 
          className="modal-overlay active" 
          id="alertModal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveBranchAlertId(null);
            }
          }}
        >
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">
                Alertas: {sucursalesMeta.find(s => s.id === activeBranchAlertId)?.abr}
              </h2>
              <button className="modal-close" onClick={() => setActiveBranchAlertId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Las siguientes reseñas negativas requieren reporte a Marketing para su resolución inmediata.
              </p>
              
              <div className="copy-report-container">
                <button 
                  id="copyAlertBtn" 
                  className="copy-report-btn" 
                  onClick={() => handleCopyAlert(activeBranchAlertId)}
                  style={{
                    backgroundColor: copiedBranchId === activeBranchAlertId ? 'var(--verde)' : '',
                    color: copiedBranchId === activeBranchAlertId ? '#fff' : ''
                  }}
                >
                  <Icon name="clipboard" size={16} /> 
                  {copiedBranchId === activeBranchAlertId ? '✓ Copiado al portapapeles' : 'Copiar Resumen para Marketing'}
                </button>
              </div>

              {DataLoader.getReviewsForBranch(currentYear, currentMonth, activeBranchAlertId)
                .filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0)
                .map((r, idx) => (
                  <ReviewItem 
                    key={idx} 
                    review={r} 
                    type="list" 
                    onClick={() => setSelectedReview(r)} 
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal de Alertas Consolidadas Regionales */}
      {showAllAlertsModal && (
        <div 
          className="modal-overlay active" 
          id="alertModal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAllAlertsModal(false);
            }
          }}
        >
          <div className="modal-box" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h2 className="modal-title">Todas las Alertas: {capitalizedCurrMonth} {currentYear}</h2>
              <button className="modal-close" onClick={() => setShowAllAlertsModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1, paddingTop: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Consolidado de reseñas críticas en la región durante el mes. Reportar a Marketing.
              </p>
              
              {conAlerta.length > 0 ? (
                <>
                  <div className="copy-report-container">
                    <button 
                      id="copyAllAlertsBtn" 
                      className="copy-report-btn" 
                      onClick={handleCopyAllAlerts}
                      style={{
                        backgroundColor: copiedAllAlerts ? 'var(--verde)' : '',
                        color: copiedAllAlerts ? '#fff' : ''
                      }}
                    >
                      <Icon name="clipboard" size={16} />
                      {copiedAllAlerts ? '✓ Copiado al portapapeles' : 'Copiar Reporte Consolidado'}
                    </button>
                  </div>

                  {conAlerta.map(branchMeta => {
                    const branchReviews = DataLoader.getReviewsForBranch(currentYear, currentMonth, branchMeta.id);
                    const negatives = branchReviews.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);
                    return (
                      <div key={branchMeta.id} className="branch-incident-group" style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="bc-status warn-red" style={{ marginTop: 0, width: '8px', height: '8px' }}></span>
                          {branchMeta.nombre} ({negatives.length})
                        </h3>
                        {negatives.map((r, idx) => (
                          <ReviewItem 
                            key={idx} 
                            review={r} 
                            type="list" 
                            onClick={() => {
                              setSelectedReview(r);
                              setShowAllAlertsModal(false);
                            }} 
                          />
                        ))}
                      </div>
                    );
                  })}
                </>
              ) : (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  No hay reseñas negativas registradas este mes.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Sidebar deslizable para feed completo de opiniones */}
      {showFullFeedSidebar && (
        <div 
          className="sidebar-overlay active" 
          id="feedSidebarOverlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFullFeedSidebar(false);
            }
          }}
        >
          <div className="feed-sidebar">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Feed de Reseñas</h2>
              <button className="sidebar-close" onClick={() => setShowFullFeedSidebar(false)}>×</button>
            </div>
            
            <div className="sidebar-filters">
              {/* Filtro Sentimiento */}
              <div className="filter-group">
                <label>Sentimiento</label>
                <div className={`custom-select ${sidebarSentimentOpen ? 'open' : ''}`} id="sidebarSentimentDropdown">
                  <button 
                    className="custom-select-trigger" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSidebarSentimentOpen(!sidebarSentimentOpen);
                      setSidebarBranchOpen(false);
                    }}
                  >
                    <span className="custom-select-value">
                      {sidebarSentiment === 'positivas' ? 'Positivas (4-5★)' : sidebarSentiment === 'neutras' ? 'Neutras (3★)' : sidebarSentiment === 'negativas' ? 'Negativas (1-2★)' : 'Todas las calificaciones'}
                    </span>
                    <ChevronDown className="custom-select-arrow" size={10} />
                  </button>
                  <div className="custom-select-options">
                    <div className={`custom-option ${sidebarSentiment === 'todas' ? 'active' : ''}`} onClick={() => setSidebarSentiment('todas')}>Todas las calificaciones</div>
                    <div className={`custom-option ${sidebarSentiment === 'positivas' ? 'active' : ''}`} onClick={() => setSidebarSentiment('positivas')}>Positivas (4-5★)</div>
                    <div className={`custom-option ${sidebarSentiment === 'neutras' ? 'active' : ''}`} onClick={() => setSidebarSentiment('neutras')}>Neutras (3★)</div>
                    <div className={`custom-option ${sidebarSentiment === 'negativas' ? 'active' : ''}`} onClick={() => setSidebarSentiment('negativas')}>Negativas (1-2★)</div>
                  </div>
                </div>
              </div>
              
              {/* Filtro Sucursal */}
              <div className="filter-group">
                <label>Sucursal</label>
                <div className={`custom-select ${sidebarBranchOpen ? 'open' : ''}`} id="sidebarBranchDropdown">
                  <button 
                    className="custom-select-trigger" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSidebarBranchOpen(!sidebarBranchOpen);
                      setSidebarSentimentOpen(false);
                    }}
                  >
                    <span className="custom-select-value">
                      {sidebarBranch === 'todas' ? 'Todas las sucursales' : sucursalesMeta.find(s => s.nombre === sidebarBranch)?.abr || sidebarBranch}
                    </span>
                    <ChevronDown className="custom-select-arrow" size={10} />
                  </button>
                  <div className="custom-select-options" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className={`custom-option ${sidebarBranch === 'todas' ? 'active' : ''}`} onClick={() => setSidebarBranch('todas')}>Todas las sucursales</div>
                    {sucursalesMeta.map(s => (
                      <div 
                        key={s.id} 
                        className={`custom-option ${sidebarBranch === s.nombre ? 'active' : ''}`} 
                        onClick={() => setSidebarBranch(s.nombre)}
                      >
                        {s.abr}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sidebar-content" id="sidebarReviewsContainer" style={{ overflowY: 'auto', flexGrow: 1 }}>
              {sidebarFiltered.length > 0 ? (
                sidebarFiltered.map(r => (
                  <ReviewItem 
                    key={r.globalId} 
                    review={r} 
                    type="sidebar" 
                    onClick={() => setSelectedReview(r)} 
                  />
                ))
              ) : (
                <div className="empty-state">No se encontraron reseñas con estos filtros</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
