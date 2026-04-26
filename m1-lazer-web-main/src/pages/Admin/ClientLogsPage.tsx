import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Search,
  Trash2,
  Eye,
  Code,
  User,
  Monitor,
  FileText,
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import ClientLogDetailModal from '../../components/Admin/ClientLogDetailModal';
import ClientLogStats from '../../components/Admin/ClientLogStats';
import UnknownHashesManagement from '../../components/Admin/UnknownHashesManagement';
import { adminAPI } from '../../utils/api/admin';
import type { ClientLog } from '../../api/admin';

// Log Type Badge Component
const LogTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const colors: Record<string, string> = {
    CRASH: 'bg-red-500/20 text-red-400 border-red-500/30',
    ERROR: 'bg-red-500/20 text-red-400 border-red-500/30',
    WARNING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    PERFORMANCE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    INFO: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const icons: Record<string, React.ReactNode> = {
    CRASH: <AlertTriangle size={12} />,
    ERROR: <AlertCircle size={12} />,
    WARNING: <AlertCircle size={12} />,
    PERFORMANCE: <Monitor size={12} />,
    INFO: <Info size={12} />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${colors[type] || colors.INFO}`}>
      {icons[type]}
      {type}
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

// Tab Button Component
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
      active
        ? 'text-blue-400 border-blue-400'
        : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-700/30'
    }`}
  >
    {icon}
    {children}
  </button>
);

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

const ClientLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'versions' | 'unknown'>('logs');
  const [logs, setLogs] = useState<ClientLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedLog, setSelectedLog] = useState<ClientLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  // Filters
  const [userId, setUserId] = useState('');
  const [clientVersion, setClientVersion] = useState('');
  const [clientHash, setClientHash] = useState('');
  const [osVersion, setOsVersion] = useState('');
  const [logType, setLogType] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getClientLogs({
        page,
        limit: pageSize,
        user_id: userId || undefined,
        client_version: clientVersion || undefined,
        client_hash: clientHash || undefined,
        os_version: osVersion || undefined,
        log_type: logType || undefined,
        search: search || undefined,
      });
      setLogs(result.logs || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('Failed to fetch client logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, userId, clientVersion, clientHash, osVersion, logType, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewLog = (log: ClientLog) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const handleDeleteClick = (logId: string) => {
    setLogToDelete(logId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!logToDelete) return;
    try {
      await adminAPI.deleteClientLog(logToDelete);
      setDeleteModalOpen(false);
      setLogToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const clearFilters = () => {
    setUserId('');
    setClientVersion('');
    setClientHash('');
    setOsVersion('');
    setLogType('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = userId || clientVersion || clientHash || osVersion || logType || search;

  const totalPages = Math.ceil(total / pageSize);

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
            <h1 className="text-2xl font-bold text-white mb-2">Client Logs</h1>
            <p className="text-sm text-gray-400">
              Monitor client logs, track usage statistics, and manage unknown client hashes
            </p>
          </div>
          <Button icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <TabButton
          active={activeTab === 'logs'}
          onClick={() => setActiveTab('logs')}
          icon={<FileText size={18} />}
        >
          Log Entries
        </TabButton>
        <TabButton
          active={activeTab === 'versions'}
          onClick={() => setActiveTab('versions')}
          icon={<Monitor size={18} />}
        >
          Client Versions
        </TabButton>
        <TabButton
          active={activeTab === 'unknown'}
          onClick={() => setActiveTab('unknown')}
          icon={<Shield size={18} />}
        >
          Unknown Hashes
        </TabButton>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Logs" value={total} color="text-blue-400" />
              <StatCard
                title="Error Logs"
                value={logs.filter(l => l.log_type === 'ERROR' || l.log_type === 'CRASH').length}
                color="text-red-400"
              />
              <StatCard
                title="Warning Logs"
                value={logs.filter(l => l.log_type === 'WARNING').length}
                color="text-amber-400"
              />
              <StatCard
                title="Info Logs"
                value={logs.filter(l => l.log_type === 'INFO').length}
                color="text-green-400"
              />
            </div>

            {/* Filters */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <Input
                  placeholder="User ID..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  icon={<User size={16} />}
                />
                <Input
                  placeholder="Client version..."
                  value={clientVersion}
                  onChange={(e) => setClientVersion(e.target.value)}
                  icon={<Code size={16} />}
                />
                <Input
                  placeholder="Client hash..."
                  value={clientHash}
                  onChange={(e) => setClientHash(e.target.value)}
                  icon={<Code size={16} />}
                />
                <Input
                  placeholder="OS version..."
                  value={osVersion}
                  onChange={(e) => setOsVersion(e.target.value)}
                  icon={<Monitor size={16} />}
                />
                <Select value={logType} onChange={(e) => setLogType(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="CRASH">CRASH</option>
                  <option value="ERROR">ERROR</option>
                  <option value="WARNING">WARNING</option>
                  <option value="PERFORMANCE">PERFORMANCE</option>
                  <option value="INFO">INFO</option>
                </Select>
              </div>
              <div className="flex gap-4">
                <Input
                  placeholder="Search usernames, versions, hashes, messages..."
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
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Client Version</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Client Hash</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">OS</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Message</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                          <span className="text-gray-400">Loading...</span>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No client logs found</p>
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
                            <LogTypeBadge type={log.log_type} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {(log.username || '?')[0].toUpperCase()}
                              </div>
                              <span className="text-gray-200">{log.username || 'Anonymous'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300 font-mono">{log.client_version}</td>
                          <td className="px-4 py-3 text-sm text-gray-400 font-mono truncate max-w-[180px]">
                            {log.client_hash ? `${log.client_hash.substring(0, 20)}...` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">{log.os_version || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-xs">{log.message}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => handleViewLog(log)} />
                              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDeleteClick(log.id)} />
                            </div>
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
          </motion.div>
        )}

        {activeTab === 'versions' && (
          <motion.div
            key="versions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ClientLogStats />
          </motion.div>
        )}

        {activeTab === 'unknown' && (
          <motion.div
            key="unknown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <UnknownHashesManagement />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <ClientLogDetailModal
        log={selectedLog}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedLog(null);
        }}
        onDelete={fetchData}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Log Entry?</h3>
                <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ClientLogsPage;
