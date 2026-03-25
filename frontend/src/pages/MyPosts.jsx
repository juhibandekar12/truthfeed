import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getMyPosts, deleteMyNews } from '../services/api';
import ConfidenceBadge from '../components/ConfidenceBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { timeAgo } from '../utils/timeAgo';

export default function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await getMyPosts();
      setPosts(res.data || []);
    } catch (_) { /* load failed */ }
    finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">📝 My Posts</h1>
          <p className="text-dark-400 text-sm mt-1">All articles you&apos;ve submitted</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <span className="text-5xl block mb-4">✍️</span>
            <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
            <p className="text-dark-400 mb-6">Start contributing by posting your first article!</p>
            <button onClick={() => navigate('/post')} className="btn-primary">
              Post News
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/news/${post.id}`)}
                className="glass-card p-6 cursor-pointer animate-fade-in relative group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-2 mb-2">
                      {post.is_real ? (
                        <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✅ Real
                        </span>
                      ) : (
                        <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
                          🚨 Fake
                        </span>
                      )}
                      <span className="text-xs text-dark-500">{timeAgo(post.created_at)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                    <p className="text-sm text-dark-400 line-clamp-2">{post.content}</p>
                  </div>
                  <div className="flex-shrink-0 w-40 flex flex-col items-end gap-2">
                    <ConfidenceBadge confidence={post.bert_confidence} />
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this post?')) {
                          try {
                            await deleteMyNews(post.id);
                            loadPosts();
                          } catch (_) {
                            alert('Failed to delete post');
                          }
                        }
                      }}
                      className="text-red-400 hover:text-red-300 text-sm mt-3 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
