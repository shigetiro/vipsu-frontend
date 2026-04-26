import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCheck, FiX, FiImage, FiCamera, FiShield, FiMonitor, FiLock, FiSettings, FiKey, FiEdit2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userAPI, type TOTPStatus } from '../utils/api';
import EditableCover from '../components/UI/EditableCover';
import Avatar from '../components/UI/Avatar';
import AvatarUpload from '../components/UI/AvatarUpload';
import CountrySelect from '../components/UI/CountrySelect';
import { allCountries } from '../utils/allCountries';
import TotpSetupModal from '../components/TOTP/TotpSetupModal';
import TotpDisableModal from '../components/TOTP/TotpDisableModal';
import SessionManagement from '../components/Device/SessionManagement';
import TrustedDeviceManagement from '../components/Device/TrustedDeviceManagement';
import PasswordResetSection from '../components/Settings/PasswordResetSection';
import UserPreferencesSection from '../components/Settings/UserPreferencesSection';
import OAuthAppsSection from '../components/Settings/OAuthAppsSection';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isLoading, refreshUser, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [isUpdatingCountry, setIsUpdatingCountry] = useState(false);

  const [totpStatus, setTotpStatus] = useState<TOTPStatus | null>(null);
  const [isLoadingTotpStatus, setIsLoadingTotpStatus] = useState(true);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [showTotpDisable, setShowTotpDisable] = useState(false);

  const fetchTotpStatus = async () => {
    try {
      const status = await userAPI.totp.getStatus();
      setTotpStatus(status);
    } catch (error) {
      console.error('Failed to fetch TOTP status:', error);
      setTotpStatus({ enabled: false });
    } finally {
      setIsLoadingTotpStatus(false);
    }
  };

  const handleTotpSetupSuccess = () => {
    setTotpStatus({ enabled: true, created_at: new Date().toISOString() });
    toast.success(t('settings.totp.setupSuccess'));
  };

  const handleTotpDisableSuccess = () => {
    setTotpStatus({ enabled: false });
    toast.success(t('settings.totp.disableSuccess'));
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTotpStatus();
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-osu-pink blur-xl opacity-20" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-osu-pink relative"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
          <i className="fa fa-exclamation-triangle text-2xl text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('settings.errors.loadFailed')}
        </h2>
        <p className="text-slate-500">
          {t('settings.errors.tryRefresh')}
        </p>
      </div>
    );
  }

  const handleStartEdit = () => {
    setNewUsername(user.username);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewUsername('');
  };

  const handleStartEditCountry = () => {
    setSelectedCountryCode(user.country_code || '');
    setIsEditingCountry(true);
  };

  const handleCancelEditCountry = () => {
    setIsEditingCountry(false);
    setSelectedCountryCode('');
  };

  const handleSubmitCountry = async () => {
    if (!selectedCountryCode) {
      toast.error(t('settings.country.errors.failed'));
      return;
    }

    if (selectedCountryCode === user.country_code) {
      toast.error(t('settings.country.errors.sameAsOld'));
      return;
    }

    setIsUpdatingCountry(true);
    try {
      const updatedUser = await userAPI.updateSelf({ country_code: selectedCountryCode });
      if (updatedUser) {
        updateUser(updatedUser);
      } else {
        await refreshUser();
      }
      toast.success(t('settings.country.success'));

      setIsEditingCountry(false);
      setSelectedCountryCode('');
    } catch (error) {
      console.error('Failed to update country:', error);
      toast.error(t('settings.country.errors.failed'));
    } finally {
      setIsUpdatingCountry(false);
    }
  };

  const handleSubmitUsername = async () => {
    if (!newUsername.trim()) {
      toast.error(t('settings.username.errors.empty'));
      return;
    }

    if (newUsername.trim() === user.username) {
      toast.error(t('settings.username.errors.sameAsOld'));
      return;
    }

    setIsSubmitting(true);
    try {
      await userAPI.rename(newUsername.trim());

      toast.success(t('settings.username.success'));
      setIsEditing(false);
      setNewUsername('');

      setTimeout(async () => {
        await refreshUser();
      }, 1000);
    } catch (error) {
      console.error('Failed to rename:', error);
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 409) {
        toast.error(t('settings.username.errors.taken'));
      } else if (err.response?.status === 404) {
        toast.error(t('settings.username.errors.userNotFound'));
      } else {
        toast.error(t('settings.username.errors.failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    toast.success(t('settings.avatar.success'));
    setShowAvatarUpload(false);
    setTimeout(async () => {
      await refreshUser();
    }, 2000);
  };

  // Section Card Component
  const SettingsCard: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
    children,
    delay = 0,
    className = ''
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  );

  // Section Header Component
  const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-osu-pink/10 flex items-center justify-center text-osu-pink">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('settings.title')}
        </h1>
        <p className="text-slate-500">
          {t('settings.description')}
        </p>
      </motion.div>

      {/* Username Settings */}
      <SettingsCard delay={0.1}>
        <SectionHeader
          icon={<FiUser className="w-5 h-5" />}
          title={t('settings.username.title')}
        />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              {t('settings.username.current')}
            </label>
            {!isEditing ? (
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-800/30">
                <span className="text-lg font-medium text-white">
                  {user.username}
                </span>
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 rounded-lg border border-white/10 bg-slate-800/50 text-slate-300 hover:bg-osu-pink hover:text-white hover:border-osu-pink transition-all text-sm font-medium"
                >
                  {t('settings.username.change')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-osu-pink focus:border-transparent bg-slate-800/50 text-white placeholder-slate-500"
                    placeholder={t('settings.username.placeholder')}
                    maxLength={50}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {t('settings.username.hint')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitUsername}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-osu-pink text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-osu-pink/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiCheck className="w-4 h-4" />
                    {isSubmitting ? t('settings.username.saving') : t('settings.username.save')}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-slate-800/50 text-slate-300 rounded-lg font-medium transition-all hover:bg-white/5 disabled:opacity-50"
                  >
                    <FiX className="w-4 h-4" />
                    {t('settings.username.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* Avatar Settings */}
      <SettingsCard delay={0.15}>
        <SectionHeader
          icon={<FiCamera className="w-5 h-5" />}
          title={t('settings.avatar.title')}
        />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-3">
              {t('settings.avatar.current')}
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                userId={user.id}
                username={user.username}
                avatarUrl={user.avatar_url}
                size="lg"
                shape="rounded"
                editable={false}
                className="!w-16 !h-16"
              />
              <div className="flex-1">
                <button
                  onClick={() => setShowAvatarUpload(true)}
                  className="px-4 py-2 bg-osu-pink text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-osu-pink/30 flex items-center gap-2"
                >
                  <FiCamera className="w-4 h-4" />
                  {t('settings.avatar.change')}
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  {t('settings.avatar.hint')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Cover Settings */}
      <SettingsCard delay={0.2}>
        <SectionHeader
          icon={<FiImage className="w-5 h-5" />}
          title={t('settings.cover.title')}
        />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              {t('settings.cover.label')}
            </label>
            <p className="text-xs text-slate-500 mb-4">
              {t('settings.cover.hint')}
            </p>
            <EditableCover
              userId={user.id}
              username={user.username}
              coverUrl={user.cover_url}
              editable={true}
              onCoverUpdate={() => {}}
            />
          </div>
        </div>
      </SettingsCard>

      {/* Password Settings */}
      <SettingsCard delay={0.225}>
        <SectionHeader
          icon={<FiLock className="w-5 h-5" />}
          title={t('settings.password.title')}
        />
        <PasswordResetSection />
      </SettingsCard>

      {/* TOTP Two-Factor Authentication */}
      <SettingsCard delay={0.25}>
        <SectionHeader
          icon={<FiShield className="w-5 h-5" />}
          title={t('settings.totp.title')}
        />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              {t('settings.totp.status')}
            </label>
            {isLoadingTotpStatus ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-osu-pink"></div>
                <span className="text-sm text-slate-500">
                  {t('settings.totp.checking')}
                </span>
              </div>
            ) : totpStatus ? (
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${totpStatus.enabled ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <div>
                    <span className={`font-medium ${totpStatus.enabled ? 'text-green-400' : 'text-slate-400'}`}>
                      {totpStatus.enabled ? t('settings.totp.enabled') : t('settings.totp.disabled')}
                    </span>
                    {totpStatus.enabled && totpStatus.created_at && (
                      <p className="text-xs text-slate-500">
                        {t('settings.totp.enabledSince', {
                          date: new Date(totpStatus.created_at).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!totpStatus.enabled ? (
                    <button
                      onClick={() => setShowTotpSetup(true)}
                      className="px-4 py-2 bg-osu-pink text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-osu-pink/30 text-sm"
                    >
                      {t('settings.totp.enable')}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowTotpDisable(true)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium transition-all hover:bg-red-500/30 text-sm"
                    >
                      {t('settings.totp.disable')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-400">
                {t('settings.totp.loadError')}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-sm text-blue-300">
              {t('settings.totp.description')}
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* OAuth Applications */}
      <SettingsCard delay={0.26}>
        <SectionHeader
          icon={<FiKey className="w-5 h-5" />}
          title={t('settings.oauth.title')}
        />
        <OAuthAppsSection />
      </SettingsCard>

      {/* User Preferences */}
      <SettingsCard delay={0.275}>
        <SectionHeader
          icon={<FiSettings className="w-5 h-5" />}
          title={t('settings.preferences.title')}
        />
        <div className="mb-4">
          <p className="text-sm text-slate-400">
            {t('settings.preferences.description')}
          </p>
        </div>
        <UserPreferencesSection />
      </SettingsCard>

      {/* Device Management */}
      <SettingsCard delay={0.3}>
        <SectionHeader
          icon={<FiMonitor className="w-5 h-5" />}
          title={t('settings.device.title')}
        />
        <div className="mb-6">
          <p className="text-sm text-slate-400">
            {t('settings.device.description')}
          </p>
        </div>
        <SessionManagement />
        <div className="border-t border-white/5 my-8"></div>
        <TrustedDeviceManagement />
      </SettingsCard>

      {/* Account Info */}
      <SettingsCard delay={0.4}>
        <h2 className="text-xl font-semibold text-white mb-6">
          {t('settings.account.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              {t('settings.account.userId')}
            </label>
            <div className="px-4 py-3 rounded-xl border border-white/5 bg-slate-800/30">
              <span className="text-white font-mono">
                {user.id}
              </span>
            </div>
          </div>

          {user.join_date && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                {t('settings.account.joinDate')}
              </label>
              <div className="px-4 py-3 rounded-xl border border-white/5 bg-slate-800/30">
                <span className="text-white">
                  {new Date(user.join_date).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}

          {user.country && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-400">
                  {t('settings.account.country')}
                </label>
                {!isEditingCountry && (
                  <button
                    onClick={handleStartEditCountry}
                    className="flex items-center gap-1 text-sm text-osu-pink hover:text-pink-400 transition-colors"
                  >
                    <FiEdit2 className="w-3 h-3" />
                    {t('settings.country.change')}
                  </button>
                )}
              </div>

              {!isEditingCountry ? (
                <div className="px-4 py-3 rounded-xl border border-white/5 bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://flagcdn.com/w20/${user.country.code.toLowerCase()}.png`}
                      alt={user.country.code}
                      className="w-5 h-auto"
                    />
                    <span className="text-white">
                      {user.country.name}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <CountrySelect
                    value={selectedCountryCode}
                    onChange={setSelectedCountryCode}
                    placeholder={t('settings.country.hint')}
                    countries={allCountries}
                    isLoading={false}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitCountry}
                      disabled={isUpdatingCountry || !selectedCountryCode}
                      className="flex items-center gap-2 px-4 py-2 bg-osu-pink text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-osu-pink/30 disabled:opacity-50"
                    >
                      <FiCheck className="w-4 h-4" />
                      {isUpdatingCountry ? t('settings.country.saving') : t('settings.country.save')}
                    </button>
                    <button
                      onClick={handleCancelEditCountry}
                      disabled={isUpdatingCountry}
                      className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-slate-800/50 text-slate-300 rounded-lg font-medium transition-all hover:bg-white/5"
                    >
                      <FiX className="w-4 h-4" />
                      {t('settings.country.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {user.last_visit && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                {t('settings.account.lastVisit')}
              </label>
              <div className="px-4 py-3 rounded-xl border border-white/5 bg-slate-800/30">
                <span className="text-white">
                  {new Date(user.last_visit).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <AvatarUpload
          userId={user.id}
          currentAvatarUrl={user.avatar_url}
          onUploadSuccess={handleAvatarUpdate}
          onClose={() => setShowAvatarUpload(false)}
        />
      )}

      {/* TOTP Setup Modal */}
      <TotpSetupModal
        isOpen={showTotpSetup}
        onClose={() => setShowTotpSetup(false)}
        onSuccess={handleTotpSetupSuccess}
      />

      {/* TOTP Disable Modal */}
      <TotpDisableModal
        isOpen={showTotpDisable}
        onClose={() => setShowTotpDisable(false)}
        onSuccess={handleTotpDisableSuccess}
      />
    </div>
  );
};

export default SettingsPage;
