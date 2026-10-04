import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, LogIn, UserPlus, LogOut, Ticket, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TicketorLogo } from './TicketorLogo';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 pointer-events-none mb-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between pointer-events-auto bg-[#0E0E14]/90 backdrop-blur-xl border border-[#262633] shadow-2xl rounded-2xl px-5 sm:px-6 py-2.5">
        {/* Left: Sọt phim Logo */}
        <Link to="/" className="flex items-center group">
          <TicketorLogo size="md" />
        </Link>

        {/* Center: Main Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/' && !location.hash.includes('cinemas') && !location.search.includes('cinemas')
                ? 'text-[#FCFC65] font-bold'
                : 'text-[#8E8E9E] hover:text-white'
            }`}
          >
            Movies
          </Link>
          <Link
            to="/#cinemas"
            onClick={() => {
              if (location.pathname === '/' || location.pathname === '/cinemas') {
                const el = document.getElementById('cinemas');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }}
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/cinemas' || location.hash.includes('cinemas') || location.search.includes('cinemas')
                ? 'text-[#FCFC65] font-bold'
                : 'text-[#8E8E9E] hover:text-white'
            }`}
          >
            Cinemas
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies..."
                  className="bg-[#181822] text-xs text-white border border-[#353545] rounded-full pl-3 pr-8 py-1.5 focus:outline-none focus:border-[#FCFC65] w-36 sm:w-48 transition-all"
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <Search size={14} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E8E9E] hover:text-white hover:bg-[#1A1A24] transition-colors"
                title="Search"
              >
                <Search size={16} />
              </button>
            )}
          </div>

          <div className="w-[1px] h-4 bg-[#262633]" />

          {/* User Auth Section */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 py-1 px-2 rounded-full hover:bg-[#181822] transition-colors"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt={user.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-[#353545]"
                />
                <span className="text-xs font-medium text-white hidden sm:inline-block max-w-[100px] truncate">
                  {user.fullName || 'Luna Caldwell'}
                </span>
                <ChevronDown size={14} className="text-[#8E8E9E]" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-[#121218] border border-[#262633] rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-xs">
                    <div className="px-4 py-2 border-b border-[#22222E]">
                      <div className="font-semibold text-white truncate">{user.fullName}</div>
                      <div className="text-[11px] text-[#8E8E9E] truncate">{user.email}</div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-[#1A1A24] transition-colors"
                    >
                      <User size={15} />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/my-bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-[#1A1A24] transition-colors"
                    >
                      <Ticket size={15} className="text-[#FCFC65]" />
                      <span>My Tickets</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors border-t border-[#22222E] mt-1"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 text-xs font-medium text-[#D1D1DE] hover:text-white transition-colors"
              >
                <LogIn size={14} className="text-[#8E8E9E]" />
                <span>login</span>
              </button>

              <button
                onClick={() => openAuthModal('register')}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0B0B0E] bg-[#FCFC65] hover:bg-[#EAEA48] px-3.5 py-1.5 rounded-full transition-all shadow-sm"
              >
                <UserPlus size={14} />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
