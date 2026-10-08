import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

const RadarChartBreakdown = ({ breakdown = {} }) => {
  const data = [
    { subject: 'Keyword Match', score: breakdown.keywordMatch || 0, fullMark: 100 },
    { subject: 'Skills Match', score: breakdown.skillsMatch || 0, fullMark: 100 },
    { subject: 'Experience', score: breakdown.experienceRelevance || 0, fullMark: 100 },
    { subject: 'Formatting', score: breakdown.formatting || 0, fullMark: 100 },
    { subject: 'Education', score: breakdown.education || 0, fullMark: 100 }
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="var(--line)" />
          <PolarAngleAxis dataKey="subject" stroke="var(--text)" tick={{ fill: 'var(--text)', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--line)" tick={{ fill: 'var(--muted)', fontSize: 9 }} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.18}
            dot={{ r: 3, fill: 'var(--primary)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartBreakdown;
