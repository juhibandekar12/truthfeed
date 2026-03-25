import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getBookmarks, bookmark as toggleBookmark } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { timeAgo } from '../utils/timeAgo';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    try {
      const res = await getBookmarks();
      setBookmarks(res.data || []);
    } catch (_) { /* load failed */ }
    finally {
      setLoading(false);
    }
  }

  async function handleRemove(e, articleId) {
    e.stopPropagation();
    try {
      await toggleBookmark(articleId);
      setBookmarks(bookmarks.filter((b) => b.id !== articleId));
    } catch (_) { /* remove failed */ }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">📑 Bookmarks</h1>
          <p className="text-dark-400 text-sm mt-1">Your saved articles</p>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <span className="text-5xl block mb-4">📑</span>
            <h3 className="text-xl font-bold text-white mb-2">No bookmarks yet</h3>
            <p className="text-dark-400 mb-6">Save articles from the feed to read them later</p>
            <button onClick={() => navigate('/feed')} className="btn-primary">
              Browse Feed
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((article) => (
              <div
                key={article.id}
                onClick={() => navigate(`/news/${article.id}`)}
                className="glass-card p-6 cursor-pointer animate-fade-in flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs">
                      {article.category}
                    </span>
                    <span className="text-xs text-dark-500">{timeAgo(article.created_at)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white truncate">{article.title}</h3>
                  <p className="text-sm text-dark-400 mt-1">by {article.author_name}</p>
                </div>
                <button
                  onClick={(e) => handleRemove(e, article.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
