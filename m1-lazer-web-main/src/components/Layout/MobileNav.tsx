import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiTrendingUp, FiMusic, FiUsers, FiUser } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

interface MobileNavProps {
  className?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ className = '' }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: FiHome },
    { path: '/rankings', label: 'Rankings', icon: FiTrendingUp, authRequired: true },
    { path: '/beatmaps', label: 'Beatmaps', icon: FiMusic, authRequired: true },
    { path: '/teams', label: 'Teams', icon: FiUsers, authRequired: true },
  ];

  const filteredItems = navItems.filter(
    item => !item.authRequired || (item.authRequired && isAuthenticated)
  );

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden ${className}`}
      style={{
        background: 'var(--float-panel-bg)',
        borderTop: '1px solid var(--border-color)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-around h-16 safe-area-bottom">
        {filteredItems.map(item => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <motion.div
                className="relative flex flex-col items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent
                  size={22}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-osu-pink' : 'text-text-muted'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium mt-1 ${
                    isActive ? 'text-osu-pink' : 'text-text-muted'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--osu-pink)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Profile / Menu */}
        {isAuthenticated ? (
          <Link
            to={`/u/${user?.id}`}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            <motion.div
              className="relative flex flex-col items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <FiUser
                size={22}
                className={`transition-colors duration-200 ${
                  location.pathname.startsWith('/u/') ? 'text-osu-pink' : 'text-text-muted'
                }`}
              />
              <span
                className={`text-[10px] font-medium mt-1 ${
                  location.pathname.startsWith('/u/') ? 'text-osu-pink' : 'text-text-muted'
                }`}
              >
                Profile
              </span>
            </motion.div>
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            <motion.div
              className="relative flex flex-col items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <FiUser
                size={22}
                className="text-text-muted transition-colors duration-200"
              />
              <span className="text-[10px] font-medium mt-1 text-text-muted">
                Login
              </span>
            </motion.div>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;