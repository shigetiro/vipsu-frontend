import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../utils/api';
import type { BestScore, GameMode, User } from '../../types';
import { useProfileColor } from '../../contexts/ProfileColorContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import LazyBackgroundImage from '../UI/LazyBackgroundImage';
import BeatmapLink from '../UI/BeatmapLink';

import ScoreModsDisplay from './ScoreModsDisplay';

interface UserRecentScoresProps {
  userId: number;
  selectedMode: GameMode;
  user?: User;
  className?: string;
}

// 时间格式化函数
const formatTimeAgo = (dateString: string, t: any): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t('profile.activities.timeAgo.justNow');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return t('profile.activities.timeAgo.minutesAgo', { count: minutes });
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return t('profile.activities.timeAgo.hoursAgo', { count: hours });
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return t('profile.activities.timeAgo.daysAgo', { count: days });
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return t('profile.activities.timeAgo.monthsAgo', { count: months });
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return t('profile.activities.timeAgo.yearsAgo', { count: years });
  }
};

// 评级图标映射
const getRankIcon = (rank: string) => {
  const rankImageMap: Record<string, string> = {
    // SS 系列
    XH: '/image/grades/SS-Silver.svg', // 银 SS（SSH）
    X:  '/image/grades/SS.svg',        // 金 SS（SS）

    // S 系列
    SH: '/image/grades/S-Silver.svg',  // 银 S
    S:  '/image/grades/S.svg',         // 金 S

    // 其他等级
    A:  '/image/grades/A.svg',
    B:  '/image/grades/B.svg',
    C:  '/image/grades/C.svg',
    D:  '/image/grades/D.svg',
    F:  '/image/grades/F.svg', 
  };

  return rankImageMap[rank] || rankImageMap['F'];
};


// 单个成绩卡片组件 - 基于 osu! 官方设计
const ScoreCard: React.FC<{ 
  score: BestScore; 
  t: any; 
  profileColor: string; 
  showPP?: boolean;
  className?: string;
}> = ({ score, t, profileColor, showPP = true, className = '' }) => {
  // 必取字段处理
  const rank = score.rank; // 等级徽章（S/A/B/C/D/F）
  const title = score.beatmapset?.title_unicode || score.beatmapset?.title || 'Unknown Title';
  const artist = score.beatmapset?.artist_unicode || score.beatmapset?.artist || 'Unknown Artist';
  const version = score.beatmap?.version || 'Unknown'; // 难度名
  const endedAt = formatTimeAgo(score.ended_at, t); // 相对时间
  const accuracy = (score.accuracy * 100).toFixed(2); // 命中率（百分比）
  const originalPp = Math.round(score.pp || 0); // 原始pp
  const mods = score.mods || []; // MOD列表
  const passed = score.passed; // 是否通过

  // Construct beatmap URL manually if missing, to ensure redirection works
  let beatmapUrl = score.beatmap?.url;
  if (!beatmapUrl || beatmapUrl === '#') {
    if (score.beatmap?.beatmapset_id && score.beatmap?.id) {
      beatmapUrl = `/beatmapsets/${score.beatmap.beatmapset_id}#${score.beatmap.mode || 'osu'}/${score.beatmap.id}`;
    } else {
      beatmapUrl = '#';
    }
  }

  const coverImage = score.beatmapset?.covers?.['cover@2x'] || score.beatmapset?.covers?.cover;

  // 将主题颜色转换为 RGB 以便使用透明度
  const hexToRgb = (hex: string): string => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const themeRgb = hexToRgb(profileColor);

  return (
    <LazyBackgroundImage 
      src={coverImage}
      className={`relative overflow-hidden rounded-xl bg-card glass-card transition-all duration-300 ${className}`}
    >
      {/* 渐变遮罩层确保文字可读性 - 使用主题颜色 */}
      <div 
        className="absolute inset-0 bg-gradient-to-r" 
        style={{
          background: `linear-gradient(to right, rgba(${themeRgb}, 0.15) 0%, rgba(${themeRgb}, 0.08) 50%, rgba(${themeRgb}, 0.03) 100%)`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-surface-2/90 via-surface-2/75 to-surface-2/60" />
      
      {/* 失败标记 */}
      {!passed && (
        <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20" />
      )}
      
      <div className="relative bg-transparent glass-card-hover rounded-xl transition-all duration-300">
        {/* 桌面端布局 */}
        <div className="hidden sm:block">
          {/* 主要内容区域 */}
          <div className="flex items-center h-12 pl-5 pr-24">
            {/* 等级徽章 */}
            <div className="flex-shrink-0 mr-3">
              <img 
                src={getRankIcon(rank)} 
                alt={rank}
                className={`w-14 h-10 object-contain ${!passed ? 'opacity-50' : ''}`}
              />
            </div>

            {/* 谱面信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col -space-y-0.5">
                {/* 标题和艺术家 */}
                <div className="flex items-baseline gap-1 text-sm leading-tight">
                  <BeatmapLink
                    beatmapUrl={beatmapUrl}
                    className={`font-semibold hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors ${!passed ? 'text-gray-500' : 'text-gray-900'}`}
                    title={title}
                  >
                    {title}
                  </BeatmapLink>
                  <span className="text-gray-600 text-xs flex-shrink-0">
                    {t('profile.bestScores.by')}
                  </span>
                  <span className="text-gray-600 text-xs truncate">
                    {artist}
                  </span>
                  {!passed && (
                    <span className="text-red-500 dark:text-red-400 text-xs font-semibold ml-2">
                      {t('profile.recentScores.failed')}
                    </span>
                  )}
                </div>
                
                {/* 难度名和时间 */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    {version}
                  </span>
                  <span className="text-gray-500">
                    {endedAt}
                  </span>
                  <Link
                    to={`/scores/${score.id}`}
                    className="text-osu-pink hover:text-osu-pink/80 transition-colors font-medium"
                  >
                    View score
                  </Link>
                </div>
              </div>
            </div>

            {/* 中间成绩数据 */}
            <div className="flex-shrink-0 flex items-center gap-2 mr-6">
              {/* MOD图标 + 准确率 */}
              <ScoreModsDisplay mods={mods} />
              <div className={`text-sm font-bold ml-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${!passed ? 'text-gray-500' : 'text-cyan-600 dark:text-cyan-300'}`}>
                {accuracy}%
              </div>
            </div>
          </div>

          {/* 右侧性能区域 */}
          <div className="absolute right-0 top-0 h-full flex items-center justify-center gap-2 pr-5">
            {/* PP 值 */}
            {showPP && originalPp > 0 && (
              <div className={`text-sm font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${!passed ? 'text-gray-400' : 'text-profile-color'}`}>
                {originalPp} PP
              </div>
            )}
          </div>
        </div>

        {/* 手机端布局 */}
        <div className="block sm:hidden p-4">
          <div className="flex items-start gap-3">
            {/* 等级徽章 */}
            <div className="flex-shrink-0">
              <img 
                src={getRankIcon(rank)} 
                alt={rank}
                className={`w-12 h-8 object-contain ${!passed ? 'opacity-50' : ''}`}
              />
            </div>

            {/* 主要内容 */}
            <div className="flex-1 min-w-0">
              {/* 第一行：标题和艺术家 */}
              <div className="flex items-baseline gap-1 text-sm leading-tight mb-1">
                <BeatmapLink
                  beatmapUrl={beatmapUrl}
                  className={`font-semibold hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors ${!passed ? 'text-gray-500' : 'text-gray-900'}`}
                  title={title}
                >
                  {title}
                </BeatmapLink>
                <span className="text-gray-600 text-xs flex-shrink-0">
                  {t('profile.bestScores.by')}
                </span>
                <span className="text-gray-600 text-xs truncate">
                  {artist}
                </span>
                {!passed && (
                  <span className="text-red-500 dark:text-red-400 text-xs font-semibold ml-2">
                    {t('profile.recentScores.failed')}
                  </span>
                )}
              </div>
              
              {/* 第二行：难度名和时间 */}
              <div className="flex items-center gap-3 text-xs mb-2">
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  {version}
                </span>
                <span className="text-gray-500">
                  {endedAt}
                </span>
                <Link
                  to={`/scores/${score.id}`}
                  className="text-osu-pink hover:text-osu-pink/80 transition-colors font-medium"
                >
                  View score
                </Link>
              </div>

              {/* 第三行：MOD、准确率和PP */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScoreModsDisplay mods={mods} />
                  <div className={`text-sm font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${!passed ? 'text-gray-500' : 'text-cyan-600 dark:text-cyan-300'}`}>
                    {accuracy}%
                  </div>
                </div>
                {showPP && originalPp > 0 && (
                  <div className={`text-sm font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${!passed ? 'text-gray-400' : 'text-profile-color'}`}>
                    {originalPp} PP
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LazyBackgroundImage>
  );
};

const UserRecentScores: React.FC<UserRecentScoresProps> = ({ userId, selectedMode, className = '' }) => {
  const { t } = useTranslation();
  const { profileColor } = useProfileColor();
  const [scores, setScores] = useState<BestScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const loadScores = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      
      if (reset) {
        setLoading(true);
        setError(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const response = await userAPI.getRecentScores(userId, selectedMode, 6, currentOffset, false);
      
      // 处理 API 响应
      const newScores = Array.isArray(response) ? response : [];
      
      // 判断是否还有更多数据
      let hasMoreData: boolean;
      
      if (reset) {
        hasMoreData = newScores.length === 6;
        setScores(newScores);
        setOffset(newScores.length);
      } else {
        const currentTotal = scores.length + newScores.length;
        hasMoreData = newScores.length === 6 && currentTotal < 100; // 最近成绩最多显示100条
        setScores(prev => [...prev, ...newScores]);
        setOffset(prev => prev + newScores.length);
      }

      setHasMore(hasMoreData);
    } catch (err) {
      console.error('Failed to load user recent scores:', err);
      setError(t('profile.recentScores.loadFailed'));
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setOffset(0);
      setScores([]);
      setError(null);
      setHasMore(true);
      loadScores(true);
    }
  }, [userId, selectedMode]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadScores(false);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: profileColor }}></div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            {t('profile.recentScores.title')}
          </h3>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
          <div className="bg-transparent h-[20px] rounded-t-xl flex items-center justify-center">
            <div className="w-16 h-1 rounded-full" style={{ backgroundColor: profileColor }}></div>
          </div>
          <div className="bg-transparent space-y-3 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
          <div className="bg-transparent h-[20px] rounded-b-xl flex items-center justify-center" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: profileColor }}></div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            {t('profile.recentScores.title')}
          </h3>
        </div>
        <div className="text-center text-red-500 dark:text-red-400 text-sm py-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: profileColor }}></div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">
          {t('profile.recentScores.title')}
        </h3>
        <span className="text-sm text-[var(--text-muted)] ml-2">
          ({t('profile.recentScores.last24h')})
        </span>
      </div>
      
      {scores.length === 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="bg-transparent h-[20px] rounded-t-xl flex items-center justify-center">
            <div className="w-16 h-1 rounded-full" style={{ backgroundColor: profileColor }}></div>
          </div>
          <div className="text-center text-[var(--text-muted)] py-6 text-sm">
            {t('profile.recentScores.noScores')}
          </div>
          <div className="bg-transparent h-[20px] rounded-b-xl flex items-center justify-center" />
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Top decorative bar */}
            <div className="bg-transparent h-[20px] rounded-t-xl flex items-center justify-center">
              <div className="w-16 h-1 rounded-full" style={{ backgroundColor: profileColor }}></div>
            </div>

            {/* Scores list */}
            <div className="bg-transparent flex flex-col gap-1">
              {scores.map((score) => (
                <ScoreCard key={score.id} score={score} t={t} profileColor={profileColor} showPP={score.passed} />
              ))}
            </div>

            {/* Bottom decorative bar */}
            <div className="bg-transparent h-[20px] rounded-b-xl flex items-center justify-center" />
          </div>

          {hasMore && (
            <div className="flex justify-center mt-3">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-[80px] sm:min-w-[100px] h-[32px] px-3 py-1.5 disabled:bg-gray-400 text-white rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 hover:opacity-90"
                style={{ backgroundColor: loadingMore ? undefined : profileColor }}
              >
                {loadingMore ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>{t('profile.recentScores.loading')}</span>
                  </>
                ) : (
                  <span>{t('profile.recentScores.loadMore')}</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserRecentScores;

