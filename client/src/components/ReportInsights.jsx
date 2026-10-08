import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const statusIcons = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle
};

const statusLabels = {
  pass: 'Pass',
  warn: 'Warn',
  fail: 'Fail'
};

const ReportInsights = ({ parseability = [], resumeText = '', matchedKeywords = [], missingKeywords = [] }) => {
  const keywords = [...new Set(matchedKeywords.filter((keyword) => typeof keyword === 'string' && keyword.trim()))]
    .sort((left, right) => right.length - left.length);
  const pattern = keywords.length
    ? new RegExp(`(${keywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
    : null;
  const matches = pattern ? resumeText.split(pattern) : [resumeText];
  const matchedSet = new Set(keywords.map((keyword) => keyword.toLocaleLowerCase()));

  return (
    <>
      <section className="glass-panel report-checklist">
        <div className="report-section-heading">
          <div><h2>ATS parseability checklist</h2><p>Rule-based checks of the extracted resume text.</p></div>
          <span>{parseability.filter((check) => check.status === 'pass').length}/{parseability.length} pass</span>
        </div>
        <div className="parseability-grid">
          {parseability.map((check) => {
            const Icon = statusIcons[check.status] || AlertTriangle;
            return (
              <article className={`parseability-item status-${check.status}`} key={check.id}>
                <Icon size={17} />
                <div><span>{check.label}</span><p>{check.detail}</p></div>
                <span>{statusLabels[check.status] || 'Warn'}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="keyword-view-layout">
        <div className="glass-panel keyword-text-panel">
          <div className="report-section-heading">
            <div><h2>Keyword highlighting</h2><p>Matched job keywords found in the resume text.</p></div>
            <span className="keyword-legend"><i /> Matched</span>
          </div>
          {resumeText
            ? <pre className="keyword-resume-text">{matches.map((part, index) => matchedSet.has(part.toLocaleLowerCase())
              ? <mark key={`${index}-${part}`}>{part}</mark>
              : <React.Fragment key={`${index}-${part}`}>{part}</React.Fragment>)}</pre>
            : <p className="keyword-private-note">Resume text is private and is not included in shared reports.</p>}
        </div>
        <aside className="glass-panel keyword-missing-panel">
          <h2>Missing keywords <span>{missingKeywords.length}</span></h2>
          {missingKeywords.length
            ? <ul>{missingKeywords.map((item, index) => <li key={`${item.keyword}-${index}`}><span>{item.keyword}</span><span className={`keyword-priority priority-${item.importance}`}>{item.importance}</span></li>)}</ul>
            : <p>No missing keywords were identified.</p>}
        </aside>
      </section>
    </>
  );
};

export default ReportInsights;
