import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { beatmapAPI } from '../utils/api/beatmap';
import type { Beatmapset } from '../types/beatmap';
import type { GameMode } from '../types';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useProfileColor } from '../contexts/ProfileColorContext';
import BeatmapCard from '../components/Beatmap/BeatmapCard';
import { FaFilter, FaSort, FaThLarge, FaList, FaSearch, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const GENRES = [
  { id: 0, label: 'Any' },
  { id: 1, label: 'Unspecified' },
  { id: 2, label: 'Video Game' },
  { id: 3, label: 'Anime' },
  { id: 4, label: 'Rock' },
  { id: 5, label: 'Pop' },
  { id: 6, label: 'Other' },
  { id: 7, label: 'Novelty' },
  { id: 9, label: 'Hip Hop' },
  { id: 10, label: 'Electronic' },
  { id: 11, label: 'Metal' },
  { id: 12, label: 'Classical' },
  { id: 13, label: 'Folk' },
  { id: 14, label: 'Jazz' },
];

const LANGUAGES = [
  { id: 0, label: 'Any' },
  { id: 1, label: 'Unspecified' },
  { id: 2, label: 'English' },
  { id: 3, label: 'Chinese' },
  { id: 4, label: 'French' },
  { id: 5, label: 'German' },
  { id: 6, label: 'Italian' },
  { id: 7, label: 'Japanese' },
  { id: 8, label: 'Korean' },
  { id: 9, label: 'Spanish' },
  { id: 10, label: 'Swedish' },
  { id: 11, label: 'Russian' },
  { id: 12, label: 'Polish' },
  { id: 13, label: 'Instrumental' },
  { id: 14, label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'relevance_desc', label: 'Relevance' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
  { value: 'artist_asc', label: 'Artist (A-Z)' },
  { value: 'artist_desc', label: 'Artist (Z-A)' },
  { value: 'difficulty_desc', label: 'Difficulty (High-Low)' },
  { value: 'difficulty_asc', label: 'Difficulty (Low-High)' },
  { value: 'ranked_desc', label: 'Ranked Date (New-Old)' },
  { value: 'ranked_asc', label: 'Ranked Date (Old-New)' },
  { value: 'rating_desc', label: 'Rating' },
  { value: 'plays_desc', label: 'Plays' },
  { value: 'favourites_desc', label: 'Favorites' },
];

const BeatmapsPage: React.FC = () => {
  const { t } = useTranslation();
  const { profileColor } = useProfileColor();
  
  // State
  const [selectedMode, setSelectedMode] = useState<GameMode>('osu');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<string>('ranked');
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [genre, setGenre] = useState<number>(0);
  const [language, setLanguage] = useState<number>(0);
  const [nsfw, setNsfw] = useState(true); // Default to showing NSFW content if allowed, or filtered? Usually true means show. API might be 'nsfw' param.
  const [sort, setSort] = useState('relevance_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [beatmapsets, setBeatmapsets] = useState<Beatmapset[]>([]);
  const [cursor, setCursor] = useState<Record<string, any> | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBeatmaps = useCallback(async (reset: boolean = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      let modeInt = 0;
      if (['taiko', 'taikorx'].includes(selectedMode)) {
        modeInt = 1;
      } else if (['fruits', 'fruitsrx'].includes(selectedMode)) {
        modeInt = 2;
      } else if (selectedMode === 'mania') {
        modeInt = 3;
      } else if (selectedMode === 'osuspaceruleset') {
        modeInt = 727;
      }

      const currentCursor = reset ? undefined : cursor;
      
      // Don't fetch if no cursor and not resetting (end of list)
      if (!reset && !cursor) {
          setLoadingMore(false);
          return;
      }

      const response = await beatmapAPI.searchBeatmaps({
        q: searchQuery,
        m: modeInt,
        s: status === 'any' ? 'leaderboard' : status,
        g: genre !== 0 ? genre : undefined,
        l: language !== 0 ? language : undefined,
        nsfw: nsfw,
        sort: sort,
        is_local: isLocalOnly,
        cursor: currentCursor || undefined,
      });

      if (!abortController.signal.aborted) {
        if (reset) {
          setBeatmapsets(response.beatmapsets);
        } else {
          setBeatmapsets(prev => {
            const existingIds = new Set(prev.map(set => set.id));
            const newSets = response.beatmapsets.filter((set: Beatmapset) => !existingIds.has(set.id));
            return [...prev, ...newSets];
          });
        }
        setCursor(response.cursor);
        setTotal(response.total);
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        console.error('Failed to fetch beatmaps:', err);
        setError(t('beatmap.error') || 'Failed to load beatmaps');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [t, selectedMode, searchQuery, status, genre, language, nsfw, sort, isLocalOnly, cursor]);

  // Initial fetch and on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBeatmaps(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedMode, searchQuery, status, genre, language, nsfw, sort, isLocalOnly]); // Dependencies that trigger a reset

  const handleLoadMore = () => {
    if (!loading && !loadingMore && cursor) {
      fetchBeatmaps(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('nav.beatmaps')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('beatmap.listingDescription') || 'Find your favorite beatmaps'}
          </p>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-4 mb-8">
            
            {/* Search Bar & Primary Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('beatmap.searchPlaceholder') || 'Search beatmaps...'}
                        className="w-full bg-card border-card rounded-xl pl-12 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                    <div className="bg-card rounded-xl p-1 shadow-sm border-card whitespace-nowrap flex gap-1">
                        {[
                            { id: 'osu', label: 'osu!' },
                            { id: 'taiko', label: 'Taiko' },
                            { id: 'fruits', label: 'Catch' },
                            { id: 'mania', label: 'Mania' },
                            { id: 'osuspaceruleset', label: 'Space' }
                        ].map((mode) => {
                            const isSelected = selectedMode === mode.id || 
                                (mode.id === 'taiko' && selectedMode === 'taikorx') || 
                                (mode.id === 'fruits' && selectedMode === 'fruitsrx') ||
                                (mode.id === 'osu' && ['osurx', 'osuap'].includes(selectedMode));

                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => setSelectedMode(mode.id as GameMode)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        isSelected
                                            ? 'bg-pink-500 text-white shadow-md' 
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                            showFilters 
                                ? 'bg-pink-500 text-white border-pink-500' 
                                : 'bg-card border-card text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <FaFilter />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-card rounded-xl p-6 shadow-sm border-card space-y-6">
                            
                            {/* Filter Groups */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                
                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="any">Any</option>
                                        <option value="ranked">Ranked</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="loved">Loved</option>
                                        <option value="pending">Pending</option>
                                        <option value="wip">WIP</option>
                                        <option value="graveyard">Graveyard</option>
                                    </select>
                                </div>

                                {/* Genre */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Genre</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                                        value={genre}
                                        onChange={(e) => setGenre(Number(e.target.value))}
                                    >
                                        {GENRES.map(g => (
                                            <option key={g.id} value={g.id}>{g.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Language */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Language</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                                        value={language}
                                        onChange={(e) => setLanguage(Number(e.target.value))}
                                    >
                                        {LANGUAGES.map(l => (
                                            <option key={l.id} value={l.id}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sort */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sort By</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                                            value={sort}
                                            onChange={(e) => setSort(e.target.value)}
                                        >
                                            {SORT_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                        <FaSort className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${nsfw ? 'bg-pink-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${nsfw ? 'translate-x-4' : ''}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-pink-500 transition-colors">NSFW Content</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isLocalOnly ? 'bg-pink-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isLocalOnly ? 'translate-x-4' : ''}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={isLocalOnly} onChange={(e) => setIsLocalOnly(e.target.checked)} />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-pink-500 transition-colors">Local/Custom Maps</span>
                                </label>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Header */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Found <span className="font-bold text-gray-900 dark:text-white">{total}</span> beatmapsets
                </div>
                
                <div className="flex bg-card rounded-lg p-1 border-card">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        <FaThLarge />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        <FaList />
                    </button>
                </div>
            </div>
        </div>

        {/* Content */}
        {loading && beatmapsets.length === 0 ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 bg-card rounded-xl p-8 border-card">
            <p className="text-xl font-bold mb-2">Oops!</p>
            <p>{error}</p>
            <button 
                onClick={() => fetchBeatmaps(true)}
                className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
                Try Again
            </button>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
                viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
                    : 'grid-cols-1'
            }`}>
              {beatmapsets.map((set) => (
                <div key={`${set.id}-${set.status}`} className={viewMode === 'list' ? 'h-40' : 'h-full'}>
                    <BeatmapCard beatmapset={set} themeColor={profileColor} />
                </div>
              ))}
            </div>
            
            {beatmapsets.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-500 bg-card rounded-xl border-card">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No beatmaps found</h3>
                <p>Try adjusting your filters or search query.</p>
              </div>
            )}

            {/* Load More */}
            {cursor && (
                <div className="mt-12 text-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-card border border-gray-200 dark:border-gray-700 hover:border-pink-500 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingMore ? (
                            <div className="flex items-center gap-2">
                                <LoadingSpinner size="sm" />
                                <span>Loading more...</span>
                            </div>
                        ) : (
                            'Load More Beatmaps'
                        )}
                    </button>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BeatmapsPage;
