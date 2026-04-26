import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { beatmapAPI, scoreAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import type { Beatmapset, Beatmap } from '../types';
import type { Score } from '../types/scores';
import { formatDuration, formatNumber } from '../utils/format';
import { GAME_MODE_NAMES, GAME_MODE_GROUPS, MAIN_MODE_ICONS } from '../types';
import type { GameMode, MainGameMode } from '../types';
import { AudioPlayButton, AudioPlayerControls } from '../components/UI/AudioPlayer';
import toast from 'react-hot-toast';

const BeatmapPage: React.FC = () => {
  const { beatmapId, beatmapsetId } = useParams<{ beatmapId?: string; beatmapsetId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [beatmapset, setBeatmapset] = useState<Beatmapset | null>(null);
  const [selectedBeatmap, setSelectedBeatmap] = useState<Beatmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>('osu');
  const [openMainMode, setOpenMainMode] = useState<MainGameMode | null>(null);
  const closeTimersRef = useRef<number | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    return () => {
      if (closeTimersRef.current) {
        clearTimeout(closeTimersRef.current);
        closeTimersRef.current = null;
      }
    };
  }, []);

  const fetchBeatmapData = useCallback(async () => {
    const hashMatch = window.location.hash.match(/#[^/]+\/(\d+)/);
    const hashBeatmapId = hashMatch ? parseInt(hashMatch[1], 10) : null;

    const targetBeatmapId = beatmapId ? parseInt(beatmapId, 10) : hashBeatmapId;
    const targetBeatmapsetId = beatmapsetId ? parseInt(beatmapsetId, 10) : null;

    if (!targetBeatmapId && !targetBeatmapsetId) {
      setError(t('beatmap.notFound'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let beatmapsetData: Beatmapset;

      if (targetBeatmapsetId) {
        beatmapsetData = await beatmapAPI.getBeatmapset(targetBeatmapsetId);
      } else if (targetBeatmapId) {
        if (isNaN(targetBeatmapId)) {
          throw new Error(t('beatmap.notFound'));
        }

        try {
          beatmapsetData = await beatmapAPI.getBeatmapByBeatmapId(targetBeatmapId);
        } catch (error: any) {
          if (error.message === 'Beatmap not found') {
            throw new Error(t('beatmap.notFound'));
          }
          throw error;
        }
      } else {
        throw new Error(t('beatmap.notFound'));
      }

      setBeatmapset(beatmapsetData);

      let targetBeatmap: Beatmap | undefined;

      if (targetBeatmapId) {
        targetBeatmap = beatmapsetData.beatmaps.find(
          (beatmap) => beatmap.id === targetBeatmapId
        );
      }

      if (targetBeatmap) {
        setSelectedBeatmap(targetBeatmap);
        const mode = targetBeatmap.mode || 'osu';
        const newUrl = `/beatmapsets/${beatmapsetData.id}#${mode}/${targetBeatmap.id}`;
        if (window.location.pathname + window.location.hash !== newUrl) {
          navigate(newUrl, { replace: true });
        }
      } else {
        const firstBeatmap = beatmapsetData.beatmaps[0];
        if (firstBeatmap) {
          setSelectedBeatmap(firstBeatmap);
          const mode = firstBeatmap.mode || 'osu';
          const newUrl = `/beatmapsets/${beatmapsetData.id}#${mode}/${firstBeatmap.id}`;
          navigate(newUrl, { replace: true });
        }
      }

    } catch (error: any) {
      console.error('Failed to fetch beatmap data:', error);
      setError(error.message || t('beatmap.error'));
      toast.error(error.message || t('beatmap.error'));
    } finally {
      setLoading(false);
    }
  }, [beatmapId, beatmapsetId, navigate, t]);

  useEffect(() => {
    fetchBeatmapData();
  }, [fetchBeatmapData]);

  const handleDifficultySelect = useCallback((beatmap: Beatmap) => {
    setSelectedBeatmap(beatmap);
    if (beatmapset) {
      const mode = beatmap.mode || 'osu';
      navigate(`/beatmapsets/${beatmapset.id}#${mode}/${beatmap.id}`, { replace: true });
    }
  }, [beatmapset, navigate]);

  useEffect(() => {
    if (!selectedBeatmap) return;

    const fetchScores = async () => {
      if (!isAuthenticated) {
        setScores([]);
        return;
      }

      setScoresLoading(true);
      try {
        const modeToUse = (selectedMode as string) || selectedBeatmap.mode || 'osu';
        const data = await scoreAPI.getBeatmapScores(selectedBeatmap.id, 50, modeToUse);
        const sorted = (data.scores || []).slice().sort((a: any, b: any) => ((b.total_score ?? b.pp ?? 0) - (a.total_score ?? a.pp ?? 0)));
        setScores(sorted);
      } catch (error) {
        const err = error as any;
        if (err?.response?.status === 401) {
          toast.error(t('auth.loginRequired') || 'Please login to view scores');
        } else {
          console.error('Failed to fetch beatmap scores:', error);
        }
        setScores([]);
      } finally {
        setScoresLoading(false);
      }
    };

    fetchScores();
  }, [selectedBeatmap, isAuthenticated, selectedMode, t]);

  useEffect(() => {
    if (!selectedBeatmap) return;
    const mode = (selectedBeatmap.mode || 'osu') as GameMode;
    setSelectedMode(mode);
  }, [selectedBeatmap]);

  const formatBPM = useCallback((bpm: number) => {
    return Number.isInteger(bpm) ? bpm.toString() : bpm.toFixed(1);
  }, []);

  const getDifficultyColor = useCallback((stars: number) => {
    if (stars < 1.5) return 'text-gray-500';
    if (stars < 2.25) return 'text-blue-500';
    if (stars < 3.75) return 'text-green-500';
    if (stars < 5.25) return 'text-yellow-500';
    if (stars < 6.75) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  const isLeaderboardAvailable = useMemo(() => {
    return ['ranked', 'approved', 'qualified', 'loved'].includes(beatmapset?.status || '');
  }, [beatmapset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-osu-pink shadow-[0_0_30px_rgba(255,0,85,0.3)]"></div>
      </div>
    );
  }

  if (error || !beatmapset) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center p-8 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl">
          <h1 className="text-2xl font-bold text-red-400 mb-4 drop-shadow-lg">
            {error || t('beatmap.notFound')}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-osu-pink to-osu-pink/80 hover:from-osu-pink/90 hover:to-osu-pink/70 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,0,85,0.4)] transform hover:scale-105"
          >
            {t('beatmap.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f14] via-[#14141a] to-[#1a1a22]">
      {/* Hero Section - Compact */}
      <div className="relative">
        <div
          className="relative h-48 sm:h-56 md:h-64"
          style={{
            backgroundImage: `linear-gradient(180deg, transparent 0%, rgba(15,15,20,0.5) 50%, #0f0f14 100%), url(${beatmapset.covers?.['cover@2x'] || beatmapset.covers?.cover || '/images/default-bg.jpg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f14] via-transparent to-black/30" />

          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-4">
            <div className="max-w-[1600px] mx-auto flex items-end gap-4">
              {/* Cover Image */}
              <div className="hidden sm:block flex-shrink-0 -mb-8">
                <img
                  src={beatmapset.covers?.cover || '/images/default-bg.jpg'}
                  alt=""
                  className="w-32 h-32 rounded-xl shadow-2xl border-2 border-white/10"
                />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 pb-2">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-osu-pink text-white">
                    {beatmapset.status}
                  </span>
                  {beatmapset.video && (
                    <span className="hidden sm:inline px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                      VIDEO
                    </span>
                  )}
                  {beatmapset.storyboard && (
                    <span className="hidden sm:inline px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      STORYBOARD
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 truncate">
                  {beatmapset.title_unicode || beatmapset.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-400">
                  by <span className="text-osu-pink font-medium">{beatmapset.artist_unicode || beatmapset.artist}</span>
                  <span className="text-slate-600 mx-2">|</span>
                  mapped by <span className="text-slate-300">{beatmapset.creator}</span>
                </p>
              </div>

              {/* Audio Button - Centered vertically */}
              {beatmapset.preview_url && (
                <div className="flex-shrink-0 self-center sm:self-auto">
                  <AudioPlayButton
                    audioUrl={beatmapset.preview_url}
                    size="lg"
                    showProgress={true}
                    className="shadow-2xl hover:scale-105 transition-transform"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Difficulty Selector */}
            <div className="rounded-xl border border-white/5 bg-slate-900/30">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <i className="fa fa-star text-osu-pink" />
                  {t('beatmap.difficulties')}
                </h2>
                <span className="text-xs text-slate-500">{beatmapset.beatmaps.length} versions</span>
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {beatmapset.beatmaps
                  .sort((a, b) => a.difficulty_rating - b.difficulty_rating)
                  .map((beatmap) => {
                    const isSelected = selectedBeatmap?.id === beatmap.id;
                    return (
                      <button
                        key={beatmap.id}
                        onClick={() => handleDifficultySelect(beatmap)}
                        data-tooltip-id="difficulty-tooltip"
                        data-tooltip-content={`${beatmap.version} - ${beatmap.difficulty_rating.toFixed(2)}★`}
                        className={`group relative flex flex-col items-center justify-center min-w-[80px] px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? 'border-osu-pink bg-osu-pink/20 shadow-[0_0_15px_rgba(255,0,85,0.3)]'
                            : 'border-transparent bg-slate-800/50 hover:bg-slate-800'
                        }`}
                      >
                        <span className={`text-sm font-bold ${getDifficultyColor(beatmap.difficulty_rating)}`}>
                          {beatmap.difficulty_rating.toFixed(2)}★
                        </span>
                        <span className="text-xs text-slate-500 mt-1 truncate max-w-[100px] font-medium">
                          {beatmap.version}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Selected Beatmap Details - Stats only, no SR section */}
            {selectedBeatmap && (
              <div className="rounded-xl border border-white/5 bg-slate-900/30">
                <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${getDifficultyColor(selectedBeatmap.difficulty_rating)}`}>
                      {selectedBeatmap.difficulty_rating.toFixed(2)}★
                    </span>
                    <span className="text-slate-400">{selectedBeatmap.version}</span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {GAME_MODE_NAMES[selectedBeatmap.mode as keyof typeof GAME_MODE_NAMES]}
                  </span>
                </div>

                <div className="p-5">
                  {/* Main Stats only */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: t('beatmap.length'), value: formatDuration(selectedBeatmap.total_length) },
                      { label: t('beatmap.bpm'), value: formatBPM(selectedBeatmap.bpm) },
                      { label: t('beatmap.maxCombo'), value: formatNumber(selectedBeatmap.max_combo) },
                      { label: t('beatmap.mode'), value: GAME_MODE_NAMES[selectedBeatmap.mode as keyof typeof GAME_MODE_NAMES] },
                    ].map((stat, idx) => (
                      <div key={idx} className="text-center p-4 rounded-lg border border-white/10 bg-black/20">
                        <div className="text-xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-xs text-slate-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {selectedBeatmap && isLeaderboardAvailable && (
              <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <i className="fa fa-trophy text-amber-400" />
                    {t('Leaderboard') || 'Top Scores'}
                  </h2>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-white/5">
                    {(Object.keys(GAME_MODE_GROUPS) as MainGameMode[]).map((mainMode) => {
                      const variants = GAME_MODE_GROUPS[mainMode];
                      const anyActive = variants.includes(selectedMode);
                      const isOpen = openMainMode === mainMode;

                      return (
                        <div
                          key={mainMode}
                          className="relative"
                          onMouseEnter={() => {
                            if (closeTimersRef.current) {
                              clearTimeout(closeTimersRef.current);
                              closeTimersRef.current = null;
                            }
                            setOpenMainMode(mainMode);
                          }}
                          onMouseLeave={() => {
                            closeTimersRef.current = window.setTimeout(() => setOpenMainMode(null), 150) as unknown as number;
                          }}
                        >
                          <button
                            onClick={() => setSelectedMode(mainMode)}
                            className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              anyActive
                                ? 'bg-osu-pink text-white shadow-lg shadow-osu-pink/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {mainMode === 'osuspaceruleset' ? (
                              <img
                                src="/image/logo.png"
                                alt=""
                                className="w-4 h-4 object-contain"
                                style={{ filter: anyActive ? 'brightness(1.2)' : 'brightness(0.7)' }}
                              />
                            ) : MAIN_MODE_ICONS[mainMode] ? (
                              <i className={`${MAIN_MODE_ICONS[mainMode]} text-base`} />
                            ) : (
                              <span className="text-xs font-bold">{mainMode[0].toUpperCase()}</span>
                            )}
                          </button>

                          {/* Dropdown */}
                          {variants.length > 1 && (
                            <div className={`absolute z-50 right-0 top-full mt-1 ${isOpen ? 'block' : 'hidden'}`}>
                              <div className="rounded-xl border border-white/10 bg-[#1a1a22] shadow-2xl overflow-hidden min-w-[140px] p-1">
                                {variants.map((variant) => (
                                  <button
                                    key={variant}
                                    onClick={() => {
                                      if (closeTimersRef.current) {
                                        clearTimeout(closeTimersRef.current);
                                        closeTimersRef.current = null;
                                      }
                                      setSelectedMode(variant);
                                      setOpenMainMode(null);
                                    }}
                                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                      selectedMode === variant
                                        ? 'bg-osu-pink text-white'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    {GAME_MODE_NAMES[variant]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!isAuthenticated ? (
                  <div className="p-8 text-center">
                    <p className="mb-4 text-slate-500">{t('auth.loginRequired') || 'Login to view scores'}</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-6 py-2.5 bg-osu-pink hover:bg-osu-pink/80 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-osu-pink/30"
                    >
                      {t('auth.login') || 'Login'}
                    </button>
                  </div>
                ) : scoresLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-2 border-osu-pink rounded-full animate-spin border-t-transparent" />
                  </div>
                ) : scores.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('Player')}</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">{t('Score')}</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">PP</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">%</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">{t('Mods')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((score, index) => (
                          <tr key={score.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                                index === 0 ? 'bg-amber-400 text-amber-950' :
                                index === 1 ? 'bg-slate-300 text-slate-900' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                'text-slate-500'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={score.user.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                <Link
                                  to={`/users/${score.user.id}?mode=${selectedBeatmap.mode || 'osu'}`}
                                  className="font-medium text-osu-pink hover:text-white transition-colors text-sm"
                                >
                                  {score.user.username}
                                </Link>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link to={`/scores/${score.id}`} className="font-medium text-white hover:text-osu-pink transition-colors text-sm">
                                {typeof score.total_score === 'number' ? formatNumber(score.total_score) : (score.total_score ?? score.pp ?? 0)}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-osu-pink">
                                {score.pp ? score.pp.toFixed(2) : '0.00'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-medium text-slate-300">
                                {(score.accuracy * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {score.mods && score.mods.length > 0 ? (
                                  score.mods.map((mod, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-semibold rounded">
                                      {mod.acronym}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-600 text-xs">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-500">{t('beatmap.noScores')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Beatmapset Info */}
            <div className="rounded-xl border border-white/5 bg-slate-900/30">
              <div className="px-5 py-3 border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <i className="fa fa-info-circle text-emerald-400" />
                  {t('beatmap.information')}
                </h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('beatmap.creator')}</span>
                  <span className="font-medium text-slate-200">{beatmapset.creator}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('beatmap.source')}</span>
                  <span className="font-medium text-slate-200">{beatmapset.source || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('beatmap.submitted')}</span>
                  <span className="font-medium text-slate-200">{new Date(beatmapset.submitted_date).toLocaleDateString()}</span>
                </div>
                {beatmapset.ranked_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{t('beatmap.ranked')}</span>
                    <span className="font-medium text-slate-200">{new Date(beatmapset.ranked_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('beatmap.lastUpdated')}</span>
                  <span className="font-medium text-slate-200">{new Date(beatmapset.last_updated).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('beatmap.playCount')}</span>
                  <span className="font-medium text-slate-200">{formatNumber(beatmapset.play_count)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('beatmap.favouriteCount')}</span>
                  <span className="font-medium text-slate-200 flex items-center gap-1">
                    <span className="text-red-400">❤</span>
                    {formatNumber(beatmapset.favourite_count)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {beatmapset.tags && (
              <div className="rounded-xl border border-white/5 bg-slate-900/30">
                <div className="px-5 py-3 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    <i className="fa fa-tags text-purple-400" />
                    {t('beatmap.tags')}
                  </h3>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {beatmapset.tags.split(' ').filter(tag => tag.trim()).map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-400 hover:bg-osu-pink/20 hover:text-osu-pink transition-colors cursor-pointer border border-transparent hover:border-osu-pink/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="rounded-xl border border-white/5 bg-slate-900/30">
              <div className="px-5 py-3 border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <i className="fa fa-download text-amber-400" />
                  {t('beatmap.actions')}
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <button
                  onClick={() => window.open(`https://osu.ppy.sh/beatmapsets/${beatmapset.id}/download`, '_blank')}
                  className="group w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-r from-osu-pink to-osu-pink/90 hover:shadow-lg hover:shadow-osu-pink/30 hover:scale-[1.02]"
                >
                  <i className="fa fa-download transition-transform group-hover:-translate-y-0.5" />
                  <span>{t('beatmap.download')}</span>
                </button>

                <button
                  onClick={() => window.open(`https://osu.gatari.pw/d/${beatmapset.id}`, '_blank')}
                  className="group w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-r from-cyan-500 to-cyan-600 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02]"
                >
                  <i className="fa fa-cloud-download transition-transform group-hover:-translate-y-0.5" />
                  <span>{t('beatmap.mirrorDownload') || 'Mirror Download'}</span>
                </button>

                {beatmapset.preview_url && (
                  <button
                    onClick={() => window.open(beatmapset.preview_url, '_blank')}
                    className="group w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/30 hover:scale-[1.02]"
                  >
                    <i className="fa fa-play transition-transform group-hover:scale-110" />
                    <span>{t('beatmap.preview')}</span>
                  </button>
                )}

                <button
                  onClick={() => window.open(`https://osu.ppy.sh/beatmapsets/${beatmapset.id}`, '_blank')}
                  className="group w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-white transition-all bg-slate-700 hover:bg-slate-600 hover:shadow-lg hover:scale-[1.02]"
                >
                  <i className="fa fa-external-link transition-transform group-hover:rotate-12" />
                  <span>{t('beatmap.viewOnOsu') || 'View on osu!'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip
        id="difficulty-tooltip"
        place="top"
        style={{
          backgroundColor: 'rgba(20, 20, 26, 0.95)',
          color: '#fff',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />

      <AudioPlayerControls />
    </div>
  );
};

export default BeatmapPage;
