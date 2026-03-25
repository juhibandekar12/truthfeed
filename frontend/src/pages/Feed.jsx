import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFeed, searchNews, getNewsByCategory } from '../services/api';
import NewsCard from '../components/NewsCard';
import NewsTicker from '../components/NewsTicker';

const CATEGORIES = ['All', 'Politics', 'Health', 'Technology', 'Sports', 'Business', 'Entertainment', 'World', 'Science'];

export default function Feed() {
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [page, activeCategory]);

  async function loadArticles() {
    setLoading(true);
    try {
      let response;
      if (activeCategory !== 'All') {
        response = await getNewsByCategory(activeCategory);
        setArticles(response.data || []);
        setTotalPages(1);
      } else {
        response = await getFeed(page, 10);
        setArticles(response.data?.articles || []);
        setTotalPages(response.data?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setActiveCategory('All');
      loadArticles();
      return;
    }
    // Search across all categories — reset category filter for clarity
    setActiveCategory('All');
    setLoading(true);
    try {
      const res = await searchNews(searchQuery.trim());
      setArticles(res.data || []);
      setTotalPages(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryChange(cat) {
    setActiveCategory(cat);
    setPage(1);
    setSearchQuery('');
  }

  return (
    <div className="min-h-screen">
      {/* Breaking News Ticker */}
      <NewsTicker />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">News Feed</h1>
            <p className="text-dark-400 text-sm mt-1">AI-verified articles from our community</p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field md:w-64"
              placeholder="Search articles..."
            />
            <button type="submit" className="btn-primary py-3 px-4">
              🔍
            </button>
          </form>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white border border-dark-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-dark-700 rounded w-1/3 mb-4" />
                <div className="h-6 bg-dark-700 rounded w-full mb-2" />
                <div className="h-6 bg-dark-700 rounded w-2/3 mb-4" />
                <div className="h-16 bg-dark-700 rounded w-full mb-4" />
                <div className="h-3 bg-dark-700 rounded w-full" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-xl font-bold text-white mb-2">No articles found</h3>
            <p className="text-dark-400">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} onUpdate={loadArticles} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary py-2 px-4 disabled:opacity-30"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                  page === p
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-2 px-4 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
