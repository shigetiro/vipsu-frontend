import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import type { RegisterForm } from '../types';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

const RegisterPage: React.FC = () => {
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterForm> = {};

    if (!formData.username) {
      newErrors.username = t('auth.register.errors.usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('auth.register.errors.usernameMin');
    } else if (formData.username.length > 15) {
      newErrors.username = t('auth.register.errors.usernameMax');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = t('auth.register.errors.usernamePattern');
    } else if (/^\d/.test(formData.username)) {
      newErrors.username = t('auth.register.errors.usernameStart');
    }

    if (!formData.email) {
      newErrors.email = t('auth.register.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.register.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.register.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.register.errors.passwordMin');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('auth.register.errors.passwordStrength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.register.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.register.errors.confirmPasswordMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const success = await register(
      formData.username,
      formData.email,
      formData.password,
      turnstileToken
    );

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof RegisterForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="min-h-screen flex justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 bg-gradient-to-br from-[#0f0f14] via-[#14141a] to-[#1a1a22]">
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255,0,102,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(139,125,222,0.05) 0%, transparent 50%)
          `,
        }}
      />
      <div className="max-w-md w-full space-y-5 pb-4 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto flex items-center justify-center mb-4 rounded-2xl bg-osu-pink/10 border border-white/10">
            <img
              src="/image/logos/logo.svg"
              alt={t('common.brandAlt')}
              className="w-9 h-9 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {t('auth.register.title')}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {t('auth.register.subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl py-6 px-6 space-y-4 border border-white/10 bg-black/20 backdrop-blur-xl">
          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-1">
                {t('auth.register.username')}
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
                  className={`w-full px-3 py-2.5 pl-10 border rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all ${
                    errors.username ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder={t('auth.register.usernamePlaceholder')}
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">
                {t('auth.register.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`w-full px-3 py-2.5 pl-10 border rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all ${
                    errors.email ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder={t('auth.register.emailPlaceholder')}
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">
                {t('auth.register.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full px-3 py-2.5 pl-10 pr-10 border rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all ${
                    errors.password ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder={t('auth.register.passwordPlaceholder')}
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-400 mb-1">
                {t('auth.register.confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className={`w-full px-3 py-2.5 pl-10 pr-10 border rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all ${
                    errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-osu-pink transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-osu-pink hover:bg-osu-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-osu-pink disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-osu-pink/30 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  t('auth.register.submit')
                )}
              </button>
            </div>

            {/* Turnstile */}
            <div className="flex justify-center pt-2">
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

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                {t('auth.register.hasAccount')}{' '}
                <Link
                  to="/login"
                  className="font-medium text-osu-pink hover:text-pink-400 transition-colors"
                >
                  {t('auth.register.loginNow')}
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Agreement */}
        <div className="text-center">
          <p className="text-xs text-slate-600">
            {t('common.registerAgreement')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
