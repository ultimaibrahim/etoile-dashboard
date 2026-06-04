import React, { useState } from 'react';
import Sparkline from './Sparkline';

interface ScorecardProps {
  title: string;
  value: string;
  status: 'optimal' | 'attention' | 'critical';
  progress: number;
  badgeLabel: string;
  subText: React.ReactNode;
  sparklineData: number[];
  onClickDetail?: () => void;
  detailButtonLabel?: string;
}

export const Scorecard: React.FC<ScorecardProps> = ({
  title,
  value,
  status,
  progress,
  badgeLabel,
  subText,
  sparklineData,
  onClickDetail,
  detailButtonLabel
}) => {
  const [active, setActive] = useState(false);

  const statusClass = `status-${status}`;
  const badgeClass = `badge-${status}`;
  const sparkColor = status === 'optimal' ? '#7A9E8A' : status === 'attention' ? '#c97d10' : '#c62828';

  return (
    <div 
      className={`scorecard ${statusClass} ${active ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={active}
      onClick={() => setActive(!active)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActive(!active);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="sc-header-row">
        <span className="sc-label">{title}</span>
        <span className="sc-chevron">▼</span>
      </div>
      
      <div className="sc-value-row">
        <div className="sc-value num">{value}</div>
        <div className="sc-sparkline">
          <Sparkline data={sparklineData} color={sparkColor} />
        </div>
      </div>
      
      <div className="kpi-progress">
        <div 
          className="kpi-progress-bar" 
          style={{ 
            width: `${Math.min(100, Math.max(0, progress))}%`,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
      
      <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
      
      <div className="sc-details-wrapper">
        <div className="sc-details-inner">
          <div className="sc-sub">{subText}</div>
          {onClickDetail && detailButtonLabel && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClickDetail();
              }} 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sage)',
                fontSize: '11px',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
                fontWeight: 700,
                marginTop: '8px'
              }}
            >
              {detailButtonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scorecard;
