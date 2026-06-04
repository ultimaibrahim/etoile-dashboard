import React from 'react';
import { Review } from '../types';
import RatingStars from './RatingStars';
import { formatDate } from '../utils';

interface ReviewItemProps {
  review: Review;
  type?: 'carousel' | 'sidebar' | 'list';
  onClick?: () => void;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({ review, type = 'list', onClick }) => {
  const isNeg = review.stars <= 2;
  const isNeutral = review.stars === 3;
  
  const timeStr = review.publishedAtDate 
    ? new Date(review.publishedAtDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) 
    : '';

  if (type === 'carousel') {
    const cardClass = review.stars <= 3 ? 'review-card neg' : 'review-card';
    return (
      <div className={cardClass} onClick={onClick} style={{ cursor: 'pointer' }}>
        <div className="rc-head">
          <span className="rc-branch">{review.sucursal}</span>
          <span className="rc-date">{timeStr}</span>
        </div>
        <div className="rc-stars">
          <RatingStars rating={review.stars} />
        </div>
        <p className="rc-text">"{review.text}"</p>
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div 
        className={`sidebar-review-card ${isNeg ? 'neg' : ''} ${isNeutral ? 'neutral' : ''}`} 
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="src-head">
          <span className="src-branch">{review.sucursal}</span>
          <span className="src-date">{timeStr}</span>
        </div>
        <div className="src-stars">
          <RatingStars rating={review.stars} />
        </div>
        <p className="src-text">"{review.text}"</p>
        {review.responseText && (
          <div className="src-response">
            <strong>Respuesta:</strong> "{review.responseText}"
          </div>
        )}
      </div>
    );
  }

  // Default List/Alert item type
  return (
    <div 
      className="review-item" 
      style={{ 
        borderLeft: isNeg ? '2px solid var(--rojo-soft)' : isNeutral ? '2px solid var(--amber)' : '2px solid var(--verde)', 
        paddingLeft: '12px', 
        marginBottom: '12px',
        backgroundColor: 'var(--surface-2)',
        padding: '12px',
        borderRadius: '8px'
      }}
      onClick={onClick}
    >
      <div className="ri-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div className="ri-score" style={{ color: isNeg ? 'var(--rojo-soft)' : isNeutral ? 'var(--amber)' : 'var(--verde)' }}>
          <RatingStars rating={review.stars} />
        </div>
        <div className="ri-date" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {formatDate(review.publishedAtDate)}
        </div>
      </div>
      <div className="ri-text" style={{ fontSize: '13px', lineHeight: '1.4', fontStyle: 'italic', color: 'var(--text)' }}>
        "{review.text}"
      </div>
      {review.responseText && (
        <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
          <strong>Respuesta:</strong> "{review.responseText}"
        </div>
      )}
    </div>
  );
};

export default ReviewItem;
