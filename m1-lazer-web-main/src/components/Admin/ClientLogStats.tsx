import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ChevronDown } from 'lucide-react';
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

interface UserVersionRecord {
  osu_id: number;
  username: string;
  version: string;
  connect_count: number;
  last_connected: string;
  first_connected: string;
}

interface ClientLogStatsProps {
  timeRange?: '24h' | '7d' | '30d' | 'all';
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  color: string;
  suffix?: string;
}> = ({ title, value, color, suffix }) => (
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
  const [versions, setVersions] = useState<VersionStats[]>([]);
  const [platforms, setPlatforms] = useState<PlatformStats[]>([]);
  const [userRecords, setUserRecords] = useState<UserVersionRecord[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>('all');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [versionData, platformData, userData] = await Promise.all([
        adminAPI.getClientVersionStats(timeRange),
        adminAPI.getClientPlatformStats(timeRange),
        adminAPI.getUserVersionRecords(timeRange),
      ]);
      const versionList = Array.isArray(versionData) ? versionData : (versionData?.versions || []);
      const platformList = Array.isArray(platformData) ? platformData : (platformData?.platforms || []);
      const records = Array.isArray(userData) ? userData : (userData?.records || []);
      setVersions(versionList);
      setPlatforms(platformList);
      setUserRecords(records);
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const timeRangeLabels = {
    '24h': 'Last 24h',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    'all': 'All time',
  };

  if (loading && versions.length === 0) {
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

  const totalUsers = versions.reduce((sum, v) => sum + (v.count || 0), 0);
  const totalConnections = userRecords.reduce((sum, r) => sum + r.connect_count, 0);
  const uniqueUsers = userRecords.length;
  const uniqueVersions = versions.length;

  const filteredRecords = selectedVersion === 'all'
    ? userRecords
    : userRecords.filter(r => r.version === selectedVersion);

  const versionOptions = [...new Set(userRecords.map(r => r.version))];

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Users"
          value={totalUsers}
          suffix="users"
          color="border-blue-500/30"
        />
        <StatCard
          title="Unique Users"
          value={uniqueUsers}
          color="border-purple-500/30"
        />
        <StatCard
          title="Total Connections"
          value={totalConnections}
          color="border-green-500/30"
        />
        <StatCard
          title="Unique Versions"
          value={uniqueVersions}
          color="border-amber-500/30"
        />
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Version Summary</h3>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="all">All Versions</option>
            {versionOptions.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
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
              {versions.map((version) => (
                <tr key={version.version} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{version.version}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{version.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{version.percentage.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(version.last_seen)}</td>
                </tr>
              ))}
              {(versions.length === 0) && (
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

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">User Connections by Version</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Connections</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">First Seen</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Connected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredRecords.map((record, index) => (
                <tr key={`${record.osu_id}-${index}`} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-300">{record.osu_id}</td>
                  <td className="px-4 py-3 text-white font-medium">{record.username}</td>
                  <td className="px-4 py-3 text-gray-300">{record.version}</td>
                  <td className="px-4 py-3 text-gray-300">{record.connect_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(record.first_connected)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(record.last_connected)}</td>
                </tr>
              ))}
              {(filteredRecords.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No user connection data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {platforms.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Platform Statistics</h3>
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
                {platforms.map((platform) => (
                  <tr key={platform.os_version} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-300">{platform.os_version}</td>
                    <td className="px-4 py-3 text-gray-300">{platform.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-300">{platform.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientLogStats;