import React from 'react';
import { starStr } from '../utils';

interface RatingStarsProps {
  rating: number;
  textMode?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ rating, textMode = true }) => {
  if (textMode) {
    return <span style={{ color: 'var(--oro)', letterSpacing: '1px' }}>{starStr(rating)}</span>;
  }

  const rounded = Math.round(rating);
  return (
    <div style={{ display: 'inline-flex', gap: '2px', color: 'var(--oro)' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ fontSize: '15px' }}>{i < rounded ? '★' : '☆'}</span>
      ))}
    </div>
  );
};

export default RatingStars;
