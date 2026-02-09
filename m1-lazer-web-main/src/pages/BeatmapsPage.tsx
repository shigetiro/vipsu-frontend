import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { beatmapAPI } from '../utils/api/beatmap';
import type { Beatmapset, SearchBeatmapsetsResponse } from '../types/beatmap';
import type { GameMode } from '../types';
import GameModeSelector from '../components/UI/GameModeSelector';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import LazyBackgroundImage from '../components/UI/LazyBackgroundImage';
import { useProfileColor } from '../contexts/ProfileColorContext';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../utils/format';

const BeatmapsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profileColor } = useProfileColor();
  
  const [selectedMode, setSelectedMode] = useState<GameMode>('osu');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<string>('any');
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SearchBeatmapsetsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBeatmaps = useCallback(async (q: string, mode: GameMode, s: string, local: boolean) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const modeInt = mode === 'osu' ? 0 : 
                    mode === 'taiko' ? 1 : 
                    mode === 'fruits' ? 2 : 
                    mode === 'mania' ? 3 : 
                    mode === 'space' ? 727 : 0;

      const response = await beatmapAPI.searchBeatmaps({
        q,
        m: modeInt,
        s: s === 'any' ? 'leaderboard' : s,
        sort: 'relevance_desc',
        is_local: local,
      });

      if (!abortController.signal.aborted) {
        setData(response);
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        console.error('Failed to fetch beatmaps:', err);
        setError(t('beatmap.error') || 'Failed to load beatmaps');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBeatmaps(searchQuery, selectedMode, status, isLocalOnly);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedMode, status, isLocalOnly, fetchBeatmaps]);

  const handleBeatmapClick = (beatmapsetId: number) => {
    navigate(`/beatmapsets/${beatmapsetId}`);
  };

  const hexToRgb = (hex: string): string => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const themeRgb = hexToRgb(profileColor || '#ED8EA6');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('nav.beatmaps')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('beatmap.listingDescription') || 'Find your favorite beatmaps'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Search and Filters */}
          <div className="flex-1 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('beatmap.searchPlaceholder') || 'Search beatmaps...'}
                className="w-full bg-card border-card rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              {!isLocalOnly && (
                <>
                  <div className="bg-card rounded-lg p-1.5 shadow-sm border-card">
                    <GameModeSelector
                      selectedMode={selectedMode}
                      onModeChange={(mode) => setSelectedMode(mode)}
                      variant="compact"
                    />
                  </div>

                  <select
                    className="bg-card border-card rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="any">{t('beatmap.status.any') || 'Any Status'}</option>
                    <option value="ranked">{t('beatmap.status.ranked') || 'Ranked'}</option>
                    <option value="approved">{t('beatmap.status.approved') || 'Approved'}</option>
                    <option value="qualified">{t('beatmap.status.qualified') || 'Qualified'}</option>
                    <option value="loved">{t('beatmap.status.loved') || 'Loved'}</option>
                    <option value="pending">{t('beatmap.status.pending') || 'Pending'}</option>
                    <option value="wip">{t('beatmap.status.wip') || 'WIP'}</option>
                    <option value="graveyard">{t('beatmap.status.graveyard') || 'Graveyard'}</option>
                  </select>
                </>
              )}

              <label className="flex items-center gap-2 bg-card border-card rounded-lg px-4 py-2 cursor-pointer hover:bg-opacity-80 transition-all">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                  checked={isLocalOnly}
                  onChange={(e) => setIsLocalOnly(e.target.checked)}
                />
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  {t('beatmap.customMaps') || 'Custom Maps'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data?.beatmapsets.map((set) => (
              <div
                key={set.id}
                className="group relative bg-card rounded-2xl overflow-hidden border-card hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleBeatmapClick(set.id)}
              >
                <LazyBackgroundImage
                  src={set.covers?.card || '/default.jpg'}
                  className="h-32 w-full object-cover"
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      set.status === 'ranked' ? 'bg-green-500 text-white' :
                      set.status === 'approved' ? 'bg-blue-500 text-white' :
                      set.status === 'qualified' ? 'bg-purple-500 text-white' :
                      set.status === 'loved' ? 'bg-pink-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {t(`beatmap.status.${set.status}`) || set.status}
                    </span>
                    {set.is_local && (
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-lg backdrop-blur-sm bg-opacity-90">
                        {t('beatmap.uploaded') || 'Uploaded'}
                      </span>
                    )}
                  </div>
                </LazyBackgroundImage>

                <div className="p-4 bg-card">
                  <h3 className="text-gray-900 dark:text-white font-bold truncate leading-tight group-hover:text-pink-500 transition-colors">
                    {set.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm truncate mb-2">
                    {set.artist}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {t('beatmap.mappedBy') || 'mapped by'} <span className="text-gray-700 dark:text-gray-300 font-medium">{set.creator}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                      <span className="opacity-70">▶</span> {formatNumber(set.play_count)}
                    </div>
                  </div>
                </div>

                {/* Hover overlay with theme color */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-300"
                  style={{
                    backgroundColor: `rgb(${themeRgb})`
                  }}
                />
              </div>
            ))}
            
            {data?.beatmapsets.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-500">
                {t('beatmap.noResults') || 'No beatmaps found'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BeatmapsPage;
