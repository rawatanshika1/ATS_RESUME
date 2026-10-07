import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import ReportInsights from '../components/ReportInsights';
import ScoreGauge from '../components/ScoreGauge';
import RadarChartBreakdown from '../components/RadarChartBreakdown';

const SharedReport = () => {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    axiosClient.get(`/analyses/shared/${token}`)
      .then((response) => {
        if (!cancelled) setReport(response.data.data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.response?.data?.message || 'Could not load this shared report.');
      });
    return () => { cancelled = true; };
  }, [token]);

  if (error) {
    return <main className="shared-report-page"><section className="glass-panel shared-report-error"><h1>Report unavailable</h1><p>{error}</p></section></main>;
  }
  if (!report) {
    return <main className="shared-report-page"><div className="app-loading" role="status" aria-label="Loading shared report"><span /></div></main>;
  }

  const { result } = report;
  return (
    <main className="shared-report-page">
      <header className="shared-report-header">
        <div><span className="section-kicker">READ-ONLY SHARED REPORT</span><h1>{report.jobTitle}</h1><p>{report.mode} analysis · {new Date(report.createdAt).toLocaleDateString()}</p></div>
        <span className="shared-report-badge">Shared ATS report</span>
      </header>
      <p className="shared-report-privacy">This share link contains analysis findings only. Resume text, contact details, and the job description are not shared.</p>
      <section className="shared-report-score">
        <div className="glass-panel shared-score-gauge"><ScoreGauge score={result.overallScore} size={175} /><strong>Overall ATS score</strong></div>
        <div className="glass-panel shared-score-summary"><h2>Recruiter summary</h2><p>{result.summary}</p><h3>Key strengths</h3><ul>{(result.strengths || []).map((strength, index) => <li key={`${strength}-${index}`}>{strength}</li>)}</ul></div>
        <div className="glass-panel shared-score-radar"><h2>Score breakdown</h2><RadarChartBreakdown breakdown={result.breakdown || {}} /></div>
      </section>
      <ReportInsights
        parseability={report.parseability || []}
        matchedKeywords={result.matchedKeywords || []}
        missingKeywords={result.missingKeywords || []}
      />
    </main>
  );
};

export default SharedReport;
