import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { scoreAPI } from '../../utils/api';
import type { Score } from '../../types/scores';
import type { Beatmap } from '../../types';

interface BeatmapLeaderboardProps {
  beatmapId: number;
  beatmap?: Beatmap;
  limit?: number;
  mode?: string;
}

/**
 * BeatmapLeaderboard Component
 * 显示指定谱面的排行榜，按PP从高到低排序
 */
const BeatmapLeaderboard: React.FC<BeatmapLeaderboardProps> = ({
  beatmapId,
  beatmap,
  limit = 50,
  mode,
}) => {
  const { t } = useTranslation();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await scoreAPI.getBeatmapScores(beatmapId, limit);
        setScores(data.scores);
      } catch (err) {
        console.error('Failed to fetch beatmap scores:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scores');
        setScores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [beatmapId, limit]);

  const getRankColor = (rank: string): string => {
    switch (rank) {
      case 'F': return '#FF0000';
      case 'D': return '#FF6B6B';
      case 'C': return '#FFB85C';
      case 'B': return '#FFE181';
      case 'A': return '#A4D65E';
      case 'S': return '#FFDAB9';
      case 'X': return '#FFD700';
      case 'SH': return '#E0E0E0';
      case 'XH': return '#FFD700';
      default: return '#999999';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-osu-pink"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-slate-600 dark:text-slate-400">
            {t('beatmap.noScores') || 'Noch keine Scores'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-700/50">
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('beatmap.player') || 'Player'}
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('beatmap.grade') || 'Grade'}
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              PP
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('beatmap.accuracy') || 'Accuracy'}
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('beatmap.combo') || 'Max Combo'}
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('beatmap.mods') || 'Mods'}
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr
              key={score.id}
              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <td className="px-6 py-4 text-sm font-bold text-osu-pink">
                {index + 1}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={score.user.avatar_url}
                    alt={score.user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white hover:text-osu-pink transition-colors cursor-pointer">
                      {score.user.username}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {score.user.country_code}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div
                  className="inline-block px-3 py-1 rounded-lg font-bold text-white"
                  style={{ backgroundColor: getRankColor(score.rank) }}
                >
                  {score.rank}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="font-bold text-osu-pink text-base">
                  {score.pp.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {(score.accuracy * 100).toFixed(2)}%
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {score.max_combo}
                  {beatmap && `/${beatmap.max_combo}`}
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
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      NM
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BeatmapLeaderboard;

