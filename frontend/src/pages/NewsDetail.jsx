import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { getNewsDetail, upvote, downvote, bookmark, getBookmarkStatus } from '../services/api';
import ConfidenceBadge from '../components/ConfidenceBadge';
import CommentSection from '../components/CommentSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/timeAgo';
import { CATEGORY_COLORS } from '../utils/constants';

export default function NewsDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0 });
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [id]);

  async function loadArticle() {
    setLoading(true);
    try {
      const res = await getNewsDetail(id);
      setArticle(res.data);
      setVotes({ upvotes: res.data.upvotes || 0, downvotes: res.data.downvotes || 0 });
      if (isAuthenticated) {
        try {
          const bRes = await getBookmarkStatus(id);
          setIsBookmarked(bRes.data.bookmarked);
        } catch (_) { /* not critical */ }
      }
    } catch (_) { /* article load failed */ }
    finally {
      setLoading(false);
    }
  }

  async function handleUpvote() {
    if (!isAuthenticated) return;
    try {
      const res = await upvote(id);
      setVotes({ upvotes: res.data.upvotes, downvotes: res.data.downvotes });
    } catch (_) { /* vote failed */ }
  }

  async function handleDownvote() {
    if (!isAuthenticated) return;
    try {
      const res = await downvote(id);
      setVotes({ upvotes: res.data.upvotes, downvotes: res.data.downvotes });
    } catch (_) { /* vote failed */ }
  }

  async function handleBookmark() {
    if (!isAuthenticated) return;
    try {
      const res = await bookmark(id);
      setIsBookmarked(res.data.bookmarked);
    } catch (_) { /* bookmark failed */ }
  }

  function shareWhatsApp() {
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent((article?.title || '') + ' ' + url)}`, '_blank');
  }

  function shareTwitter() {
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article?.title || '')}&url=${encodeURIComponent(url)}`, '_blank');
  }

  if (loading) return <LoadingSpinner />;

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4">😕</span>
          <h2 className="text-2xl font-bold text-white">Article Not Found</h2>
        </div>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[article.category] || 'bg-dark-600 text-dark-300 border-dark-500';

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="glass-card p-8 md:p-12 animate-fade-in">
          {/* Header badges */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className={`badge border ${categoryColor}`}>{article.category}</span>
            {article.is_real && (
              <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ✅ AI Verified
              </span>
            )}
            {!article.is_real && (
              <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
                🚨 Flagged as Fake
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Author & Time */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-dark-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {article.author_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{article.author_name}</p>
              <p className="text-dark-400 text-sm">{timeAgo(article.created_at)}</p>
            </div>
          </div>

          {/* Content */}
          <div className="text-dark-200 leading-relaxed text-lg mb-8 whitespace-pre-wrap">
            {article.content}
          </div>

          {/* AI Confidence Section */}
          <div className="glass-card p-6 mb-8 hover:transform-none">
            <h3 className="text-lg font-bold text-white mb-4">🤖 AI Analysis</h3>
            <ConfidenceBadge confidence={article.bert_confidence} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="block text-2xl font-bold text-emerald-400">{article.real_prob}%</span>
                <span className="text-dark-400 text-sm">Real Probability</span>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <span className="block text-2xl font-bold text-red-400">{article.fake_prob}%</span>
                <span className="text-dark-400 text-sm">Fake Probability</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between py-6 border-y border-dark-700/50 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={handleUpvote}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 hover:bg-emerald-500/10 text-dark-300 hover:text-emerald-400 transition-all"
              >
                ▲ <span className="font-semibold">{votes.upvotes}</span>
              </button>
              <button
                onClick={handleDownvote}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 hover:bg-red-500/10 text-dark-300 hover:text-red-400 transition-all"
              >
                ▼ <span className="font-semibold">{votes.downvotes}</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBookmark}
                className={`px-4 py-2 rounded-xl transition-all ${isBookmarked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-800 text-dark-400 hover:text-yellow-400'}`}
              >
                {isBookmarked ? '★ Saved' : '☆ Save'}
              </button>
              <button onClick={shareWhatsApp} className="px-3 py-2 rounded-xl bg-dark-800 text-dark-400 hover:text-green-400 transition-all" title="WhatsApp">
                📱
              </button>
              <button onClick={shareTwitter} className="px-3 py-2 rounded-xl bg-dark-800 text-dark-400 hover:text-blue-400 transition-all" title="Twitter">
                🐦
              </button>
            </div>
          </div>

          {/* Comments */}
          <CommentSection newsId={id} />
        </article>
      </div>
    </div>
  );
}
