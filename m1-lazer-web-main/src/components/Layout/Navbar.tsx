import React, { memo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiTrendingUp, FiMusic, FiUsers, FiServer, FiBell, FiSun, FiMoon, FiUser, FiSettings, FiLogOut, FiChevronDown, FiServer as FiAdmin } from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import LanguageSelector from '../UI/LanguageSelector';
import Avatar from '../UI/Avatar';
import type { NavItem as NavItemType } from '../../types';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isDesktop;
}

const NavItem = memo<{
  item: NavItemType;
  showDropdown?: boolean;
  setShowDropdown?: (v: boolean) => void;
  hoveredPath?: string | null;
  setHoveredPath?: (v: string | null) => void;
}>(({ item, showDropdown, setShowDropdown, hoveredPath, setHoveredPath }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isActive = location.pathname === item.path || (item.path === '/rankings' && location.pathname.startsWith('/rankings'));
  const Icon = item.icon;

  if (item.requireAuth && !isAuthenticated) return null;

  if (item.hasDropdown && item.children) {
    return (
      <div
        className="relative flex items-center py-1"
        onMouseEnter={() => {
          setShowDropdown?.(true);
          setHoveredPath?.(item.path);
        }}
        onMouseLeave={() => {
          setShowDropdown?.(false);
          setHoveredPath?.(null);
        }}
      >
        <Link
          to={item.path}
          className={`group relative flex items-center gap-2 h-10 px-4 text-sm font-medium transition-all duration-200 rounded-2xl ${
            isActive
              ? 'bg-gradient-to-r from-osu-pink/25 to-osu-pink/15 text-osu-pink shadow-lg shadow-osu-pink/20 ring-2 ring-osu-pink/30'
              : hoveredPath === item.path
                ? 'bg-white/[0.08] text-white hover:translate-x-0.5'
                : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
          }`}
        >
          <span className="relative flex items-center gap-2">
            {Icon && <Icon size={16} />}
            {item.title}
            <FiChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''} ${isActive ? 'text-osu-pink' : ''}`} />
          </span>
        </Link>

        {showDropdown && (
          <div
            className="absolute top-full left-0 rounded-2xl border border-white/10 bg-[#14141a]/95 backdrop-blur-xl shadow-2xl overflow-hidden min-w-[180px] p-2"
            style={{ marginTop: '4px' }}
          >
            {item.children?.map((child) => {
              const isChildActive = location.pathname === child.path;
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`group relative flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all duration-200 rounded-2xl ${
                    isChildActive
                      ? 'bg-gradient-to-r from-osu-pink/25 to-osu-pink/15 text-osu-pink shadow-lg shadow-osu-pink/20'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white hover:translate-x-0.5'
                  }`}
                >
                  <span className="relative">{child.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.path}
      className={`group relative flex items-center gap-2 h-10 px-4 text-sm font-medium transition-all duration-200 rounded-2xl ${
        isActive
          ? 'bg-gradient-to-r from-osu-pink/25 to-osu-pink/15 text-osu-pink shadow-lg shadow-osu-pink/20 ring-1 ring-osu-pink/30'
          : hoveredPath === item.path
            ? 'bg-white/[0.08] text-white'
            : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
      }`}
      onMouseEnter={() => setHoveredPath?.(item.path)}
      onMouseLeave={() => setHoveredPath?.(null)}
    >
      <span className="relative flex items-center gap-2">
        {Icon && <Icon size={16} />}
        {item.title}
      </span>
      {isActive && <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-osu-pink shadow-lg shadow-osu-pink/50" />}
    </Link>
  );
});

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const isDesktop = useIsDesktop();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRankingsMenu, setShowRankingsMenu] = useState(false);
  const [hoveredNavPath, setHoveredNavPath] = useState<string | null>(null);

  const navItems: NavItemType[] = [
    { path: '/', title: 'Home', icon: FiHome },
    { path: '/rankings', title: 'Rankings', icon: FiTrendingUp, hasDropdown: true, children: [
      { path: '/rankings', title: 'Global Rankings' },
      { path: '/rankings/top-plays', title: 'Top Plays' },
    ]},
    { path: '/beatmaps', title: 'Beatmaps', icon: FiMusic },
    { path: '/teams', title: 'Teams', icon: FiUsers },
    { path: '/how-to-join', title: 'Join', icon: FiServer },
    { path: '/admin', title: 'Admin', icon: FiAdmin, requireAuth: true },
  ];

  const visibleNavItems = navItems.filter(item => !item.requireAuth || (item.requireAuth && isAuthenticated));

  return (
    <>
      {isDesktop && isAuthenticated ? (
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 left-0 right-0 z-50 h-16 px-6"
          style={{
            background: 'linear-gradient(180deg, rgba(15,15,20,0.98) 0%, rgba(20,20,26,0.95) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3"
            >
              <Link to="/" className="flex items-center gap-3 group">
                <motion.img
                  src="/image/logos/logo.svg"
                  alt="osu!"
                  className="w-9 h-9 drop-shadow-lg"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                />
                <span className="text-2xl font-black text-osu-pink">osu!</span>
              </Link>
            </motion.div>

            {/* Nav Items */}
            <div className="flex items-center gap-1">
              {visibleNavItems.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  showDropdown={item.path === '/rankings' ? showRankingsMenu : undefined}
                  setShowDropdown={item.path === '/rankings' ? setShowRankingsMenu : undefined}
                  hoveredPath={hoveredNavPath}
                  setHoveredPath={setHoveredNavPath}
                />
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>

              <Link
                to="/messages"
                className="p-2.5 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <FiBell size={18} />
              </Link>

              {/* User Menu */}
              <div
                className="relative"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
                  <Avatar
                    userId={user?.id}
                    username={user?.username || 'User'}
                    avatarUrl={user?.avatar_url}
                    size="sm"
                    editable={false}
                  />
                  <span className="text-sm font-medium text-slate-300 hidden lg:block">{user?.username}</span>
                  <FiChevronDown size={14} className="text-slate-400" />
                </button>

                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl overflow-hidden p-2"
                  >
                    <Link
                      to="/profile"
                      className="group relative flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all duration-200 rounded-2xl text-slate-400 hover:bg-white/[0.05] hover:text-white hover:translate-x-0.5"
                    >
                      <FiUser size={16} />
                      <span className="flex-1">Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="group relative flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all duration-200 rounded-2xl text-slate-400 hover:bg-white/[0.05] hover:text-white hover:translate-x-0.5"
                    >
                      <FiSettings size={16} />
                      <span className="flex-1">Settings</span>
                    </Link>
                    {user?.is_admin && (
                      <Link
                        to="/admin"
                        className="group relative flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all duration-200 rounded-2xl text-slate-400 hover:bg-white/[0.05] hover:text-white hover:translate-x-0.5"
                      >
                        <FiAdmin size={16} />
                        <span className="flex-1">Admin Panel</span>
                      </Link>
                    )}
                    <div className="h-px bg-white/5 my-1" />
                    <button
                      onClick={logout}
                      className="group relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all duration-200 rounded-2xl text-red-400 hover:bg-red-500/10 hover:translate-x-0.5"
                    >
                      <FiLogOut size={16} />
                      <span className="flex-1">Log Out</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.nav>
      ) : isDesktop ? (
        // Desktop - Not Authenticated
        <nav
          className="fixed top-0 left-0 right-0 z-50 h-16 px-6"
          style={{
            background: 'linear-gradient(180deg, rgba(15,15,20,0.98) 0%, rgba(20,20,26,0.95) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/image/logos/logo.svg" alt="osu!" className="w-9 h-9" />
              <span className="text-2xl font-black text-osu-pink">osu!</span>
            </Link>

            <div className="flex items-center gap-1">
              {visibleNavItems.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  showDropdown={item.path === '/rankings' ? showRankingsMenu : undefined}
                  setShowDropdown={item.path === '/rankings' ? setShowRankingsMenu : undefined}
                  hoveredPath={hoveredNavPath}
                  setHoveredPath={setHoveredNavPath}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>

              <LanguageSelector variant="desktop" />

              <Link
                to="/login"
                className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
              >
                Log In
              </Link>

              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-osu-pink text-white text-sm font-semibold hover:bg-osu-pink/90 hover:shadow-lg hover:shadow-osu-pink/30 transition-all"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      ) : (
        // Mobile
        <nav
          className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(180deg, rgba(15,15,20,0.98) 0%, rgba(20,20,26,0.95) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Link to="/" className="flex items-center gap-2">
            <img src="/image/logos/logo.svg" alt="osu!" className="w-8 h-8" />
            <span className="text-xl font-black text-osu-pink">osu!</span>
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to="/messages"
                className="p-2 rounded-lg text-slate-400 hover:text-white"
              >
                <FiBell size={20} />
              </Link>
            ) : (
              <Link to="/login" className="text-slate-300 text-sm font-medium hover:text-white px-3 py-1.5">
                Log In
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
