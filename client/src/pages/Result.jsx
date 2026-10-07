import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import ScoreGauge from '../components/ScoreGauge';
import RadarChartBreakdown from '../components/RadarChartBreakdown';
import ReportInsights from '../components/ReportInsights';
import {
  ArrowLeft,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Linkedin,
  Lightbulb,
  Printer,
  Share2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Result = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'suggestions' | 'linkedin'
  const [shareExpiry, setShareExpiry] = useState('never');
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/analyses/${id}`);
      setAnalysis(res.data.data);
    } catch {
      showToast('Failed to load analysis record.', 'error');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this analysis report?')) return;
    try {
      await axiosClient.delete(`/analyses/${id}`);
      showToast('Analysis report deleted.', 'info');
      navigate('/history');
    } catch {
      showToast('Failed to delete report.', 'error');
    }
  };

  const createShareLink = async () => {
    try {
      setSharing(true);
      const expiresAt = shareExpiry === 'never'
        ? null
        : new Date(Date.now() + Number(shareExpiry) * 24 * 60 * 60 * 1000).toISOString();
      const response = await axiosClient.post(`/analyses/${id}/share`, { expiresAt });
      const url = `${window.location.origin}/shared-report/${response.data.data.token}`;
      setShareUrl(url);
      showToast('Read-only report link created. Copy it from the field below.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not create a share link.', 'error');
    } finally {
      setSharing(false);
    }
  };

  const revokeShareLink = async () => {
    try {
      await axiosClient.delete(`/analyses/${id}/share`);
      setShareUrl('');
      showToast('Share link revoked.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not revoke the share link.', 'error');
    }
  };

  const handleCopyText = (text, identifier) => {
    navigator.clipboard.writeText(text);
    setCopiedField(identifier);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Loading ATS Analysis Report...</p>
      </div>
    );
  }

  if (!analysis) return null;

  const { result, mode, jobTitle, resumeFileName, createdAt } = analysis;
  const { overallScore, breakdown, matchedKeywords = [], missingKeywords = [], strengths, suggestions, summary, linkedinOptimization } = result;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            to="/app"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">{jobTitle || 'Target Position'}</h1>
              <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {mode} mode
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              File: <span className="text-slate-200">{resumeFileName}</span> • Analyzed on {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="report-share-controls">
            <label className="sr-only" htmlFor="share-expiry">Share link expiry</label>
            <select id="share-expiry" value={shareExpiry} onChange={(event) => setShareExpiry(event.target.value)}>
              <option value="never">No expiry</option><option value="1">1 day</option><option value="7">7 days</option><option value="30">30 days</option>
            </select>
            <button type="button" onClick={createShareLink} disabled={sharing} className="report-share-button">
              <Share2 className="w-4 h-4" />{sharing ? 'Creating...' : 'Share report'}
            </button>
            {shareUrl && <>
              <input aria-label="Read-only share URL" readOnly value={shareUrl} onFocus={(event) => event.target.select()} />
              <button type="button" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  showToast('Share link copied.', 'success');
                } catch {
                  showToast('Clipboard access is unavailable. Select and copy the share URL.', 'error');
                }
              }} className="report-revoke-button">Copy</button>
              <button type="button" onClick={revokeShareLink} className="report-revoke-button">Revoke</button>
            </>}
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDelete}
            className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-800/50 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <ReportInsights
        parseability={analysis.parseability || []}
        resumeText={analysis.resumeText || ''}
        matchedKeywords={matchedKeywords}
        missingKeywords={missingKeywords}
      />

      {/* Main Score Overview Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overall Score Gauge */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <ScoreGauge score={overallScore} size={190} />
          <p className="text-xs text-slate-400 mt-4 max-w-xs leading-relaxed">
            Overall evaluation combining keyword density, skills alignment, formatting readability, and experience context.
          </p>
        </div>

        {/* Center: Executive Summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-bold text-white text-base">ATS Recruiter Summary</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Highlights</h4>
            <ul className="space-y-1.5">
              {strengths && strengths.slice(0, 3).map((st, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Category Radar Chart Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-between">
          <h2 className="font-bold text-white text-base self-start mb-2">Breakdown Radar</h2>
          <RadarChartBreakdown breakdown={breakdown} />
          <div className="w-full grid grid-cols-2 gap-2 text-center text-xs mt-2 pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-400">Keywords:</span>{' '}
              <span className="font-bold text-white">{breakdown.keywordMatch}%</span>
            </div>
            <div>
              <span className="text-slate-400">Skills:</span>{' '}
              <span className="font-bold text-white">{breakdown.skillsMatch}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Keyword Match & Skills
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'suggestions'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Improvement Suggestions</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs">
            {suggestions?.length || 0}
          </span>
        </button>
        {mode === 'linkedin' && linkedinOptimization && (
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'linkedin'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Linkedin className="w-4 h-4 text-sky-400" />
            <span>LinkedIn Optimization</span>
          </button>
        )}
      </div>

      {/* Tab 1: Keywords Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched Keywords */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Matched Keywords ({matchedKeywords?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {matchedKeywords && matchedKeywords.length > 0 ? (
                matchedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
                  >
                    ✓ {kw}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">No specific matched keywords detected.</p>
              )}
            </div>
          </div>

          {/* Missing Keywords */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Missing Keywords ({missingKeywords?.length || 0})
            </h3>
            <div className="space-y-3">
              {missingKeywords && missingKeywords.length > 0 ? (
                missingKeywords.map((item, i) => {
                  const impColor =
                    item.importance === 'high'
                      ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                      : item.importance === 'medium'
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                      : 'bg-sky-950/80 border-sky-500/50 text-sky-300';
                  return (
                    <div key={i} className={`p-3 rounded-xl border ${impColor} flex items-start justify-between gap-3`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{item.keyword}</span>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-black/40">
                            {item.importance} priority
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-slate-300">
                          Where to add: <span className="font-medium italic">{item.whereToAdd}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">No missing keywords! Excellent keyword coverage.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Specific Improvement Suggestions with Before/After Rewrites */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Tailored Improvement Suggestions
            </h3>
            <span className="text-xs text-slate-400">Click any card to view detailed before/after rewrite</span>
          </div>

          {suggestions && suggestions.map((sug, idx) => {
            const isExpanded = expandedSuggestion === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition-all duration-200"
              >
                <div
                  onClick={() => setExpandedSuggestion(isExpanded ? null : idx)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase border border-indigo-500/30">
                      {sug.section}
                    </span>
                    <h4 className="font-semibold text-white text-sm sm:text-base">{sug.issue}</h4>
                  </div>
                  <button className="text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                    <div className="pt-3">
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Recommendation</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{sug.improvement}</p>
                    </div>

                    {sug.exampleRewrite && (
                      <div className="bg-slate-900/90 rounded-xl p-4 border border-indigo-500/30 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            ✨ Suggested Example Rewrite
                          </span>
                          <button
                            onClick={() => handleCopyText(sug.exampleRewrite, `sug-${idx}`)}
                            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {copiedField === `sug-${idx}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Rewrite</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm font-mono text-emerald-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                          "{sug.exampleRewrite}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: LinkedIn Optimization */}
      {activeTab === 'linkedin' && linkedinOptimization && (
        <div className="space-y-6">
          {/* Headlines Options */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <Linkedin className="w-5 h-5 text-sky-400" />
              Optimized LinkedIn Headlines
            </h3>
            <div className="space-y-3">
              {linkedinOptimization.headline.map((hl, i) => (
                <div key={i} className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-200 leading-relaxed">Option {i + 1}: "{hl}"</span>
                  <button
                    onClick={() => handleCopyText(hl, `headline-${i}`)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
                  >
                    {copiedField === `headline-${i}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">LinkedIn "About" Summary Rewrite</h3>
              <button
                onClick={() => handleCopyText(linkedinOptimization.aboutSection, 'about')}
                className="px-3 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedField === 'about' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>Copy Summary</span>
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-sans">
              {linkedinOptimization.aboutSection}
            </p>
          </div>

          {/* Skills to Add */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white text-base mb-3">Recommended LinkedIn Skills</h3>
            <div className="flex flex-wrap gap-2">
              {linkedinOptimization.skillsToAdd.map((sk, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-300 text-xs font-semibold">
                  + {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Result;
