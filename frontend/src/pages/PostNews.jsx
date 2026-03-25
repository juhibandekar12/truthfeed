import { useState } from 'react';
import { postNews } from '../services/api';

const CATEGORIES = ['Politics', 'Health', 'Technology', 'Sports', 'Business', 'Entertainment', 'World', 'Science'];

export default function PostNews() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (content.length < 50) {
      setResult({ status: 'error', message: 'Content must be at least 50 characters.' });
      return;
    }
    if (!category) {
      setResult({ status: 'error', message: 'Please select a category.' });
      return;
    }

    setResult(null);
    setLoading(true);
    try {
      const res = await postNews(title, content, category);
      setResult(res.data);
      if (res.data.status === 'approved') {
        setTitle('');
        setContent('');
        setCategory('');
      }
    } catch (err) {
      setResult({ status: 'error', message: err.response?.data?.detail || 'Failed to submit news.' });
    } finally {
      setLoading(false);
    }
  }

  function getResultUI() {
    if (!result) return null;

    const configs = {
      approved: {
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        icon: '✅',
        title: 'REAL NEWS — Published!',
        color: 'text-emerald-400',
      },
      fake: {
        bg: 'bg-red-500/10 border-red-500/30',
        icon: '🚨',
        title: 'FAKE NEWS — Rejected',
        color: 'text-red-400',
      },
      duplicate: {
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        icon: '⚠️',
        title: 'DUPLICATE — Rejected',
        color: 'text-yellow-400',
      },
      rejected: {
        bg: 'bg-orange-500/10 border-orange-500/30',
        icon: '🚫',
        title: 'INAPPROPRIATE — Rejected',
        color: 'text-orange-400',
      },
      error: {
        bg: 'bg-red-500/10 border-red-500/30',
        icon: '❌',
        title: 'Error',
        color: 'text-red-400',
      },
    };

    const cfg = configs[result.status] || configs.error;

    return (
      <div className={`p-6 rounded-2xl border ${cfg.bg} animate-fade-in`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{cfg.icon}</span>
          <h3 className={`text-xl font-bold ${cfg.color}`}>{cfg.title}</h3>
        </div>
        <p className="text-dark-300 mb-2">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-white mb-2">✍️ Post News</h1>
          <p className="text-dark-400">Submit an article and let AI verify its authenticity</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-dark-300 font-medium mb-1 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Enter the news headline..."
                required
                minLength={5}
                maxLength={300}
              />
            </div>

            <div>
              <label className="text-sm text-dark-300 font-medium mb-1 block">
                Content
                <span className="text-dark-500 ml-2">({content.length}/50 min)</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field resize-none"
                placeholder="Write the full news article content (minimum 50 characters)..."
                rows={8}
                required
                minLength={50}
              />
            </div>

            <div>
              <label className="text-sm text-dark-300 font-medium mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI is analyzing your article...
                </span>
              ) : (
                '🔍 Submit & Verify'
              )}
            </button>
          </form>

          {/* Result */}
          <div className="mt-8">{getResultUI()}</div>
        </div>
      </div>
    </div>
  );
}
