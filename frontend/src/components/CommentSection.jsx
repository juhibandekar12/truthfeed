import { useState, useEffect } from 'react';
import { addComment, getComments } from '../services/api';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CommentSection({ newsId }) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [newsId]);

  async function fetchComments() {
    try {
      const res = await getComments(newsId);
      setComments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError('');
    try {
      await addComment(newsId, newComment.trim());
      setNewComment('');
      fetchComments();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to post comment';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        💬 Comments
        <span className="text-sm text-dark-400 font-normal">({comments.length})</span>
      </h3>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="input-field resize-none mb-2"
          />
          {error && (
            <p className="text-red-400 text-sm mb-2 flex items-center gap-1">
              ⚠️ {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="glass-card p-4 mb-6 text-center">
          <p className="text-dark-400">
            <a href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Log in
            </a>{' '}
            to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-dark-500 text-sm text-center py-8">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="glass-card p-4 hover:transform-none">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {comment.author_name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-dark-200">{comment.author_name}</span>
                <span className="text-xs text-dark-500">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-sm text-dark-300 pl-9">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
