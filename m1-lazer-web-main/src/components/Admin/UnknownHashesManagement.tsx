import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  Monitor,
  Apple,
  Smartphone,
  Laptop,
  CheckCircle,
  X,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { adminAPI } from '../../utils/api/admin';
import type { UnknownHashEntry } from '../../api/admin';

// Button Component
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}> = ({ children, variant = 'secondary', size = 'md', icon, className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
    outline: 'border border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-700/50',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
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
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
    {...props}
  />
);

// Select Component
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors" {...props}>
    {props.children}
  </select>
);

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
}> = ({ title, value, color, icon }) => (
  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</div>
    <div className="flex items-center justify-between">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-')}/10`}>{icon}</div>
    </div>
  </div>
);

// OS Icon Component
const OSIcon: React.FC<{ os?: string }> = ({ os }) => {
  if (!os) return <Monitor size={16} className="text-gray-500" />;
  const osLower = os.toLowerCase();
  if (osLower.includes('ios') || osLower.includes('mac')) return <Apple size={16} className="text-gray-300" />;
  if (osLower.includes('android')) return <Smartphone size={16} className="text-green-400" />;
  if (osLower.includes('windows')) return <Laptop size={16} className="text-blue-400" />;
  if (osLower.includes('linux')) return <Laptop size={16} className="text-yellow-400" />;
  return <Monitor size={16} className="text-gray-500" />;
};

// OS Color Badge
const OSBadge: React.FC<{ os?: string }> = ({ os }) => {
  const colors: Record<string, string> = {
    windows: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    macos: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    ios: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    android: 'bg-green-500/20 text-green-400 border-green-500/30',
    linux: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  const osLower = (os || 'unknown').toLowerCase();
  const colorClass = colors[osLower] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${colorClass}`}>
      <OSIcon os={os} />
      {os || 'Unknown'}
    </span>
  );
};

// Modal Component
const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="text-lg font-semibold text-white flex items-center gap-2">{title}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
};

// Confirmation Dialog Component
const ConfirmDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ open, onClose, onConfirm, title, message }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </div>
      </motion.div>
    </div>
  );
};

const UnknownHashesManagement: React.FC = () => {
  const [data, setData] = useState<UnknownHashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [sortBy, setSortBy] = useState<'count' | 'first_seen' | 'last_seen' | 'hash'>('count');
  const [sortDesc, setSortDesc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHash, setSelectedHash] = useState<UnknownHashEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hashToDelete, setHashToDelete] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState('');
  const [version, setVersion] = useState('');
  const [osName, setOsName] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getUnknownClientHashes({
        page: page,
        per_page: perPage,
      });
      setData(result.hashes || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('Failed to fetch unknown client hashes:', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToAllowList = (record: UnknownHashEntry) => {
    setSelectedHash(record);
    setClientName('');
    setVersion('');
    setOsName(record.last_detected_os || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHash) return;

    setSubmitting(true);
    try {
      await adminAPI.assignClientHash({
        client_hash: selectedHash.hash,
        client_name: clientName,
        version,
        os_name: osName,
      });
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add hash override:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (hash: string) => {
    setHashToDelete(hash);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!hashToDelete) return;
    try {
      await fetch(`/api/private/admin/client-hashes/unknown/${encodeURIComponent(hashToDelete)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setConfirmOpen(false);
      setHashToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete unknown hash:', err);
    }
  };

  const getCountColor = (count: number) => {
    if (count > 100) return 'bg-red-500';
    if (count > 50) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Unknown Client Hashes</h2>
            <p className="text-sm text-gray-400">Manage unverified client hashes and add them to the allow list</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-3 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="count">By Occurrences</option>
              <option value="last_seen">By Last Seen</option>
              <option value="first_seen">By First Seen</option>
              <option value="hash">By Hash</option>
            </select>
          </div>

          <select
            value={sortDesc ? 'desc' : 'asc'}
            onChange={(e) => setSortDesc(e.target.value === 'desc')}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>

          <Button icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Unknown Hashes"
          value={total}
          color="text-amber-400"
          icon={<AlertCircle className="text-amber-400" size={20} />}
        />
        <StatCard
          title="High Frequency (>100)"
          value={data.filter((h) => h.count > 100).length}
          color="text-red-400"
          icon={<AlertTriangle className="text-red-400" size={20} />}
        />
        <StatCard
          title="Recently Active (<7d)"
          value={data.filter((h) => {
            if (!h.last_seen) return false;
            const days = (Date.now() - new Date(h.last_seen).getTime()) / (1000 * 60 * 60 * 24);
            return days < 7;
          }).length}
          color="text-green-400"
          icon={<CheckCircle className="text-green-400" size={20} />}
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">Unknown Hashes Registry</span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">{total} entries</span>
          </div>
          <span className="text-sm text-gray-400">Add trusted hashes to recognize them as valid clients</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Client Hash</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Occurrences</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User Agent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">OS</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">First Seen</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Seen</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                    <span className="text-gray-400">Loading...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No unknown hashes found</p>
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr key={record.hash} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-gray-400 bg-gray-900/50 px-2 py-1 rounded">
                        {record.hash.substring(0, 24)}...
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-bold text-white rounded ${getCountColor(record.count)}`}>
                        {record.count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400 truncate max-w-[150px] inline-block" title={record.last_user_agent}>
                        {record.last_user_agent?.substring(0, 50) || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <OSBadge os={record.last_detected_os} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {record.first_seen ? new Date(record.first_seen).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {record.last_seen ? new Date(record.last_seen).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="primary" size="sm" icon={<Shield size={14} />} onClick={() => handleAddToAllowList(record)}>
                          Allow
                        </Button>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDeleteClick(record.hash)} />
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
            Showing {data.length} of {total} entries
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-gray-400 px-2">
              Page {page} of {totalPages || 1}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Next
            </Button>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="ml-2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add to Allow List Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <>
            <Shield className="text-blue-400" size={20} />
            <span>Add to Allow List</span>
          </>
        }
      >
        {selectedHash && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hash Info */}
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
              <div className="text-xs text-gray-500 mb-2">Client Hash</div>
              <code className="text-xs font-mono text-gray-300 break-all">{selectedHash.hash}</code>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500">Occurrences</div>
                  <div className="text-lg font-semibold text-amber-400">{selectedHash.count}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">OS</div>
                  <div className="text-white">{selectedHash.last_detected_os || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Last Seen</div>
                  <div className="text-white">
                    {selectedHash.last_seen ? new Date(selectedHash.last_seen).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Client Name <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g., osu!lazer"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Version <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g., 2024.312.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Operating System
              </label>
              <Select value={osName} onChange={(e) => setOsName(e.target.value)}>
                <option value="">Select OS</option>
                <option value="Windows">Windows</option>
                <option value="macOS">macOS</option>
                <option value="Linux">Linux</option>
                <option value="iOS">iOS</option>
                <option value="Android">Android</option>
                <option value="FreeBSD">FreeBSD</option>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" icon={<Plus size={18} />} loading={submitting}>
                Add to Allow List
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Hash Record?"
        message="This will remove it from the unknown hashes registry. This action cannot be undone."
      />
    </motion.div>
  );
};

export default UnknownHashesManagement;
