import React from 'react';

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showGradient?: boolean;
}

export const SparkLine: React.FC<SparkLineProps> = ({
  data,
  color = '#22C55E',
  height = 36,
  width = 90,
  showGradient = true,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 3;

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height} ${points} ${width - padding},${height}`;
  const gradientId = `spark-grad-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      {showGradient && (
        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
