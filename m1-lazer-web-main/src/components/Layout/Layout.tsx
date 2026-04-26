import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { NotificationProvider } from '../../contexts/NotificationContext';

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: -10,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
  },
};

const Layout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Hide mobile nav routes
  const hideMobileNavRoutes = ['/login', '/register', '/password-reset', '/admin'];
  const shouldShowMobileNav = !hideMobileNavRoutes.includes(location.pathname) && isAuthenticated;

  return (
    <NotificationProvider isAuthenticated={isAuthenticated} user={user}>
      <div
        className="min-h-screen bg-gradient-to-br from-[#0f0f14] via-[#14141a] to-[#1a1a22]"
      >
        <Navbar />
        {/* Main content */}
        <main className="pt-14 md:pt-16 min-h-screen">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="stagger-children w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        {shouldShowMobileNav && <MobileNav />}
        <Toaster
          position="top-right"
          containerStyle={{
            top: '80px',
            right: '16px',
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(20, 20, 26, 0.95)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
            },
            success: {
              iconTheme: {
                primary: '#ff0066',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
      </div>
    </NotificationProvider>
  );
};

export default Layout;
