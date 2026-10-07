import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  History as HistoryIcon,
  Trash2,
  Eye,
  Search,
  PlusCircle,
  FileText,
  TrendingUp,
  Award
} from 'lucide-react';

const History = () => {
  const [analyses, setAnalyses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const { showToast } = useToast();

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedIds([]);
      const res = await axiosClient.get(`/analyses?page=${page}&limit=10`);
      setAnalyses(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      showToast('Failed to load analysis history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis record?')) return;
    try {
      await axiosClient.delete(`/analyses/${id}`);
      showToast('Analysis record deleted.', 'info');
      fetchHistory();
    } catch {
      showToast('Failed to delete analysis record.', 'error');
    }
  };

  // Filtered list by search query
  const filteredAnalyses = analyses.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.jobTitle.toLowerCase().includes(q) ||
      item.resumeFileName.toLowerCase().includes(q) ||
      item.mode.toLowerCase().includes(q)
    );
  });

  // Calculate stats & trend chart data
  const chartData = [...analyses]
    .reverse()
    .map((item) => ({
      date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: item.overallScore,
      jobTitle: item.jobTitle
    }));
  const selectedAnalyses = analyses.filter((item) => selectedIds.includes(item.id)).sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
  const comparisonChartData = selectedAnalyses.length === 2
    ? selectedAnalyses.map((item) => ({
      date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: item.overallScore,
      jobTitle: item.jobTitle
    }))
    : chartData;
  const scoreDelta = selectedAnalyses.length === 2
    ? selectedAnalyses[1].overallScore - selectedAnalyses[0].overallScore
    : null;

  const avgScore = total > 0 ? Math.round(analyses.reduce((acc, curr) => acc + curr.overallScore, 0) / (analyses.length || 1)) : 0;
  const maxScore = analyses.length > 0 ? Math.max(...analyses.map((a) => a.overallScore)) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-indigo-400" />
            Analysis History
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review your past ATS resume checks and track score progress</p>
        </div>
        <Link
          to="/analyze"
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Analysis</span>
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Analyses</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{total}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Average ATS Score</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{avgScore}%</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Best Score Achieved</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{maxScore}%</p>
          </div>
        </div>
      </div>

      {/* Score-over-Time Trend Chart */}
      {chartData.length > 1 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">{selectedAnalyses.length === 2 ? 'Selected Analysis Score Comparison' : 'Score Progress Over Time'}</h2>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#818cf8"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#6366f1' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <section className="glass-panel analysis-compare-panel">
        <div className="analysis-compare-heading">
          <div><h2>Compare analyses</h2><p>Select two reports below to compare their scores and change over time.</p></div>
          <span>{selectedIds.length}/2 selected</span>
        </div>
        {selectedAnalyses.length === 2
          ? <div className="analysis-compare-results">
            {selectedAnalyses.map((item) => <article key={item.id}><small>{new Date(item.createdAt).toLocaleDateString()}</small><strong>{item.jobTitle}</strong><span>{item.overallScore}%</span></article>)}
            <div className={`analysis-score-delta ${scoreDelta >= 0 ? 'delta-up' : 'delta-down'}`}><span>Score change</span><strong>{scoreDelta > 0 ? '+' : ''}{scoreDelta}%</strong></div>
          </div>
          : <p className="analysis-compare-hint">Choose exactly two analyses in the list below.</p>}
      </section>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by job title, resume filename, or mode..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
        />
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-xs">Loading history...</p>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Analysis Records Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            You haven't run any resume checks yet. Upload a resume to get your first ATS score!
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Start First Analysis
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4">Compare</th>
                  <th className="py-4 px-6">Job Title</th>
                  <th className="py-4 px-6">Mode</th>
                  <th className="py-4 px-6">Resume File</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAnalyses.map((item) => {
                  let badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
                  if (item.overallScore < 60) badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-500/40';
                  else if (item.overallScore < 80) badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-500/40';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => window.location.href = `/result/${item.id}`}
                      className="hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-4" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.jobTitle} for comparison`}
                          checked={selectedIds.includes(item.id)}
                          disabled={!selectedIds.includes(item.id) && selectedIds.length >= 2}
                          onChange={() => setSelectedIds((current) => current.includes(item.id)
                            ? current.filter((selectedId) => selectedId !== item.id)
                            : current.length < 2 ? [...current, item.id] : current)}
                        />
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">{item.jobTitle}</td>
                      <td className="py-4 px-6">
                        <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {item.mode}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs truncate max-w-[180px]">{item.resumeFileName}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold ${badgeColor}`}>
                          {item.overallScore}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/result/${item.id}`}
                          className="inline-flex items-center gap-1 p-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-2 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 rounded-lg text-xs font-semibold transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
