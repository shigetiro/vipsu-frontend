import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Search,
  Code,
  User,
  Monitor,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ClientLogStats from '../../components/Admin/ClientLogStats';
import UnknownHashesManagement from '../../components/Admin/UnknownHashesManagement';
import { adminAPI } from '../../utils/api/admin';
import type { LoginAuditEntry } from '../../api/admin';

const LoginSuccessBadge: React.FC<{ success: boolean }> = ({ success }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${
    success 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-red-500/20 text-red-400 border-red-500/30'
  }`}>
    {success ? <CheckCircle size={12} /> : <XCircle size={12} />}
    {success ? 'Success' : 'Failed'}
  </span>
);

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

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors ${className}`} {...props}>
    {children}
  </select>
);

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
  const [activeTab, setActiveTab] = useState<'audit' | 'versions' | 'unknown'>('audit');
  const [logs, setLogs] = useState<LoginAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [userId, setUserId] = useState('');
  const [clientVersion, setClientVersion] = useState('');
  const [clientHash, setClientHash] = useState('');
  const [osVersion, setOsVersion] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loginMethod, setLoginMethod] = useState('');
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getLoginAudit({
        page,
        per_page: pageSize,
        user_id: userId ? parseInt(userId) : undefined,
        client_version: clientVersion || undefined,
        client_hash: clientHash || undefined,
        os_version: osVersion || undefined,
        login_success: loginSuccess === '' ? undefined : loginSuccess === 'true',
        login_method: loginMethod || undefined,
        search: search || undefined,
        time_range: timeRange,
      });
      setLogs(result.logs || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('Failed to fetch login audit:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, userId, clientVersion, clientHash, osVersion, loginSuccess, loginMethod, search, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setUserId('');
    setClientVersion('');
    setClientHash('');
    setOsVersion('');
    setLoginSuccess('');
    setLoginMethod('');
    setSearch('');
    setTimeRange('7d');
    setPage(1);
  };

  const hasActiveFilters = userId || clientVersion || clientHash || osVersion || loginSuccess || loginMethod || search;
  const totalPages = Math.ceil(total / pageSize);

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
            <h1 className="text-2xl font-bold text-white mb-2">Login Audit</h1>
            <p className="text-sm text-gray-400">
              Track user logins, client versions, and device information
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="w-32">
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </Select>
            <Button icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />} onClick={fetchData}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-700 mb-6">
        <TabButton
          active={activeTab === 'audit'}
          onClick={() => setActiveTab('audit')}
          icon={<Shield size={18} />}
        >
          Login Audit
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
        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Logins" value={total} color="text-blue-400" />
              <StatCard
                title="Successful"
                value={logs.filter(l => l.login_success).length}
                color="text-green-400"
              />
              <StatCard
                title="Failed"
                value={logs.filter(l => !l.login_success).length}
                color="text-red-400"
              />
              <StatCard
                title="Unique Users"
                value={new Set(logs.map(l => l.user_id)).size}
                color="text-purple-400"
              />
            </div>

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
                <Select value={loginSuccess} onChange={(e) => setLoginSuccess(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Select value={loginMethod} onChange={(e) => setLoginMethod(e.target.value)}>
                  <option value="">All Methods</option>
                  <option value="password">Password</option>
                  <option value="oauth">OAuth</option>
                  <option value="session_resume">Session Resume</option>
                </Select>
                <Input
                  placeholder="Search users, IPs, hashes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search size={16} />}
                  className="col-span-1 sm:col-span-2 lg:col-span-2"
                />
              </div>
              <div className="flex gap-4">
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

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">OS</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Hash</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
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
                          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No login records found</p>
                          {hasActiveFilters && <p className="text-sm mt-2">Try adjusting your filters</p>}
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                            {new Date(log.login_time).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {(log.username || '?')[0].toUpperCase()}
                              </div>
                              <span className="text-gray-200">{log.username || `User ${log.user_id}`}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                            {log.client_version || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {log.os_version || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400 font-mono truncate max-w-[120px]">
                            {log.client_hash ? `${log.client_hash.substring(0, 16)}...` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {log.login_method || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <LoginSuccessBadge success={log.login_success} />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {log.country_name || log.ip_address || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

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
    </motion.div>
  );
};

export default ClientLogsPage;