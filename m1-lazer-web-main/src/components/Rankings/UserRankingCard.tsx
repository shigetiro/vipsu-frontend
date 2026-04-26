import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import { useTranslation } from 'react-i18next';
import RankBadge from '../UI/RankBadge';
import LazyBackgroundImage from '../UI/LazyBackgroundImage';
import LazyAvatar from '../UI/LazyAvatar';
import LazyFlag from '../UI/LazyFlag';
import UserRoleBadge from '../UI/UserRoleBadge';
import { GAME_MODE_COLORS } from '../../types';
import { cn } from '../../utils/cn';
import type { UserRanking, GameMode, RankingType } from '../../types';

interface Props {
  ranking: UserRanking;
  rank: number;
  selectedMode: GameMode;
  rankingType: RankingType;
}

const UserRankingCard: React.FC<Props> = ({ ranking, rank, selectedMode, rankingType }) => {
  const { t } = useTranslation();
  const isTopThree = rank <= 3;

  // Filter out default cover URLs
  const rawCoverUrl = ranking.user.cover_url || ranking.user.cover?.url;
  const defaultCoverUrls = [
    'https://assets-ppy.g0v0.top/user-profile-covers/default.jpeg',
    'https://assets.ppy.sh/user-profile-covers/default.jpeg',
  ];
  const coverUrl = rawCoverUrl && !defaultCoverUrls.includes(rawCoverUrl) ? rawCoverUrl : undefined;

  // Modern design without cover image
  if (!coverUrl) {
    return (
      <div
        className={cn(
          'group flex items-center px-4 py-4 transition-all duration-300 cursor-pointer',
          'hover:bg-card-hover hover:shadow-lg hover:-translate-y-1',
          'border-b border-card'
        )}
      >
        {/* Rank number */}
        <RankBadge rank={rank} size="sm" />

        {/* User avatar */}
        <Link to={`/users/${ranking.user.id}?mode=${selectedMode}`} className="flex-shrink-0">
          <LazyAvatar
            src={ranking.user.avatar_url}
            alt={ranking.user.username}
            size="md"
          />
        </Link>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={`/users/${ranking.user.id}?mode=${selectedMode}`}
              className="font-semibold text-base truncate text-text-primary hover:text-primary transition-colors"
            >
              {ranking.user.username}
            </Link>
            <UserRoleBadge
              isAdmin={ranking.user.is_admin}
              isGMT={ranking.user.is_gmt}
              isQAT={ranking.user.is_qat}
              isBNG={ranking.user.is_bng}
              badges={ranking.user.badges}
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            {ranking.user.country_code && (
              <Link to={`/rankings/country/${ranking.user.country_code}`}>
                <LazyFlag
                  src={`/image/flag/${ranking.user.country_code.toLowerCase()}.svg`}
                  alt={ranking.user.country_code}
                  className="w-5 h-4 rounded-sm flex-shrink-0 cursor-pointer hover:opacity-80"
                  data-tooltip-id={`country-tooltip-${ranking.user.id}`}
                  data-tooltip-content={ranking.user.country?.name || ranking.user.country_code}
                />
              </Link>
            )}
            {ranking.user.team && (
              <Link to={`/teams/${ranking.user.team.id}`}>
                <LazyFlag
                  src={ranking.user.team.flag_url}
                  alt={ranking.user.team.short_name}
                  className="w-5 h-4 rounded-sm flex-shrink-0 cursor-pointer hover:opacity-80 ml-1"
                  data-tooltip-id={`team-tooltip-${ranking.user.id}`}
                  data-tooltip-content={ranking.user.team.short_name}
                />
              </Link>
            )}
          </div>
        </div>

        {/* Score display */}
        <div className="flex flex-col gap-1 text-right flex-shrink-0">
          <div className="text-base sm:text-lg font-bold" style={{ color: GAME_MODE_COLORS[selectedMode] }}>
            {rankingType === 'performance'
              ? `${Math.round(ranking.pp || 0).toLocaleString()}pp`
              : `${(ranking.ranked_score || 0).toLocaleString()}`}
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-3 text-xs text-text-muted">
            {rankingType === 'performance' && ranking.ranked_score !== undefined && (
              <div className="whitespace-nowrap">
                {t('common.score')}: {ranking.ranked_score.toLocaleString()}
              </div>
            )}
            {rankingType !== 'performance' && ranking.pp !== undefined && (
              <div className="whitespace-nowrap">
                PP: {Math.round(ranking.pp).toLocaleString()}
              </div>
            )}
            {ranking.hit_accuracy !== undefined && (
              <div className="whitespace-nowrap">
                {t('rankings.userCard.accuracy')}: {ranking.hit_accuracy.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modern design with cover image
  return (
    <div
      className={cn(
        'group overflow-hidden transition-all duration-500 cursor-pointer',
        'rounded-2xl hover:shadow-purple-glow hover:-translate-y-1 hover:scale-[1.02]'
      )}
    >
      <LazyBackgroundImage
        src={coverUrl}
        className="transition-all duration-700 group-hover:scale-110"
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/85 to-white/80 dark:from-gray-900/90 dark:via-gray-900/85 dark:to-gray-900/80 hover:from-white/85 hover:via-white/80 hover:to-white/75 dark:hover:from-gray-900/85 dark:hover:via-gray-900/80 dark:hover:to-gray-900/75 transition-all duration-300" />

        {/* TOP 3 special effect overlay */}
        {isTopThree && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/5 to-transparent" />
        )}

        <motion.div className="relative flex items-center gap-3 sm:gap-4 px-4 py-3 group">
          {/* Rank badge */}
          <motion.div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
            <RankBadge rank={rank} size="sm" />
          </motion.div>

          {/* User avatar */}
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="flex-shrink-0">
            <Link to={`/users/${ranking.user.id}?mode=${selectedMode}`}>
              <LazyAvatar
                src={ranking.user.avatar_url}
                alt={ranking.user.username}
                size="md"
                className="hover:border-2 hover:border-primary/50 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200"
              />
            </Link>
          </motion.div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Link
                to={`/users/${ranking.user.id}?mode=${selectedMode}`}
                className="font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
              >
                {ranking.user.username}
              </Link>
              <UserRoleBadge
                isAdmin={ranking.user.is_admin}
                isGMT={ranking.user.is_gmt}
                isQAT={ranking.user.is_qat}
                isBNG={ranking.user.is_bng}
                badges={ranking.user.badges}
              />
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {ranking.user.country_code && (
                <>
                  <LazyFlag
                    src={`/image/flag/${ranking.user.country_code.toLowerCase()}.svg`}
                    alt={ranking.user.country_code}
                    className="w-3 h-2 sm:w-4 sm:h-3 rounded-sm flex-shrink-0"
                    data-tooltip-id={`country-tooltip-bg-${ranking.user.id}`}
                    data-tooltip-content={ranking.user.country?.name || ranking.user.country_code}
                  />
                  <Tooltip
                    id={`country-tooltip-bg-${ranking.user.id}`}
                    place="bottom"
                    float={true}
                    style={{ zIndex: 9999 }}
                  />
                </>
              )}
              {ranking.user.team && (
                <>
                  <LazyFlag
                    src={ranking.user.team.flag_url}
                    alt={ranking.user.team.short_name}
                    className="w-3 h-2 sm:w-4 sm:h-3 rounded-sm flex-shrink-0 ml-1"
                    data-tooltip-id={`team-tooltip-bg-${ranking.user.id}`}
                    data-tooltip-content={ranking.user.team.short_name}
                  />
                  <Tooltip
                    id={`team-tooltip-bg-${ranking.user.id}`}
                    place="bottom"
                    float={true}
                    style={{ zIndex: 9999 }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Score display */}
          <div className="flex flex-col gap-1 text-right flex-shrink-0">
            <div className="text-base sm:text-lg font-bold" style={{ color: GAME_MODE_COLORS[selectedMode] }}>
              {rankingType === 'performance'
                ? `${Math.round(ranking.pp || 0).toLocaleString()}pp`
                : `${(ranking.ranked_score || 0).toLocaleString()}`}
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-3 text-xs text-gray-500">
              {rankingType === 'performance' ? (
                ranking.ranked_score !== undefined && (
                  <div className="whitespace-nowrap">
                    {t('common.score')}: {ranking.ranked_score.toLocaleString()}
                  </div>
                )
              ) : (
                ranking.pp !== undefined && (
                  <div className="whitespace-nowrap">
                    PP: {Math.round(ranking.pp).toLocaleString()}
                  </div>
                )
              )}
              {ranking.hit_accuracy !== undefined && (
                <div className="whitespace-nowrap">
                  {t('rankings.userCard.accuracy')}: {ranking.hit_accuracy.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </LazyBackgroundImage>
    </div>
  );
};

export default UserRankingCard;
