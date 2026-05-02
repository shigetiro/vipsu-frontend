import React from 'react';
import { useTranslation } from 'react-i18next';

interface DailyChallengeStats {
  daily_streak_best: number;
  daily_streak_current: number;
  last_update?: string | null;
  last_weekly_streak?: unknown;
  playcount: number;
  top_10p_placements: number;
  top_50p_placements: number;
  weekly_streak_best: number;
  weekly_streak_current: number;
  user_id: number;
}

interface DailyChallengeStatsCardProps {
  stats?: DailyChallengeStats;
}

const DailyChallengeStatsCard: React.FC<DailyChallengeStatsCardProps> = ({ stats }) => {
  const { t } = useTranslation();

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-transparent md:bg-card px-3 md:px-6 lg:px-8 py-4 md:py-6 border-b border-card">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-osu-pink rounded-full"></div>
          <h2 className="text-base md:text-lg font-bold text-text-primary">
            {t('profile.dailyChallenge.title', 'Daily Challenge')}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Daily Streak */}
          <div className="p-3 rounded-lg bg-surface-2">
            <div className="text-xs text-gray-500 mb-1">
              {t('profile.dailyChallenge.dailyStreak', 'Daily Streak')}
            </div>
            <div className="text-lg font-bold text-primary">
              {stats.daily_streak_current}
              <span className="text-xs text-gray-400 ml-1">
                / {stats.daily_streak_best}
              </span>
            </div>
          </div>

          {/* Weekly Streak */}
          <div className="p-3 rounded-lg bg-surface-2">
            <div className="text-xs text-gray-500 mb-1">
              {t('profile.dailyChallenge.weeklyStreak', 'Weekly Streak')}
            </div>
            <div className="text-lg font-bold text-primary">
              {stats.weekly_streak_current}
              <span className="text-xs text-gray-400 ml-1">
                / {stats.weekly_streak_best}
              </span>
            </div>
          </div>

          {/* Play Count */}
          <div className="p-3 rounded-lg bg-surface-2">
            <div className="text-xs text-gray-500 mb-1">
              {t('profile.dailyChallenge.playCount', 'Play Count')}
            </div>
            <div className="text-lg font-bold text-primary">
              {stats.playcount}
            </div>
          </div>

          {/* Top Placements */}
          <div className="p-3 rounded-lg bg-surface-2">
            <div className="text-xs text-gray-500 mb-1">
              {t('profile.dailyChallenge.topPlacements', 'Top Placements')}
            </div>
            <div className="text-lg font-bold text-primary">
              <span className="text-green-500">{stats.top_10p_placements}</span>
              <span className="text-gray-400"> / </span>
              <span className="text-blue-500">{stats.top_50p_placements}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengeStatsCard;