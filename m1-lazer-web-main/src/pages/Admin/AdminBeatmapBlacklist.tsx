import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  RefreshCw,
  X,
  Music,
  Search,
  Loader2,
  Trash2,
  Filter,
  Shield,
  Ban,
  Star,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface BlacklistedBeatmap {
  id: number;
  beatmapset_id: number;
  beatmap_id: number;
  beatmapset?: {
    id: number;
    title: string;
    artist: string;
  };
  beatmap?: {
    id: number;
    version: string;
    difficulty_rating: number;
    mode: string;
    total_length: number;
    bpm: number;
    count_circles: number;
    count_sliders: number;
    count_spinners: number;
  };
}

type SortField = 'beatmap_id' | 'beatmapset_id' | 'title' | 'artist' | 'stars' | 'bpm' | 'length' | 'mode';

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
  const sizeStyles = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2', lg: 'px-6 py-3 text-lg' };

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

const AdminBeatmapBlacklist: React.FC = () => {
  const [blacklistedBeatmaps, setBlacklistedBeatmaps] = useState<BlacklistedBeatmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addByBeatmapId, setAddByBeatmapId] = useState(false);
  const [adding, setAdding] = useState(false);
  const [sortField, setSortField] = useState<SortField>('beatmap_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchDebounced, setSearchDebounced] = useState('');
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBlacklist();
  }, []);

  // Auto-apply search filter with debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchTerm]);

  const loadBlacklist = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getBlacklistedBeatmaps();
      setBlacklistedBeatmaps(data || []);
    } catch (error) {
      console.error('Failed to load blacklist:', error);
      toast.error('Failed to load blacklisted beatmaps');
    } finally {
      setLoading(false);
    }
  };

  // Filter + sort with useMemo
  const filteredAndSorted = useMemo(() => {
    let result = [...blacklistedBeatmaps];

    // Search filter
    if (searchDebounced.trim()) {
      const searchNum = parseInt(searchDebounced.trim());
      if (!isNaN(searchNum)) {
        result = result.filter(item =>
          item.beatmap_id === searchNum || item.beatmapset_id === searchNum
        );
      }
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'beatmap_id':
          cmp = a.beatmap_id - b.beatmap_id;
          break;
        case 'beatmapset_id':
          cmp = a.beatmapset_id - b.beatmapset_id;
          break;
        case 'title':
          cmp = (a.beatmapset?.title || '').localeCompare(b.beatmapset?.title || '');
          break;
        case 'artist':
          cmp = (a.beatmapset?.artist || '').localeCompare(b.beatmapset?.artist || '');
          break;
        case 'stars':
          cmp = (a.beatmap?.difficulty_rating || 0) - (b.beatmap?.difficulty_rating || 0);
          break;
        case 'bpm':
          cmp = (a.beatmap?.bpm || 0) - (b.beatmap?.bpm || 0);
          break;
        case 'length':
          cmp = (a.beatmap?.total_length || 0) - (b.beatmap?.total_length || 0);
          break;
        case 'mode':
          cmp = (a.beatmap?.mode || '').localeCompare(b.beatmap?.mode || '');
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [blacklistedBeatmaps, searchDebounced, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode; align?: string }> = ({ field, children, align = 'center' }) => {
    const alignClass = align === 'left' ? 'text-left' : 'text-center';
    return (
      <th
        className={`${alignClass} py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none whitespace-nowrap`}
        onClick={() => toggleSort(field)}
      >
        <div className={`flex items-center gap-1 ${align === 'left' ? '' : 'justify-center'}`}>
          {children}
          {sortField === field && (
            sortDirection === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />
          )}
        </div>
      </th>
    );
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputValue);

    if (isNaN(id) || id <= 0) {
      toast.error(addByBeatmapId ? 'Please enter a valid beatmap ID' : 'Please enter a valid beatmapset ID');
      return;
    }

    setAdding(true);
    try {
      if (addByBeatmapId) {
        await adminAPI.addBlacklistedBeatmapById(id);
        toast.success('Beatmap added to blacklist');
      } else {
        await adminAPI.addBlacklistedBeatmapSet(id);
        toast.success('Beatmapset added to blacklist');
      }
      setInputValue('');
      loadBlacklist();
    } catch (error) {
      console.error('Failed to add to blacklist:', error);
      toast.error(addByBeatmapId ? 'Failed to add beatmap to blacklist' : 'Failed to add beatmapset to blacklist');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm(`Are you sure you want to remove this ${addByBeatmapId ? 'beatmap' : 'beatmapset'} from the blacklist?`)) return;

    try {
      if (addByBeatmapId) {
        await adminAPI.removeBlacklistedBeatmapById(id);
        toast.success('Beatmap removed from blacklist');
      } else {
        await adminAPI.removeBlacklistedBeatmapSet(id);
        toast.success('Beatmapset removed from blacklist');
      }
      loadBlacklist();
    } catch (error) {
      console.error('Failed to remove from blacklist:', error);
      toast.error(addByBeatmapId ? 'Failed to remove beatmap from blacklist' : 'Failed to remove beatmapset from blacklist');
    }
  };

  const formatLength = (seconds?: number) => {
    if (!seconds) return 'N/A';
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getModeLabel = (mode?: string) => {
    switch (mode) {
      case 'osu': return 'osu!';
      case 'taiko': return 'Taiko';
      case 'fruits': return 'Catch';
      case 'mania': return 'Mania';
      default: return mode || 'N/A';
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
        <h2 className="text-2xl font-bold text-white mb-2">Beatmap Blacklist</h2>
        <p className="text-sm text-gray-400">
          Manage blacklisted beatmaps and beatmapsets
        </p>
      </div>

      {/* Add to Blacklist */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Add to Blacklist</h3>
              <p className="text-xs text-gray-400">Blacklisted beatmaps will have their scores removed</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Add by:</span>
            <button
              onClick={() => setAddByBeatmapId(!addByBeatmapId)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <span className={`text-sm font-medium transition-colors ${!addByBeatmapId ? 'text-blue-400' : 'text-gray-500'}`}>Beatmapset</span>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${addByBeatmapId ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${addByBeatmapId ? 'left-[22px]' : 'left-0.5'}`}
                />
              </div>
              <span className={`text-sm font-medium transition-colors ${addByBeatmapId ? 'text-blue-400' : 'text-gray-500'}`}>Beatmap</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={addByBeatmapId ? 'Enter Beatmap ID' : 'Enter Beatmapset ID'}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              required
              min="1"
            />
          </div>
          <Button
            type="submit"
            variant="danger"
            loading={adding}
            icon={<Ban size={16} />}
          >
            {adding ? 'Adding...' : 'Add to Blacklist'}
          </Button>
        </form>

        {/* Search Filter */}
        <div className="mt-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Beatmap ID or Beatmapset ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Blacklist Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No blacklisted beatmaps</p>
          <p className="text-gray-500 text-sm mt-1">Add a beatmap or beatmapset above to blacklist it</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <SortHeader field="beatmap_id" align="left">Map ID</SortHeader>
                  <SortHeader field="beatmapset_id" align="left">Set ID</SortHeader>
                  <SortHeader field="title" align="left">Title</SortHeader>
                  <SortHeader field="artist" align="left">Artist</SortHeader>
                  <SortHeader field="stars">Stars</SortHeader>
                  <SortHeader field="length">Len</SortHeader>
                  <SortHeader field="bpm">BPM</SortHeader>
                  <SortHeader field="mode">Mode</SortHeader>
                  <th className="text-center py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Diff</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-2 px-2 font-mono text-gray-300 text-xs">{item.beatmap_id}</td>
                    <td className="py-2 px-2 font-mono text-gray-400 text-xs">{item.beatmapset_id}</td>
                    <td className="py-2 px-2 text-white truncate max-w-[140px]">
                      {item.beatmapset?.title || 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-gray-400 truncate max-w-[100px]">
                      {item.beatmapset?.artist || 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {item.beatmap?.difficulty_rating != null ? (
                        <span className="font-medium text-amber-400">{item.beatmap.difficulty_rating.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center text-gray-400">
                      {item.beatmap?.total_length != null ? formatLength(item.beatmap.total_length) : 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-center text-gray-400">
                      {item.beatmap?.bpm != null ? item.beatmap.bpm.toFixed(0) : 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-center text-gray-400">
                      {getModeLabel(item.beatmap?.mode)}
                    </td>
                    <td className="py-2 px-2 text-center text-gray-400 text-xs">
                      {item.beatmap
                        ? `${item.beatmap.count_circles}/${item.beatmap.count_sliders}/${item.beatmap.count_spinners}`
                        : 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => handleRemove(item.beatmap_id)}
                        className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors"
                        title="Remove from blacklist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Count */}
      {!loading && filteredAndSorted.length > 0 && (
        <div className="text-center text-xs text-gray-500 mt-3">
          {filteredAndSorted.length} blacklisted {filteredAndSorted.length === 1 ? 'beatmap' : 'beatmaps'}
        </div>
      )}
    </motion.div>
  );
};

export default AdminBeatmapBlacklist;
