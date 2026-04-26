import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { adminAPI } from '../../utils/api';

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

interface TooltipPayload {
  name: string;
  value: number;
  payload: VersionStat | PlatformStat;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

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

const ClientVersionOverview: React.FC = () => {
  const [versionStats, setVersionStats] = useState<VersionStat[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  
    // Ensure stats are always arrays
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

  // Initial fetch and time range changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchAllData(timeRange);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAllData, timeRange]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetchAllData(timeRange);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchAllData, timeRange]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format percentage for display
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Custom tooltip for charts
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const name = 'version' in data ? data.version : data.os_version;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{name || 'Unknown'}</p>
          <p className="tooltip-value">
            Count: {payload[0].value.toLocaleString()}
          </p>
          <p className="tooltip-percentage">
            Share: {formatPercentage(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Render loading state
  if (isLoading && versionStats.length === 0 && platformStats.length === 0) {
    return (
      <div className="client-version-overview">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading client version statistics...</p>
        </div>
      </div>
    );
  }

  // Render error state (only if no data available)
  if (error && versionStats.length === 0) {
    return (
      <div className="client-version-overview">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={handleManualRefresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-version-overview">
      {/* Header */}
      <div className="overview-header">
        <h2 className="overview-title">Client Version Overview</h2>
        <div className="header-controls">
          <div className="time-range-selector">
            <label htmlFor="time-range">Time Range:</label>
            <select
              id="time-range"
              value={timeRange}
              onChange={handleTimeRangeChange}
              disabled={isLoading}
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="refresh-button"
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <span className="last-refresh">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Error Banner (when data exists but refresh failed) */}
      {error && versionStats.length > 0 && (
        <div className="error-banner">
          <span>⚠️ Failed to refresh data: {error}</span>
          <button onClick={handleManualRefresh}>Retry</button>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-container">
        {/* Version Distribution Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Client Version Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={safeVersionStats as any[]}
                  dataKey="count"
                  nameKey="version"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => {
                    const { version, percentage } = entry;
                    return `${version}: ${formatPercentage(percentage)}`;
                  }}
                  labelLine={true}
                >
                  {safeVersionStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="legend-text">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Platform Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={safePlatformStats}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="os_version" type="category" width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Users">
                  {safePlatformStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Version Statistics Table */}
      <div className="table-card">
        <h3 className="table-title">Detailed Version Statistics</h3>
        <div className="table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>User Count</th>
                <th>Percentage</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {safeVersionStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="no-data">
                    No client version data available for the selected time range.
                  </td>
                </tr>
              ) : (
                safeVersionStats.map((stat, index) => (
                  <tr key={stat.version || `version-${index}`}>
                    <td>
                      <div className="version-cell">
                        <span
                          className="version-color"
                          style={{
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="version-name">{stat.version || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{stat.count.toLocaleString()}</td>
                    <td>{formatPercentage(stat.percentage)}</td>
                    <td>{formatDate(stat.last_seen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        {safeVersionStats.length > 0 && (
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Total Unique Versions:</span>
              <span className="summary-value">{safeVersionStats.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Users Tracked:</span>
              <span className="summary-value">
                {safeVersionStats.reduce((sum, stat) => sum + stat.count, 0).toLocaleString()}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Most Popular Version:</span>
              <span className="summary-value">
                {safeVersionStats[0]?.version || 'N/A'} ({formatPercentage(safeVersionStats[0]?.percentage || 0)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Platform Statistics Table */}
      {safePlatformStats.length > 0 && (
        <div className="table-card">
          <h3 className="table-title">Platform Statistics</h3>
          <div className="table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Operating System</th>
                  <th>User Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {safePlatformStats.map((stat, index) => (
                  <tr key={stat.os_version || `os-${index}`}>
                    <td>
                      <div className="version-cell">
                        <span
                          className="version-color"
                          style={{
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="version-name">{stat.os_version || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{stat.count.toLocaleString()}</td>
                    <td>{formatPercentage(stat.percentage)}</td>
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

export default ClientVersionOverview;