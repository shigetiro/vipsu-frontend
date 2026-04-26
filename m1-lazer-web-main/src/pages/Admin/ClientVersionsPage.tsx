import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  RefreshCw,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  Users,
  Package,
  ChevronDown,
} from 'lucide-react';
import { adminAPI } from '../../utils/api/admin';

// Types
interface VersionStat {
  version: string;
  count: number;
  percentage: number;
  last_seen: string;
}

interface PlatformStat {
  os_version: string;
  count: number;
  percentage: number;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

// Color palette for charts (osu! themed)
const CHART_COLORS = [
  '#FF66AB',
  '#66B3FF',
  '#66FFB3',
  '#FFB366',
  '#B366FF',
  '#FF6B6B',
  '#6BCB77',
  '#4D96FF',
  '#9B59B6',
  '#3498DB',
];

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

// Button Component
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

// Select Component
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select
    className={`px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors ${className}`}
    {...props}
  >
    {children}
  </select>
);

// Stat Card Component
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

// Custom tooltip for charts
const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = 'version' in data ? data.version : data.os_version;

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-1">{name || 'Unknown'}</p>
        <p className="text-gray-400 text-sm">Count: <span className="text-white">{payload[0].value.toLocaleString()}</span></p>
        <p className="text-gray-400 text-sm">Share: <span className="text-white">{data.percentage.toFixed(1)}%</span></p>
      </div>
    );
  }
  return null;
};

const ClientVersionsPage: React.FC = () => {
  const [versionStats, setVersionStats] = useState<VersionStat[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const isMountedRef = useRef(true);

  const safeVersionStats = Array.isArray(versionStats) ? versionStats : [];
  const safePlatformStats = Array.isArray(platformStats) ? platformStats : [];

  const fetchVersionStats = useCallback(async (range: TimeRange): Promise<VersionStat[]> => {
    const response = await adminAPI.getClientVersionStats(range);
    return response;
  }, []);

  const fetchPlatformStats = useCallback(async (range: TimeRange): Promise<PlatformStat[]> => {
    const response = await adminAPI.getClientPlatformStats(range);
    return response;
  }, []);

  const fetchAllData = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    setError(null);

    try {
      const [versions, platforms] = await Promise.all([
        fetchVersionStats(range),
        fetchPlatformStats(range),
      ]);

      if (isMountedRef.current) {
        setVersionStats(versions);
        setPlatformStats(platforms);
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
  }, [fetchVersionStats, fetchPlatformStats]);

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

  const totalUsers = safeVersionStats.reduce((sum, stat) => sum + stat.count, 0);
  const mostPopularVersion = safeVersionStats[0]?.version || 'N/A';
  const mostPopularPercentage = safeVersionStats[0]?.percentage || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Client Versions</h1>
            <p className="text-sm text-gray-400">
              Monitor client version distribution and platform statistics
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

      {/* Time Range Selector */}
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

      {/* Error Banner */}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          icon={<Users size={20} />}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          title="Unique Versions"
          value={safeVersionStats.length}
          icon={<Package size={20} />}
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          title="Most Popular"
          value={mostPopularVersion}
          icon={<Monitor size={20} />}
          color="bg-green-500/20 text-green-400"
        />
        <StatCard
          title="Share"
          value={`${mostPopularPercentage.toFixed(1)}%`}
          icon={<Globe size={20} />}
          color="bg-amber-500/20 text-amber-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Version Distribution Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Client Version Distribution</h3>
          {isLoading && safeVersionStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : safeVersionStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <span>No version data available</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={safeVersionStats as any[]}
                  dataKey="count"
                  nameKey="version"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.version}: ${entry.percentage.toFixed(1)}%`}
                  labelLine={true}
                >
                  {safeVersionStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => <span className="text-gray-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform Distribution Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Distribution</h3>
          {isLoading && safePlatformStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : safePlatformStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <span>No platform data available</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={safePlatformStats}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="os_version" type="category" width={90} stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]}>
                  {safePlatformStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Version Statistics Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Detailed Version Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User Count</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {safeVersionStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No client version data available</p>
                  </td>
                </tr>
              ) : (
                safeVersionStats.map((stat, index) => (
                  <tr key={stat.version || `version-${index}`} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-white font-medium">{stat.version || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{stat.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{stat.percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(stat.last_seen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Statistics Table */}
      {safePlatformStats.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Platform Statistics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Operating System</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User Count</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {safePlatformStats.map((stat, index) => (
                  <tr key={stat.os_version || `os-${index}`} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-white font-medium">{stat.os_version || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{stat.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{stat.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ClientVersionsPage;
