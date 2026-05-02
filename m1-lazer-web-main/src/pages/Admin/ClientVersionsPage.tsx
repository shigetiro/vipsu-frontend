import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Users, Package, Clock, Globe, Terminal } from 'lucide-react';
import { adminAPI } from '../../utils/api/admin';

interface VersionStat {
  version: string;
  count: number;
  percentage: number;
  last_seen: string;
}

interface UserVersionRecord {
  osu_id: number;
  username: string;
  version: string;
  connect_count: number;
  last_connected: string;
  first_connected: string;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'secondary', size = 'md', icon, className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
    outline: 'border border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-700/50',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
};

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select
    className={`px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors ${className}`}
    {...props}
  >
    {children}
  </select>
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className={`p-4 bg-gray-800/50 border border-gray-700 rounded-xl`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider">{title}</div>
        <div className="text-xl font-bold text-white">{value}</div>
      </div>
    </div>
  </div>
);

const ClientVersionsPage: React.FC = () => {
  const [versionStats, setVersionStats] = useState<VersionStat[]>([]);
  const [userVersionRecords, setUserVersionRecords] = useState<UserVersionRecord[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedVersion, setSelectedVersion] = useState<string>('all');

  const isMountedRef = useRef(true);

  const safeVersionStats = Array.isArray(versionStats) ? versionStats : [];
  const safeUserRecords = Array.isArray(userVersionRecords) ? userVersionRecords : [];

  const fetchVersionStats = useCallback(async (range: TimeRange): Promise<VersionStat[]> => {
    const response = await adminAPI.getClientVersionStats(range);
    return response;
  }, []);

  const fetchUserVersionRecords = useCallback(async (range: TimeRange): Promise<UserVersionRecord[]> => {
    const response = await adminAPI.getUserVersionRecords(range);
    return response;
  }, []);

  const fetchAllData = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    setError(null);

    try {
      const [versions, userRecords] = await Promise.all([
        fetchVersionStats(range),
        fetchUserVersionRecords(range),
      ]);

      if (isMountedRef.current) {
        setVersionStats(versions);
        setUserVersionRecords(userRecords);
        setLastRefresh(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching client stats:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchVersionStats, fetchUserVersionRecords]);

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value as TimeRange;
    setTimeRange(newRange);
    fetchAllData(newRange);
  };

  const handleManualRefresh = () => {
    fetchAllData(timeRange);
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchAllData(timeRange);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAllData, timeRange]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetchAllData(timeRange);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchAllData, timeRange]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const totalUniqueUsers = safeUserRecords.length;
  const totalConnections = safeUserRecords.reduce((sum, record) => sum + record.connect_count, 0);

  const versionCounts = safeVersionStats.map(v => ({
    version: v.version,
    count: v.count,
    percentage: v.percentage,
    lastSeen: v.last_seen
  }));

  const filteredRecords = selectedVersion === 'all' 
    ? safeUserRecords 
    : safeUserRecords.filter(r => r.version === selectedVersion);

  const uniqueVersions = [...new Set(safeUserRecords.map(r => r.version))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Client Versions</h1>
            <p className="text-sm text-gray-400">
              Track client versions and user connections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button
              icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Time Range:</span>
          <Select value={timeRange} onChange={handleTimeRangeChange} className="w-40">
            {TIME_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <span>⚠️</span>
            <span>Failed to refresh data: {error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Connections"
          value={totalConnections.toLocaleString()}
          icon={<Terminal size={20} />}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          title="Unique Users"
          value={totalUniqueUsers.toLocaleString()}
          icon={<Users size={20} />}
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          title="Unique Versions"
          value={safeVersionStats.length}
          icon={<Package size={20} />}
          color="bg-green-500/20 text-green-400"
        />
        <StatCard
          title="Time Range"
          value={TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.label || 'N/A'}
          icon={<Globe size={20} />}
          color="bg-amber-500/20 text-amber-400"
        />
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Version Summary</h3>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="all">All Versions</option>
            {uniqueVersions.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Connections</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Share</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {versionCounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No client version data available</p>
                  </td>
                </tr>
              ) : (
                versionCounts.map((stat, index) => (
                  <tr key={stat.version || `version-${index}`} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{stat.version || 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{stat.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{stat.percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(stat.lastSeen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700">
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
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No user connection data available</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={`${record.osu_id}-${index}`} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-300">{record.osu_id}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{record.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{record.version}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{record.connect_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(record.first_connected)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(record.last_connected)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientVersionsPage;