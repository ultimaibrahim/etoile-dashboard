import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DataLoader } from '../services/dataLoader';
import { Kpis } from '../services/kpis';
import { MONTH_NAMES, SUCURSALES_META_ALL } from '../lib/data';
import { Review } from '../types';
import Topbar from '../components/Topbar';
import RatingStars from '../components/RatingStars';
import Icon from '../components/Icon';
import { formatDate, initReveal } from '../utils';

interface BranchQuarterStats {
  id: string;
  nombre: string;
  abr: string;
  historico: number;
  qAvg: number;
  totalCount: number;
  totalNeg: number;
  monthVals: Array<{ month: number; avg: number; count: number }>;
  best: Review | null;
  worst: Review | null;
}

export const Quarter: React.FC = () => {
  const { q } = useParams<{ q: string }>();
  const navigate = useNavigate();
  const {
    activeRegion,
    isAuthenticated,
    sucursalesMeta
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2026);
  const [quarterNum, setQuarterNum] = useState(1);
  const [months, setMonths] = useState<number[]>([]);
  const [prevMonths, setPrevMonths] = useState<number[]>([]);
  const [branchQStats, setBranchQStats] = useState<BranchQuarterStats[]>([]);
  const [currQAvg, setCurrQAvg] = useState(0);
  const [currQTotal, setCurrQTotal] = useState(0);
  const [prevQAvg, setPrevQAvg] = useState<number | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>({});

  // Parsear parámetro de trimestre (ej. 2026-Q1)
  const parseQuarterParam = (qStr: string) => {
    const regex = /^(\d{4})-Q([1-4])$/;
    const matches = qStr.match(regex);
    if (!matches) return null;
    return {
      year: parseInt(matches[1]),
      quarter: parseInt(matches[2])
    };
  };

  const getQuarterMonths = (qNum: number): number[] => {
    switch (qNum) {
      case 1: return [1, 2, 3];
      case 2: return [4, 5, 6];
      case 3: return [7, 8, 9];
      case 4: return [10, 11, 12];
      default: return [];
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const qParam = parseQuarterParam(q || '2026-Q1');
    if (!qParam) {
      navigate('/');
      return;
    }

    setYear(qParam.year);
    setQuarterNum(qParam.quarter);

    const qMonths = getQuarterMonths(qParam.quarter);
    setMonths(qMonths);

    const prevQ = qParam.quarter > 1 ? qParam.quarter - 1 : null;
    const pMonths = prevQ ? getQuarterMonths(prevQ) : [];
    setPrevMonths(pMonths);

    const fetchData = async () => {
      setLoading(true);

      // 1. Cargar meses del trimestre actual
      for (const m of qMonths) {
        await DataLoader.loadMonth(qParam.year, m, activeRegion);
      }

      // 2. Cargar meses del trimestre anterior para comparar
      for (const m of pMonths) {
        if (DataLoader.hasMonth(qParam.year, m)) {
          await DataLoader.loadMonth(qParam.year, m, activeRegion);
        }
      }

      // 3. Calcular estadísticas del trimestre por sucursal
      const statsList: BranchQuarterStats[] = sucursalesMeta.map(meta => {
        let totalStars = 0;
        let totalCount = 0;
        let totalNeg = 0;
        const monthVals: Array<{ month: number; avg: number; count: number }> = [];

        for (const m of qMonths) {
          const stats = DataLoader.computeBranchStats(qParam.year, m, meta.id);
          totalStars += stats.avg * stats.count;
          totalCount += stats.count;
          totalNeg += stats.negativeCount;
          monthVals.push({ month: m, avg: stats.avg, count: stats.count });
        }

        const qAvg = totalCount > 0 ? totalStars / totalCount : 0;

        // Consolidar reseñas del trimestre
        let allRevs: Review[] = [];
        for (const m of qMonths) {
          allRevs = allRevs.concat(DataLoader.getReviewsForBranch(qParam.year, m, meta.id));
        }

        const best = allRevs.length ? allRevs.reduce((a, b) => a.stars >= b.stars ? a : b) : null;
        const worst = allRevs.length ? allRevs.reduce((a, b) => a.stars <= b.stars ? a : b) : null;

        return {
          id: meta.id,
          nombre: meta.nombre,
          abr: meta.abr,
          historico: meta.historico,
          qAvg,
          totalCount,
          totalNeg,
          monthVals,
          best,
          worst
        };
      }).sort((a, b) => b.qAvg - a.qAvg);

      setBranchQStats(statsList);

      // Calcular promedio y volumen global del trimestre
      const totalQCount = statsList.reduce((acc, s) => acc + s.totalCount, 0);
      const totalQAvg = totalQCount > 0 
        ? statsList.reduce((acc, s) => acc + (s.qAvg * s.totalCount), 0) / totalQCount 
        : 0;

      setCurrQTotal(totalQCount);
      setCurrQAvg(totalQAvg);

      // Calcular promedio del trimestre anterior
      if (prevQ) {
        let pStars = 0;
        let pCount = 0;
        for (const m of pMonths) {
          const g = DataLoader.getGlobalStats(qParam.year, m);
          pStars += g.avgRating * g.totalReviews;
          pCount += g.totalReviews;
        }
        setPrevQAvg(pCount > 0 ? pStars / pCount : 0);
      } else {
        setPrevQAvg(null);
      }

      setLoading(false);
    };

    fetchData();
  }, [q, activeRegion, isAuthenticated, sucursalesMeta]);

  // Inicializar animaciones de scroll cuando termina de cargar
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        initReveal();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!isAuthenticated) return null;

  const toggleAccordion = (month: number) => {
    setOpenAccordions(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  return (
    <>
      <Topbar showBack={true} branchName={`Trimestre Q${quarterNum} ${year}`} />

      {/* HERO */}
      <section className="hero" style={{ padding: '48px 22px' }}>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-label-row">
              <span className="eyebrow" style={{ color: 'rgba(245,239,230,.55)' }}>Comparativa Trimestral</span>
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(48px,10vw,96px)', color: '#FAF5EB', lineHeight: 1, margin: 0 }}>
              Q{quarterNum} {year}
            </h1>
            
            {!loading && (
              <div style={{ display: 'flex', gap: '18px', marginTop: '18px', flexWrap: 'wrap' }}>
                <div className="hero-stat" style={{ background: 'rgba(245,239,230,.06)', border: '1px solid rgba(245,239,230,.1)', borderRadius: '12px', padding: '14px 16px' }}>
                  <span className="hero-stat-val num">{currQAvg.toFixed(2)}</span>
                  <div className="hero-stat-info">
                    <span className="hero-stat-label">Promedio regional</span>
                  </div>
                </div>
                <div className="hero-stat" style={{ background: 'rgba(245,239,230,.06)', border: '1px solid rgba(245,239,230,.1)', borderRadius: '12px', padding: '14px 16px' }}>
                  <span className="hero-stat-val num">{currQTotal}</span>
                  <div className="hero-stat-info">
                    <span className="hero-stat-label">Reseñas totales</span>
                  </div>
                </div>
                {prevQAvg !== null && (
                  <div className="hero-stat" style={{ background: 'rgba(245,239,230,.06)', border: '1px solid rgba(245,239,230,.1)', borderRadius: '12px', padding: '14px 16px' }}>
                    <span className="hero-stat-val num">{prevQAvg.toFixed(2)}</span>
                    <div className="hero-stat-info">
                      <span className="hero-stat-label">Q{quarterNum - 1} anterior</span>
                      <span className="hero-stat-sub">
                        Δ {(currQAvg - prevQAvg) > 0 ? '+' : ''}{(currQAvg - prevQAvg).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '20px' }}>
          <div className="custom-select-arrow" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--verde)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px' }}>Cargando analíticos trimestrales...</p>
        </div>
      ) : (
        <div className="quarter-view-content" style={{ paddingBottom: '40px' }}>
          {/* RANKING TABLE */}
          <section className="section r in">
            <div className="section-head">
              <div className="section-title">Ranking <span className="accent">Q{quarterNum}</span></div>
            </div>
            <div className="chart-card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sucursal</th>
                    <th className="num">Promedio</th>
                    <th className="num">Reseñas</th>
                    <th className="num">Negativas</th>
                    <th>Estado</th>
                    <th className="num">Δ Hist</th>
                  </tr>
                </thead>
                <tbody>
                  {branchQStats.map((s, i) => {
                    const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                    const delta = s.qAvg - s.historico;
                    const dClass = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
                    const dStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
                    const status = s.qAvg >= 4.8 ? 'optimal' : s.qAvg >= 4.5 ? 'attention' : 'critical';
                    return (
                      <tr key={s.id}>
                        <td><span className={`rank-badge ${rankCls}`}>{i + 1}</span></td>
                        <td><strong>{s.nombre}</strong></td>
                        <td className="num">{s.qAvg > 0 ? s.qAvg.toFixed(2) : '—'}</td>
                        <td className="num">{s.totalCount}</td>
                        <td className="num">{s.totalNeg}</td>
                        <td>
                          <span className={`badge badge-${status}`}>
                            {Kpis.statusLabel(status)}
                          </span>
                        </td>
                        <td className="num"><span className={`sc-delta ${dClass}`}>{s.qAvg > 0 ? dStr : '—'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* EVOLUCION MENSUAL */}
          <section className="section r in">
            <div className="section-head">
              <div className="section-title">Evolución <span className="accent">mensual</span></div>
            </div>
            <div className="chart-card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sucursal</th>
                    {prevMonths.map(m => (
                      <th key={m} className="num" style={{ color: 'var(--text-muted)' }}>{MONTH_NAMES[m - 1]}</th>
                    ))}
                    {months.map(m => (
                      <th key={m} className="num">{MONTH_NAMES[m - 1]}</th>
                    ))}
                    <th className="num">Prom Q{quarterNum}</th>
                  </tr>
                </thead>
                <tbody>
                  {branchQStats.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.abr}</strong></td>
                      
                      {/* Calificaciones trimestre anterior */}
                      {prevMonths.map(pm => {
                        const mStats = DataLoader.computeBranchStats(year, pm, s.id);
                        const val = mStats.count > 0 ? mStats.avg.toFixed(2) : '—';
                        return (
                          <td key={pm} className="num" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                            {val}
                          </td>
                        );
                      })}

                      {/* Calificaciones trimestre actual */}
                      {s.monthVals.map(mv => (
                        <td key={mv.month} className="num">
                          {mv.count > 0 ? mv.avg.toFixed(2) : '—'}
                        </td>
                      ))}

                      {/* Promedio global del Q */}
                      <td className="num" style={{ fontWeight: 700 }}>
                        {s.qAvg > 0 ? s.qAvg.toFixed(2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* DETALLE MENSUAL ACCORDIONS */}
          <section className="section r in">
            <div className="section-head">
              <div className="section-title">Detalle <span className="accent">por mes</span></div>
            </div>
            
            <div className="accordion-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {months.map(m => {
                let mTotalCount = 0;
                let mTotalNeg = 0;
                let mTotalStars = 0;

                const mRanking = SUCURSALES_META_ALL.filter(s => s.region === activeRegion).map(meta => {
                  const stats = DataLoader.computeBranchStats(year, m, meta.id);
                  mTotalCount += stats.count;
                  mTotalNeg += stats.negativeCount;
                  mTotalStars += stats.avg * stats.count;
                  return { ...meta, avg: stats.avg, count: stats.count, neg: stats.negativeCount };
                }).sort((a, b) => b.avg - a.avg);

                const mAvg = mTotalCount > 0 ? mTotalStars / mTotalCount : 0;
                
                const monthData = DataLoader.getMonth(year, m);
                const mReviews = monthData ? monthData.reviews : [];
                
                const mBest = mReviews.length 
                  ? mReviews.reduce((a, b) => a.stars >= b.stars ? a : b) 
                  : null;
                const mWorst = mReviews.length 
                  ? mReviews.reduce((a, b) => a.stars <= b.stars ? a : b) 
                  : null;

                const isExpanded = !!openAccordions[m];

                return (
                  <div key={m} className="accordion-item">
                    <div 
                      className="accordion-header" 
                      onClick={() => toggleAccordion(m)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="accordion-title">{MONTH_NAMES[m - 1]} {year}</span>
                        </div>
                        <div className="accordion-sub">
                          {mTotalCount} reseñas · Promedio {mAvg.toFixed(2)}★ · {mTotalNeg} negativas
                        </div>
                      </div>
                      <span className={`accordion-chevron ${isExpanded ? 'open' : ''}`} style={{ transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </div>

                    {isExpanded && (
                      <div className="accordion-body" style={{ display: 'block', padding: '16px' }}>
                        <div style={{ display: 'grid', gap: '16px' }}>
                          
                          {/* Scorecards */}
                          <div className="scorecard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            <div className="scorecard" style={{ padding: '14px' }}>
                              <div className="sc-label">Promedio Regional</div>
                              <div className={`sc-value num ${mAvg >= 4.6 ? 'gold' : 'down'}`}>{mAvg.toFixed(2)}</div>
                            </div>
                            <div className="scorecard" style={{ padding: '14px' }}>
                              <div className="sc-label">Reseñas Totales</div>
                              <div className="sc-value num">{mTotalCount}</div>
                            </div>
                            <div className="scorecard" style={{ padding: '14px' }}>
                              <div className="sc-label">Reseñas Negativas</div>
                              <div className={`sc-value num ${mTotalNeg > 0 ? 'down' : 'up'}`}>{mTotalNeg}</div>
                            </div>
                          </div>

                          {/* Ranking Miniatures */}
                          <div>
                            <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                              Ranking del mes
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {mRanking.map((s, idx) => {
                                if (s.count === 0) return null;
                                const badgeClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
                                return (
                                  <div 
                                    key={s.id}
                                    style={{ 
                                      background: 'var(--surface-2)', 
                                      border: '1px solid var(--border)', 
                                      padding: '8px 12px', 
                                      borderRadius: '8px', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px', 
                                      fontSize: '13px' 
                                    }}
                                  >
                                    {badgeClass ? (
                                      <span className={`rank-badge ${badgeClass}`} style={{ width: '16px', height: '16px', fontSize: '9px' }}>
                                        {idx + 1}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-dim)', fontWeight: 600, width: '16px', textAlign: 'center' }}>
                                        {idx + 1}
                                      </span>
                                    )}
                                    <span>{s.abr}</span>
                                    <strong className="num">{s.avg.toFixed(2)}</strong>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quotes */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
                            <div>
                              <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                                Mejor reseña de {MONTH_NAMES[m - 1]}
                              </div>
                              {mBest ? (
                                <div className="quote-block">
                                  <div className="quote-meta">★ {mBest.stars} · {mBest.sucursal} · {formatDate(mBest.publishedAtDate)}</div>
                                  "{mBest.text && mBest.text.length > 200 ? `${mBest.text.substring(0, 200)}...` : mBest.text}"
                                </div>
                              ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin reseñas destacadas</p>
                              )}
                            </div>

                            {mWorst && mWorst.stars <= 2 && (
                              <div>
                                <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--rojo-soft)', fontWeight: 700, marginBottom: '8px' }}>
                                  Peor reseña de {MONTH_NAMES[m - 1]}
                                </div>
                                <div className="quote-block warn">
                                  <div className="quote-meta">★ {mWorst.stars} · {mWorst.sucursal} · {formatDate(mWorst.publishedAtDate)}</div>
                                  "{mWorst.text && mWorst.text.length > 200 ? `${mWorst.text.substring(0, 200)}...` : mWorst.text}"
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <span className="brand" style={{ textTransform: 'none', fontFamily: 'var(--giaza)', fontSize: '18px' }}>étoile</span> · Dashboard de Reseñas<br />
        Región {activeRegion}
      </footer>
    </>
  );
};

export default Quarter;
