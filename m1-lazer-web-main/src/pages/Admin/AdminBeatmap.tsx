import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  X,
  Music,
  Search,
  Loader2,
  Trash2,
  Edit3,
  Filter,
  SortAsc,
  SortDesc,
  BarChart3,
  Eye,
  EyeOff,
  ChevronRight,
  Star,
  Activity,
  Layers,
  LayoutGrid,
  List,
  ChevronDown,
} from 'lucide-react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface Beatmap {
  id: number;
  version: string;
  difficulty_rating: number;
  mode: string | null;
  bpm?: number;
  total_length?: number;
  count_circles?: number;
  count_sliders?: number;
  count_spinners?: number;
}

interface Beatmapset {
  id: number;
  title: string;
  artist: string;
  creator: string;
  rank_status: string | null;
  covers?: {
    cover?: string;
    card?: string;
    list?: string;
    slimcover?: string;
    'cover@2x'?: string;
    'card@2x'?: string;
  };
  cover_url?: string;
  beatmaps: Beatmap[];
  submitted_at?: string;
  last_updated?: string;
}

interface BeatmapsResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  beatmapsets: Beatmapset[];
}

interface BeatmapStats {
  total_beatmapsets: number;
  total_beatmaps: number;
  ranked_count: number;
  approved_count: number;
  qualified_count: number;
  loved_count: number;
  pending_count: number;
  graveyard_count: number;
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'orange' | 'pink' | 'cyan';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
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

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
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
    ghost: 'hover:bg-gray-700/50 text-gray-300 hover:text-white',
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

// Modal Component
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
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

const AdminBeatmap: React.FC = () => {
  const [beatmaps, setBeatmaps] = useState<BeatmapsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBeatmapset, setSelectedBeatmapset] = useState<Beatmapset | null>(null);
  const [newRankStatus, setNewRankStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'creator' | 'submitted' | 'difficulty'>('submitted');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [rawBeatmaps, setRawBeatmaps] = useState<BeatmapsResponse | null>(null);

  // Compute stats from raw beatmaps data
  const stats = useMemo<BeatmapStats | null>(() => {
    if (!rawBeatmaps?.beatmapsets) return null;
    const sets = rawBeatmaps.beatmapsets;
    const countStatus = (status: string) => sets.filter(b => b.rank_status === status).length;
    const totalMaps = sets.reduce((sum, s) => sum + (s.beatmaps?.length || 0), 0);
    return {
      total_beatmapsets: rawBeatmaps.total || sets.length,
      total_beatmaps: totalMaps,
      ranked_count: countStatus('ranked'),
      approved_count: countStatus('approved'),
      qualified_count: countStatus('qualified'),
      loved_count: countStatus('loved'),
      pending_count: countStatus('pending'),
      graveyard_count: countStatus('graveyard'),
    };
  }, [rawBeatmaps]);

  useEffect(() => {
    loadBeatmaps();
  }, [currentPage, searchQuery, rankFilter, modeFilter]);

  const loadBeatmaps = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getBeatmaps(currentPage, 25, searchQuery, rankFilter || undefined, modeFilter || undefined);
      setRawBeatmaps(data);
      setBeatmaps(data);
    } catch (error) {
      console.error('Failed to load beatmaps:', error);
      toast.error('Failed to load beatmaps');
    } finally {
      setLoading(false);
    }
  };

  // Client-side sort via useMemo (filters are now server-side)
  const displayedBeatmaps = useMemo(() => {
    if (!rawBeatmaps?.beatmapsets) return [];

    const sorted = [...rawBeatmaps.beatmapsets].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'artist':
          cmp = a.artist.localeCompare(b.artist);
          break;
        case 'creator':
          cmp = a.creator.localeCompare(b.creator);
          break;
        case 'submitted':
          cmp = (a.submitted_at || '').localeCompare(b.submitted_at || '');
          break;
        case 'difficulty':
          const aDiff = a.beatmaps.reduce((max, bm) => Math.max(max, bm.difficulty_rating), 0);
          const bDiff = b.beatmaps.reduce((max, bm) => Math.max(max, bm.difficulty_rating), 0);
          cmp = aDiff - bDiff;
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [rawBeatmaps, sortBy, sortDirection]);

  // Sync displayed results to beatmaps state
  useEffect(() => {
    if (rawBeatmaps) {
      setBeatmaps({ ...rawBeatmaps, beatmapsets: displayedBeatmaps });
    }
  }, [displayedBeatmaps, rawBeatmaps]);

  const handleSearch = (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 300);
  };

  const handleBeatmapClick = async (beatmapsetId: number) => {
    try {
      const beatmap = await adminAPI.getBeatmap(beatmapsetId);
      setSelectedBeatmapset(beatmap);
      setNewRankStatus(beatmap.rank_status || '');
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to load beatmap details:', error);
      toast.error('Failed to load beatmap details');
    }
  };

  const handleUpdateRankStatus = async () => {
    if (!selectedBeatmapset || !newRankStatus) return;

    try {
      await adminAPI.updateRankStatus(selectedBeatmapset.id, newRankStatus);
      toast.success('Rank status updated successfully');
      setDetailModalOpen(false);
      setSelectedBeatmapset(null);
          } catch (error) {
      console.error('Failed to update rank status:', error);
      toast.error('Failed to update rank status');
    }
  };

  const handleBanBeatmap = async () => {
    if (!selectedBeatmapset) return;
    if (!confirm('Are you sure you want to ban this beatmapset? This will remove all scores.')) return;

    try {
      await adminAPI.banBeatmap(selectedBeatmapset.id);
      toast.success('Beatmapset banned and scores removed');
      setDetailModalOpen(false);
      setSelectedBeatmapset(null);
          } catch (error) {
      console.error('Failed to ban beatmap:', error);
      toast.error('Failed to ban beatmap');
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, { bg: string; text: string }> = {
      ranked: { bg: 'bg-green-500/20', text: 'text-green-400' },
      approved: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      qualified: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      loved: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
      pending: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      graveyard: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
      wip: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    };
    return colors[status || ''] || { bg: 'bg-gray-500/20', text: 'text-gray-400' };
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'ranked': return <CheckCircle size={12} />;
      case 'approved': return <CheckCircle size={12} />;
      case 'qualified': return <Clock size={12} />;
      case 'loved': return <Star size={12} />;
      case 'pending': return <Clock size={12} />;
      case 'graveyard': return <AlertCircle size={12} />;
      default: return <AlertCircle size={12} />;
    }
  };

  const getModeIcon = (mode: string | null) => {
    switch (mode) {
      case 'osu': return 'osu!';
      case 'taiko': return 'Taiko';
      case 'fruits': return 'Catch';
      case 'mania': return 'Mania';
      default: return mode || '?';
    }
  };

  const maxDiff = (beatmaps: Beatmap[]) => {
    if (!beatmaps || beatmaps.length === 0) return 0;
    return Math.max(...beatmaps.map(b => b.difficulty_rating));
  };

  const formatLength = (seconds?: number) => {
    if (!seconds) return '0:00';
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
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
        <h2 className="text-2xl font-bold text-white mb-2">Beatmap Management</h2>
        <p className="text-sm text-gray-400">
          Manage beatmaps, rank status, and view beatmap statistics
        </p>
      </div>

      {/* Statistics Dashboard */}
      <div className="mb-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg animate-pulse">
                <div className="h-3 bg-gray-700 rounded w-16 mb-2" />
                <div className="h-7 bg-gray-700 rounded w-12" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Sets" value={stats.total_beatmapsets} icon={<Layers size={20} />} color="blue" />
            <StatCard title="Total Maps" value={stats.total_beatmaps} icon={<Music size={20} />} color="purple" />
            <StatCard title="Ranked" value={stats.ranked_count} icon={<CheckCircle size={20} />} color="green" />
            <StatCard title="Approved" value={stats.approved_count} icon={<CheckCircle size={20} />} color="blue" />
            <StatCard title="Qualified" value={stats.qualified_count} icon={<Clock size={20} />} color="amber" />
            <StatCard title="Loved" value={stats.loved_count} icon={<Star size={20} />} color="pink" />
            <StatCard title="Pending" value={stats.pending_count} icon={<Clock size={20} />} color="orange" />
            <StatCard title="Graveyard" value={stats.graveyard_count} icon={<AlertCircle size={20} />} color="red" />
          </div>
        ) : null}
      </div>

      {/* Search & Controls */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search beatmaps by title, artist, or creator..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              size="sm"
              icon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>

            {/* Sort */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                icon={sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                onClick={() => {
                  const fields: typeof sortBy[] = ['submitted', 'title', 'artist', 'creator', 'difficulty'];
                  const idx = fields.indexOf(sortBy);
                  const next = fields[(idx + 1) % fields.length];
                  setSortBy(next);
                }}
              >
                Sort: {sortBy}
              </Button>
            </div>

            {/* View Mode */}
            <div className="flex bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={16} />}
              onClick={() => { loadBeatmaps();  }}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 pt-4 mt-4 border-t border-gray-700">
                {/* Rank Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Status:</span>
                  <div className="flex flex-wrap gap-1">
                    {['ranked', 'approved', 'qualified', 'loved', 'pending', 'graveyard'].map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          setRankFilter(rankFilter === status ? null : status);
                          setCurrentPage(1);
                          }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          rankFilter === status
                            ? `${getStatusColor(status).bg} ${getStatusColor(status).text} ring-1 ring-current`
                            : 'bg-gray-700 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Filter */}
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Mode:</span>
                  <div className="flex gap-1">
                    {['osu', 'taiko', 'fruits', 'mania'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => {
                          setModeFilter(modeFilter === mode ? null : mode);
                          setCurrentPage(1);
                          }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          modeFilter === mode
                            ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-400'
                            : 'bg-gray-700 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {getModeIcon(mode)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active filters indicator */}
                {(rankFilter || modeFilter) && (
                  <button
                    onClick={() => { setRankFilter(null); setModeFilter(null); setCurrentPage(1); }}
                    className="ml-auto px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Beatmap List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : !beatmaps?.beatmapsets?.length ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No beatmaps found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Beatmap</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300" onClick={() => toggleSort('creator')}>
                    Creator
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulties</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300" onClick={() => toggleSort('difficulty')}>
                    Max Stars
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300" onClick={() => toggleSort('submitted')}>
                    Submitted
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {beatmaps.beatmapsets.map((set) => {
                  const statusColor = getStatusColor(set.rank_status);
                  const maxDifficulty = maxDiff(set.beatmaps);
                  return (
                    <tr
                      key={set.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {set.covers?.list || set.covers?.card || set.cover_url ? (
                            <img
                              src={set.covers?.list || set.covers?.card || set.cover_url}
                              alt={set.title}
                              className="w-12 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-700 rounded flex items-center justify-center">
                              <Music size={14} className="text-gray-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">{set.title}</div>
                            <div className="text-xs text-gray-400 truncate">by {set.artist}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">{set.creator}</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-400">{set.beatmaps?.length || 0}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-amber-400">{maxDifficulty.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                          {getStatusIcon(set.rank_status)}
                          {set.rank_status || 'unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-400">{formatDate(set.submitted_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye size={14} />}
                          onClick={() => handleBeatmapClick(set.id)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {beatmaps.beatmapsets.map((set) => {
            const statusColor = getStatusColor(set.rank_status);
            const maxDifficulty = maxDiff(set.beatmaps);
            return (
              <motion.div
                key={set.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => handleBeatmapClick(set.id)}
              >
                {/* Cover Image */}
                <div className="relative h-24 overflow-hidden">
                  {set.covers?.cover || set.covers?.slimcover || set.cover_url ? (
                    <img
                      src={set.covers?.cover || set.covers?.slimcover || set.cover_url}
                      alt={set.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <Music size={24} className="text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                  <span className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                    {getStatusIcon(set.rank_status)}
                    {set.rank_status || 'unknown'}
                  </span>
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="text-sm font-semibold text-white truncate">{set.title}</div>
                    <div className="text-xs text-gray-300 truncate">by {set.artist}</div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Mapped by {set.creator}</span>
                    <span>{formatDate(set.submitted_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{set.beatmaps?.length || 0} difficulties</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400" />
                      <span className="text-xs font-medium text-amber-400">{maxDifficulty.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {beatmaps && beatmaps.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-400 px-4">
            Page {currentPage} of {beatmaps.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= beatmaps.total_pages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
          <span className="text-xs text-gray-500 ml-2">
            ({beatmaps.total} total)
          </span>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedBeatmapset(null); }}
        title={
          <>
            <Music className="text-blue-400" size={20} />
            <span>Beatmap Details</span>
          </>
        }
        size="lg"
      >
        {selectedBeatmapset ? (
          <div className="space-y-6">
            {/* Cover & Info */}
            {selectedBeatmapset.covers?.cover && (
              <div className="relative h-32 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl">
                <img
                  src={selectedBeatmapset.covers.cover}
                  alt={selectedBeatmapset.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent" />
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-white">{selectedBeatmapset.title}</h3>
              <p className="text-gray-400 mt-1">by {selectedBeatmapset.artist} | mapped by {selectedBeatmapset.creator}</p>
            </div>

            {/* Status & Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Status</div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedBeatmapset.rank_status).bg} ${getStatusColor(selectedBeatmapset.rank_status).text}`}>
                  {getStatusIcon(selectedBeatmapset.rank_status)}
                  {selectedBeatmapset.rank_status || 'unknown'}
                </span>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Submitted</div>
                <span className="text-sm text-white">{formatDate(selectedBeatmapset.submitted_at)}</span>
              </div>
            </div>

            {/* Difficulties Table */}
            {selectedBeatmapset.beatmaps?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Difficulties ({selectedBeatmapset.beatmaps.length})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Version</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Stars</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Mode</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">BPM</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Length</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">CS/AR/OD/HP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBeatmapset.beatmaps.map((bm) => (
                        <tr key={bm.id} className="border-b border-gray-700/50">
                          <td className="py-2 px-3 text-sm text-white">{bm.version}</td>
                          <td className="py-2 px-3 text-center text-sm font-medium text-amber-400">{bm.difficulty_rating?.toFixed(2)}</td>
                          <td className="py-2 px-3 text-center text-sm text-gray-400">{getModeIcon(bm.mode)}</td>
                          <td className="py-2 px-3 text-center text-sm text-gray-400">{bm.bpm?.toFixed(0) || 'N/A'}</td>
                          <td className="py-2 px-3 text-center text-sm text-gray-400">{formatLength(bm.total_length)}</td>
                          <td className="py-2 px-3 text-center text-sm text-gray-400">--</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Rank Status Update */}
            <div className="p-4 bg-gray-700/30 border border-gray-600 rounded-xl">
              <h4 className="text-sm font-semibold text-white mb-3">Update Rank Status</h4>
              <div className="flex gap-3">
                <select
                  value={newRankStatus}
                  onChange={(e) => setNewRankStatus(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select status...</option>
                  <option value="ranked">Ranked</option>
                  <option value="approved">Approved</option>
                  <option value="qualified">Qualified</option>
                  <option value="loved">Loved</option>
                  <option value="pending">Pending</option>
                  <option value="graveyard">Graveyard</option>
                </select>
                <Button
                  variant="primary"
                  onClick={handleUpdateRankStatus}
                  disabled={!newRankStatus}
                >
                  Update
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-400" />
                <h4 className="text-sm font-semibold text-red-400">Danger Zone</h4>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Banning this beatmapset will remove all associated scores. This action cannot be undone.
              </p>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={handleBanBeatmap}
              >
                Ban Beatmapset
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default AdminBeatmap;
