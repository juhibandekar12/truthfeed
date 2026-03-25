import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  }

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "bg-primary-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg shadow-primary-500/20"
      : "text-dark-300 px-4 py-1.5 rounded-full hover:text-white transition-all duration-300 text-sm font-medium";

  const adminNavLinkClass = ({ isActive }) =>
    isActive
      ? "bg-accent-purple text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20"
      : "text-accent-purple px-4 py-1.5 rounded-full hover:text-purple-300 transition-all duration-300 text-sm font-medium";

  return (
    <nav className="glass sticky top-0 z-50 border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 group">
            <span className="text-2xl">✅</span>
            <span className="font-display text-xl font-bold gradient-text group-hover:opacity-80 transition-opacity">
              TruthFeed
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-dark-800/50 p-1 rounded-full border border-dark-700">
            <NavLink to="/feed" className={navLinkClass}>
              Feed
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink to="/post" className={navLinkClass}>
                  ✍️ Post News
                </NavLink>
                <NavLink to="/my-posts" className={navLinkClass}>
                  My Posts
                </NavLink>
                <NavLink to="/bookmarks" className={navLinkClass}>
                  📑 Bookmarks
                </NavLink>
              </>
            )}

            {isAdmin && (
              <NavLink to="/admin" className={adminNavLinkClass}>
                ⚙️ Admin
              </NavLink>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-dark-200 font-medium">{user?.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-dark-400 hover:text-red-400 transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-4">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-dark-200 hover:text-white transition-colors focus:outline-none p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Modal */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full glass border-b border-dark-700 shadow-2xl">
          <div className="px-4 pt-4 pb-6 space-y-3 flex flex-col">
            <Link to="/feed" onClick={() => setIsMobileMenuOpen(false)} className="text-dark-200 hover:text-white transition-colors text-base font-medium py-2">
              Feed
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/post" onClick={() => setIsMobileMenuOpen(false)} className="text-dark-200 hover:text-white transition-colors text-base font-medium py-2">
                  ✍️ Post News
                </Link>
                <Link to="/my-posts" onClick={() => setIsMobileMenuOpen(false)} className="text-dark-200 hover:text-white transition-colors text-base font-medium py-2">
                  My Posts
                </Link>
                <Link to="/bookmarks" onClick={() => setIsMobileMenuOpen(false)} className="text-dark-200 hover:text-white transition-colors text-base font-medium py-2">
                  📑 Bookmarks
                </Link>
              </>
            )}

            {isAdmin && (
              <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-accent-purple hover:text-purple-300 transition-colors text-base font-medium py-2">
                ⚙️ Admin
              </Link>
            )}

            <hr className="border-dark-700/50 my-2" />

            {/* Mobile Auth Section */}
            {isAuthenticated ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base text-white font-semibold">{user?.username}</span>
                    <span className="text-sm text-dark-400">{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary w-full text-center py-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary text-center py-2">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary text-center py-2">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
