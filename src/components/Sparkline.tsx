import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 110,
  height = 32,
  color = '#7A9E8A'
}) => {
  if (!Array.isArray(data) || data.length < 2) {
    return <svg width={width} height={height} className="sparkline" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const padding = 2;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = range === 0 
      ? height / 2 
      : height - padding - ((val - min) / range) * (height - 2 * padding);
    return { x, y };
  });

  const pathD = `M ${points[0].x} ${points[0].y}` + 
    points.slice(1).map(p => ` L ${p.x} ${p.y}`).join('');

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const gradId = `spark-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      className="sparkline" 
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color} />
    </svg>
  );
};

export default Sparkline;
