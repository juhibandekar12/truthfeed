import { useState, useEffect } from 'react';
import { getDashboard, getAnalytics, getAllNews, getRejected, overrideNews, deleteNews } from '../services/api';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer, Legend } from 'recharts';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [articles, setArticles] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [dashRes, analyticsRes, allRes, rejRes] = await Promise.all([
        getDashboard(),
        getAnalytics(),
        getAllNews(),
        getRejected(),
      ]);
      setStats(dashRes.data);
      setAnalytics(analyticsRes.data);
      setArticles(allRes.data || []);
      setRejected(rejRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleOverride(id) {
    try {
      await overrideNews(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteNews(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fakeVsRealData = analytics?.fake_vs_real
    ? [
        { name: 'Real', value: analytics.fake_vs_real.real },
        { name: 'Fake', value: analytics.fake_vs_real.fake },
      ]
    : [];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">⚙️ Admin Dashboard</h1>
          <p className="text-dark-400 text-sm mt-1">Platform management and analytics</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
            {[
              { label: 'Total Articles', value: stats.total_articles, icon: '📰', color: 'text-primary-400' },
              { label: 'Real %', value: `${stats.real_percentage}%`, icon: '✅', color: 'text-emerald-400' },
              { label: 'Fake %', value: `${stats.fake_percentage}%`, icon: '🚨', color: 'text-red-400' },
              { label: 'Total Users', value: stats.total_users, icon: '👥', color: 'text-blue-400' },
              { label: 'Auto Collected', value: stats.auto_collected_count, icon: '🤖', color: 'text-purple-400' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-5 text-center hover:transform-none">
                <span className="text-2xl block mb-2">{stat.icon}</span>
                <span className={`block text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                <span className="text-dark-400 text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['overview', 'all-articles', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {tab === 'overview' ? '📊 Analytics' : tab === 'all-articles' ? '📰 All Articles' : '🚨 Rejected'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && analytics && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">📂 By Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.category_distribution || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {(analytics.category_distribution || []).map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Submissions Line Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">📈 Daily Submissions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.daily_submissions || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Fake vs Real Bar Chart */}
            <div className="glass-card p-6 md:col-span-2">
              <h3 className="text-lg font-bold text-white mb-4">📊 Fake vs Real</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fakeVsRealData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]}>
                    {fakeVsRealData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.name === 'Real' ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'all-articles' && (
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left p-4 text-sm text-dark-400 font-medium">Title</th>
                    <th className="text-left p-4 text-sm text-dark-400 font-medium">Author</th>
                    <th className="text-left p-4 text-sm text-dark-400 font-medium">Category</th>
                    <th className="text-left p-4 text-sm text-dark-400 font-medium">Status</th>
                    <th className="text-left p-4 text-sm text-dark-400 font-medium">Confidence</th>
                    <th className="text-left p-4 text-sm text-dark-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                      <td className="p-4 text-sm text-white max-w-[200px] truncate">{article.title}</td>
                      <td className="p-4 text-sm text-dark-300">{article.author_name}</td>
                      <td className="p-4 text-sm text-dark-300">{article.category}</td>
                      <td className="p-4">
                        {article.is_real ? (
                          <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Real</span>
                        ) : (
                          <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Fake</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-dark-300">{article.bert_confidence?.toFixed(1)}%</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {!article.is_real && (
                            <button
                              onClick={() => handleOverride(article.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
                            >
                              Override
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rejected' && (
          <div className="space-y-4">
            {rejected.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <span className="text-5xl block mb-4">🎉</span>
                <h3 className="text-xl font-bold text-white">No rejected articles</h3>
              </div>
            ) : (
              rejected.map((article) => (
                <div key={article.id} className="glass-card p-5 animate-fade-in">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">🚨 Fake</span>
                        <span className="text-xs text-dark-500">{article.bert_confidence?.toFixed(1)}% confidence</span>
                      </div>
                      <h3 className="text-white font-semibold truncate">{article.title}</h3>
                      <p className="text-sm text-dark-400 mt-1">by {article.author_name}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleOverride(article.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all"
                      >
                        Override
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
