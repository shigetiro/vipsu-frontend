import { api } from './client';

export const adminAPI = {
  // Statistics
  getStats: async () => {
    const response = await api.get('/api/private/admin/stats');
    return response.data;
  },

  // Users
  getUsers: async (page: number = 1, limit: number = 50, search: string = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    const response = await api.get(`/api/private/admin/users?${params.toString()}`);
    return response.data;
  },

  getUser: async (userId: number) => {
    const response = await api.get(`/api/private/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: number, userData: {
    username?: string;
    country_code?: string;
    is_qat?: boolean;
    is_gmt?: boolean;
    is_admin?: boolean;
    is_dev?: boolean;
    badge?: string | object;
  }) => {
    const response = await api.patch(`/api/private/admin/users/${userId}`, userData);
    return response.data;
  },

  banUser: async (userId: number, reason?: string) => {
    const response = await api.post(`/api/private/admin/users/${userId}/ban`, { reason });
    return response.data;
  },

  unbanUser: async (userId: number) => {
    const response = await api.post(`/api/private/admin/users/${userId}/unban`);
    return response.data;
  },

  wipeUserStats: async (userId: number, mode: string) => {
    const response = await api.post(`/api/private/admin/users/${userId}/wipe`, { mode });
    return response.data;
  },

  // Scores
  getScores: async () => {
    const response = await api.get('/api/private/admin/scores');
    return response.data;
  },

  // Beatmaps
  getBeatmaps: async (page: number = 1, limit: number = 25, search: string = '', rankStatus?: string, mode?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (rankStatus) params.append('rank_status', rankStatus);
    if (mode) params.append('mode', mode);
    const response = await api.get(`/api/private/admin/beatmaps?${params.toString()}`);
    return response.data;
  },

  searchBeatmaps: async (query: string, limit = 50) => {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());
    const response = await api.get(`/api/private/admin/beatmaps/search?${params.toString()}`);
    return response.data;
  },

  getBeatmap: async (id: string | number) => {
    const response = await api.get(`/api/private/admin/beatmaps/${id}`);
    return response.data;
  },

  updateRankStatus: async (id: string | number, status: string) => {
    const response = await api.post(`/api/private/admin/beatmaps/${id}/rank`, { status });
    return response.data;
  },

  banBeatmap: async (id: string | number) => {
    const response = await api.post(`/api/private/admin/beatmaps/${id}/ban`);
    return response.data;
  },

  // Beatmap Blacklist
  getBlacklistedBeatmaps: async () => {
    const response = await api.get('/api/private/admin/beatmaps/blacklist');
    return response.data;
  },

  addBlacklistedBeatmapSet: async (beatmapsetId: number) => {
    const response = await api.post('/api/private/admin/beatmaps/blacklist', { beatmapset_id: beatmapsetId });
    return response.data;
  },

  removeBlacklistedBeatmapSet: async (beatmapsetId: number) => {
    const response = await api.delete(`/api/private/admin/beatmaps/blacklist/${beatmapsetId}`);
    return response.data;
  },

  // Add/Remove by individual beatmap ID
  addBlacklistedBeatmapById: async (beatmapId: number) => {
    const response = await api.post('/api/private/admin/beatmaps/blacklist', { beatmap_id: beatmapId });
    return response.data;
  },

  removeBlacklistedBeatmapById: async (beatmapId: number) => {
    const response = await api.delete(`/api/private/admin/beatmaps/blacklist/beatmap/${beatmapId}`);
    return response.data;
  },

  // User History & Suspicious Activity
  getUserHistory: async (userId: number) => {
    const response = await api.get(`/api/private/admin/users/${userId}/history`);
    return response.data;
  },

  getUserSuspiciousActivity: async (userId: number) => {
    const response = await api.get(`/api/private/admin/users/${userId}/suspicious`);
    return response.data;
  },

  updateUserTrustScore: async (userId: number, score: number) => {
    const response = await api.patch(`/api/private/admin/users/${userId}/trust-score`, { score });
    return response.data;
  },

  markUserSuspicious: async (userId: number, reasons: string[], notes?: string) => {
    const response = await api.post(`/api/private/admin/users/${userId}/suspicious`, { reasons, notes });
    return response.data;
  },

  unmarkUserSuspicious: async (userId: number) => {
    const response = await api.delete(`/api/private/admin/users/${userId}/suspicious`);
    return response.data;
  },

  resetUserPassword: async (userId: number) => {
    const response = await api.post(`/api/private/admin/users/${userId}/reset-password`);
    return response.data;
  },

  resendVerificationEmail: async (userId: number) => {
    const response = await api.post(`/api/private/admin/users/${userId}/resend-verification`);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/api/private/admin/users/${userId}`);
    return response.data;
  },

  addUserNote: async (userId: number, note: string) => {
    const response = await api.post(`/api/private/admin/users/${userId}/notes`, { note });
    return response.data;
  },

  // Team Management
  getTeams: async () => {
    const response = await api.get('/api/private/admin/teams');
    return response.data;
  },

  getTeamMembers: async (teamId: number) => {
    const response = await api.get(`/api/private/admin/teams/${teamId}/members`);
    return response.data;
  },

  addUserToTeam: async (userId: number, teamId: number) => {
    const response = await api.post(`/api/private/admin/users/${userId}/team`, { team_id: teamId });
    return response.data;
  },

  removeUserFromTeam: async (userId: number) => {
    const response = await api.delete(`/api/private/admin/users/${userId}/team`);
    return response.data;
  },

  // Badges
  getBadges: async () => {
    const response = await api.get('/api/private/admin/user-badges');
    return response.data;
  },

  createBadge: async (badgeData: {
    description: string;
    image_url: string;
    image_2x_url?: string;
    url?: string;
    awarded_at?: string;
    user_id?: number | null;
  }) => {
    const response = await api.post('/api/private/admin/user-badges', badgeData);
    return response.data;
  },

  updateBadge: async (badgeId: number, badgeData: {
    description?: string;
    image_url?: string;
    image_2x_url?: string;
    url?: string;
    awarded_at?: string;
    user_id?: number | null;
  }) => {
    const response = await api.patch(`/api/private/admin/user-badges/${badgeId}`, badgeData);
    return response.data;
  },

  deleteBadge: async (badgeId: number) => {
    const response = await api.delete(`/api/private/admin/user-badges/${badgeId}`);
    return response.data;
  },

  uploadBadgeImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/private/admin/upload-badge-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Daily Challenge - Enhanced to match osu.Game structure
  getDailyChallenge: async (date: string) => {
    const response = await api.get(`/api/private/admin/daily-challenge/${date}`);
    return response.data;
  },

  listDailyChallenges: async (params?: {
    page?: number;
    per_page?: number;
    date_from?: string;
    date_to?: string;
  }) => {
    const response = await api.get('/api/private/admin/daily-challenges', { params });
    return response.data;
  },

  createDailyChallenge: async (challengeData: {
    date: string;
    beatmap_id: number;
    ruleset_id: number;
    required_mods: string;
    allowed_mods: string;
    room_id?: number;
    max_attempts?: number;
    time_limit?: number;
  }) => {
    const response = await api.post('/api/private/admin/daily-challenge', challengeData);
    return response.data;
  },

  updateDailyChallenge: async (date: string, challengeData: {
    beatmap_id?: number;
    ruleset_id?: number;
    required_mods?: string;
    allowed_mods?: string;
    room_id?: number;
    max_attempts?: number;
    time_limit?: number;
  }) => {
    const response = await api.patch(`/api/private/admin/daily-challenge/${date}`, challengeData);
    return response.data;
  },

  deleteDailyChallenge: async (date: string) => {
    const response = await api.delete(`/api/private/admin/daily-challenge/${date}`);
    return response.data;
  },

  triggerDailyChallenge: async () => {
    const response = await api.post('/api/private/admin/daily-challenge/trigger');
    return response.data;
  },

  createRandomDailyChallenge: async (data: {
    date?: string;
    ruleset_id?: number;
    min_difficulty?: number;
    max_difficulty?: number;
    create_challenge?: boolean;
    required_mods?: string;
    allowed_mods?: string;
  }) => {
    const response = await api.post('/api/private/admin/daily-challenge/random', data);
    return response.data;
  },

  getDailyChallengeStats: async (userId: number) => {
    const response = await api.get(`/api/private/admin/daily-challenge/stats/${userId}`);
    return response.data;
  },

  // Teams
  getAllTeams: async () => {
    const response = await api.get('/api/private/admin/teams');
    return response.data;
  },

  updateTeam: async (teamId: number, teamData: FormData) => {
    const response = await api.patch(`/api/private/admin/teams/${teamId}`, teamData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteTeam: async (teamId: number) => {
    const response = await api.delete(`/api/private/admin/teams/${teamId}`);
    return response.data;
  },

  // Reports
  getReports: async (params?: { page?: number; per_page?: number; status?: string; search?: string }) => {
    const response = await api.get('/api/private/admin/reports', { params });
    return response.data;
  },

  resolveReport: async (reportId: number, resolution: { action: 'close' | 'ban' | 'warn'; notes?: string }) => {
    const response = await api.post(`/api/private/admin/reports/${reportId}/resolve`, resolution);
    return response.data;
  },

  // Global Announcement (simple notification send)
  sendGlobalAnnouncement: async (data: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    also_send_pm: boolean;
    online_only: boolean;
    show_popup: boolean;
    sender_username?: string;
    sender_user_id?: number | null;
  }) => {
    const response = await api.post('/api/private/admin/global-announcement', data);
    return response.data;
  },

  // Announcements (legacy CRUD)
  getAnnouncements: async (params?: { page?: number; per_page?: number; is_active?: boolean; type?: string; include_expired?: boolean }) => {
    const response = await api.get('/api/private/admin/announcements', { params });
    return response.data;
  },

  createAnnouncement: async (data: {
    title: string;
    content: string;
    type?: string;
    target_roles?: string[];
    start_at?: string;
    end_at?: string;
    is_active?: boolean;
    is_pinned?: boolean;
    show_in_client?: boolean;
    show_on_website?: boolean;
  }) => {
    const response = await api.post('/api/private/admin/announcements', data);
    return response.data;
  },

  updateAnnouncement: async (id: number, data: {
    title?: string;
    content?: string;
    type?: string;
    target_roles?: string[];
    start_at?: string;
    end_at?: string;
    is_active?: boolean;
    is_pinned?: boolean;
    show_in_client?: boolean;
    show_on_website?: boolean;
  }) => {
    const response = await api.put(`/api/private/admin/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: number) => {
    const response = await api.delete(`/api/private/admin/announcements/${id}`);
    return response.data;
  },

  activateAnnouncement: async (id: number, sendNotification?: boolean, onlineOnly?: boolean) => {
    const params = new URLSearchParams();
    if (sendNotification !== undefined) {
      params.append('send_notification', sendNotification.toString());
    }
    if (onlineOnly !== undefined) {
      params.append('online_only', onlineOnly.toString());
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.post(`/api/private/admin/announcements/${id}/activate${queryString}`);
    return response.data;
  },

  deactivateAnnouncement: async (id: number) => {
    const response = await api.post(`/api/private/admin/announcements/${id}/deactivate`);
    return response.data;
  },

  // System Tools
  getMaintenanceMode: async () => {
    const response = await api.get('/api/private/admin/system/maintenance-mode');
    return response.data;
  },

  setMaintenanceMode: async (enabled: boolean) => {
    const response = await api.post('/api/private/admin/system/maintenance-mode', { enabled });
    return response.data;
  },

  // Maintenance mode with countdown scheduling
  getMaintenanceModeStatus: async () => {
    const response = await api.get('/api/private/admin/system/maintenance-mode/status');
    return response.data;
  },

  scheduleMaintenanceMode: async (data: {
    enabled: boolean;
    message?: string;
    schedule_minutes?: number;
  }) => {
    const response = await api.post('/api/private/admin/system/maintenance-mode/schedule', data);
    return response.data;
  },

  recalculateUser: async (userId: number) => {
    const response = await api.post(`/api/private/admin/recalculate/user/${userId}`);
    return response.data;
  },

  recalculateBeatmap: async (beatmapId: number) => {
    const response = await api.post(`/api/private/admin/recalculate/beatmap/${beatmapId}`);
    return response.data;
  },

  recalculateOverall: async () => {
    const response = await api.post('/api/private/admin/recalculate/overall');
    return response.data;
  },

  getRecalculationTasks: async (params?: { status?: string; limit?: number }) => {
    const response = await api.get('/api/private/admin/recalculate/tasks', { params });
    return response.data;
  },

  getRecalculationStatus: async () => {
    const response = await api.get('/api/private/admin/recalculate/status');
    return response.data;
  },

  // Pending counts for menu badges
  getPendingCounts: async () => {
    const response = await api.get('/api/private/admin/pending-counts');
    return response.data;
  },

  // Beatmap Rank Requests
  getBeatmapRequests: async (params?: { page?: number; per_page?: number; status?: string }) => {
    const response = await api.get('/api/private/admin/beatmap-rank-requests', { params });
    return response.data;
  },

  approveBeatmapRequest: async (requestId: number) => {
    const response = await api.post(`/api/private/admin/beatmap-rank-requests/${requestId}/approve`);
    return response.data;
  },

  rejectBeatmapRequest: async (requestId: number, reason?: string) => {
    const response = await api.post(`/api/private/admin/beatmap-rank-requests/${requestId}/reject`, { reason });
    return response.data;
  },

  // Client Version/Platform Stats
  getClientVersionStats: async (timeRange: string = '7d') => {
    const response = await api.get('/api/private/admin/logs/client-version-stats', { params: { time_range: timeRange } });
    return response.data;
  },

  getClientPlatformStats: async (timeRange: string = '7d') => {
    const response = await api.get('/api/private/admin/logs/client-platform-stats', { params: { time_range: timeRange } });
    return response.data;
  },

  getUserVersionRecords: async (timeRange: string = '7d') => {
    const response = await api.get('/api/private/admin/logs/user-version-records', { params: { time_range: timeRange } });
    return response.data;
  },

  // Client Logs
  getClientLogs: async (params?: {
    page?: number;
    limit?: number;
    user_id?: string;
    client_version?: string;
    client_hash?: string;
    os_version?: string;
    log_type?: string;
    search?: string;
  }) => {
    const response = await api.get('/api/private/admin/logs/client-logs', { params });
    return response.data;
  },

  deleteClientLog: async (logId: string) => {
    const response = await api.delete(`/api/private/admin/logs/client-logs/${logId}`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action_type?: string;
    search?: string;
  }) => {
    const response = await api.get('/api/private/admin/logs/audit-logs', { params });
    return response.data;
  },

  // Anticheat
  getAnticheatDetections: async (params?: {
    user_id?: number;
    score_id?: number;
    risk_level?: string;
    flagged_only?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/private/anticheat/detections', { params });
    return response.data;
  },

  getAnticheatDetection: async (detectionId: number) => {
    const response = await api.get(`/api/private/anticheat/detections/${detectionId}`);
    return response.data;
  },

  flagDetection: async (detectionId: number) => {
    const response = await api.post(`/api/private/anticheat/detections/${detectionId}/flag`);
    return response.data;
  },

  dismissDetection: async (detectionId: number) => {
    const response = await api.post(`/api/private/anticheat/detections/${detectionId}/dismiss`);
    return response.data;
  },

  getAnticheatStats: async () => {
    const response = await api.get('/api/private/anticheat/stats');
    return response.data;
  },

  // Login Audit
  getLoginAudit: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    user_id?: number;
    client_version?: string;
    client_hash?: string;
    os_version?: string;
    login_success?: boolean;
    login_method?: string;
    time_range?: string;
  }) => {
    const response = await api.get('/api/private/admin/logs/login-audit', { params });
    return response.data;
  },

  // Unknown Client Hashes
  getUnknownClientHashes: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }) => {
    const response = await api.get('/api/private/admin/client-hashes/unknown', { params });
    return response.data;
  },

  assignClientHash: async (data: {
    client_hash: string;
    client_name: string;
    version?: string;
    os_name?: string;
  }) => {
    const response = await api.post('/api/private/admin/client-hashes/assign', data);
    return response.data;
  },

  // Changelog Management
  getChangelogBuilds: async () => {
    const response = await api.get('/api/private/changelog/admin/builds');
    return response.data;
  },

  getChangelogEntries: async (buildId: number) => {
    const response = await api.get(`/api/private/changelog/admin/entries/${buildId}`);
    return response.data;
  },

  createChangelogStream: async (data: {
    name: string;
    display_name: string;
    is_featured?: boolean;
    user_count?: number;
  }) => {
    const response = await api.post('/api/private/changelog/streams', data);
    return response.data;
  },

  createChangelogBuild: async (data: {
    stream_id: number;
    version: string;
    display_version: string;
    users?: number;
    created_at?: string;
  }) => {
    const response = await api.post('/api/private/changelog/builds', data);
    return response.data;
  },

  createChangelogEntry: async (data: {
    build_id: number;
    repository?: string;
    github_pull_request_id?: number;
    github_url?: string;
    url?: string;
    type: string;
    category: string;
    title: string;
    message_html?: string;
    major?: boolean;
  }) => {
    const response = await api.post('/api/private/changelog/entries', data);
    return response.data;
  },

  deleteChangelogEntry: async (entryId: number) => {
    const response = await api.delete(`/api/private/changelog/entries/${entryId}`);
    return response.data;
  },

  deleteChangelogBuild: async (buildId: number) => {
    const response = await api.delete(`/api/private/changelog/builds/${buildId}`);
    return response.data;
  },

  getGitHubCommits: async (repo: string = 'shikkesora/torii-osu', perPage: number = 20) => {
    const response = await api.get(`/api/private/changelog/github/commits`, { params: { repo, per_page: perPage } });
    return response.data;
  },

  createEntryFromCommit: async (buildId: number, commitSha: string, commitMessage: string, repo: string = 'shikkesora/torii-osu') => {
    const response = await api.post('/api/private/changelog/entries/from-commit', {
      build_id: buildId,
      commit_sha: commitSha,
      commit_message: commitMessage,
      repo,
    });
    return response.data;
  },
};
