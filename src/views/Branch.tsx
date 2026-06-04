import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DataLoader } from '../services/dataLoader';
import { starStr, formatDate, computeDynamicInsights, initReveal } from '../utils';
import { KpiMeta, MONTH_NAMES, SUCURSALES_META_ALL } from '../lib/data';
import { Review, BranchStats } from '../types';
import Topbar from '../components/Topbar';
import RatingStars from '../components/RatingStars';
import Icon from '../components/Icon';
import { BranchRatingTrendChart, BranchVolumeTrendChart } from '../components/DashboardCharts';
import { ChevronDown } from 'lucide-react';

export const Branch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [stats, setStats] = useState<BranchStats>({ count: 0, avg: 0, negativeCount: 0, guideCount: 0 });
  const [prevStats, setPrevStats] = useState<BranchStats | null>(null);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const meta = SUCURSALES_META_ALL.find(s => s.id === id);

  // Redireccionar si no autenticado o si la sucursal no existe
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!meta) {
      navigate('/');
    }
  }, [isAuthenticated, meta, navigate]);

  // Carga de datos de la sucursal y comparativas
  useEffect(() => {
    if (!meta) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Asegurar que el manifest esté inicializado en DataLoader
      const dbManifest = await DataLoader.init(activeRegion);
      const months = dbManifest[currentYear] || [];
      setAvailableMonths(months);

      // Cargar todos los meses de la región activos en paralelo
      await Promise.all(months.map(m => DataLoader.loadMonth(currentYear, m, activeRegion)));

      // Cargar mes anterior para comparación de deltas
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = currentYear - 1;
      }
      
      const hasPrev = DataLoader.hasMonth(prevYear, prevMonth);
      if (hasPrev) {
        await DataLoader.loadMonth(prevYear, prevMonth, activeRegion);
        const pStats = DataLoader.computeBranchStats(prevYear, prevMonth, meta.id);
        setPrevStats(pStats);
      } else {
        setPrevStats(null);
      }

      // Obtener estadísticas y opiniones del mes actual
      const bReviews = DataLoader.getReviewsForBranch(currentYear, currentMonth, meta.id);
      const bStats = DataLoader.computeBranchStats(currentYear, currentMonth, meta.id);

      setReviewsList(bReviews);
      setStats(bStats);
      setLoading(false);
    };

    fetchData();
  }, [meta, activeRegion, currentYear, currentMonth]);

  // Cierre de dropdowns
  useEffect(() => {
    const closeDropdown = () => setMonthDropdownOpen(false);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  // Inicializar animaciones de scroll cuando termina de cargar
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        initReveal();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!isAuthenticated || !meta) return null;

  const capitalizedMonth = MONTH_NAMES[currentMonth - 1] || '';

  // Calculation of deltas and indicators
  const delta = stats.avg > 0 ? (stats.avg - meta.historico) : 0;
  const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
  const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';

  const kpiVolClass = stats.count >= KpiMeta.volumenMeta ? 'optimal' : 'attention';

  // Calidad de reseña: % de reseñas de 4-5 estrellas que tienen texto descriptivo (ignora negativas)
  const positivas = reviewsList.filter(r => r.stars >= 4);
  const positivasConTexto = positivas.filter(r => r.text && r.text.trim().length > 5).length;
  const hasTextRatio = positivas.length > 0 ? (positivasConTexto / positivas.length) : 0;
  const kpiCalClass = hasTextRatio >= KpiMeta.calidadTextoMeta ? 'optimal' : 'attention';
  const kpiRatClass = stats.avg >= KpiMeta.ratingMinimo || stats.avg === 0 ? 'optimal' : 'critical';

  // Comparaciones con el mes anterior
  const volDiff = prevStats ? (stats.count - prevStats.count) : 0;
  const volDiffStr = volDiff >= 0 ? `+${volDiff}` : `${volDiff}`;

  let prevHasTextRatio = 0;
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = currentYear - 1;
  }
  if (DataLoader.hasMonth(prevYear, prevMonth)) {
    const prevReviews = DataLoader.getReviewsForBranch(prevYear, prevMonth, meta.id);
    const prevPositivas = prevReviews.filter(r => r.stars >= 4);
    const prevPositivasConTexto = prevPositivas.filter(r => r.text && r.text.trim().length > 5).length;
    prevHasTextRatio = prevPositivas.length > 0 ? (prevPositivasConTexto / prevPositivas.length) : 0;
  }
  const calDiff = (hasTextRatio - prevHasTextRatio) * 100;
  const calDiffStr = calDiff >= 0 ? `+${calDiff.toFixed(0)}%` : `${calDiff.toFixed(0)}%`;

  const ratDiff = (prevStats && prevStats.avg > 0) ? (stats.avg - prevStats.avg) : 0;
  const ratDiffStr = ratDiff >= 0 ? `+${ratDiff.toFixed(2)}` : `${ratDiff.toFixed(2)}`;

  // Insights Dinámicos
  const dynamic = computeDynamicInsights(reviewsList);

  // Datos para gráficos de evolución
  const trendLabels: string[] = [];
  const ratingTrendData: (number | null)[] = [];
  const volumeTrendData: number[] = [];
  const sortedMonths = [...availableMonths].sort((a, b) => a - b);
  for (const m of sortedMonths) {
    const mName = MONTH_NAMES[m - 1].substring(0, 3);
    trendLabels.push(`${mName} ${currentYear}`);
    const statsM = DataLoader.computeBranchStats(currentYear, m, meta.id);
    ratingTrendData.push(statsM.count > 0 ? statsM.avg : null);
    volumeTrendData.push(statsM.count);
  }

  // Áreas de Oportunidad
  const negativeReviews = reviewsList.filter(r => r.stars <= 3 && r.text && r.text.trim().length > 0);
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

  const getSeverity = (count: number) => {
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

  // Insights del texto
  const buildInsights = () => {
    const allText = reviewsList.map(r => r.text ? r.text.toLowerCase() : '').join(' ');
    const items: Array<{ m: string; label: string; val: string; cls?: string }> = [];

    const deltaLabel = stats.avg > 0 ? (stats.avg - meta.historico).toFixed(2) : '0.00';
    const trendTxt = Number(deltaLabel) > 0
      ? `+${deltaLabel} sobre histórico (${meta.historico.toFixed(1)})`
      : Number(deltaLabel) < 0
        ? `${deltaLabel} bajo histórico`
        : `Sin cambio vs ${meta.historico.toFixed(1)}`;
    items.push({ m: 'Δ', label: 'Tendencia', val: trendTxt, cls: 'gold' });

    if (/(amable|atentos?|servicio|atenci[oó]n|amabilidad)/.test(allText))
      items.push({ m: '01', label: 'Tema dominante', val: 'Atención y servicio al cliente' });
    if (/(rique?[aá]|delici|bueno|sabor|rico|exquisit)/.test(allText))
      items.push({ m: '02', label: 'Producto', val: 'Sabor y calidad mencionados positivamente' });

    const names = Array.from(new Set(allText.match(/\b(valentina|osvaldo|oswaldo|arely|vale|areli|daniela|ulises|ale|amanda|bryan|brayan|roman|sergio|jacqueline|valeria|gael|alejandra|brandon|dylan|iker|denisse|andy|paulina|victor|cesar|lizbeth)\b/g) || []))
      .map(n => n[0].toUpperCase() + n.slice(1));
    if (names.length) items.push({ m: '03', label: 'Personal destacado', val: names.join(' · ') });

    if (/(r[aá]pido|tiempo|eficiente|rapidez)/.test(allText))
      items.push({ m: '04', label: 'Operación', val: 'Rapidez y eficiencia comentadas' });

    const guides = reviewsList.filter(r => r.isLocalGuide).length;
    if (guides) items.push({ m: 'LG', label: 'Local Guides', val: `${guides} de ${reviewsList.length} opiniones son de Local Guides` });

    if (items.length === 1) {
      items.push({ m: '--', label: 'Sin insights de texto', val: 'Las reseñas del mes no contienen suficientes palabras clave.' });
    }

    return items.slice(0, 5);
  };

  const textReviews = reviewsList.filter(r => r.text && r.text.trim().length > 0);
  const visibleReviews = showAllReviews ? textReviews : textReviews.slice(0, 5);

  return (
    <>
      <Topbar showBack={sucursalesMeta.length > 1} branchName={meta.nombre} />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
          <div className="custom-select-arrow" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--verde)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px' }}>Cargando estadísticas de sucursal...</p>
        </div>
      ) : (
        <div className="branch-view-container">
          {/* BRANCH HERO */}
          <section className="branch-hero">
            <div className="bh-eyebrow">
              <span>{activeRegion}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <h1 className="bh-name" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', margin: 0 }}>
                {meta.nombre}
                <span style={{ fontFamily: 'var(--mono)', color: '#E8A020', fontSize: '20px', letterSpacing: '2px', fontWeight: 'normal', marginTop: '6px' }}>
                  {stats.avg > 0 ? starStr(Math.round(stats.avg)) : '—'}
                </span>
              </h1>
              
              {/* Dropdown del mes */}
              <div 
                className={`custom-select ${monthDropdownOpen ? 'open' : ''}`} 
                id="branchMonthDropdown"
                onClick={(e) => {
                  e.stopPropagation();
                  setMonthDropdownOpen(!monthDropdownOpen);
                }}
              >
                <button className="custom-select-trigger">
                  <span className="custom-select-value">{capitalizedMonth} {currentYear}</span>
                  <ChevronDown className="custom-select-arrow" size={10} />
                </button>
                <div className="custom-select-options">
                  {[...availableMonths].sort((a, b) => b - a).map(m => (
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
          </section>

          {/* SCORECARD */}
          <section className="section r in">
            <div className="section-head">
              <div className="section-title">Scorecard <span className="accent">{capitalizedMonth}</span></div>
              <span className="section-sub">Evaluación de KPIs operativos</span>
            </div>
            
            <div className="scorecard-grid" style={{ marginBottom: '14px' }}>
              <div className={`scorecard status-${kpiVolClass}`}>
                <div className="sc-label">Volumen de reseñas</div>
                <div className="sc-value num">{stats.count}</div>
                <div className="kpi-progress">
                  <div className="kpi-progress-bar" style={{ width: `${Math.min(stats.count / KpiMeta.volumenMeta * 100, 100).toFixed(0)}%` }}></div>
                </div>
                <span className={`badge badge-${kpiVolClass}`}>{kpiVolClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
                <div className="sc-sub" style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span>Meta: ≥{KpiMeta.volumenMeta}</span>
                  <span style={{ color: volDiff > 0 ? 'var(--verde)' : volDiff < 0 ? 'var(--rojo-soft)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {volDiffStr} vs anterior
                  </span>
                </div>
              </div>

              <div className={`scorecard status-${kpiCalClass}`}>
                <div className="sc-label">Calidad de reseña</div>
                <div className="sc-value num">{(hasTextRatio * 100).toFixed(0)}%</div>
                <div className="kpi-progress">
                  <div className="kpi-progress-bar" style={{ width: `${Math.min(hasTextRatio / KpiMeta.calidadTextoMeta * 100, 100).toFixed(0)}%` }}></div>
                </div>
                <span className={`badge badge-${kpiCalClass}`}>{kpiCalClass === 'optimal' ? 'Cumple' : 'Atención'}</span>
                <div className="sc-sub" style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span>Meta: ≥{(KpiMeta.calidadTextoMeta * 100).toFixed(0)}%</span>
                  <span style={{ color: calDiff > 0.5 ? 'var(--verde)' : calDiff < -0.5 ? 'var(--rojo-soft)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {calDiffStr} vs anterior
                  </span>
                </div>
              </div>

              <div className={`scorecard status-${kpiRatClass}`}>
                <div className="sc-label">Rating Mensual</div>
                <div className="sc-value num">{stats.avg > 0 ? stats.avg.toFixed(2) : '—'}</div>
                <div className="kpi-progress">
                  <div className="kpi-progress-bar" style={{ width: `${stats.avg > 0 ? Math.min(stats.avg / KpiMeta.ratingMinimo * 100, 100).toFixed(0) : 0}%` }}></div>
                </div>
                <span className={`badge badge-${kpiRatClass}`}>{kpiRatClass === 'optimal' ? 'Cumple' : 'Crítico'}</span>
                <div className="sc-sub" style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span>Meta: ≥{KpiMeta.ratingMinimo.toFixed(2)}</span>
                  <span style={{ color: ratDiff > 0.01 ? 'var(--verde)' : ratDiff < -0.01 ? 'var(--rojo-soft)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {ratDiffStr} vs anterior
                  </span>
                </div>
              </div>

              <div className={`scorecard status-${dClass === 'up' ? 'optimal' : dClass === 'down' ? 'attention' : 'optimal'}`}>
                <div className="sc-label">Δ vs Histórico ({meta.historico.toFixed(1)})</div>
                <div className={`sc-value num ${dClass}`}>{stats.avg > 0 ? dStr : '—'}</div>
                <div className="kpi-progress">
                  <div className="kpi-progress-bar" style={{ width: '100%' }}></div>
                </div>
                <div className="sc-sub" style={{ marginTop: '6px' }}>{dClass === 'up' ? '↑ Mejora' : dClass === 'down' ? '↓ Caída' : '→ Estable'}</div>
              </div>
            </div>

            {/* Cuadro de Advertencia Dinámica */}
            {dynamic.problemas.length > 0 ? (
              <div className="status-warn-box" style={{ marginBottom: '14px' }}>
                <div className="topic">Alerta: {dynamic.alertTheme}</div>
                <ul className="problem-list">
                  {dynamic.problemas.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="status-ok-box" style={{ marginBottom: '14px' }}>
                <div className="check" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', flexShrink: 0 }}>
                  <Icon name="check" size={16} />
                </div>
                <div className="ok-text">
                  <strong>Estable</strong> · Sin incidencias recurrentes de gravedad en este periodo.
                </div>
              </div>
            )}
          </section>

          {/* INSIGHTS */}
          <section className="section r in">
            <div className="section-head">
              <div className="section-title">Insights <span className="accent">{capitalizedMonth}</span></div>
            </div>
            <div className="insight-grid">
              {buildInsights().map((t, idx) => (
                <div className="insight-card" key={idx}>
                  <span className={`insight-marker ${t.cls || ''}`}>{t.m}</span>
                  <div>
                    <div className="insight-label">{t.label}</div>
                    <div className="insight-val">{t.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* EVOLUCIÓN HISTÓRICA */}
          <section className="section r in">
            <div className="section-head">
              <div className="section-title">Evolución de KPIs <span className="accent">{currentYear}</span></div>
              <span className="section-sub">Tendencia histórica mensual de calificación y volumen</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', boxShadow: 'var(--sombra-card)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                  Rating Promedio Mensual
                </div>
                <div style={{ height: '180px', position: 'relative' }}>
                  <BranchRatingTrendChart labels={trendLabels} data={ratingTrendData as number[]} color={darkMode ? '#7A9E8A' : '#3D5A47'} height={180} />
                </div>
              </div>
              
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', boxShadow: 'var(--sombra-card)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                  Volumen de Reseñas Mensual
                </div>
                <div style={{ height: '180px', position: 'relative' }}>
                  <BranchVolumeTrendChart labels={trendLabels} data={volumeTrendData} color={darkMode ? '#7A9E8A' : '#3D5A47'} height={180} />
                </div>
              </div>
            </div>
          </section>

          {/* ÁREAS DE OPORTUNIDAD */}
          <section className="section r in">
            <div className="section-head">
              <div className="section-title">Áreas de Oportunidad <span className="accent">{capitalizedMonth}</span></div>
              <span className="section-sub">Aspectos críticos a mejorar según quejas de 1 a 3 estrellas</span>
            </div>
            
            <div className="proactive-alerts-grid">
              <div className={`proactive-alert-card ${serviceSev.cls}`}>
                <div className="pac-header">
                  <div className="pac-title-wrap">
                    <span className="pac-icon">
                      <Icon name={serviceCount > 0 ? 'alert' : 'check'} size={18} />
                    </span>
                    <span className="pac-branch">Servicio y Atención</span>
                  </div>
                  <span className="pac-tag">{serviceSev.tag}</span>
                </div>
                <p className="pac-desc" dangerouslySetInnerHTML={{ __html: serviceDesc }}></p>
                <div className="pac-action-box">
                  <strong>Recomendación:</strong> {serviceRec}
                </div>
              </div>

              <div className={`proactive-alert-card ${qualitySev.cls}`}>
                <div className="pac-header">
                  <div className="pac-title-wrap">
                    <span className="pac-icon">
                      <Icon name={qualityCount > 0 ? 'alert' : 'check'} size={18} />
                    </span>
                    <span className="pac-branch">Calidad y Limpieza</span>
                  </div>
                  <span className="pac-tag">{qualitySev.tag}</span>
                </div>
                <p className="pac-desc" dangerouslySetInnerHTML={{ __html: qualityDesc }}></p>
                <div className="pac-action-box">
                  <strong>Recomendación:</strong> {qualityRec}
                </div>
              </div>

              <div className={`proactive-alert-card ${valueSev.cls}`}>
                <div className="pac-header">
                  <div className="pac-title-wrap">
                    <span className="pac-icon">
                      <Icon name={valueCount > 0 ? 'alert' : 'check'} size={18} />
                    </span>
                    <span className="pac-branch">Precio y Porción</span>
                  </div>
                  <span className="pac-tag">{valueSev.tag}</span>
                </div>
                <p className="pac-desc" dangerouslySetInnerHTML={{ __html: valueDesc }}></p>
                <div className="pac-action-box">
                  <strong>Recomendación:</strong> {valueRec}
                </div>
              </div>
            </div>
          </section>

          {/* LISTA DE RESEÑAS */}
          <section className="section r in">
            <div className="section-head">
              <div className="section-title">Reseñas</div>
              <span className="section-sub">
                {textReviews.length} opiniones con texto en {capitalizedMonth} · {reviewsList.length} totales
              </span>
            </div>
            
            <div className="reviews-panel">
              <div className="reviews-list">
                {visibleReviews.length > 0 ? (
                  visibleReviews.map((r) => {
                    const low = r.stars <= 3;
                    return (
                      <div 
                        key={r.globalId} 
                        className={`review-item ${low ? 'negative' : ''}`} 
                        onClick={() => setSelectedReview(r)} 
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="rev-author">
                          Reseñante de Google {r.isLocalGuide && <span className="rev-guide">Local Guide</span>}
                        </div>
                        <span className={`rev-stars ${low ? 'low' : ''}`}>{starStr(r.stars)}</span>
                        <div className="rev-meta">{formatDate(r.publishedAtDate)} · {r.sucursal}</div>
                        <div className="rev-text" dangerouslySetInnerHTML={{ __html: (r.text || '').replace(/\n/g, '<br>') }} />
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <span className="glyph">—</span>Sin reseñas para mostrar en este mes
                  </div>
                )}
              </div>
              
              {textReviews.length > 5 && (
                <button 
                  className="show-all-btn" 
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? '↑ Mostrar menos' : `Mostrar todas las ${textReviews.length} reseñas ↓`}
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <span className="brand" style={{ textTransform: 'none', fontFamily: 'var(--giaza)', fontSize: '18px' }}>étoile</span> · {meta.nombre}<br />
        Dashboard de Reseñas · Región {activeRegion}
      </footer>

      {/* MODAL DETALLE RESEÑA */}
      {selectedReview && (
        <div 
          className="modal-overlay active" 
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
    </>
  );
};

export default Branch;
