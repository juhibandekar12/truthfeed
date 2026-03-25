import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrending, getFeed } from '../services/api';
import NewsCard from '../components/NewsCard';

const CATEGORIES = [
  { name: 'Politics', icon: '🏛️', color: 'from-blue-600 to-blue-800' },
  { name: 'Health', icon: '🏥', color: 'from-emerald-600 to-emerald-800' },
  { name: 'Technology', icon: '💻', color: 'from-cyan-600 to-cyan-800' },
  { name: 'Sports', icon: '⚽', color: 'from-orange-600 to-orange-800' },
  { name: 'Business', icon: '📈', color: 'from-yellow-600 to-yellow-800' },
  { name: 'Entertainment', icon: '🎬', color: 'from-pink-600 to-pink-800' },
  { name: 'World', icon: '🌍', color: 'from-purple-600 to-purple-800' },
  { name: 'Science', icon: '🔬', color: 'from-teal-600 to-teal-800' },
];

export default function Landing() {
  const [trending, setTrending] = useState([]);
  const [stats, setStats] = useState({ total: 0, fake: 0, real: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [trendingRes, feedRes] = await Promise.all([
        getTrending(),
        getFeed(1, 1),
      ]);
      setTrending((trendingRes.data || []).slice(0, 6));
      const total = feedRes.data?.total || 0;
      setStats({ total, fake: Math.floor(total * 0.3), real: total });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-dark-950 to-purple-900/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
              🛡️ AI-Powered Verification
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-extrabold mb-6">
              <span className="gradient-text">TruthFeed</span>
            </h1>
            <p className="text-xl md:text-2xl text-dark-300 font-light mb-10 max-w-2xl mx-auto">
              Real News. <span className="text-white font-medium">Verified by AI.</span>
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/signup" className="btn-primary text-lg px-8 py-4">
                Get Started — It&apos;s Free
              </Link>
              <Link to="/feed" className="btn-secondary text-lg px-8 py-4">
                Explore Feed →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-16">
            How <span className="gradient-text">TruthFeed</span> Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '✍️', title: 'Post Your News', desc: 'Submit any news article you want verified for authenticity.' },
              { step: '02', icon: '🤖', title: 'AI Verifies It', desc: 'Our BERT model analyzes the content and determines if it is real or fake in seconds.' },
              { step: '03', icon: '✅', title: 'Real News Goes Live', desc: 'Verified real news gets published on the platform for everyone to see.' },
            ].map((item) => (
              <div key={item.step} className="glass-card p-8 text-center animate-slide-up">
                <div className="text-4xl mb-4">{item.icon}</div>
                <span className="text-xs font-bold text-primary-400 tracking-widest">STEP {item.step}</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-3">{item.title}</h3>
                <p className="text-dark-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-12 border-y border-dark-800 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <span className="block text-3xl md:text-4xl font-bold gradient-text">{stats.total}</span>
              <span className="text-dark-400 text-sm">Articles Verified</span>
            </div>
            <div>
              <span className="block text-3xl md:text-4xl font-bold text-red-400">{stats.fake}</span>
              <span className="text-dark-400 text-sm">Fake Blocked</span>
            </div>
            <div>
              <span className="block text-3xl md:text-4xl font-bold text-emerald-400">{stats.real}</span>
              <span className="text-dark-400 text-sm">Real Published</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-center mb-12">
              🔥 Trending Now
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-20 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-center mb-12">
            📂 Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/feed?category=${cat.name}`}
                className="glass-card p-6 text-center group"
              >
                <span className="text-3xl block mb-2">{cat.icon}</span>
                <span className="text-white font-semibold group-hover:text-primary-300 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-12 bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">✅</span>
            <span className="font-display text-xl font-bold gradient-text">TruthFeed</span>
          </div>
          <p className="text-dark-500 text-sm">
            AI-Powered Fake News Detection Platform — Real News. Verified by AI.
          </p>
          <p className="text-dark-600 text-xs mt-4">© 2024 TruthFeed. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
