import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  useEffect(() => {
    const fetchBeatmapData = async () => {
      // 从 URL hash 获取 beatmap ID （用于 beatmapsets 路由）
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
          // 使用 beatmapset ID 查询
          beatmapsetData = await beatmapAPI.getBeatmapset(targetBeatmapsetId);
        } else if (targetBeatmapId) {
          // 使用 beatmap ID 查询
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
        
        // 找到对应的beatmap
        let targetBeatmap: Beatmap | undefined;
        
        if (targetBeatmapId) {
          targetBeatmap = beatmapsetData.beatmaps.find(
            (beatmap) => beatmap.id === targetBeatmapId
          );
        }
        
        if (targetBeatmap) {
          setSelectedBeatmap(targetBeatmap);
          // 更新 URL 为标准格式
          const mode = targetBeatmap.mode || 'osu';
          const newUrl = `/beatmapsets/${beatmapsetData.id}#${mode}/${targetBeatmap.id}`;
          if (window.location.pathname + window.location.hash !== newUrl) {
            navigate(newUrl, { replace: true });
          }
        } else {
          // 如果没找到，选择第一个
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
    };

    fetchBeatmapData();
  }, [beatmapId, beatmapsetId, navigate, t]);

  const handleDifficultySelect = (beatmap: Beatmap) => {
    setSelectedBeatmap(beatmap);
    // 更新URL为标准格式
    if (beatmapset) {
      const mode = beatmap.mode || 'osu';
      navigate(`/beatmapsets/${beatmapset.id}#${mode}/${beatmap.id}`, { replace: true });
    }
  };

  // 获取该谱面的排行榜（仅在 auth 加载完并且已认证时请求）
  useEffect(() => {
    if (!selectedBeatmap) return;

    const fetchScores = async () => {
      // 如果未认证，跳过调用受保护的 endpoint
      if (!isAuthenticated) {
        setScores([]);
        return;
      }

      setScoresLoading(true);
      try {
      const modeToUse = (selectedMode as string) || selectedBeatmap.mode || 'osu';
      const data = await scoreAPI.getBeatmapScores(selectedBeatmap.id, 50, modeToUse);
      // Sort by total_score (descending) before setting state
      const sorted = (data.scores || []).slice().sort((a: any, b: any) => ((b.total_score ?? b.pp ?? 0) - (a.total_score ?? a.pp ?? 0)));
      setScores(sorted);
      } catch (error) {
        const err = error as any;
        if (err?.response?.status === 401) {
          toast.error(t('auth.loginRequired') || 'Bitte einloggen, um Scores zu sehen');
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

  // When selectedBeatmap changes, default to the beatmap's exact mode (including RX/AP/Relax)
  useEffect(() => {
    if (!selectedBeatmap) return;
    const mode = (selectedBeatmap.mode || 'osu') as GameMode;
    setSelectedMode(mode);
  }, [selectedBeatmap]);

  const formatBPM = (bpm: number) => {
    return Number.isInteger(bpm) ? bpm.toString() : bpm.toFixed(1);
  };

  const getDifficultyColor = (stars: number) => {
    if (stars < 1.5) return 'text-gray-500';
    if (stars < 2.25) return 'text-blue-500';
    if (stars < 3.75) return 'text-green-500';
    if (stars < 5.25) return 'text-yellow-500';
    if (stars < 6.75) return 'text-orange-500';
    return 'text-red-500';
  };

  // 根据难度星级返回从浅到深的 osu-pink 色调
  const getDifficultyPinkShade = (stars: number) => {
    // 0-2星: 很浅的粉色
    if (stars < 2) return '#FFF0F4';
    // 2-3星: 浅粉色
    if (stars < 3) return '#FFD9E5';
    // 3-4星: 中等浅粉
    if (stars < 4) return '#FFC2D6';
    // 4-5星: 中等粉色
    if (stars < 5) return '#FFABC7';
    // 5-6星: 标准 osu-pink
    if (stars < 6) return '#ED8EA6';
    // 6-7星: 深粉色
    if (stars < 7) return '#E06B8A';
    // 7-8星: 更深的粉色
    if (stars < 8) return '#D34871';
    // 8星以上: 最深的粉色
    return '#C62558';
  };

  const getDifficultyTextColor = (stars: number) => {
    // 浅色背景使用深色文字，深色背景使用浅色文字
    if (stars < 4) return '#9D2449'; // 深色文字
    return '#FFFFFF'; // 白色文字
  };

  const isLeaderboardAvailable = useMemo(() => {
    return ['ranked', 'approved', 'qualified', 'loved'].includes(beatmapset?.status || '');
  }, [beatmapset]);

  console.debug('Leaderboard availability:', isLeaderboardAvailable);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !beatmapset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error || t('beatmap.notFound')}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('beatmap.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section Container */}
      <div className="px-4 lg:px-6 pt-0 pb-6">
        <div className="max-w-7xl mx-auto">
          <div 
            className="relative h-72 overflow-hidden rounded-2xl shadow-lg"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${beatmapset.covers?.['cover@2x'] || beatmapset.covers?.cover || '/images/default-bg.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/60" />
            <div className="relative px-6 lg:px-8 h-full flex flex-col justify-end pb-6">
              <div className="text-white">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-osu-pink/90 text-white">
                    {beatmapset.status}
                  </span>
                  {beatmapset.video && (
                    <span className="px-3 py-1 bg-red-500/90 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                      VIDEO
                    </span>
                  )}
                  {beatmapset.storyboard && (
                    <span className="px-3 py-1 bg-purple-500/90 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                      STORYBOARD
                    </span>
                  )}
                  {beatmapset.is_local && (
                    <span className="px-3 py-1 bg-blue-600/90 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm">
                      {t('beatmap.uploaded') || 'Uploaded'}
                    </span>
                  )}
                </div>
                
                {/* Title and Artist */}
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1 truncate">
                      {beatmapset.title_unicode || beatmapset.title}
                    </h1>
                    <p className="text-lg sm:text-xl opacity-95 mb-1">
                      by <span className="font-semibold">{beatmapset.artist_unicode || beatmapset.artist}</span>
                    </p>
                    <p className="text-base opacity-80">
                      mapped by <span className="font-medium hover:text-osu-pink transition-colors cursor-pointer">{beatmapset.creator}</span>
                    </p>
                  </div>
                  
                  {/* Audio Preview Button */}
                  {beatmapset.preview_url && (
                    <div className="flex-shrink-0">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Difficulty Selection - Horizontal List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-osu-pink">●</span>
                  {t('beatmap.difficulties')}
                </h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {beatmapset.beatmaps
                    .sort((a, b) => a.difficulty_rating - b.difficulty_rating)
                    .map((beatmap) => {
                      const isSelected = selectedBeatmap?.id === beatmap.id;
                      const bgColor = getDifficultyPinkShade(beatmap.difficulty_rating);
                      const textColor = getDifficultyTextColor(beatmap.difficulty_rating);
                      
                      return (
                        <button
                          key={beatmap.id}
                          onClick={() => handleDifficultySelect(beatmap)}
                          data-tooltip-id="difficulty-tooltip"
                          data-tooltip-content={`${beatmap.version} - ${beatmap.difficulty_rating.toFixed(2)}★`}
                          className={`group relative px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm border-2 ${
                            isSelected
                              ? 'border-osu-pink shadow-lg scale-105'
                              : 'border-transparent hover:border-osu-pink/30 hover:scale-102'
                          }`}
                          style={{
                            backgroundColor: bgColor,
                            color: textColor,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {/* 星数显示 */}
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-base">
                                {beatmap.difficulty_rating.toFixed(2)}
                              </span>
                              <span className="text-sm">★</span>
                            </div>
                            
                          </div>
                          
                          {/* 选中指示器 */}
                          {isSelected && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 border-r-2 border-b-2 border-osu-pink"
                                 style={{ backgroundColor: bgColor }}
                            />
                          )}
                        </button>
                      );
                    })}
                </div>
                
                {/* Tooltip 组件 */}
                <Tooltip 
                  id="difficulty-tooltip"
                  place="top"
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                />
              </div>
            </div>

            {/* Selected Beatmap Details */}
            {selectedBeatmap && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-osu-pink/10 to-transparent">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedBeatmap.version}
                    </h2>
                    <span className={`text-xl font-bold ${getDifficultyColor(selectedBeatmap.difficulty_rating)}`}>
                      {selectedBeatmap.difficulty_rating.toFixed(2)}★
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Main Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-osu-pink mb-1">
                        {formatDuration(selectedBeatmap.total_length)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        {t('beatmap.length')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-osu-pink mb-1">
                        {formatBPM(selectedBeatmap.bpm)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        {t('beatmap.bpm')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-osu-pink mb-1">
                        {formatNumber(selectedBeatmap.max_combo)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        {t('beatmap.maxCombo')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-osu-pink mb-1">
                        {GAME_MODE_NAMES[selectedBeatmap.mode as keyof typeof GAME_MODE_NAMES] || selectedBeatmap.mode}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        {t('beatmap.mode')}
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {selectedBeatmap.cs}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {t('beatmap.circleSize')}
                      </div>
                    </div>
                    <div className="text-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {selectedBeatmap.ar}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {t('beatmap.approachRate')}
                      </div>
                    </div>
                    <div className="text-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {selectedBeatmap.accuracy}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {t('beatmap.overallDifficulty')}
                      </div>
                    </div>
                    <div className="text-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {selectedBeatmap.drain}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {t('beatmap.hpDrain')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard / Scores */}
            {selectedBeatmap && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-osu-pink/10 to-transparent">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-osu-pink">🏆</span>
                      {t('Leaderboard') || 'Top Scores'}
                    </h2>

                    <div className="flex items-center gap-2 flex-wrap">
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
                              // small delay to allow pointer to move into the dropdown
                              closeTimersRef.current = window.setTimeout(() => setOpenMainMode(null), 150) as unknown as number;
                            }}
                            onFocus={() => {
                              if (closeTimersRef.current) {
                                clearTimeout(closeTimersRef.current);
                                closeTimersRef.current = null;
                              }
                              setOpenMainMode(mainMode);
                            }}
                            onBlur={(e) => {
                              const related = (e as React.FocusEvent).relatedTarget as Node | null;
                              if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
                                // delay closing slightly so clicks inside dropdown aren't lost
                                closeTimersRef.current = window.setTimeout(() => setOpenMainMode(null), 120) as unknown as number;
                              }
                            }}
                            tabIndex={0}
                          >
                            <button
                              onClick={() => setSelectedMode(mainMode)}
                              className={`relative w-10 h-10 flex items-center justify-center rounded-md text-sm font-semibold transition-colors ${
                                anyActive
                                  ? 'text-white shadow-md'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-osu-pink/10'
                              }`}
                              style={{ backgroundColor: anyActive ? 'var(--osu-pink)' : undefined }}
                              aria-haspopup="true"
                              aria-expanded={anyActive || isOpen}
                            >
                              {/* subtle inner texture/ring to preserve button look when variant is selected */}
                              {anyActive && (
                                <span
                                  aria-hidden
                                  className="pointer-events-none absolute inset-0 rounded-md"
                                  style={{
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)), radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 35%, transparent 60%)',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -6px 14px rgba(0,0,0,0.08)',
                                    zIndex: 0,
                                  }}
                                />
                              )}
                              <span className="sr-only">{GAME_MODE_NAMES[mainMode]}</span>
                              {mainMode === 'osuspaceruleset' || (MAIN_MODE_ICONS[mainMode] && (MAIN_MODE_ICONS[mainMode].includes('.svg') || MAIN_MODE_ICONS[mainMode].includes('.png') || MAIN_MODE_ICONS[mainMode].startsWith('/'))) ? (
                                <img 
                                  src={mainMode === 'osuspaceruleset' ? '/image/logo.png' : MAIN_MODE_ICONS[mainMode]} 
                                  alt={`${mainMode} icon`}
                                  className="w-[1rem] h-[1rem] relative z-10 object-contain"
                                  style={{ filter: anyActive ? 'brightness(0) invert(1)' : 'none' }}
                                />
                              ) : (
                                <i
                                  className={`${MAIN_MODE_ICONS[mainMode] || ''} text-base transition-colors relative z-10 ${anyActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}
                                  aria-hidden="true"
                                />
                              )}
                            </button>

                            {/* Hover/focus dropdown showing the group's variants - JS-controlled visibility */}
                            <div className={`absolute z-50 left-0 top-full ${isOpen ? 'block' : 'hidden'}`}>
                              <div className="rounded-md shadow-lg overflow-hidden w-40">
                                {variants.map((variant) => (
                                  <button
                                    key={variant}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        if (closeTimersRef.current) {
                                          clearTimeout(closeTimersRef.current);
                                          closeTimersRef.current = null;
                                        }
                                        setSelectedMode(variant);
                                        setOpenMainMode(null);
                                      }}
                                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                        selectedMode === variant
                                          ? 'bg-osu-pink text-white'
                                          : 'bg-slate-800/80 dark:bg-slate-700 text-slate-200 hover:bg-slate-700/60'
                                      }`}
                                  >
                                    {GAME_MODE_NAMES[variant]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                { !isAuthenticated ? (
                  <div className="p-8 text-center">
                    <p className="mb-4 text-slate-700 dark:text-slate-300">
                      {t('auth.loginRequired') || 'Bitte einloggen, um Scores zu sehen'}
                    </p>
                    <div>
                      <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 bg-osu-pink text-white rounded-lg"
                      >
                        {t('auth.login') || 'Login'}
                      </button>
                    </div>
                  </div>
                ) : scoresLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-osu-pink"></div>
                  </div>
                ) : scores.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                          <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {t('Player') || 'Player'}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {t('Score') || 'Score'}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            PP
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {t('Accuracy') || 'Accuracy'}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {t('Max Combo') || 'Max Combo'}
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {t('Mods') || 'Mods'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((score) => (
                          <tr
                            key={score.id}
                            className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center gap-3">
                                <img
                                  src={score.user.avatar_url}
                                  alt={score.user.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div>
                                  <Link
                                    to={`/users/${score.user.id}?mode=${selectedBeatmap.mode || 'osu'}`}
                                    className="font-semibold text-slate-900 dark:text-white hover:text-osu-pink transition-colors"
                                  >
                                    {score.user.username}
                                  </Link>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {score.user.country_code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                to={`/scores/${score.id}`}
                                className="font-bold text-slate-900 dark:text-white hover:text-osu-pink transition-colors"
                              >
                                {typeof score.total_score === 'number' ? formatNumber(score.total_score) : (score.total_score ?? score.pp ?? 0)}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                to={`/scores/${score.id}`}
                                className="font-bold text-osu-pink text-base hover:opacity-80 transition-opacity"
                              >
                                {score.pp ? score.pp.toFixed(2) : '0.00'}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                              {(score.accuracy * 100).toFixed(2)}%
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {score.max_combo}/{selectedBeatmap.max_combo}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {score.mods && score.mods.length > 0 ? (
                                  score.mods.map((mod, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded"
                                    >
                                      {mod.acronym}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500 dark:text-slate-400 text-xs">NM</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="text-5xl mb-3">📭</div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {t('beatmap.noScores') || 'Noch keine Scores'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Beatmapset Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-osu-pink to-osu-pink/80">
                <h3 className="text-lg font-bold text-white">
                  {t('beatmap.information')}
                </h3>
              </div>
              <div className="p-6 space-y-4 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t('beatmap.creator')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white hover:text-osu-pink transition-colors cursor-pointer">
                    {beatmapset.creator}
                  </span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-700" />
                
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t('beatmap.source')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">
                    {beatmapset.source || 'N/A'}
                  </span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-700" />
                
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t('beatmap.submitted')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {new Date(beatmapset.submitted_date).toLocaleDateString()}
                  </span>
                </div>
                {beatmapset.ranked_date && (
                  <>
                    <div className="h-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex justify-between items-start">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{t('beatmap.ranked')}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {new Date(beatmapset.ranked_date).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
                <div className="h-px bg-slate-200 dark:bg-slate-700" />
                
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t('beatmap.lastUpdated')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {new Date(beatmapset.last_updated).toLocaleDateString()}
                  </span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-700" />
                
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t('beatmap.playCount')}</span>
                  <span className="font-semibold text-osu-pink">
                    {formatNumber(beatmapset.play_count)}
                  </span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-700" />
                
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t('beatmap.favouriteCount')}</span>
                  <span className="font-semibold text-osu-pink flex items-center gap-1">
                    <span>❤</span>
                    {formatNumber(beatmapset.favourite_count)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {beatmapset.tags && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('beatmap.tags')}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {beatmapset.tags.split(' ').filter(tag => tag.trim()).map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-osu-pink/10 hover:text-osu-pink transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('beatmap.actions')}
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <a
                  href={`https://osu.ppy.sh/beatmapsets/${beatmapset.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-3 bg-osu-pink hover:bg-osu-pink/90 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('beatmap.download')}
                  </span>
                </a>
              <div className="p-6 space-y-3">
                <a
                  href={`https://osu.gatari.pw/d/${beatmapset.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-3 bg-osu-pink hover:bg-osu-pink/90 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('Mirror Download')}
                  </span>
                </a>                
                {beatmapset.preview_url && (
                  <a
                    href={beatmapset.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      {t('beatmap.preview')}
                    </span>
                  </a>
                )}
                <a
                  href={`https://osu.ppy.sh/beatmapsets/${beatmapset.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {t('beatmap.viewOnOsu')}
                  </span>
                </a>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Audio Player Controls */}
      <AudioPlayerControls />
    </div>
  );
};

export default BeatmapPage;
