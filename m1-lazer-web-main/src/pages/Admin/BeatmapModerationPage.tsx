import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  Star,
  Heart,
  Ban,
  RefreshCw,
  ChevronRight,
  Music,
  Clock,
  User,
  Globe,
  AlertTriangle,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';

// Types
interface BeatmapDifficulty {
  id: number;
  version: string;
  mode: number;
  mode_name: string;
  star_rating: number;
  status: number;
  status_name: string;
  total_length: number;
  bpm: number;
  cs: number;
  ar: number;
  od: number;
  hp: number;
  passcount: number;
  playcount: number;
}

interface BeatmapSet {
  id: number;
  title: string;
  title_unicode?: string;
  artist: string;
  artist_unicode?: string;
  creator: string;
  creator_id: number;
  source: string;
  tags: string[];
  status: number;
  status_name: string;
  ranked_date?: string;
  last_updated: string;
  submitted_date: string;
  approved_date?: string;
  genre: { id: number; name: string };
  language: { id: number; name: string };
  difficulties: BeatmapDifficulty[];
  has_video: boolean;
  has_storyboard: boolean;
  cover_url: string;
  thumbnail_url: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  blacklist_added_by?: string;
  favourite_count: number;
  play_count: number;
}

interface ModerationNote {
  id: number;
  beatmapset_id: number;
  note_text: string;
  created_by: string;
  created_at: string;
}

type RankedStatus = 'all' | 'ranked' | 'approved' | 'qualified' | 'loved' | 'pending' | 'wip' | 'graveyard' | 'blacklisted';
type ModerationAction = 'rank' | 'unrank' | 'love' | 'unlove' | 'qualify' | 'disqualify' | 'nominate' | 'blacklist' | 'unblacklist';

interface Filters {
  status: RankedStatus;
  search: string;
  mode: number | 'all';
  sort: 'title' | 'artist' | 'creator' | 'updated' | 'ranked' | 'plays' | 'favourites';
  order: 'asc' | 'desc';
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
}

// Status badge component
const StatusBadge: React.FC<{ status: string; isBlacklisted?: boolean }> = ({ status, isBlacklisted }) => {
  if (isBlacklisted) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800">
        <Ban className="w-3 h-3 mr-1" />
        Blacklisted
      </span>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    'Ranked': { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800' },
    'Approved': { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800' },
    'Qualified': { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-800' },
    'Loved': { bg: 'bg-pink-900/30', text: 'text-pink-400', border: 'border-pink-800' },
    'Pending': { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-800' },
    'WIP': { bg: 'bg-gray-700/30', text: 'text-gray-400', border: 'border-gray-600' },
    'Graveyard': { bg: 'bg-gray-800/30', text: 'text-gray-500', border: 'border-gray-700' },
  };

  const config = statusConfig[status] || statusConfig['Pending'];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
      {status}
    </span>
  );
};

// Mode icon component
const ModeIcon: React.FC<{ mode: number }> = ({ mode }) => {
  const modes = ['osu!', 'osu!taiko', 'osu!catch', 'osu!mania'];
  const colors = ['text-pink-400', 'text-red-400', 'text-cyan-400', 'text-purple-400'];
  
  return (
    <span className={`text-xs font-medium ${colors[mode] || 'text-gray-400'}`}>
      {modes[mode] || 'Unknown'}
    </span>
  );
};

// Action Modal Component
interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: ModerationAction;
  target: 'set' | 'difficulty';
  item: BeatmapSet | BeatmapDifficulty | null;
  onConfirm: (reason: string) => Promise<void>;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, action, target, item, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReason('');
    setError(null);
  }, [isOpen, action]);

  if (!isOpen || !item) return null;

  const actionConfig: Record<ModerationAction, { title: string; description: string; color: string; icon: React.ReactNode; requiresReason: boolean }> = {
    rank: { 
      title: 'Rank Beatmap', 
      description: 'This will move the beatmap to Ranked status and enable PP rewards.', 
      color: 'green',
      icon: <Star className="w-5 h-5" />,
      requiresReason: false 
    },
    unrank: { 
      title: 'Unrank Beatmap', 
      description: 'This will remove Ranked status and disable PP rewards. All scores will lose PP.', 
      color: 'red',
      icon: <XCircle className="w-5 h-5" />,
      requiresReason: true 
    },
    love: { 
      title: 'Love Beatmap', 
      description: 'This will move the beatmap to Loved status. No PP will be awarded.', 
      color: 'pink',
      icon: <Heart className="w-5 h-5" />,
      requiresReason: false 
    },
    unlove: { 
      title: 'Unlove Beatmap', 
      description: 'This will remove Loved status and return the beatmap to Pending.', 
      color: 'red',
      icon: <XCircle className="w-5 h-5" />,
      requiresReason: true 
    },
    qualify: { 
      title: 'Qualify Beatmap', 
      description: 'This will move the beatmap to Qualified status for ranking consideration.', 
      color: 'yellow',
      icon: <CheckCircle className="w-5 h-5" />,
      requiresReason: false 
    },
    disqualify: { 
      title: 'Disqualify Beatmap', 
      description: 'This will remove Qualified status. Please provide a reason.', 
      color: 'red',
      icon: <XCircle className="w-5 h-5" />,
      requiresReason: true 
    },
    nominate: { 
      title: 'Nominate Beatmap', 
      description: 'This will nominate the beatmap for ranking.', 
      color: 'blue',
      icon: <Star className="w-5 h-5" />,
      requiresReason: false 
    },
    blacklist: { 
      title: 'Blacklist Beatmap', 
      description: 'This will prevent the beatmap from being played or downloaded.', 
      color: 'red',
      icon: <Ban className="w-5 h-5" />,
      requiresReason: true 
    },
    unblacklist: { 
      title: 'Remove from Blacklist', 
      description: 'This will allow the beatmap to be played again.', 
      color: 'green',
      icon: <CheckCircle className="w-5 h-5" />,
      requiresReason: false 
    },
  };

  const config = actionConfig[action];
  const itemName = 'title' in item ? item.title : item.version;
  const itemArtist = 'artist' in item ? item.artist : '';
  
  // Fixed: Use a mapping object instead of dynamic class names
  const colorClasses: Record<string, string> = {
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    pink: 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };
  
  const iconBgClasses: Record<string, string> = {
    green: 'bg-green-900/30',
    red: 'bg-red-900/30',
    pink: 'bg-pink-900/30',
    yellow: 'bg-yellow-900/30',
    blue: 'bg-blue-900/30',
  };

  const handleConfirm = async () => {
    if (config.requiresReason && !reason.trim()) {
      setError('A reason is required for this action.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onConfirm(reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${iconBgClasses[config.color]}`}>
                {config.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{config.title}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 mb-4">{config.description}</p>
            
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">Target {target === 'set' ? 'Beatmapset' : 'Difficulty'}</p>
              <p className="text-white font-medium">
                {itemArtist && <span className="text-gray-400">{itemArtist} - </span>}
                {itemName}
              </p>
              {'creator' in item && (
                <p className="text-sm text-gray-400 mt-1">by {item.creator}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason {config.requiresReason ? <span className="text-red-400">*</span> : '(optional)'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={config.requiresReason ? 'Please provide a reason for this action...' : 'Add an optional note...'}
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${colorClasses[config.color]} disabled:opacity-50`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : config.icon}
              {config.title}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Detail Panel Component
interface DetailPanelProps {
  beatmapSet: BeatmapSet | null;
  onClose: () => void;
  onAction: (action: ModerationAction, target: 'set' | 'difficulty', item: BeatmapSet | BeatmapDifficulty) => void;
  onRefresh: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ beatmapSet, onClose, onAction, onRefresh }) => {
  const [notes, setNotes] = useState<ModerationNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (beatmapSet) {
      fetchNotes(beatmapSet.id);
    }
  }, [beatmapSet]);

  const fetchNotes = async (setId: number) => {
    setLoadingNotes(true);
    try {
      const response = await fetch(`/api/admin/beatmapsets/${setId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const addNote = async () => {
    if (!beatmapSet || !newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const response = await fetch(`/api/admin/beatmapsets/${beatmapSet.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_text: newNote }),
      });
      
      if (response.ok) {
        const note = await response.json();
        setNotes([...notes, note]);
        setNewNote('');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  if (!beatmapSet) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-gray-800 border-l border-gray-700 shadow-2xl overflow-y-auto z-40">
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Beatmap Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Cover Image */}
      <div className="relative h-40 bg-gray-900">
        <img
          src={beatmapSet.cover_url}
          alt=""
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white truncate">{beatmapSet.artist} - {beatmapSet.title}</h3>
          <p className="text-gray-300 text-sm">mapped by {beatmapSet.creator}</p>
        </div>
      </div>
      
      {/* Status & Actions */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <StatusBadge status={beatmapSet.status_name} isBlacklisted={beatmapSet.is_blacklisted} />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>ID: {beatmapSet.id}</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {!beatmapSet.is_blacklisted && beatmapSet.status !== 1 && beatmapSet.status !== 2 && (
            <button
              onClick={() => onAction('rank', 'set', beatmapSet)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
            >
              <Star className="w-4 h-4" />
              Rank
            </button>
          )}
          {(beatmapSet.status === 1 || beatmapSet.status === 2) && (
            <button
              onClick={() => onAction('unrank', 'set', beatmapSet)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Unrank
            </button>
          )}
          {!beatmapSet.is_blacklisted && beatmapSet.status !== 4 && (
            <button
              onClick={() => onAction('love', 'set', beatmapSet)}
              className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors"
            >
              <Heart className="w-4 h-4" />
              Love
            </button>
          )}
          {beatmapSet.status === 4 && (
            <button
              onClick={() => onAction('unlove', 'set', beatmapSet)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Unlove
            </button>
          )}
          {!beatmapSet.is_blacklisted && (
            <button
              onClick={() => onAction('blacklist', 'set', beatmapSet)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
              Blacklist
            </button>
          )}
          {beatmapSet.is_blacklisted && (
            <button
              onClick={() => onAction('unblacklist', 'set', beatmapSet)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Unblacklist
            </button>
          )}
        </div>
      </div>
      
      {/* Metadata */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Submitted</p>
            <p className="text-white">{formatDate(beatmapSet.submitted_date)}</p>
          </div>
          {beatmapSet.ranked_date && (
            <div>
              <p className="text-gray-500">Ranked</p>
              <p className="text-white">{formatDate(beatmapSet.ranked_date)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Last Updated</p>
            <p className="text-white">{formatDate(beatmapSet.last_updated)}</p>
          </div>
          <div>
            <p className="text-gray-500">Genre</p>
            <p className="text-white">{beatmapSet.genre?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-gray-500">Language</p>
            <p className="text-white">{beatmapSet.language?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-gray-500">Source</p>
            <p className="text-white">{beatmapSet.source || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Favourites</p>
            <p className="text-white">{beatmapSet.favourite_count.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Plays</p>
            <p className="text-white">{beatmapSet.play_count.toLocaleString()}</p>
          </div>
        </div>
        
        {beatmapSet.tags && beatmapSet.tags.length > 0 && (
          <div className="mt-4">
            <p className="text-gray-500 text-sm mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {beatmapSet.tags.slice(0, 10).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                  {tag}
                </span>
              ))}
              {beatmapSet.tags.length > 10 && (
                <span className="px-2 py-0.5 text-gray-500 text-xs">
                  +{beatmapSet.tags.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Difficulties */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Difficulties ({beatmapSet.difficulties.length})</h4>
        <div className="space-y-2">
          {beatmapSet.difficulties.map((diff) => (
            <div
              key={diff.id}
              className="bg-gray-900 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ModeIcon mode={diff.mode} />
                  <span className="text-white truncate">{diff.version}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span>★ {diff.star_rating.toFixed(2)}</span>
                  <span>{formatDuration(diff.total_length)}</span>
                  <span>{diff.bpm.toFixed(0)} BPM</span>
                  <span>CS {diff.cs} AR {diff.ar} OD {diff.od}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => onAction('rank', 'difficulty', diff)}
                  className="p-1.5 text-green-400 hover:bg-green-900/30 rounded transition-colors"
                  title="Rank"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onAction('love', 'difficulty', diff)}
                  className="p-1.5 text-pink-400 hover:bg-pink-900/30 rounded transition-colors"
                  title="Love"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Blacklist Info */}
      {beatmapSet.is_blacklisted && (
        <div className="p-4 border-b border-gray-700 bg-red-900/10">
          <h4 className="text-sm font-medium text-red-400 mb-2">Blacklist Information</h4>
          <div className="text-sm">
            <p className="text-gray-400">Reason: <span className="text-white">{beatmapSet.blacklist_reason || 'No reason provided'}</span></p>
            {beatmapSet.blacklist_added_by && (
              <p className="text-gray-400 mt-1">Added by: <span className="text-white">{beatmapSet.blacklist_added_by}</span></p>
            )}
          </div>
        </div>
      )}
      
      {/* Moderator Notes */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Moderator Notes</h4>
        
        {loadingNotes ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {notes.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No notes yet</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{note.created_by}</span>
                    <span className="text-xs text-gray-500">{formatDate(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-300">{note.note_text}</p>
                </div>
              ))
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            placeholder="Add a note..."
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim() || addingNote}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const BeatmapModerationPage: React.FC = () => {
  const [beatmapSets, setBeatmapSets] = useState<BeatmapSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<BeatmapSet | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    search: '',
    mode: 'all',
    sort: 'updated',
    order: 'desc',
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 25,
    total: 0,
  });
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: ModerationAction;
    target: 'set' | 'difficulty';
    item: BeatmapSet | BeatmapDifficulty | null;
  }>({
    isOpen: false,
    action: 'rank',
    target: 'set',
    item: null,
  });
  
  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search]);

  // Reset page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters.status, filters.mode, filters.sort, filters.order, debouncedSearch]);

  const fetchBeatmapSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.mode !== 'all') params.append('mode', String(filters.mode));
      params.append('sort', filters.sort);
      params.append('order', filters.order);
      params.append('page', String(pagination.page));
      params.append('per_page', String(pagination.per_page));

      const response = await fetch(`/api/admin/beatmapsets?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBeatmapSets(data.beatmapsets);
        setPagination(prev => ({ ...prev, total: data.total }));
      } else {
        throw new Error('Failed to fetch beatmapsets');
      }
    } catch (err) {
      console.error('Failed to fetch beatmapsets:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.mode, filters.sort, filters.order, debouncedSearch, pagination.page, pagination.per_page]);

  useEffect(() => {
    fetchBeatmapSets();
  }, [fetchBeatmapSets]);

  const handleAction = useCallback(async (action: ModerationAction, target: 'set' | 'difficulty', item: BeatmapSet | BeatmapDifficulty) => {
    setModalState({ isOpen: true, action, target, item });
  }, []);

  const executeAction = useCallback(async (reason: string) => {
    const { action, target, item } = modalState;
    if (!item) return;

    const endpoint = target === 'set' 
      ? `/api/admin/beatmapsets/${item.id}/${action}`
      : `/api/admin/beatmaps/${item.id}/${action}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Action failed');
    }

    fetchBeatmapSets();
    if (selectedSet?.id === (item as BeatmapSet).id) {
      // Refresh selected set data
      const detailResponse = await fetch(`/api/admin/beatmapsets/${selectedSet.id}`);
      if (detailResponse.ok) {
        setSelectedSet(await detailResponse.json());
      }
    }
  }, [modalState, fetchBeatmapSets, selectedSet]);

  const totalPages = Math.ceil(pagination.total / pagination.per_page);

  const statusOptions: RankedStatus[] = ['all', 'ranked', 'approved', 'qualified', 'loved', 'pending', 'wip', 'graveyard', 'blacklisted'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Beatmap Moderation</h1>
          <button
            onClick={fetchBeatmapSets}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by title, artist, or creator..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as RankedStatus })}
            className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          
          {/* Mode Filter */}
          <select
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
            className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Modes</option>
            <option value={0}>osu!</option>
            <option value={1}>osu!taiko</option>
            <option value={2}>osu!catch</option>
            <option value={3}>osu!mania</option>
          </select>
          
          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value as Filters['sort'] })}
            className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated">Last Updated</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
            <option value="creator">Creator</option>
            <option value="ranked">Ranked Date</option>
            <option value="plays">Play Count</option>
            <option value="favourites">Favourite Count</option>
          </select>
          
          {/* Order Toggle */}
          <button
            onClick={() => setFilters({ ...filters, order: filters.order === 'asc' ? 'desc' : 'asc' })}
            className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors"
          >
            {filters.order === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
          <button onClick={fetchBeatmapSets} className="ml-auto text-sm underline hover:no-underline">
            Retry
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : beatmapSets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Music className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">No beatmaps found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {beatmapSets.map((set) => (
              <div
                key={set.id}
                onClick={() => setSelectedSet(set)}
                className={`flex items-center gap-4 p-4 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                  selectedSet?.id === set.id ? 'bg-gray-700/50' : ''
                }`}
              >
                {/* Thumbnail */}
                <img
                  src={set.thumbnail_url}
                  alt=""
                  className="w-16 h-12 object-cover rounded"
                />
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={set.status_name} isBlacklisted={set.is_blacklisted} />
                    <span className="text-white font-medium truncate">
                      {set.artist} - {set.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {set.creator}
                    </span>
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {set.difficulties.length} difficulties
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(set.last_updated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="text-right text-sm">
                  <p className="text-gray-400">{set.play_count.toLocaleString()} plays</p>
                  <p className="text-gray-500">{set.favourite_count.toLocaleString()} favourites</p>
                </div>
                
                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.per_page + 1} - {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} beatmapsets
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination({ ...pagination, page: pageNum })}
                    className={`w-8 h-8 rounded-lg transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === totalPages}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Detail Panel */}
      {selectedSet && (
        <DetailPanel
          beatmapSet={selectedSet}
          onClose={() => setSelectedSet(null)}
          onAction={handleAction}
          onRefresh={fetchBeatmapSets}
        />
      )}
      
      {/* Action Modal */}
      <ActionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        action={modalState.action}
        target={modalState.target}
        item={modalState.item}
        onConfirm={executeAction}
      />
    </div>
  );
};

export default BeatmapModerationPage;