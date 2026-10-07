import React from 'react';

const ScoreGauge = ({ score = 0, size = 180, strokeWidth = 14 }) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let colorClass = 'stroke-indigo-500 text-indigo-600';
  let badgeLabel = 'Excellent Match';
  let glowStyle = 'drop-shadow-[0_0_12px_rgba(91,75,219,0.24)]';

  if (normalizedScore < 60) {
    colorClass = 'stroke-indigo-500 text-indigo-600';
    badgeLabel = 'Needs Optimization';
    glowStyle = 'drop-shadow-[0_0_12px_rgba(91,75,219,0.24)]';
  } else if (normalizedScore < 80) {
    colorClass = 'stroke-indigo-500 text-indigo-600';
    badgeLabel = 'Good Match';
    glowStyle = 'drop-shadow-[0_0_12px_rgba(91,75,219,0.24)]';
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
            className="stroke-slate-200"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`${colorClass} ${glowStyle} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-main">{normalizedScore}%</span>
          <span className="text-xs uppercase tracking-wider font-semibold text-muted mt-1">ATS Score</span>
        </div>
      </div>
      <div className={`score-badge mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${colorClass.split(' ')[1]} border-current/30`}>
        {badgeLabel}
      </div>
    </div>
  );
};

export default ScoreGauge;
