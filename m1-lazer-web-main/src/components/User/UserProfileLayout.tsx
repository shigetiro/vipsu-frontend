import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../UI/Avatar';
import UserRoleBadge from '../UI/UserRoleBadge';
import GameModeSelector from '../UI/GameModeSelector';
import RankHistoryChart from '../UI/RankHistoryChart';
import PlayerRankCard from '../User/PlayerRankCard';
import StatsCard from '../User/StatsCard';
import LevelProgress from '../UI/LevelProgress';
import { type User, type GameMode } from '../../types';
import FriendStats from './FriendStats';
import UserRecentActivity from './UserRecentActivity';
import UserPinnedScores from './UserPinnedScores';
import UserBestScores from './UserBestScores';
import UserRecentScores from './UserRecentScores';
import UserPageDisplay from './UserPageDisplay';
import RestrictedBanner from './RestrictedBanner';
import { FaTools, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Tooltip } from 'react-tooltip';
import { useAuth } from '../../hooks/useAuth';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useProfileColor } from '../../contexts/ProfileColorContext';
import Badges from './Badges';
import Achievements from './Achievements';
import UserMostPlayedBeatmaps from './UserMostPlayedBeatmaps';
import { cn } from '../../utils/cn';

interface UserProfileLayoutProps {
  user: User;
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onUserUpdate?: (user: User) => void;
}

const formatPlayTime = (seconds: number | undefined): string => {
  if (!seconds) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
};

/** 头图懒加载 + blur 过渡 */
const CoverImage: React.FC<{ src?: string; alt?: string; isExpanded: boolean }> = ({ src, alt = 'cover', isExpanded }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const defaultCover = '/image/backgrounds/layered-waves-haikei.svg';
  const displaySrc = (!src || error) ? defaultCover : src;

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const heightClass = isExpanded
    ? 'h-[180px] md:h-[288px]'
    : 'h-0';

  return (
    <div ref={ref} className={`relative w-full overflow-hidden transition-all duration-300 ${heightClass}`}>
      <div className="absolute inset-0 cover-bg">
        <div className="h-full w-full" style={{ background: 'transparent' }} />
      </div>

      {inView && displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition duration-500 ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (displaySrc !== defaultCover) {
              setError(true);
            }
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
    </div>
  );
};

const UserProfileLayout: React.FC<UserProfileLayoutProps> = ({ user, selectedMode, onModeChange, onUserUpdate }) => {
  const { t } = useTranslation();
  const { refreshUser, user: currentUser } = useAuth();
  const { preferences, updatePreference } = useUserPreferences();
  const { profileColor, setProfileColorLocal, resetProfileColor } = useProfileColor();

  const pinnedScoresRefreshRef = useRef<(() => void) | null>(null);
  const bestScoresRefreshRef = useRef<(() => void) | null>(null);
  const pinActionRef = useRef<{
    handlePin: (score: any) => void;
    handleUnpin: (scoreId: number) => void;
  } | null>(null);
  const bestScoresActionRef = useRef<{
    updatePinStatus: (scoreId: number, isPinned: boolean) => void;
  } | null>(null);

  const stats = user.statistics;
  const gradeCounts = stats?.grade_counts ?? { ssh: 0, ss: 0, sh: 0, s: 0, a: 0 };
  const levelProgress = stats?.level?.progress ?? 0;
  const levelCurrent = stats?.level?.current ?? 0;
  const playTime = formatPlayTime(stats?.play_time);
  const user_achievements = Array.isArray(user.user_achievements)
    ? user.user_achievements.filter(
        (a): a is { achievement_id: number; achieved_at: string } =>
          typeof a === 'object' &&
          a !== null &&
          typeof (a as any).achievement_id === 'number' &&
          typeof (a as any).achieved_at === 'string'
      )
    : undefined;

  const coverUrlRaw = user.cover_url || user.cover?.url || undefined;
  const coverUrl =
    coverUrlRaw === "https://assets.ppy.sh/user-profile-covers/default.jpeg"
      ? "/image/backgrounds/bgcover.jpg"
      : coverUrlRaw;

  const canEdit = currentUser?.id === user.id;
  const isCoverExpanded = preferences?.profile_cover_expanded ?? false;
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);

  const handleAvatarUpdate = async (avatarData: any) => {
    if (!canEdit) return;

    try {
      await refreshUser();
      onUserUpdate?.(user);
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  const handleToggleCover = async () => {
    const newExpandedState = !isCoverExpanded;

    if (canEdit) {
      await updatePreference('profile_cover_expanded', newExpandedState);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-0 md:px-4 lg:px-6 py-4 md:py-6">
      {/* 主卡片 */}
      <div className="bg-card md:main-card-shadow md:rounded-t-2xl md:rounded-b-2xl overflow-hidden md:border md:border-card">
        {/* 受限用户提示 - 仅管理员可见 */}
        {user.is_restricted && currentUser?.is_admin && (
          <div className="px-3 md:px-6 pt-4">
            <RestrictedBanner />
          </div>
        )}

        {/* 头部栏 + 模式选择 */}
        <div className="relative">
          <div className="relative z-10 bg-transparent md:bg-card px-4 md:px-6 py-3 md:py-4 flex items-center justify-between md:rounded-t-2xl border-b border-card" style={{ color: 'var(--text-primary)' }}>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-osu-pink rounded-full"></div>
              <div className="text-base md:text-lg font-bold">{t('profile.info.title')}</div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <GameModeSelector
                selectedMode={selectedMode}
                onModeChange={onModeChange}
                variant="compact"
                className=""
              />
            </div>
          </div>

          {/* 头图懒加载 */}
          <div className="overflow-hidden">
            <CoverImage src={coverUrl} alt={`${user.username} cover`} isExpanded={isCoverExpanded} />
          </div>
        </div>

        {/* 头像与基本信息条 - 现代布局无负边距 */}
        <div className="relative md:bg-card px-3 md:px-8 py-4 md:py-6 border-b border-card">
          <div className="flex items-end md:items-start gap-4 md:gap-6">
            {/* 头像容器 */}
            <div className={cn(
              'flex-shrink-0 flex md:block items-end',
              isCoverExpanded ? 'md:-mt-8' : 'md:mt-0',
              isCoverExpanded ? 'md:mb-2' : 'md:mb-0'
            )}>
              <div className={cn(
                'transition-all duration-300',
                isCoverExpanded ? 'scale-105' : 'scale-100',
                isCoverExpanded ? 'md:!w-28 md:!h-28' : 'md:!w-24 md:!h-24'
              )}>
                <Avatar
                  userId={user.id}
                  username={user.username}
                  avatarUrl={user.avatar_url}
                  size="xl"
                  shape="rounded"
                  editable={false}
                  className="ring-4 md:ring-2 ring-card"
                  onAvatarUpdate={handleAvatarUpdate}
                />
              </div>
            </div>

            {/* 用户信息 */}
            <div className="flex-1 min-w-0">
              {/* 顶部行：用户名 + 徽章 */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary truncate">
                  {user.username}
                </h1>
                <UserRoleBadge
                  isAdmin={user.is_admin}
                  isGMT={user.is_gmt}
                  isQAT={user.is_qat}
                  isBNG={user.is_bng}
                  className="lg:ml-2"
                />
                {Array.isArray(user.badges) && user.badges.length > 0 && (
                  <div className="flex-shrink-0">
                    <Badges badges={user.badges} />
                  </div>
                )}
              </div>

              {/* 底部信息行：国家 + 团队 */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {/* 国旗和国家名 */}
                {user.country?.code && (
                  <div className="flex items-center gap-2">
                    <img
                      src={`/image/flag/${user.country.code.toLowerCase()}.svg`}
                      alt={user.country.name}
                      className="h-5 md:h-6 w-auto rounded-sm object-contain cursor-help"
                      loading="lazy"
                      decoding="async"
                      data-tooltip-id="country-tooltip"
                      data-tooltip-content={user.country?.name || '国家'}
                    />
                    <span className="text-sm md:text-base text-text-secondary">
                      {user.country?.name}
                    </span>
                  </div>
                )}

                {/* 团队旗帜和名称 */}
                {user.team && (
                  <div className="flex items-center gap-2">
                    <img
                      src={user.team.flag_url}
                      alt="团队旗帜"
                      className="h-5 md:h-6 w-auto rounded-sm object-contain cursor-help"
                      loading="lazy"
                      decoding="async"
                      data-tooltip-id="team-tooltip"
                      data-tooltip-content={user.team.name}
                    />
                    <span className="text-sm md:text-base text-text-secondary">
                      {user.team.short_name || user.team.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 展开/收起按钮 */}
            <button
              onClick={handleToggleCover}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-2 text-gray-700 grid place-items-center text-sm md:text-base hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
              aria-label={isCoverExpanded ? t('profile.userPage.collapseCover') : t('profile.userPage.expandCover')}
              data-tooltip-id="cover-toggle-tooltip"
              data-tooltip-content={isCoverExpanded ? t('profile.userPage.collapseCover') : t('profile.userPage.expandCover')}
            >
              {isCoverExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>

        {/* Tooltips */}
        <Tooltip id="country-tooltip" />
        <Tooltip id="team-tooltip" />
        <Tooltip id="cover-toggle-tooltip" />

        {/* 中部：左 3/4（排名+折线+信息），右 1/4（统计） */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 py-4 border-b border-card">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 左侧 3/4 */}
            <div className="flex-[3] flex flex-col gap-3">
              {/* 排名 */}
              <div className="flex gap-8 p-3 md:rounded-lg md:rank-card-shadow mb-4">
                <div className="text-center">
                  <div className="text-gray-500 mb-1 text-xs">{t('profile.info.globalRank')}</div>
                  <div className="font-bold text-primary text-xl">#{stats?.global_rank ?? '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-1 text-xs">{t('profile.info.countryRank')}</div>
                  <div className="font-bold text-primary text-xl">#{stats?.country_rank ?? '—'}</div>
                </div>
              </div>

              {/* 折线图 */}
              <div className="w-full">
                <RankHistoryChart
                  rankHistory={user.rank_history}
                  isUpdatingMode={isUpdatingMode}
                  selectedModeColor={profileColor}
                  delay={0.4}
                  height="8rem"
                />
              </div>

              {/* 附加信息（PP / 游戏时间 / 成绩徽章） */}
              <div className="w-full">
                <PlayerRankCard
                  stats={stats}
                  playTime={playTime}
                  user_achievements={user_achievements}
                  gradeCounts={gradeCounts}
                />
              </div>
            </div>

            {/* 右侧 1/4：统计信息 */}
            <div className="flex-1">
              <div className="p-3 md:rounded-lg h-full flex flex-col justify-center md:stats-card-shadow" style={{ background: 'var(--bg-secondary)' }}>
                <StatsCard stats={stats} />
              </div>
            </div>
          </div>
        </div>

        {/* 好友/消息 + 等级进度 */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 relative border-b border-card">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="flex-1">
              <FriendStats user={user} />
            </div>
            <div className="flex-1">
              <LevelProgress
                levelCurrent={levelCurrent}
                levelProgress={levelProgress}
              />
            </div>
          </div>
        </div>

        {/* 成绩部分 */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 border-b border-card">
          <UserPinnedScores
            userId={user.id}
            selectedMode={selectedMode}
            user={user}
            refreshRef={pinnedScoresRefreshRef}
            onPinActionRef={pinActionRef}
            bestScoresActionRef={bestScoresActionRef}
          />
        </div>

        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 border-b border-card">
          <UserBestScores
            userId={user.id}
            selectedMode={selectedMode}
            user={user}
            refreshRef={bestScoresRefreshRef}
            pinActionRef={pinActionRef}
          />
        </div>

        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 border-b border-card">
          <UserRecentScores
            userId={user.id}
            selectedMode={selectedMode}
          />
        </div>

        {/* 最近活动 */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 border-b border-card">
          <UserRecentActivity
            userId={user.id}
          />
        </div>

        {/* 最常游玩的谱面 */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 border-b border-card">
          <UserMostPlayedBeatmaps
            userId={user.id}
            user={user}
          />
        </div>

        {/* 成就 */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 border-b border-card">
          <Achievements
            userAchievements={user_achievements}
          />
        </div>

        {/* 用户页面 */}
        <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6">
          <UserPageDisplay
            user={user}
            onUserUpdate={onUserUpdate}
          />
        </div>

        {/* 管理员工具 */}
        {canEdit && (
          <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaTools />
              <span>{t('profile.userPage.editProfile')}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UserProfileLayout;