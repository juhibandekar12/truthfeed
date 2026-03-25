import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import ConfidenceBadge from './ConfidenceBadge';
import { upvote, downvote, bookmark } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/timeAgo';
import { CATEGORY_COLORS } from '../utils/constants';

export default function NewsCard({ article, onUpdate }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [votes, setVotes] = useState({
    upvotes: article.upvotes || 0,
    downvotes: article.downvotes || 0,
  });
  const [isBookmarked, setIsBookmarked] = useState(false);

  const summary = article.content?.length > 200
    ? article.content.substring(0, 200) + '...'
    : article.content;

  const categoryColor = CATEGORY_COLORS[article.category] || 'bg-dark-600 text-dark-300 border-dark-500';

  async function handleUpvote(e) {
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login');
    try {
      const res = await upvote(article.id);
      setVotes({ upvotes: res.data.upvotes, downvotes: res.data.downvotes });
      if (onUpdate) onUpdate();
    } catch (_) { /* vote failed silently */ }
  }

  async function handleDownvote(e) {
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login');
    try {
      const res = await downvote(article.id);
      setVotes({ upvotes: res.data.upvotes, downvotes: res.data.downvotes });
      if (onUpdate) onUpdate();
    } catch (_) { /* vote failed silently */ }
  }

  async function handleBookmark(e) {
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login');
    try {
      const res = await bookmark(article.id);
      setIsBookmarked(res.data.bookmarked);
    } catch (_) { /* bookmark failed silently */ }
  }

  function shareWhatsApp(e) {
    e.stopPropagation();
    const url = `${window.location.origin}/news/${article.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + url)}`, '_blank');
  }

  function shareTwitter(e) {
    e.stopPropagation();
    const url = `${window.location.origin}/news/${article.id}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(url)}`, '_blank');
  }

  return (
    <div
      className="glass-card p-5 cursor-pointer animate-fade-in"
      onClick={() => navigate(`/news/${article.id}`)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`badge border ${categoryColor}`}>
            {article.category}
          </span>
          {article.is_real && (
            <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ✅ AI Verified
            </span>
          )}
        </div>
        <span className="text-xs text-dark-400">{timeAgo(article.created_at)}</span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 hover:text-primary-300 transition-colors">
        {article.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-dark-300 mb-4 line-clamp-3">{summary}</p>

      {/* Author */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
          {article.author_name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        <span className="text-xs text-dark-400">{article.author_name}</span>
      </div>

      {/* Confidence */}
      <div className="mb-4">
        <ConfidenceBadge confidence={article.bert_confidence} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-700/50">
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpvote}
            className="flex items-center gap-1 text-sm text-dark-400 hover:text-emerald-400 transition-colors"
          >
            ▲ <span>{votes.upvotes}</span>
          </button>
          <button
            onClick={handleDownvote}
            className="flex items-center gap-1 text-sm text-dark-400 hover:text-red-400 transition-colors"
          >
            ▼ <span>{votes.downvotes}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmark}
            className={`text-lg transition-all duration-300 ${isBookmarked ? 'text-yellow-400 scale-110' : 'text-dark-500 hover:text-yellow-400'}`}
            title="Bookmark"
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          <button onClick={shareWhatsApp} className="text-sm text-dark-500 hover:text-green-400 transition-colors" title="Share on WhatsApp">
            📱
          </button>
          <button onClick={shareTwitter} className="text-sm text-dark-500 hover:text-blue-400 transition-colors" title="Share on Twitter">
            🐦
          </button>
        </div>
      </div>
    </div>
  );
}
