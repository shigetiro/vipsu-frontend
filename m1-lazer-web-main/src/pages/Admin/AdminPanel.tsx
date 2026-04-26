import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import AdminUsers from './AdminUsers';
import AdminBeatmapBlacklist from './AdminBeatmapBlacklist';
import AdminBeatmap from './AdminBeatmap';
import AdminBadges from './AdminBadges';
import AdminTeams from './AdminTeams';
import AdminDailyChallenges from './AdminDailyChallenges';
import AnnouncementsPage from './AnnouncementsPage';
import SystemToolsPage from './SystemToolsPage';
import ClientVersionsPage from './ClientVersionsPage';
import ClientLogsPage from './ClientLogsPage';
import AuditLogsPage from './AuditLogsPage';

type AdminTab = 'dashboard' | 'users' | 'beatmaps' | 'beatmap-list' | 'badges' | 'teams' | 'daily-challenges' | 'announcements' | 'system-tools' | 'client-versions' | 'client-logs' | 'audit-logs';

interface AdminStats {
  total_users: number;
  online_users: number;
  total_pp: number;
  total_plays: number;
  total_scores: number;
  total_beatmaps: number;
  blacklisted_beatmaps: number;
  performance_server_status: 'online' | 'offline';
  api_server_status: 'online' | 'offline';
}

interface PendingCounts {
  pending_reports: number;
  pending_rank_requests: number;
  pending_announcements: number;
  total: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400 hover:border-blue-500/50',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400 hover:border-purple-500/50',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400 hover:border-orange-500/50',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400 hover:border-rose-500/50',
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:border-indigo-500/50',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400 hover:border-amber-500/50',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-500/50',
  };

  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] shadow-xl hover:shadow-2xl ${selectedColor} transform-gpu`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{title}</p>
            <div className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {value}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'} animate-pulse`}>
                <span className="animate-bounce">
                  {trend.isPositive ? '↑' : '↓'}
                </span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 transform-gpu w-14 h-14 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingCounts, setPendingCounts] = useState<PendingCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const isDev = (user as any)?.is_dev;

  useEffect(() => {
    if (!user || (!user.is_admin && !isDev)) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        const [statsData, countsData] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getPendingCounts().catch(() => null)
        ]);
        setStats(statsData);
        setPendingCounts(countsData);
      } catch (error) {
        console.error('Failed to load admin data:', error);
        toast.error('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  const formatNumber = (value?: number | null) => Number(value ?? 0).toLocaleString();
  const formatRoundedNumber = (value?: number | null) => Math.round(Number(value ?? 0)).toLocaleString();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div key="dashboard-content" className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl border border-blue-500/30 backdrop-blur-md"
        >
          <div className="rounded-xl bg-blue-500/20 p-3 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-500/30">
            <svg className="w-6 h-6 text-blue-400 transition-colors duration-300 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors duration-300">Users</p>
            <p className="text-xs text-blue-400/70 group-hover:text-blue-400/90 transition-colors duration-300">Manage user accounts and permissions</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('beatmap-list')}
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl border border-purple-500/30 backdrop-blur-md"
        >
          <div className="rounded-xl bg-purple-500/20 p-3 transition-transform duration-300 group-hover:scale-110 group-hover:bg-purple-500/30">
            <svg className="w-6 h-6 text-purple-400 transition-colors duration-300 group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-400 group-hover:text-purple-300 transition-colors duration-300">Beatmaps</p>
            <p className="text-xs text-purple-400/70 group-hover:text-purple-400/90 transition-colors duration-300">Manage ranked beatmaps and metadata</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl border border-amber-500/30 backdrop-blur-md"
        >
          <div className="rounded-xl bg-amber-500/20 p-3 transition-transform duration-300 group-hover:scale-110 group-hover:bg-amber-500/30">
            <svg className="w-6 h-6 text-amber-400 transition-colors duration-300 group-hover:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-400 group-hover:text-amber-300 transition-colors duration-300">Announce</p>
            <p className="text-xs text-amber-400/70 group-hover:text-amber-400/90 transition-colors duration-300">Send announcements to users</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('system-tools')}
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl border border-cyan-500/30 backdrop-blur-md"
        >
          <div className="rounded-xl bg-cyan-500/20 p-3 transition-transform duration-300 group-hover:scale-110 group-hover:bg-cyan-500/30">
            <svg className="w-6 h-6 text-cyan-400 transition-colors duration-300 group-hover:text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">System</p>
            <p className="text-xs text-cyan-400/70 group-hover:text-cyan-400/90 transition-colors duration-300">System tools and maintenance</p>
          </div>
        </button>
      </div>

            {/* Server Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`flex items-center justify-between rounded-xl border p-4 backdrop-blur-sm transition-all ${
                stats?.api_server_status === 'online'
                  ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30'
                  : 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`relative flex h-3 w-3`}>
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
                      stats?.api_server_status === 'online' ? 'bg-green-400' : 'bg-red-400'
                    } opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      stats?.api_server_status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <span className="font-semibold">API Server</span>
                </div>
                <span className={`text-sm font-bold uppercase ${
                  stats?.api_server_status === 'online' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats?.api_server_status}
                </span>
              </div>

              <div className={`flex items-center justify-between rounded-xl border p-4 backdrop-blur-sm transition-all ${
                stats?.performance_server_status === 'online'
                  ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30'
                  : 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`relative flex h-3 w-3`}>
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
                      stats?.performance_server_status === 'online' ? 'bg-green-400' : 'bg-red-400'
                    } opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      stats?.performance_server_status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <span className="font-semibold">Performance Server</span>
                </div>
                <span className={`text-sm font-bold uppercase ${
                  stats?.performance_server_status === 'online' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats?.performance_server_status}
                </span>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Registered Users"
                value={formatNumber(stats?.total_users)}
                color="blue"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />

              <StatCard
                title="Online Users"
                value={formatNumber(stats?.online_users)}
                color="green"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                }
              />

              <StatCard
                title="Total PP"
                value={formatRoundedNumber(stats?.total_pp)}
                color="purple"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />

              <StatCard
                title="Total Plays"
                value={formatNumber(stats?.total_plays)}
                color="orange"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              <StatCard
                title="Total Scores"
                value={formatNumber(stats?.total_scores)}
                color="rose"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />

              <StatCard
                title="Listed Beatmaps"
                value={formatNumber(stats?.total_beatmaps)}
                color="indigo"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                }
              />

              <StatCard
                title="Blacklisted"
                value={formatNumber(stats?.blacklisted_beatmaps)}
                color="amber"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              />
            </div>
          </div>
        );
      case 'users':
        return <AdminUsers key="tab-users" />;
      case 'beatmaps':
        return <AdminBeatmapBlacklist key="tab-beatmaps" />;
      case 'beatmap-list':
        return <AdminBeatmap key="tab-beatmap-list" />;
      case 'badges':
        return <AdminBadges key="tab-badges" />;
      case 'teams':
        return <AdminTeams key="tab-teams" />;
      case 'daily-challenges':
        return <AdminDailyChallenges key="tab-daily-challenges" />;
      case 'announcements':
        return <AnnouncementsPage key="tab-announcements" />;
      case 'system-tools':
        return isDev ? <SystemToolsPage key="tab-system-tools" /> : <div key="tab-system-tools-denied">Access Denied</div>;
      case 'client-versions':
        return <ClientVersionsPage key="tab-client-versions" />;
      case 'client-logs':
        return <ClientLogsPage key="tab-client-logs" />;
      case 'audit-logs':
        return <AuditLogsPage key="tab-audit-logs" />;
      default:
        return <div key="tab-default">Select a tab</div>;
    }
  };

  if (!user || !user.is_admin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-gray-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'users' as AdminTab, label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'beatmaps' as AdminTab, label: 'Blacklist', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
    { id: 'beatmap-list' as AdminTab, label: 'Beatmaps', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
    { id: 'badges' as AdminTab, label: 'Badges', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { id: 'teams' as AdminTab, label: 'Teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'daily-challenges' as AdminTab, label: 'Daily Challenges', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'announcements' as AdminTab, label: 'Announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { id: 'system-tools' as AdminTab, label: 'System Tools', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'client-versions' as AdminTab, label: 'Client Versions', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'client-logs' as AdminTab, label: 'Client Logs', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { id: 'audit-logs' as AdminTab, label: 'Audit Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m9 9v-3a1 1 0 00-1-1h-1a1 1 0 00-1 1v3a1 1 0 001 1h1a1 1 0 001-1zm-3 0h.01' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/30">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-sm text-gray-400">Server Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats && (
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <div className={`h-2 w-2 rounded-full ${stats.api_server_status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-gray-300">API: {stats.api_server_status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-6 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-4">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const hasBadge = item.id === 'dashboard' && pendingCounts && pendingCounts.total > 0;

                  return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ease-out transform-gpu ${
                          isActive
                      ? 'bg-gradient-to-r from-pink-500/25 to-pink-600/15 text-pink-400 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500/30'
                      : 'text-gray-400 hover:bg-white/8 hover:text-white hover:translate-x-1 hover:shadow-lg' }                       }`}
                      >
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {hasBadge && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs font-bold text-white shadow-lg shadow-pink-500/30">
                          {pendingCounts?.total}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
              {/* Content Header */}
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-8 rounded-full bg-gradient-to-r from-pink-500 to-pink-600" />
                    <h2 className="text-xl font-bold text-white">
                      {{
                        'dashboard': 'Dashboard',
                        'users': 'User Management',
                        'beatmaps': 'Beatmap Blacklist',
                        'beatmap-list': 'Beatmap Management',
                        'badges': 'Badge Management',
                        'teams': 'Team Management',
                        'daily-challenges': 'Daily Challenge Management',
                        'announcements': 'Announcements',
                        'system-tools': 'System Tools',
                        'client-versions': 'Client Versions',
                        'client-logs': 'Client Logs',
                        'audit-logs': 'Audit Logs',
                      }[activeTab] || 'Admin Panel'}
                    </h2>
                  </div>
                  {activeTab === 'dashboard' && (
                    <button
                      onClick={() => {
                        // Refresh data
                        window.location.reload();
                      }}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="px-6 py-6">
                {loading && activeTab === 'dashboard' ? (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500" />
                      <p className="text-sm text-gray-400">Loading dashboard...</p>
                    </div>
                  </div>
                ) : (
                  renderTabContent()
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPanel;
