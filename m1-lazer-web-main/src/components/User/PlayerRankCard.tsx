import React from "react";
import { useTranslation } from 'react-i18next';

interface Props {
  stats?: { pp?: number; play_time?: number };
  playTime: string;
  user_achievements?: {
    achievement_id: number;
    achieved_at: string;
  }[];
  gradeCounts: {
    ssh: number;
    ss: number;
    sh: number;
    s: number;
    a: number;
  };
}

const PlayerRankCard: React.FC<Props> = ({ stats, playTime, user_achievements, gradeCounts }) => {
  const { t } = useTranslation();
  const achievementCount = user_achievements
    ? new Set(user_achievements.map((a) => a.achievement_id)).size
    : 0;

  return (
    <div className="px-2 md:px-4 py-3 flex flex-col md:flex-row gap-4 md:justify-between md:items-center">
      {/* 左侧：奖章 / PP / 游玩时间 */}
      <div className="flex gap-3 md:gap-4 items-center ml-0 md:ml-[-10px] justify-center md:justify-start">
        <div className="text-center min-w-0 flex-shrink-0">
          <div className="text-gray-500 text-xs mb-1 whitespace-nowrap">{t('profile.stats.medals')}</div>
          <div className="text-gray-800 font-bold text-base">
            {achievementCount}
          </div>
        </div>
        <div className="text-center min-w-0 flex-shrink-0">
          <div className="text-gray-500 text-xs mb-1 whitespace-nowrap">{t('profile.stats.pp')}</div>
          <div className="text-gray-800 font-bold text-base">
            {Math.round(stats?.pp ?? 0)}
          </div>
        </div>
        <div className="text-center min-w-0 flex-shrink-0 group relative">
          <div className="text-gray-500 text-xs mb-1 whitespace-nowrap">{t('profile.stats.playTime')}</div>
          <div className="text-gray-800 font-bold text-base cursor-help">{playTime}</div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {stats?.play_time ? `${Math.round(stats.play_time / 3600).toLocaleString()} hours` : '0 hours'}
          </div>
        </div>
      </div>

      {/* 右侧：评级徽章 */}
      <div className="flex gap-1 md:gap-2 items-center mr-0 md:mr-[-15px] justify-center md:justify-end">
        <div className="flex flex-col items-center text-xs font-bold text-gray-700">
          <img src="/image/grades/SS-Silver.svg" alt="SSH" className="w-8 h-8 md:w-10 md:h-10" />
          <span className="mt-1">{gradeCounts.ssh}</span>
        </div>
        <div className="flex flex-col items-center text-xs font-bold text-gray-700">
          <img src="/image/grades/SS.svg" alt="SS" className="w-8 h-8 md:w-10 md:h-10" />
          <span className="mt-1">{gradeCounts.ss}</span>
        </div>
        <div className="flex flex-col items-center text-xs font-bold text-gray-700">
          <img src="/image/grades/S-Silver.svg" alt="SH" className="w-8 h-8 md:w-10 md:h-10" />
          <span className="mt-1">{gradeCounts.sh}</span>
        </div>
        <div className="flex flex-col items-center text-xs font-bold text-gray-700">
          <img src="/image/grades/S.svg" alt="S" className="w-8 h-8 md:w-10 md:h-10" />
          <span className="mt-1">{gradeCounts.s}</span>
        </div>
        <div className="flex flex-col items-center text-xs font-bold text-gray-700">
          <img src="/image/grades/A.svg" alt="A" className="w-8 h-8 md:w-10 md:h-10" />
          <span className="mt-1">{gradeCounts.a}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerRankCard;
