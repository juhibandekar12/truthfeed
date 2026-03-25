import { useState, useEffect } from 'react';
import { getBreaking } from '../services/api';

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    fetchBreaking();
    const interval = setInterval(fetchBreaking, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  async function fetchBreaking() {
    try {
      const response = await getBreaking();
      setHeadlines(response.data || []);
    } catch (err) {
      console.error('Failed to fetch breaking news:', err);
    }
  }

  if (headlines.length === 0) return null;

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-red-600/20 via-red-500/10 to-red-600/20 border-y border-red-500/20">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-red-600 px-4 py-2 z-10">
          <span className="text-white text-sm font-bold tracking-wider">🔴 BREAKING</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex animate-ticker whitespace-nowrap py-2">
            {headlines.concat(headlines).map((article, idx) => (
              <span
                key={idx}
                className="inline-block mx-8 text-sm text-dark-200 hover:text-white cursor-pointer transition-colors"
              >
                {article.title}
                <span className="text-dark-500 mx-2">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
