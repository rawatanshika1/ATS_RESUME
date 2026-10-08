import React from 'react';

const ScoreGauge = ({ score = 0, size = 180, strokeWidth = 14 }) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let badgeLabel = 'Excellent Match';

  if (normalizedScore < 60) {
    badgeLabel = 'Needs Optimization';
  } else if (normalizedScore < 80) {
    badgeLabel = 'Good Match';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--line)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--primary)"
            className="transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-medium tracking-tight text-main">{normalizedScore}%</span>
          <span className="text-xs text-muted mt-1">ATS score</span>
        </div>
      </div>
      <div className="score-badge mt-3 inline-flex items-center px-3 py-1 rounded-md text-xs border border-line text-primary">
        {badgeLabel}
      </div>
    </div>
  );
};

export default ScoreGauge;
