import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const HomeFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="py-10 border-t border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-4">
          {/* Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-osu-pink/10">
              <img src="/image/logos/logo.svg" alt={t('common.brandAlt')} className="w-4 h-4 object-contain opacity-80" />
            </div>
            <span className="text-sm font-semibold text-slate-400">{t('common.brandName')}</span>
          </div>

          {/* Privacy Disclosure */}
          <div className="max-w-2xl text-center">
            <p className="text-xs leading-relaxed text-slate-500">
              {t('common.privacyDisclosure')}
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex items-center space-x-6 text-xs">
            <Link
              to="/privacy-policy"
              className="text-slate-500 transition-colors duration-200 hover:text-osu-pink"
            >
              {t('common.privacyPolicy')}
            </Link>
            <span className="text-slate-700">•</span>
            <Link
              to="/terms-of-service"
              className="text-slate-500 transition-colors duration-200 hover:text-osu-pink"
            >
              {t('common.termsOfService')}
            </Link>
          </div>

          <p className="text-xs text-center text-slate-500">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
