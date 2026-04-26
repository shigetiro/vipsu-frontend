import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RankBadge from '../UI/RankBadge';
import LazyBackgroundImage from '../UI/LazyBackgroundImage';
import LazyAvatar from '../UI/LazyAvatar';
import UserRoleBadge from '../UI/UserRoleBadge';
import ScoreModsDisplay from '../User/ScoreModsDisplay';
import { GAME_MODE_COLORS } from '../../types';
import type { Score, GameMode } from '../../types';

interface Props {
  score: Score;
  rank: number;
  selectedMode: GameMode;
}

const getRankIcon = (rank: string) => {
  const rankImageMap: Record<string, string> = {
    XH: '/image/grades/SS-Silver.svg',
    X:  '/image/grades/SS.svg',
    SH: '/image/grades/S-Silver.svg',
    S:  '/image/grades/S.svg',
    A:  '/image/grades/A.svg',
    B:  '/image/grades/B.svg',
    C:  '/image/grades/C.svg',
    D:  '/image/grades/D.svg',
    F:  '/image/grades/F.svg', 
  };
  return rankImageMap[rank] || rankImageMap['F'];
};

const TopPlayCard: React.FC<Props> = ({ score, rank, selectedMode }) => {
  const { t } = useTranslation();
  const isTopThree = rank <= 3;
  
  const coverUrl = score.beatmapset?.covers?.['cover@2x'] || score.beatmapset?.covers?.cover;
  const accuracy = (score.accuracy * 100).toFixed(2);
  const pp = Math.round(score.pp || 0);
  const mods = score.mods || [];

  return (
    <LazyBackgroundImage 
      src={coverUrl} 
      className="overflow-hidden transition-all duration-300 glass-card rounded-2xl hover:translate-y-[-2px]"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/85" />
      
      {isTopThree && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/5 to-transparent" />
      )}
      
      <div className="relative flex items-center gap-3 sm:gap-4 px-4 py-3">
        {/* Rank */}
        <div className="flex-shrink-0 w-8 sm:w-10">
          <RankBadge rank={rank} size="sm" />
        </div>

        {/* User Avatar */}
        <Link to={`/users/${score.user.id}?mode=${selectedMode}`} className="flex-shrink-0">
          <LazyAvatar
            src={score.user.avatar_url}
            alt={score.user.username}
            size="md"
            className="hover:border-blue-400 dark:hover:border-blue-500"
          />
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <Link
                to={`/users/${score.user.id}?mode=${selectedMode}`}
                className="font-bold text-sm sm:text-base text-gray-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
              >
                {score.user.username}
              </Link>
              <UserRoleBadge 
                isAdmin={score.user.is_admin} 
                isGMT={score.user.is_gmt} 
                isQAT={score.user.is_qat}
                isBNG={score.user.is_bng}
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
              <Link 
                to={`/beatmapsets/${score.beatmapset.id}#osu/${score.beatmap.id}`}
                className="hover:text-blue-500 transition-colors truncate"
              >
                {score.beatmapset.title} [{score.beatmap.version}]
              </Link>
            </div>
          </div>
        </div>

        {/* Grade & Mods */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="hidden sm:block">
            <ScoreModsDisplay mods={mods} />
          </div>
          <img 
            src={getRankIcon(score.rank)} 
            alt={score.rank}
            className="w-10 h-6 sm:w-12 sm:h-8 object-contain"
          />
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-0.5 text-right flex-shrink-0 min-w-[70px] sm:min-w-[100px]">
          <div className="text-base sm:text-lg font-black" style={{ color: GAME_MODE_COLORS[selectedMode] }}>
            {pp.toLocaleString()}pp
          </div>
          <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
            {accuracy}%
          </div>
        </div>
      </div>
    </LazyBackgroundImage>
  );
};

export default TopPlayCard;
