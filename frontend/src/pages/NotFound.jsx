import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <span className="text-8xl block mb-6">🔍</span>
        <h1 className="font-display text-5xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-dark-300 mb-8">
          Page not found. The page you're looking for doesn't exist.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <Link to="/feed" className="btn-secondary">
            Browse Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
