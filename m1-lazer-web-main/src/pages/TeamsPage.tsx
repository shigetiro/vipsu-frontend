import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiEye } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { rankingsAPI, handleApiError } from '../utils/api';
import TeamRankingsList from '../components/Rankings/TeamRankingsList';
import RankingTypeSelector from '../components/UI/RankingTypeSelector';
import PaginationControls from '../components/Rankings/PaginationControls';
import GameModeSelector from '../components/UI/GameModeSelector';
import type {
  GameMode,
  TeamRankingsResponse,
  RankingType
} from '../types';

const TeamsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<GameMode>('osu');
  const [rankingType, setRankingType] = useState<RankingType>('performance');
  const [currentPage, setCurrentPage] = useState(1);

  const [teamRankings, setTeamRankings] = useState<TeamRankingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadTeamRankings = async () => {
    setIsLoading(true);
    try {
      const response = await rankingsAPI.getTeamRankings(
        selectedMode,
        rankingType,
        currentPage
      );
      setTeamRankings(response);
    } catch (error) {
      handleApiError(error);
      console.error('Failed to load team rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndLoad = () => {
    setCurrentPage(1);
    loadTeamRankings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    resetAndLoad();
  }, [selectedMode, rankingType]);

  useEffect(() => {
    loadTeamRankings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f14] via-[#14141a] to-[#1a1a22]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-osu-pink/20 text-osu-pink">
                  <i className="fa fa-users text-xl" />
                </span>
                {t('teams.title')}
              </h1>
              <p className="text-sm sm:text-base text-slate-500">
                {t('teams.description')}
              </p>
            </div>

            {isAuthenticated && (
              user?.team ? (
                user.id === user.team.leader_id ? (
                  <Link
                    to={`/teams/${user.team.id}/edit`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-osu-pink text-white font-medium transition-all hover:shadow-lg hover:shadow-osu-pink/30 hover:-translate-y-0.5"
                  >
                    <FiEdit />
                    {t('teams.editTeam')}
                  </Link>
                ) : (
                  <Link
                    to={`/teams/${user.team.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-osu-pink text-white font-medium transition-all hover:shadow-lg hover:shadow-osu-pink/30 hover:-translate-y-0.5"
                  >
                    <FiEye />
                    {t('teams.viewTeam')}
                  </Link>
                )
              ) : (
                <Link
                  to="/teams/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-osu-pink text-white font-medium transition-all hover:shadow-lg hover:shadow-osu-pink/30 hover:-translate-y-0.5"
                >
                  <FiPlus />
                  {t('teams.createTeam')}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4 sm:p-5 mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4 sm:gap-6">
            {/* Game Mode Selection */}
            <div className="rounded-lg border border-white/5 bg-slate-800/50 p-2">
              <GameModeSelector
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                variant="compact"
              />
            </div>

            {/* Filter Options */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 xl:flex-1">
              <div className="w-full sm:w-48">
                <RankingTypeSelector
                  value={rankingType}
                  onChange={setRankingType}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rankings Content */}
        <div className="rounded-xl border border-white/5 bg-slate-900/30 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-osu-pink blur-xl opacity-20" />
                <LoadingSpinner size="lg" className="text-osu-pink relative" />
              </div>
              <p className="text-slate-500 font-medium">{t('teams.loadingTeams')}</p>
            </div>
          ) : (
            <TeamRankingsList
              rankings={teamRankings}
              currentPage={currentPage}
              selectedMode={selectedMode}
              rankingType={rankingType}
            />
          )}

          {/* Pagination */}
          {!isLoading && (
            <div className="border-t border-white/5 px-4 py-4 sm:px-6">
              <PaginationControls
                total={teamRankings?.total || 0}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
