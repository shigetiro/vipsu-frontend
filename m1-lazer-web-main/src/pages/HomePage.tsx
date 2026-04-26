import React from 'react';
import HeroSection from '../components/Home/HeroSection';
import HomeFooter from '../components/Home/HomeFooter';

const HomePage: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f0f14] via-[#14141a] to-[#1a1a22]">
    {/* Gradient background overlays */}
    <div
      className="fixed inset-0 pointer-events-none -z-10"
      style={{
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(255,0,102,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(139,125,222,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(255,0,102,0.03) 0%, transparent 70%)
        `,
      }}
    />
    <HeroSection />
    <HomeFooter />
  </div>
);

export default HomePage;
