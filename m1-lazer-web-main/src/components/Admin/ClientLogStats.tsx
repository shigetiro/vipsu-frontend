import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { RefreshCw, Users, Monitor, Clock, ChevronDown } from 'lucide-react';
import { adminAPI } from '../../utils/api/admin';

interface VersionStats {
  version: string;
  count: number;
  percentage: number;
  last_seen: string;
}

interface PlatformStats {
  os_version: string;
  count: number;
  percentage: number;
}

interface AdoptionTrend {
  date: string;
  [version: string]: string | number;
}

interface ClientLogStatsProps {
  timeRange?: '24h' | '7d' | '30d' | 'all';
}

interface StatsResponse {
  total_users: number;
  versions: VersionStats[];
  platforms: PlatformStats[];
  adoption_trend?: AdoptionTrend[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}> = ({ title, value, icon, color, suffix }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-4 rounded-xl border ${color} bg-gray-800/50`}
  >
    <div className="text-sm text-gray-400 mb-1">{title}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-white">{value}</span>
      {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
    </div>
  </motion.div>
);

const ClientLogStats: React.FC<ClientLogStatsProps> = ({ timeRange: initialTimeRange = '7d' }) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>(initialTimeRange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [versionData, platformData] = await Promise.all([
        adminAPI.getClientVersionStats(timeRange),
        adminAPI.getClientPlatformStats(timeRange),
      ]);
      // API returns arrays directly, not wrapped in an object
      const versions = Array.isArray(versionData) ? versionData : (versionData?.versions || []);
      const platforms = Array.isArray(platformData) ? platformData : (platformData?.platforms || []);
      setStats({
        total_users: versions.reduce((sum: number, v: any) => sum + (v.count || 0), 0),
        versions,
        platforms,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching client version stats:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const timeRangeLabels = {
    '24h': 'Last 24h',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    'all': 'All time',
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-3 text-gray-400">Loading statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const pieData = stats.versions?.map((v, i) => ({ name: v.version, value: v.count, color: COLORS[i % COLORS.length] })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Client Version Overview</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {timeRangeLabels[timeRange]}
              <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-10">
                {(Object.keys(timeRangeLabels) as Array<keyof typeof timeRangeLabels>).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeRange(key);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${
                      timeRange === key ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    {timeRangeLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Users"
          value={stats.total_users}
          suffix="users"
          icon={<Users size={20} />}
          color="border-blue-500/30"
        />
        <StatCard
          title="Unique Versions"
          value={stats.versions?.length || 0}
          icon={<Monitor size={20} />}
          color="border-green-500/30"
        />
        <StatCard
          title="Most Popular"
          value={stats.versions?.[0]?.version || 'N/A'}
          suffix={stats.versions?.[0] ? `${stats.versions[0].count} users` : undefined}
          icon={<Monitor size={20} />}
          color="border-amber-500/30"
        />
        <StatCard
          title="Last Updated"
          value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          icon={<Clock size={20} />}
          color="border-purple-500/30"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version Distribution Pie Chart */}
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Version Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Version Usage Bar Chart */}
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Top 10 Versions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.versions?.slice(0, 10) || []}>
              <XAxis
                dataKey="version"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                itemStyle={{ color: '#f3f4f6' }}
              />
              <Bar dataKey="count" fill="#3b82f6" name="Users" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Version Details Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Version Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Users</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {stats.versions?.map((version, index) => (
                <tr key={version.version} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] + '30', color: COLORS[index % COLORS.length] }}
                    >
                      {version.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{version.count}</td>
                  <td className="px-4 py-3 text-gray-300">{version.percentage.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(version.last_seen)}</td>
                </tr>
              ))}
              {(!stats.versions || stats.versions.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No version data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Distribution */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Platform Distribution</h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.platforms?.slice(0, 8) || []} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                dataKey="os_version"
                type="category"
                width={100}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                itemStyle={{ color: '#f3f4f6' }}
              />
              <Bar dataKey="count" fill="#10b981" name="Users" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Users</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {stats.platforms?.map((platform) => (
                <tr key={platform.os_version} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-300">{platform.os_version}</td>
                  <td className="px-4 py-3 text-gray-300">{platform.count}</td>
                  <td className="px-4 py-3 text-gray-300">{platform.percentage.toFixed(1)}%</td>
                </tr>
              ))}
              {(!stats.platforms || stats.platforms.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No platform data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientLogStats;
