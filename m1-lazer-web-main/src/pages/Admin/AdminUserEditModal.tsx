import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import type { User } from '../../types';
import CountrySelect from '../../components/UI/CountrySelect';

interface AdminUserEditModalProps {
  user: User;
  countries: Array<{ code: string; name: string }>;
  onClose: () => void;
}

interface UserHistory {
  id: number;
  action: string;
  reason: string;
  created_at: string;
  created_by?: string;
}

interface Team {
  id: number;
  name: string;
  short_name: string;
}

const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({ user, countries, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'teams' | 'moderation' | 'security'>('profile');
  const [formData, setFormData] = useState({
    username: user.username,
    country_code: user.country_code,
    is_qat: user.is_qat || false,
    is_gmt: user.is_gmt || false,
    is_admin: user.is_admin || false,
    is_dev: user.is_dev || false,
    selectedBadgeId: null as number | null,
  });
  const [userBadges, setUserBadges] = useState<any[]>(user.badges || []);
  const [loading, setLoading] = useState(false);
  const [availableBadges, setAvailableBadges] = useState<any[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [userHistory, setUserHistory] = useState<UserHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [showRestrictionConfirm, setShowRestrictionConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Team management
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(user.team || null);

  // Suspicious activity
  const [suspiciousInfo, setSuspiciousInfo] = useState({
    trust_score: user.trust_score ?? 100,
    is_suspicious: user.is_suspicious ?? false,
    suspicious_reasons: user.suspicious_reasons ?? [],
    alt_accounts: user.alt_accounts ?? [],
    notes: user.notes ?? '',
  });
  const [newNote, setNewNote] = useState('');
  const [newSuspiciousReason, setNewSuspiciousReason] = useState('');

  useEffect(() => {
    loadBadges();
  }, []);

  useEffect(() => {
    if (activeTab === 'teams') {
      loadTeams();
    } else if (activeTab === 'security') {
      loadUserHistory();
    }
  }, [activeTab]);

  const loadBadges = async () => {
    try {
      setLoadingBadges(true);
      const badges = await adminAPI.getBadges();
      setAvailableBadges(badges || []);
    } catch (error) {
      console.error('Failed to load badges:', error);
    } finally {
      setLoadingBadges(false);
    }
  };

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      const teamsData = await adminAPI.getTeams();
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadUserHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await adminAPI.getUserHistory(user.id);
      setUserHistory(history || []);
    } catch (error) {
      console.error('Failed to load user history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddBadge = async () => {
    if (!formData.selectedBadgeId) return;

    const selectedBadge = availableBadges.find(b => b.id === formData.selectedBadgeId);
    if (!selectedBadge) return;

    try {
      setLoadingBadges(true);
      const newBadgeData = {
        description: selectedBadge.description,
        image_url: selectedBadge.image_url,
        image_2x_url: selectedBadge.image_2x_url || selectedBadge.image_url,
        url: selectedBadge.url || '',
        awarded_at: new Date().toISOString(),
        user_id: user.id
      };

      const createdBadge = await adminAPI.createBadge(newBadgeData);
      setUserBadges([...userBadges, createdBadge]);
      setFormData({ ...formData, selectedBadgeId: null });
      toast.success('Badge awarded successfully');
    } catch (error) {
      console.error('Failed to award badge:', error);
      toast.error('Failed to award badge');
    } finally {
      setLoadingBadges(false);
    }
  };

  const handleRemoveBadge = async (badge: any) => {
    if (!badge.id) {
      setUserBadges(userBadges.filter(b => b !== badge));
      return;
    }

    if (!confirm('Are you sure you want to remove this badge?')) return;

    try {
      setLoadingBadges(true);
      await adminAPI.deleteBadge(badge.id);
      setUserBadges(userBadges.filter(b => b.id !== badge.id));
      toast.success('Badge removed successfully');
    } catch (error) {
      console.error('Failed to remove badge:', error);
      toast.error('Failed to remove badge');
    } finally {
      setLoadingBadges(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        username: formData.username,
        country_code: formData.country_code,
        is_qat: formData.is_qat,
        is_gmt: formData.is_gmt,
        is_admin: formData.is_admin,
        is_dev: formData.is_dev,
        badge: userBadges.filter(b => !b.id)
      };

      await adminAPI.updateUser(user.id, updateData);
      toast.success('User updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleRestrict = async () => {
    if (!restrictionReason.trim()) {
      toast.error('Please provide a reason for restriction');
      return;
    }

    try {
      setLoading(true);
      await adminAPI.banUser(user.id, restrictionReason);
      toast.success('User restricted successfully');
      setShowRestrictionConfirm(false);
      onClose();
    } catch (error) {
      console.error('Failed to restrict user:', error);
      toast.error('Failed to restrict user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnrestrict = async () => {
    try {
      setLoading(true);
      await adminAPI.unbanUser(user.id);
      toast.success('User unrestricted successfully');
      onClose();
    } catch (error) {
      console.error('Failed to unrestrict user:', error);
      toast.error('Failed to unrestrict user');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!confirm('Send password reset email to this user?')) return;

    try {
      setLoading(true);
      await adminAPI.resetUserPassword(user.id);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('Failed to send password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await adminAPI.resendVerificationEmail(user.id);
      toast.success('Verification email resent');
    } catch (error) {
      console.error('Failed to resend verification:', error);
      toast.error('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user.username) {
      toast.error('Username confirmation does not match');
      return;
    }

    try {
      setLoading(true);
      await adminAPI.deleteUser(user.id);
      toast.success('User account deleted');
      onClose();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user account');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTeam = async (teamId: number) => {
    try {
      setLoading(true);
      await adminAPI.addUserToTeam(user.id, teamId);
      const team = teams.find(t => t.id === teamId);
      setCurrentTeam(team || null);
      toast.success('User added to team');
    } catch (error) {
      console.error('Failed to add user to team:', error);
      toast.error('Failed to add user to team');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromTeam = async () => {
    if (!confirm('Remove user from their current team?')) return;

    try {
      setLoading(true);
      await adminAPI.removeUserFromTeam(user.id);
      setCurrentTeam(null);
      toast.success('User removed from team');
    } catch (error) {
      console.error('Failed to remove user from team:', error);
      toast.error('Failed to remove user from team');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setLoading(true);
      await adminAPI.addUserNote(user.id, newNote);
      setSuspiciousInfo({ ...suspiciousInfo, notes: suspiciousInfo.notes + '\n' + newNote });
      setNewNote('');
      toast.success('Note added');
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSuspicious = async () => {
    if (!newSuspiciousReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      setLoading(true);
      await adminAPI.markUserSuspicious(user.id, [...suspiciousInfo.suspicious_reasons, newSuspiciousReason], suspiciousInfo.notes);
      setSuspiciousInfo({
        ...suspiciousInfo,
        is_suspicious: true,
        suspicious_reasons: [...suspiciousInfo.suspicious_reasons, newSuspiciousReason]
      });
      setNewSuspiciousReason('');
      toast.success('User marked as suspicious');
    } catch (error) {
      console.error('Failed to mark suspicious:', error);
      toast.error('Failed to mark as suspicious');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmarkSuspicious = async () => {
    try {
      setLoading(true);
      await adminAPI.unmarkUserSuspicious(user.id);
      setSuspiciousInfo({
        ...suspiciousInfo,
        is_suspicious: false,
        suspicious_reasons: []
      });
      toast.success('User unmarked as suspicious');
    } catch (error) {
      console.error('Failed to unmark suspicious:', error);
      toast.error('Failed to unmark as suspicious');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTrustScore = async (score: number) => {
    try {
      setLoading(true);
      await adminAPI.updateUserTrustScore(user.id, score);
      setSuspiciousInfo({ ...suspiciousInfo, trust_score: score });
      toast.success('Trust score updated');
    } catch (error) {
      console.error('Failed to update trust score:', error);
      toast.error('Failed to update trust score');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'teams', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'moderation', label: 'Moderation', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ] as const;

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrustScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/10 bg-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://osuherz.ddns.net/default.jpg';
                    }}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-lg font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {user.is_restricted && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {suspiciousInfo.is_suspicious && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Edit User: {user.username}</h2>
                  {suspiciousInfo.is_suspicious && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30">
                      Suspicious
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">ID: {user.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Suspicious Banner */}
          {suspiciousInfo.is_suspicious && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-amber-400">
                  <strong>Suspicious Account</strong> - Review required
                </span>
              </div>
              {suspiciousInfo.suspicious_reasons.length > 0 && (
                <ul className="mt-2 ml-7 list-disc text-xs text-amber-400/80">
                  {suspiciousInfo.suspicious_reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="mt-4 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-500/50'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-240px)] overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <form className="space-y-6">
              {/* Username */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  required
                />
              </div>

              {/* Country */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Country/Flag</label>
                <CountrySelect
                  value={formData.country_code}
                  onChange={(value) => setFormData({ ...formData, country_code: value })}
                  countries={countries}
                />
              </div>

              {/* Roles */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-300">Roles</label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { key: 'is_qat', label: 'QAT', color: 'yellow' },
                    { key: 'is_gmt', label: 'GMT', color: 'blue' },
                    { key: 'is_admin', label: 'Admin', color: 'purple' },
                    { key: 'is_dev', label: 'Dev', color: 'cyan', tooltip: 'Can access System Tools' },
                  ].map((role) => (
                    <label
                      key={role.key}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                      title={(role as any).tooltip}
                    >
                      <input
                        type="checkbox"
                        checked={formData[role.key as keyof typeof formData] as boolean}
                        onChange={(e) =>
                          setFormData({ ...formData, [role.key]: e.target.checked })
                        }
                        className="h-5 w-5 rounded border-gray-500 bg-white/5 text-pink-500 focus:ring-pink-500/20"
                      />
                      <span className={`text-sm font-medium ${
                        role.color === 'yellow' ? 'text-yellow-400' :
                        role.color === 'blue' ? 'text-blue-400' :
                        role.color === 'purple' ? 'text-purple-400' :
                        'text-cyan-400'
                      }`}>{role.label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  <strong>Dev:</strong> Can access System Tools (recalculation, maintenance mode, etc.)
                </p>
              </div>

              {/* Trust Score Indicator */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Trust Score</label>
                  <span className={`text-lg font-bold ${getTrustScoreColor(suspiciousInfo.trust_score)}`}>
                    {suspiciousInfo.trust_score}/100
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${getTrustScoreBg(suspiciousInfo.trust_score)}`}
                    style={{ width: `${suspiciousInfo.trust_score}%` }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateTrustScore(Math.min(100, suspiciousInfo.trust_score + 10))}
                    className="rounded-lg bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/30"
                  >
                    +10 Trust
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTrustScore(Math.max(0, suspiciousInfo.trust_score - 10))}
                    className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    -10 Trust
                  </button>
                </div>
              </div>

              {/* Badges Section */}
              <div className="border-t border-white/10 pt-6">
                <label className="mb-3 block text-sm font-medium text-gray-300">Badges</label>

                {userBadges.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No badges awarded yet</p>
                ) : (
                  <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {userBadges.map((badge, index) => (
                      <div
                        key={badge.id || index}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={badge['image@2x_url'] || badge.image_url}
                            alt={badge.description}
                            className="h-10 w-10 object-contain"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{badge.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(badge.awarded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBadge(badge)}
                          className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <select
                    value={formData.selectedBadgeId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectedBadgeId: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-pink-500/50 focus:outline-none"
                    disabled={loadingBadges}
                  >
                    <option value="">Select a badge to award...</option>
                    {availableBadges.map((badge) => (
                      <option key={badge.id} value={badge.id}>
                        {badge.description}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddBadge}
                    disabled={!formData.selectedBadgeId || loadingBadges}
                    className="rounded-xl bg-pink-500 px-4 py-2.5 font-medium text-white transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Award
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              {/* Current Team */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-4 font-medium text-white">Current Team</h3>

                {currentTeam ? (
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={currentTeam.flag_url}
                        alt={currentTeam.name}
                        className="h-12 w-16 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div>
                        <p className="font-medium text-white">{currentTeam.name}</p>
                        <p className="text-sm text-gray-400">{currentTeam.short_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFromTeam}
                      disabled={loading}
                      className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
                    >
                      Remove from Team
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 py-8 text-center">
                    <p className="text-gray-400">Not a member of any team</p>
                  </div>
                )}
              </div>

              {/* Available Teams */}
              <div>
                <h3 className="mb-4 font-medium text-white">Available Teams</h3>

                {loadingTeams ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500/30 border-t-pink-500" />
                  </div>
                ) : teams.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 py-8 text-center">
                    <p className="text-gray-400">No teams available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {teams.filter(t => t.id !== currentTeam?.id).map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={team.flag_url}
                            alt={team.name}
                            className="h-10 w-14 rounded-lg object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{team.name}</p>
                            <p className="text-xs text-gray-400">{team.short_name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToTeam(team.id)}
                          disabled={loading}
                          className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
                        >
                          Add to Team
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-6">
              {/* Account Status */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Account Status</h3>
                    <p className="text-sm text-gray-400">Current restriction status</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      user.is_restricted
                        ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                        : 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                    }`}
                  >
                    {user.is_restricted ? 'Restricted' : 'Active'}
                  </span>
                </div>

                {user.is_restricted ? (
                  <button
                    onClick={handleUnrestrict}
                    disabled={loading}
                    className="w-full rounded-xl bg-green-500 px-4 py-3 font-medium text-white transition-all hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Unrestrict User'}
                  </button>
                ) : (
                  <div>
                    {!showRestrictionConfirm ? (
                      <button
                        onClick={() => setShowRestrictionConfirm(true)}
                        className="w-full rounded-xl bg-red-500 px-4 py-3 font-medium text-white transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
                      >
                        Restrict User
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Reason for restriction (required)..."
                          value={restrictionReason}
                          onChange={(e) => setRestrictionReason(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowRestrictionConfirm(false);
                              setRestrictionReason('');
                            }}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-white transition-colors hover:bg-white/10"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRestrict}
                            disabled={loading || !restrictionReason.trim()}
                            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Confirm Restriction
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Suspicious Account Management */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <h3 className="mb-4 font-medium text-amber-400 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Suspicious Activity
                </h3>

                {suspiciousInfo.is_suspicious ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                      <p className="text-sm text-amber-400">This account is marked as suspicious</p>
                      <ul className="mt-2 list-disc pl-5 text-xs text-amber-400/80">
                        {suspiciousInfo.suspicious_reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={handleUnmarkSuspicious}
                      disabled={loading}
                      className="w-full rounded-xl border border-amber-500/30 bg-amber-500/20 px-4 py-2.5 font-medium text-amber-400 transition-all hover:bg-amber-500/30"
                    >
                      Clear Suspicious Status
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Reason for marking as suspicious..."
                      value={newSuspiciousReason}
                      onChange={(e) => setNewSuspiciousReason(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-amber-500/50 focus:outline-none"
                    />
                    <button
                      onClick={handleMarkSuspicious}
                      disabled={loading || !newSuspiciousReason.trim()}
                      className="w-full rounded-xl border border-amber-500/30 bg-amber-500/20 px-4 py-2.5 font-medium text-amber-400 transition-all hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark as Suspicious
                    </button>
                  </div>
                )}
              </div>

              {/* Account Deletion */}
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <h3 className="mb-4 font-medium text-red-400">Delete Account</h3>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full rounded-xl bg-red-500 px-4 py-3 font-medium text-white transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    Delete User Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                      This action cannot be undone. Type <strong>{user.username}</strong> to confirm:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type username to confirm"
                      className="w-full rounded-xl border border-red-500/30 bg-white/5 px-4 py-2.5 text-white focus:border-red-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-white transition-colors hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading || deleteConfirmText !== user.username}
                        className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Account Security */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-4 font-medium text-white">Account Security</h3>

                {/* Email Verification */}
                <div className="mb-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">Email Verification</p>
                    <p className="text-xs text-gray-400">
                      {user.is_verified ? 'Account has been verified' : 'Account not verified'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.is_verified
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {user.is_verified ? 'Verified' : 'Pending'}
                    </span>
                    {!user.is_verified && (
                      <button
                        onClick={handleResendVerification}
                        disabled={loading}
                        className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
                      >
                        Resend
                      </button>
                    )}
                  </div>
                </div>

                {/* Password Reset */}
                <button
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition-all hover:bg-white/10"
                >
                  Send Password Reset Email
                </button>
              </div>

              {/* Admin Notes */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-4 font-medium text-white">Admin Notes</h3>

                {suspiciousInfo.notes && (
                  <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
                    <pre className="whitespace-pre-wrap text-xs text-gray-300 font-mono">
                      {suspiciousInfo.notes}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2">
                  <textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none"
                    rows={2}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || loading}
                    className="rounded-xl bg-pink-500 px-4 py-2 font-medium text-white transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Account History */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-4 font-medium text-white">Account History</h3>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500/30 border-t-pink-500" />
                  </div>
                ) : userHistory.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-white/5 py-8 text-center">
                    <p className="text-gray-400">No history found</p>
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {userHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span
                            className={`text-xs font-medium ${
                              entry.action === 'restrict'
                                ? 'text-red-400'
                                : entry.action === 'unrestrict'
                                ? 'text-green-400'
                                : 'text-blue-400'
                            }`}
                          >
                            {entry.action.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-white">{entry.reason}</p>
                        {entry.created_by && (
                          <p className="mt-1 text-xs text-gray-500">by {entry.created_by}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alt Accounts */}
              {suspiciousInfo.alt_accounts && suspiciousInfo.alt_accounts.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <h3 className="mb-4 font-medium text-amber-400">Possible Alt Accounts</h3>
                  <div className="space-y-2">
                    {suspiciousInfo.alt_accounts.map((alt) => (
                      <div
                        key={alt.id}
                        className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                            {alt.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-white">{alt.username}</span>
                        </div>
                        <span className="text-xs text-amber-400">ID: {alt.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'profile' && (
          <div className="sticky bottom-0 border-t border-white/10 bg-slate-900/95 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-xl bg-pink-500 px-6 py-2.5 font-medium text-white transition-all hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserEditModal;
