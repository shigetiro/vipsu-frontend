import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../UI/LoadingSpinner';
import type { LoginForm as LoginFormType } from '../../types';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormType>({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) return;

    const success = await login(formData.username, formData.password, turnstileToken);
    if (success) {
      navigate('/profile');
    } else {
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }
  };

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('');
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
  }, []);

  return (
    <div className="max-w-md w-full relative z-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto flex items-center justify-center mb-4 rounded-2xl bg-osu-pink/10 border border-white/10">
          <img src="/image/logos/logo.svg" alt={t('common.brandAlt')} className="w-9 h-9 object-contain" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {t('auth.login.title')}
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">{t('auth.login.subtitle')}</p>
      </div>

      {/* Form card - Admin Panel style */}
      <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl py-6 px-6 space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-1.5">
              {t('auth.login.username')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="h-4 w-4 text-slate-500" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-3 py-2.5 pl-10 border border-white/10 rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all"
                placeholder={t('auth.login.usernamePlaceholder')}
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-400">
                {t('auth.login.password')}
              </label>
              <Link
                to="/password-reset"
                className="text-xs font-medium text-osu-pink hover:text-pink-400 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-4 w-4 text-slate-500" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2.5 pl-10 pr-10 border border-white/10 rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all"
                placeholder={t('auth.login.passwordPlaceholder')}
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-osu-pink transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !formData.username || !formData.password || !turnstileToken}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-osu-pink hover:bg-osu-pink/90 hover:shadow-lg hover:shadow-osu-pink/30 hover:-translate-y-0.5"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : t('auth.login.submit')}
            </button>
          </div>

          {/* Turnstile */}
          <div className="flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
              onExpire={handleTurnstileError}
              options={{
                theme: 'dark',
                size: 'normal',
              }}
            />
          </div>

          {/* Register Link */}
          <div className="text-center pt-1">
            <p className="text-sm text-slate-500">
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" className="font-medium text-osu-pink hover:text-pink-400 transition-colors">
                {t('auth.login.registerNow')}
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Agreement */}
      <div className="text-center mt-4">
        <p className="text-xs text-slate-600">
          {t('common.authAgreement')}
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
