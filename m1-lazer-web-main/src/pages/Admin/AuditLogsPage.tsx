import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Search,
  Trash2,
  Eye,
  User,
  Shield,
  AlertTriangle,
  X,
  Filter,
  Calendar,
  FileText
} from 'lucide-react';
import AuditLogDetailModal from '../../components/Admin/AuditLogDetailModal';
import { adminAPI } from '../../utils/api/admin';
import type { AuditLog } from '../../api/admin';

// Action Type Badge Component
const ActionTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const colors: Record<string, string> = {
    USER_BAN: 'bg-red-500/20 text-red-400 border-red-500/30',
    USER_UNBAN: 'bg-green-500/20 text-green-400 border-green-500/30',
    USER_ROLE_CHANGE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    BEATMAP_DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    BEATMAP_RANK: 'bg-green-500/20 text-green-400 border-green-500/30',
    BEATMAP_UNRANK: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    SCORE_DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    TEAM_DISBAND: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    SETTINGS_CHANGE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ANNOUNCEMENT_CREATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    MAINTENANCE_MODE_TOGGLE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  const labels: Record<string, string> = {
    USER_BAN: 'User Ban',
    USER_UNBAN: 'User Unban',
    USER_ROLE_CHANGE: 'Role Change',
    BEATMAP_DELETE: 'Beatmap Delete',
    BEATMAP_RANK: 'Beatmap Rank',
    BEATMAP_UNRANK: 'Beatmap Unrank',
    SCORE_DELETE: 'Score Delete',
    TEAM_DISBAND: 'Team Disband',
    SETTINGS_CHANGE: 'Settings Change',
    ANNOUNCEMENT_CREATE: 'Announcement Create',
    MAINTENANCE_MODE_TOGGLE: 'Maintenance Toggle',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${colors[type] || colors.SETTINGS_CHANGE}`}>
      {labels[type] || type}
    </span>
  );
};

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

// Input Component
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }> = ({
  icon,
  className = '',
  ...props
}) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        {icon}
      </div>
    )}
    <input
      className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
        icon ? 'pl-10' : ''
      } ${className}`}
      {...props}
    />
  </div>
);

// Select Component
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors ${className}`} {...props}>
    {children}
  </select>
);

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number;
  color: string;
}> = ({ title, value, color }) => (
  <div className={`p-4 bg-gray-800/50 border border-gray-700 rounded-xl`}>
    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</div>
    <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
  </div>
);

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [actionType, setActionType] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getAuditLogs({
        page,
        limit: pageSize,
        action_type: actionType || undefined,
        search: search || undefined,
      });
      setLogs(result.logs || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionType, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setActionType('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = actionType || search;

  const totalPages = Math.ceil(total / pageSize);

  // Calculate stats
  const userActionCount = logs.filter(l => l.action_type?.startsWith('USER_')).length;
  const beatmapActionCount = logs.filter(l => l.action_type?.startsWith('BEATMAP')).length;
  const otherActionCount = logs.length - userActionCount - beatmapActionCount;

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
            <h1 className="text-2xl font-bold text-white mb-2">Audit Logs</h1>
            <p className="text-sm text-gray-400">
              Track administrative actions performed on the server
            </p>
          </div>
          <Button icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Logs" value={total} color="text-blue-400" />
        <StatCard title="User Actions" value={userActionCount} color="text-purple-400" />
        <StatCard title="Beatmap Actions" value={beatmapActionCount} color="text-green-400" />
        <StatCard title="Other Actions" value={otherActionCount} color="text-amber-400" />
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
        <div className="flex gap-4">
          <Select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-48">
            <option value="">All Action Types</option>
            <option value="USER_BAN">User Ban</option>
            <option value="USER_UNBAN">User Unban</option>
            <option value="USER_ROLE_CHANGE">Role Change</option>
            <option value="BEATMAP_RANK">Beatmap Rank</option>
            <option value="BEATMAP_UNRANK">Beatmap Unrank</option>
            <option value="BEATMAP_DELETE">Beatmap Delete</option>
            <option value="SCORE_DELETE">Score Delete</option>
            <option value="TEAM_DISBAND">Team Disband</option>
            <option value="SETTINGS_CHANGE">Settings Change</option>
            <option value="ANNOUNCEMENT_CREATE">Announcement Create</option>
            <option value="MAINTENANCE_MODE_TOGGLE">Maintenance Toggle</option>
          </Select>
          <Input
            placeholder="Search actor or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
            className="flex-1"
          />
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          )}
          <Button variant="primary" icon={<Search size={16} />} onClick={fetchData}>
            Search
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                    <span className="text-gray-400">Loading...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs found</p>
                    {hasActiveFilters && <p className="text-sm mt-2">Try adjusting your filters</p>}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                          {(log.actor_username || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-gray-200">{log.actor_username || '[Deleted User]'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ActionTypeBadge type={log.action_type} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      <div className="flex flex-col">
                        <span>{log.target_name || '[Deleted]'}</span>
                        <span className="text-xs text-gray-500">{log.target_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                      {log.reason || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => handleViewLog(log)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {logs.length} of {total} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-400 px-2">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
            <Select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-20"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AuditLogDetailModal
        isOpen={modalOpen}
        log={selectedLog}
        onClose={() => {
          setModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </motion.div>
  );
};

export default AuditLogsPage;
