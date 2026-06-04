import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import Icon from './Icon';
import RatingStars from './RatingStars';

interface QuoteBlockProps {
  reviews: Review[];
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({ reviews }) => {
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [fade, setFade] = useState(true);

  // Filtrar reseñas 5 estrellas con texto largo
  const goodReviews = reviews.filter(r => r.stars === 5 && r.text && r.text.length > 30);

  useEffect(() => {
    if (goodReviews.length > 0) {
      setHighlightIdx(Math.floor(Math.random() * goodReviews.length));
    }
  }, [reviews]);

  if (goodReviews.length === 0) return null;

  const currentReview = goodReviews[highlightIdx % goodReviews.length];
  const hasMore = goodReviews.length > 1;

  const handleNext = () => {
    setFade(false);
    setTimeout(() => {
      let nextIdx = Math.floor(Math.random() * goodReviews.length);
      if (nextIdx === (highlightIdx % goodReviews.length) && goodReviews.length > 1) {
        nextIdx = (nextIdx + 1) % goodReviews.length;
      }
      setHighlightIdx(nextIdx);
      setFade(true);
    }, 200);
  };

  return (
    <div 
      className="chart-card highlight-box r" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        position: 'relative', 
        minHeight: '220px', 
        overflow: 'hidden',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        opacity: fade ? 1 : 0,
        transform: fade ? 'translateY(0)' : 'translateY(8px)'
      }}
    >
      <div 
        className="watermark-stars" 
        style={{ 
          position: 'absolute', 
          right: '-20px', 
          bottom: '-20px', 
          fontSize: '120px', 
          opacity: 0.08, 
          color: 'var(--oro)', 
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        ★
      </div>
      
      <div className="highlight-header-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', zIndex: 1, position: 'relative' }}>
        <div 
          className="highlight-icon-box" 
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: 'rgba(184,144,47,0.1)', 
            color: 'var(--oro)', 
            display: 'grid', 
            placeItems: 'center', 
            flexShrink: 0 
          }}
        >
          <Icon name="starFilled" />
        </div>
        <div className="highlight-title" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 0 }}>
          Lo más destacado
        </div>
      </div>
      
      <div 
        style={{ 
          fontSize: '15px', 
          lineHeight: '1.5', 
          fontStyle: 'italic', 
          marginBottom: '12px', 
          position: 'relative', 
          zIndex: 1, 
          flexGrow: 1,
          color: 'var(--text)'
        }}
      >
        "{currentReview.text}"
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '1px', background: 'var(--border)' }}></span>
          {currentReview.sucursal}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RatingStars rating={5} />
          {hasMore && (
            <button 
              onClick={handleNext}
              className="copy-report-btn"
              style={{ 
                background: 'transparent', 
                border: '1px solid var(--border)', 
                color: 'var(--text)', 
                fontSize: '11px', 
                fontWeight: 600, 
                padding: '4px 10px', 
                borderRadius: '20px', 
                cursor: 'pointer', 
                letterSpacing: '.03em', 
                transition: 'background .15s, border-color .15s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Siguiente ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteBlock;
