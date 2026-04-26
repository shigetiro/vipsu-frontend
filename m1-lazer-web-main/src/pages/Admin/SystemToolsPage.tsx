import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  AlertCircle,
  X,
  User,
  Music,
  Globe,
  RotateCcw,
  Search,
  ChevronDown,
  Loader2,
  BarChart3
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

// Countdown Timer Component
interface MaintenanceCountdownProps {
  minutesRemaining: number;
  onComplete: () => void;
}

const MaintenanceCountdown: React.FC<MaintenanceCountdownProps> = ({ minutesRemaining: initialMinutes, onComplete }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);

  useEffect(() => {
    setSecondsRemaining(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, onComplete]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-6xl font-mono font-bold text-amber-400 tabular-nums tracking-wider">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="mt-2 text-amber-300/80 text-lg">
        until maintenance mode activates
      </div>
      <div className="mt-4 text-sm text-amber-400/60 text-center max-w-md">
        Score submissions will be disabled when countdown reaches 0
      </div>
    </div>
  );
};

// Modal Component
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-lg w-full"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="text-lg font-semibold text-white flex items-center gap-2">
            {title}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'secondary', size = 'md', loading, icon, className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
    outline: 'border border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${loading ? 'opacity-50 cursor-wait' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
      {!loading && icon}
      {children}
    </button>
  );
};

// User interface for search
interface User {
  id: number;
  username: string;
  avatar_url?: string;
  country_code?: string;
}

// Recalculation types
interface RecalculationTask {
  id: number;
  type: string;
  target_id?: number;
  progress: number;
  started_at?: string;
  created_by_username?: string;
}

interface RecalculationStatus {
  running: boolean;
  running_task?: RecalculationTask;
  running_count: number;
  pending_count: number;
  completed_24h: number;
  queue_size: number;
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  };

  return (
    <div className={`p-4 bg-gray-800/50 border ${colorClasses[color].border} rounded-lg`}>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        <div className={`${colorClasses[color].bg} p-2 rounded-lg ${colorClasses[color].text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Main System Tools Page
const SystemToolsPage: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownMinutes, setCountdownMinutes] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [maintenanceStatus, setMaintenanceStatus] = useState<{
    enabled: boolean;
    scheduled: boolean;
    countdown_active: boolean;
    countdown_minutes_remaining?: number;
    message?: string;
  } | null>(null);

  // Recalculation state
  const [recalcStatus, setRecalcStatus] = useState<RecalculationStatus | null>(null);
  const [recalcLoading, setRecalcLoading] = useState<{ user: boolean; beatmap: boolean; overall: boolean }>({
    user: false,
    beatmap: false,
    overall: false,
  });

  // User dropdown state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const userSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Beatmap input
  const [beatmapId, setBeatmapId] = useState('');

  // Fetch maintenance status
  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const status = await adminAPI.getMaintenanceModeStatus();
      setMaintenanceStatus(status);
      setCountdownActive(status.countdown_active);
      setCountdownMinutes(status.countdown_minutes_remaining || 0);
      setMaintenanceMode(status.enabled);
    } catch (err) {
      console.error('Failed to fetch maintenance status:', err);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceStatus();
    const interval = setInterval(fetchMaintenanceStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchMaintenanceStatus]);

  // Enable maintenance with countdown
  const handleEnableWithCountdown = async () => {
    setLoading(true);
    try {
      await adminAPI.scheduleMaintenanceMode({
        enabled: true,
        schedule_minutes: selectedDuration,
        message: customMessage || undefined,
      });
      setCountdownActive(true);
      setCountdownMinutes(selectedDuration);
      setSchedulerOpen(false);
      setCustomMessage('');
      await fetchMaintenanceStatus();
    } catch (err) {
      alert('Failed to schedule maintenance mode');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Enable maintenance immediately
  const handleEnableImmediate = async () => {
    if (!confirm('Enable maintenance mode immediately? Score submissions will be disabled right away.')) return;

    setLoading(true);
    try {
      await adminAPI.scheduleMaintenanceMode({ enabled: true });
      setMaintenanceMode(true);
      await fetchMaintenanceStatus();
    } catch (err) {
      alert('Failed to enable maintenance mode');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Disable maintenance
  const handleDisable = async () => {
    setLoading(true);
    try {
      await adminAPI.scheduleMaintenanceMode({ enabled: false });
      setCountdownActive(false);
      setMaintenanceMode(false);
      await fetchMaintenanceStatus();
    } catch (err) {
      alert('Failed to disable maintenance mode');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle countdown complete
  const handleCountdownComplete = useCallback(() => {
    setCountdownActive(false);
    setMaintenanceMode(true);
    fetchMaintenanceStatus();
  }, [fetchMaintenanceStatus]);

  // Fetch recalculation status
  const fetchRecalcStatus = useCallback(async () => {
    try {
      const status = await adminAPI.getRecalculationStatus();
      setRecalcStatus(status);
    } catch (err) {
      console.error('Failed to fetch recalculation status:', err);
    }
  }, []);

  useEffect(() => {
    fetchRecalcStatus();
    const interval = setInterval(fetchRecalcStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchRecalcStatus]);

  // Fetch all users for dropdown
  const fetchUsers = useCallback(async (page: number = 1, search: string = '') => {
    if (page === 1) {
      setUsersLoading(true);
    }
    try {
      const result = await adminAPI.getUsers(page, 50, search);

      // Response structure: { users: [...], total, page, per_page, total_pages }
      const userList = result.users || [];
      if (page === 1) {
        setUsers(userList);
      } else {
        setUsers(prev => [...prev, ...userList]);
      }
      setHasMoreUsers(userList.length === 50 && result.total_pages && page < result.total_pages);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      if (page === 1) {
        setUsersLoading(false);
      }
    }
  }, []);

  // Handle search input with debounce
  const handleUserSearch = (value: string) => {
    setUserSearchQuery(value);
    setUserPage(1);

    if (userSearchTimeout.current) {
      clearTimeout(userSearchTimeout.current);
    }

    userSearchTimeout.current = setTimeout(() => {
      fetchUsers(1, value);
    }, 300);
  };

  // Load users when dropdown opens
  const handleDropdownOpen = () => {
    setUserDropdownOpen(true);
    if (users.length === 0) {
      fetchUsers(1, userSearchQuery);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setUserDropdownOpen(false);
  };

  const handleLoadMoreUsers = () => {
    const nextPage = userPage + 1;
    setUserPage(nextPage);
    fetchUsers(nextPage, userSearchQuery);
  };

  // Recalculation handlers
  const handleRecalculateUser = async () => {
    if (!selectedUser) return;

    setRecalcLoading(prev => ({ ...prev, user: true }));
    try {
      // Forward to backend which handles the rest (looking up user_id)
      await adminAPI.recalculateUser(selectedUser.id);
      alert(`Started PP recalculation for user ${selectedUser.username} (ID: ${selectedUser.id})`);
      setSelectedUser(null);
      setUserSearchQuery('');
      fetchRecalcStatus();
    } catch (err) {
      alert('Failed to start user recalculation');
      console.error(err);
    } finally {
      setRecalcLoading(prev => ({ ...prev, user: false }));
    }
  };

  const handleRecalculateBeatmap = async () => {
    const id = parseInt(beatmapId, 10);
    if (isNaN(id) || id <= 0) {
      alert('Please enter a valid beatmap ID');
      return;
    }

    if (recalcStatus?.running) {
      alert('A recalculation is already running');
      return;
    }

    setRecalcLoading(prev => ({ ...prev, beatmap: true }));
    try {
      await adminAPI.recalculateBeatmap(id);
      alert('Beatmap PP recalculation started');
      setBeatmapId('');
      fetchRecalcStatus();
    } catch (err) {
      alert('Failed to start beatmap recalculation');
      console.error(err);
    } finally {
      setRecalcLoading(prev => ({ ...prev, beatmap: false }));
    }
  };

  const handleRecalculateOverall = async () => {
    if (!confirm('This will recalculate PP for all users and may take significant time. Are you sure?')) return;

    if (recalcStatus?.running) {
      alert('A recalculation is already running');
      return;
    }

    setRecalcLoading(prev => ({ ...prev, overall: true }));
    try {
      await adminAPI.recalculateOverall();
      alert('Overall PP recalculation started');
      fetchRecalcStatus();
    } catch (err) {
      alert('Failed to start overall recalculation');
      console.error(err);
    } finally {
      setRecalcLoading(prev => ({ ...prev, overall: false }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">System Tools</h2>
        <p className="text-sm text-gray-400">
          Manage server maintenance mode and system operations
        </p>
      </div>

      {/* Maintenance Mode Section */}
      <div className={`bg-gray-800/50 border rounded-xl p-6 mb-6 ${
        maintenanceMode ? 'border-red-500/50' : countdownActive ? 'border-amber-500/50' : 'border-gray-700'
      }`}>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className={maintenanceMode ? 'text-red-400' : 'text-blue-400'} size={24} />
            <h3 className="text-lg font-semibold text-white">Maintenance Mode</h3>
            {maintenanceMode && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded flex items-center gap-1">
                <AlertCircle size={12} /> ACTIVE
              </span>
            )}
            {countdownActive && !maintenanceMode && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded flex items-center gap-1">
                <Clock size={12} /> SCHEDULED
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={16} />}
            onClick={fetchMaintenanceStatus}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {/* Countdown State */}
          {countdownActive && !maintenanceMode ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <AlertCircle className="w-16 h-16 text-amber-400" />
              </div>
              <h4 className="text-xl font-semibold text-amber-400 mb-4">Maintenance Scheduled</h4>

              <MaintenanceCountdown
                minutesRemaining={countdownMinutes}
                onComplete={handleCountdownComplete}
              />

              <div className="flex justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={handleDisable}
                  loading={loading}
                >
                  Cancel Maintenance
                </Button>
                <Button
                  variant="danger"
                  onClick={handleEnableImmediate}
                  loading={loading}
                >
                  Enable Now
                </Button>
              </div>

              {maintenanceStatus?.message && (
                <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-500">Announcement: </span>
                    {maintenanceStatus.message}
                  </p>
                </div>
              )}
            </motion.div>
          ) : maintenanceMode ? (
            /* Active Maintenance State */
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-red-400">Maintenance Mode Active</h4>
                  <p className="text-gray-400">Score submissions are currently disabled</p>
                </div>
              </div>

              <p className="text-gray-400 mb-6">
                The server is in maintenance mode. Users can continue playing but score submissions
                are temporarily disabled. End maintenance mode when updates are complete.
              </p>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={18} />
                  <span>Users received notification that maintenance is active</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<CheckCircle size={20} />}
                  onClick={handleDisable}
                  loading={loading}
                >
                  End Maintenance Mode
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Normal State */
            <motion.div
              key="inactive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-400">All Systems Operational</h4>
                    <p className="text-sm text-gray-400">Server is running normally</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    icon={<Clock size={18} />}
                    onClick={() => setSchedulerOpen(true)}
                  >
                    Schedule with Countdown
                  </Button>
                  <Button
                    variant="danger"
                    icon={<AlertTriangle size={18} />}
                    onClick={handleEnableImmediate}
                    loading={loading}
                  >
                    Enable Now
                  </Button>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Scheduled Start"
                  value="5 min"
                  icon={<Clock size={20} />}
                  color="blue"
                />
                <StatCard
                  title="Auto-Announce"
                  value="Enabled"
                  icon={<CheckCircle size={20} />}
                  color="green"
                />
                <StatCard
                  title="Score Submissions"
                  value="Active"
                  icon={<CheckCircle size={20} />}
                  color="green"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scheduler Modal */}
      <Modal
        open={schedulerOpen}
        onClose={() => setSchedulerOpen(false)}
        title={
          <>
            <AlertTriangle className="text-amber-400" size={20} />
            <span>Schedule Maintenance Mode</span>
          </>
        }
      >
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 mt-0.5 flex-shrink-0" size={16} />
            <div className="text-sm text-amber-300">
              <p className="font-medium mb-2">What happens:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                <li>A warning announcement is sent to all users</li>
                <li>Countdown timer visible to administrators</li>
                <li>When timer hits 0: maintenance mode activates</li>
                <li>Score submissions are automatically disabled</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Countdown Duration (minutes)
            </label>
            <div className="flex gap-2">
              {[1, 3, 5, 10, 15].map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedDuration(m)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDuration === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 5 minutes for users to finish their plays
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Message (optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Leave empty for default message"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {customMessage.length}/500
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={() => setSchedulerOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon={<AlertTriangle size={18} />}
            onClick={handleEnableWithCountdown}
            loading={loading}
          >
            Schedule Maintenance
          </Button>
        </div>
      </Modal>

      {/* PP Recalculation Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Performance Points Recalculation</h3>
            <p className="text-sm text-gray-400">Trigger PP recalculation for users, beatmaps, or the entire server</p>
          </div>
        </div>

        {/* Status Bar */}
        {recalcStatus && (
          <div className="mb-6 p-4 bg-gray-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">Recalculation Status</span>
              {recalcStatus.running && (
                <span className="flex items-center gap-2 text-blue-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running
                </span>
              )}
            </div>

            {recalcStatus.running_task && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Task #{recalcStatus.running_task.id} ({recalcStatus.running_task.type})</span>
                  <span>{(recalcStatus.running_task.progress * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${recalcStatus.running_task.progress * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                <div className="text-lg font-semibold text-white">{recalcStatus.queue_size}</div>
                <div className="text-xs text-gray-500">Queue</div>
              </div>
              <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                <div className="text-lg font-semibold text-white">{recalcStatus.pending_count}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                <div className="text-lg font-semibold text-white">{recalcStatus.running_count}</div>
                <div className="text-xs text-gray-500">Running</div>
              </div>
              <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                <div className="text-lg font-semibold text-white">{recalcStatus.completed_24h}</div>
                <div className="text-xs text-gray-500">Completed (24h)</div>
              </div>
            </div>
          </div>
        )}

        {recalcStatus?.running && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-amber-400">A recalculation is currently running. New tasks will be queued.</span>
          </div>
        )}

        {/* Recalculation Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Recalculation */}
          <div className="p-5 bg-gray-700/30 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Specific User</h4>
                <p className="text-xs text-gray-400">Recalculate PP for a single user</p>
              </div>
            </div>

            {/* User Dropdown */}
            <div className="relative mb-3">
              <button
                onClick={handleDropdownOpen}
                className={`w-full flex items-center justify-between px-3 py-2 bg-gray-800 border rounded-lg text-left transition-colors ${
                  selectedUser ? 'border-blue-500' : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {selectedUser ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white truncate">{selectedUser.username}</span>
                      <span className="text-xs text-gray-500">(ID: {selectedUser.id})</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">Select a user...</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-30 overflow-hidden"
                  >
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => handleUserSearch(e.target.value)}
                          placeholder="Search users..."
                          className="w-full pl-9 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* User List */}
                    <div className="max-h-60 overflow-y-auto">
                      {usersLoading ? (
                        <div className="p-4 text-center">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-400 mx-auto" />
                        </div>
                      ) : users.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No users found
                        </div>
                      ) : (
                        <>
                          {users.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/50 transition-colors text-left ${
                                selectedUser?.id === user.id ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{user.username}</div>
                                <div className="text-xs text-gray-500">ID: {user.id}</div>
                              </div>
                              {selectedUser?.id === user.id && (
                                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              )}
                            </button>
                          ))}

                          {/* Load More Button */}
                          {hasMoreUsers && !userSearchQuery && (
                            <button
                              onClick={handleLoadMoreUsers}
                              className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-700/30 transition-colors"
                            >
                              Load more users...
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Click outside to close dropdown */}
              {userDropdownOpen && (
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setUserDropdownOpen(false)}
                />
              )}
            </div>

            <Button
              variant="primary"
              className="w-full"
              loading={recalcLoading.user}
              disabled={!selectedUser || recalcStatus?.running}
              onClick={handleRecalculateUser}
              icon={<RotateCcw size={16} />}
            >
              {recalcLoading.user ? 'Calculating...' : 'Recalculate User PP'}
            </Button>
          </div>

          {/* Beatmap Recalculation */}
          <div className="p-5 bg-gray-700/30 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Specific Beatmap</h4>
                <p className="text-xs text-gray-400">Recalculate PP for a single beatmap</p>
              </div>
            </div>

            <input
              type="number"
              value={beatmapId}
              onChange={(e) => setBeatmapId(e.target.value)}
              placeholder="Beatmap ID"
              min="1"
              disabled={recalcLoading.beatmap || recalcStatus?.running}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-3 text-sm disabled:opacity-50"
            />

            <Button
              variant="primary"
              className="w-full"
              loading={recalcLoading.beatmap}
              disabled={!beatmapId.trim() || recalcStatus?.running}
              onClick={handleRecalculateBeatmap}
              icon={<RotateCcw size={16} />}
            >
              {recalcLoading.beatmap ? 'Calculating...' : 'Recalculate Beatmap PP'}
            </Button>
          </div>

          {/* Overall Recalculation */}
          <div className="p-5 bg-gray-700/30 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Overall Server</h4>
                <p className="text-xs text-gray-400">Recalculate PP for all users</p>
              </div>
            </div>

            <div className="mb-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-xs text-orange-400">
                <span className="font-medium">⚠️ Warning:</span> This may take significant time on large servers
              </p>
            </div>

            <Button
              variant="danger"
              className="w-full"
              loading={recalcLoading.overall}
              disabled={recalcStatus?.running}
              onClick={handleRecalculateOverall}
              icon={<RotateCcw size={16} />}
            >
              {recalcLoading.overall ? 'Calculating...' : 'Recalculate All PP'}
            </Button>
          </div>
        </div>
      </div>

      {/* Server Status Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Server Status</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: 'Online', color: 'text-green-400' },
            { label: 'Players Online', value: '-', color: 'text-white' },
            { label: 'Score Queue', value: '-', color: 'text-white' },
            { label: 'Uptime', value: '-', color: 'text-white' },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-gray-700/30 rounded-lg">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</div>
              <div className={`text-xl font-semibold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SystemToolsPage;
