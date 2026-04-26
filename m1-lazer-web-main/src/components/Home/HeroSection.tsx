import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import InfoCard from '../InfoCard';
import { features } from '../../data/features';
import {
  FaDesktop,
  FaRocket,
  FaHeart,
  FaCog,
  FaBug,
  FaCodeBranch,
  FaPaperPlane,
  FaChartBar,
  FaChevronDown,
  FaDiscord,
  FaGithub,
} from 'react-icons/fa';

const HeroSection: React.FC = () => {
  const { t, i18n } = useTranslation();

  // English subtitle typography optimization
  const isEN = i18n?.language?.toLowerCase().startsWith('en') ?? false;
  const subtitleClasses = isEN
    ? 'text-left text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold text-gray-700 leading-snug md:leading-snug tracking-tight max-w-4xl md:max-w-[42ch] xl:max-w-[56ch] break-words mt-3 md:mt-0'
    : 'text-left md:text-right text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold text-gray-700 leading-tight max-w-4xl md:max-w-[40ch] mt-3 md:mt-0';

  return (
    <div className="relative">
      {/* Parallax background decorations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] animate-gradient-move" />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-profile-color/20 to-primary/10 rounded-full blur-2xl"
          animate={{ 
            y: [0, -10, 0],
            scale: [1, 1.05, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-gradient-to-br from-teal-300/20 to-primary/10 dark:from-teal-900/30 rounded-full blur-3xl"
          animate={{ 
            y: [0, 10, 0],
            scale: [1, 1.03, 1]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
        <motion.div 
          className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-br from-purple-400/15 to-secondary/20 dark:from-purple-900/25 rounded-full blur-xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-gradient-to-br from-secondary/15 to-teal-400/10 dark:from-secondary/20 rounded-full blur-2xl"
          animate={{ 
            y: [0, -5, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Hero section with CSS animations */}
      <section className="relative min-h-screen flex items-center justify-center z-10 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="w-full space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10">
            {/* Top row: brand group (logo + title) and subtitle side by side */}
            <motion.div 
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8 lg:gap-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.15,
                    delayChildren: 0.2
                  }
                }
              }}
            >
              <motion.div 
                className="flex items-center justify-start group"
                variants={{
                  hidden: { opacity: 0, x: -40, scale: 0.9 },
                  visible: { 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                  }
                }}
              >
                <motion.div 
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 flex items-center justify-center mr-4 sm:mr-5 md:mr-6 lg:mr-8 p-2 sm:p-3 rounded-2xl glass-effect group-hover:scale-110 transition-all duration-300"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <img src="/image/logos/logo.svg" alt={t('common.brandAlt')} className="w-full h-full object-contain drop-shadow-2xl" />
                </motion.div>
                <motion.h1 
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient-move"
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 }
                  }}
                >
                  {t('common.brandName')}
                </motion.h1>
              </motion.div>

              <motion.h2 
                lang={isEN ? 'en' : undefined} 
                className={subtitleClasses}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                {t('hero.tagline')}
              </motion.h2>
            </motion.div>

            <motion.p 
              className="text-left mx-auto text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl md:max-w-4xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <span dangerouslySetInnerHTML={{ __html: t('hero.description').replace(/<bold>(.*?)<\/bold>/g, '<span class="font-bold text-profile-color">$1</span>') }} />
            </motion.p>
          </div>
        </div>

        {/* Community buttons */}
        <motion.div 
          className="absolute bottom-64 left-1/2 -translate-x-1/2 w-full px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 w-full max-w-sm sm:max-w-2xl mx-auto">
            {/*
            <a
              href="https://qm.qq.com/q/Uw8tOkgJSS"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full flex flex-col sm:flex-row items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <div className="px-2 py-1.5 sm:px-3 sm:py-2 flex flex-col sm:flex-row items-center justify-center whitespace-nowrap w-full sm:w-auto">
                <FaQq className="mb-1 sm:mb-0 sm:mr-2 text-base sm:text-lg w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm">{t('hero.community.qq')}</span>
              </div>
              <div className="hidden sm:flex sm:items-center sm:justify-center px-2 sm:px-3 py-1.5 sm:py-2 bg-sky-600 group-hover:bg-sky-500 dark:bg-sky-700 dark:group-hover:bg-sky-600 text-white rounded-r-lg transition-colors duration-200 whitespace-nowrap w-full">
                <span className="font-semibold text-xs sm:text-sm text-center">1059561526</span>
              </div>
            </a>
            */}

            <a
              href="https://discord.gg/sbhxQATZPa"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full flex flex-col sm:flex-row items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <div className="px-2 py-1.5 sm:px-3 sm:py-2 flex flex-col sm:flex-row items-center justify-center whitespace-nowrap w-full sm:w-auto">
                <FaDiscord className="mb-1 sm:mb-0 sm:mr-2 text-base sm:text-lg w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm">{t('hero.community.discord')}</span>
              </div>
              <div className="hidden sm:flex sm:items-center sm:justify-center px-2 sm:px-3 py-1.5 sm:py-2 bg-indigo-600 group-hover:bg-indigo-500 dark:bg-indigo-700 dark:group-hover:bg-indigo-600 text-white rounded-r-lg transition-colors duration-200 whitespace-nowrap w-full">
                <span className="font-semibold text-xs sm:text-sm text-center">{t('hero.community.discordTag')}</span>
              </div>
            </a>

            <a
              href="https://github.com/shigetiro/"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full flex flex-col sm:flex-row items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <div className="px-2 py-1.5 sm:px-3 sm:py-2 flex flex-col sm:flex-row items-center justify-center whitespace-nowrap w-full sm:w-auto">
                <FaGithub className="mb-1 sm:mb-0 sm:mr-2 text-base sm:text-lg w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm">{t('hero.community.github')}</span>
              </div>
              <div className="hidden sm:flex sm:items-center sm:justify-center px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 group-hover:bg-gray-700 dark:group-hover:bg-gray-500 text-white rounded-r-lg transition-colors duration-200 whitespace-nowrap w-full">
                <span className="font-semibold text-xs sm:text-sm text-center">Vipsu</span>
              </div>
            </a>
          </div>
        </motion.div>

        {/* Join button - absolutely positioned near bottom of screen */}
        <motion.div 
          className="absolute bottom-48 left-1/2 -translate-x-1/2 w-full px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="w-full max-w-sm sm:max-w-md mx-auto">
            <Link
              to="/how-to-join"
              className="btn-primary text-sm sm:text-base md:text-lg lg:text-xl px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-3.5 lg:py-4 w-full rounded-xl text-center font-medium shadow-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <FaRocket className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('hero.joinCta')}
            </Link>
          </div>
        </motion.div>

        {/* Scroll-down hint arrows */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <FaChevronDown className="w-6 h-6 text-gray-400 opacity-70" />
          <FaChevronDown className="w-6 h-6 text-gray-400 opacity-50 -mt-4" />
        </div>
      </section>

      {/* Second screen: normal document flow (content shown after unpinning) */}
      <section className="relative min-h-screen flex items-center py-12 md:py-20 lg:py-28 z-0">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/30 to-gray-100/30 dark:from-gray-800/30 dark:to-gray-700/30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-10 md:mb-14">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              <span className="gradient-text">{t('hero.featuresTitle')}</span>
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {t('hero.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const icons = [
                <FaDesktop key="desktop" className="h-6 w-6" />, 
                <FaRocket key="rocket" className="h-6 w-6" />, 
                <FaHeart key="heart" className="h-6 w-6" />, 
                <FaCog key="cog" className="h-6 w-6" />, 
                <FaBug key="bug" className="h-6 w-6" />, 
                <FaCodeBranch key="code" className="h-6 w-6" />, 
                <FaPaperPlane key="plane" className="h-6 w-6" />, 
                <FaChartBar key="chart" className="h-6 w-6" />
              ];

              return (
                <div key={feature.id} className="w-full">
                  <InfoCard
                    image={feature.image}
                    imageAlt={t(feature.imageAltKey)}
                    title={t(feature.titleKey)}
                    content={t(feature.contentKey)}
                    icon={icons[index]}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
