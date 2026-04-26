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

  const [selectedMode, setSelectedMode] = useState<GameMode>('osu');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<string>('ranked');
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [genre, setGenre] = useState<number>(0);
  const [language, setLanguage] = useState<number>(0);
  const [nsfw, setNsfw] = useState(true);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBeatmaps(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedMode, searchQuery, status, genre, language, nsfw, sort, isLocalOnly]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && cursor) {
      fetchBeatmaps(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-osu-pink/20 text-osu-pink">
            <i className="fa fa-music text-xl" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {t('nav.beatmaps')}
            </h1>
            <p className="text-sm text-slate-500">
              {t('beatmap.listingDescription') || 'Find your favorite beatmaps'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls Container */}
      <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4 sm:p-5 mb-6 space-y-4">

        {/* Search Bar & Primary Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={t('beatmap.searchPlaceholder') || 'Search beatmaps...'}
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl pl-12 pr-10 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-osu-pink focus:border-transparent outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1.5 border border-white/5">
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
                    className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                      isSelected
                        ? 'bg-osu-pink text-white shadow-lg shadow-osu-pink/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                showFilters
                  ? 'bg-osu-pink text-white border-osu-pink shadow-lg shadow-osu-pink/20'
                  : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
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
              <div className="rounded-xl border border-white/5 bg-slate-800/30 p-5 space-y-5">

                {/* Filter Groups */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                    <select
                      className="w-full bg-slate-800/50 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all appearance-none cursor-pointer"
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Genre</label>
                    <select
                      className="w-full bg-slate-800/50 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all appearance-none cursor-pointer"
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Language</label>
                    <select
                      className="w-full bg-slate-800/50 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all appearance-none cursor-pointer"
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort By</label>
                    <div className="relative">
                      <select
                        className="w-full bg-slate-800/50 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all appearance-none cursor-pointer pr-10"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        {SORT_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <FaSort className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-11 h-6 rounded-full p-1 transition-all ${nsfw ? 'bg-osu-pink' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${nsfw ? 'translate-x-5' : ''}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} />
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors">NSFW Content</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-11 h-6 rounded-full p-1 transition-all ${isLocalOnly ? 'bg-osu-pink' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isLocalOnly ? 'translate-x-5' : ''}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={isLocalOnly} onChange={(e) => setIsLocalOnly(e.target.checked)} />
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Local/Custom Maps</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-slate-500">
            Found <span className="font-bold text-white">{total}</span> beatmapsets
          </div>

          <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-osu-pink text-white shadow-lg shadow-osu-pink/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <FaThLarge />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-osu-pink text-white shadow-lg shadow-osu-pink/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && beatmapsets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-osu-pink blur-xl opacity-20" />
            <LoadingSpinner size="lg" className="text-osu-pink relative" />
          </div>
          <p className="text-slate-500 font-medium">Loading beatmaps...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <i className="fa fa-exclamation-triangle text-2xl text-red-400" />
          </div>
          <p className="text-xl font-bold text-white mb-2">Oops!</p>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => fetchBeatmaps(true)}
            className="px-6 py-2.5 bg-osu-pink hover:bg-osu-pink/90 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-osu-pink/30"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className={`grid gap-5 ${
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
            <div className="text-center py-20 rounded-xl border border-white/5 bg-slate-900/30">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <i className="fa fa-search text-3xl text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No beatmaps found</h3>
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
            </div>
          )}

          {/* Load More */}
          {cursor && (
            <div className="mt-10 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-slate-800/50 border border-white/10 hover:border-osu-pink/50 text-slate-300 hover:text-white rounded-xl font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-osu-pink rounded-full animate-spin border-t-transparent" />
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
  );
};

export default BeatmapsPage;
