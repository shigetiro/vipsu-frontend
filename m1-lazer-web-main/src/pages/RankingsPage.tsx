import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { rankingsAPI, handleApiError } from '../utils/api';
import CountrySelect from '../components/UI/CountrySelect';
import RankingTypeSelector from '../components/UI/RankingTypeSelector';
import UserRankingsList from '../components/Rankings/UserRankingsList';
import CountryRankingsList from '../components/Rankings/CountryRankingsList';
import PaginationControls from '../components/Rankings/PaginationControls';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import GameModeSelector from '../components/UI/GameModeSelector';
import { allCountries } from '../utils/allCountries';
import type {
  GameMode,
  TopUsersResponse,
  CountryResponse,
  TabType,
  RankingType
} from '../types';

const RankingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<GameMode>('osu');
  const [selectedTab, setSelectedTab] = useState<TabType>('users');
  const [rankingType, setRankingType] = useState<RankingType>('performance');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const [userRankings, setUserRankings] = useState<TopUsersResponse | null>(null);
  const [countryRankings, setCountryRankings] = useState<CountryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadUserRankings = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    try {
      const response = await rankingsAPI.getUserRankings(
        selectedMode,
        rankingType,
        selectedCountry || undefined,
        currentPage
      );

      if (!abortController.signal.aborted) {
        setUserRankings(response);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        handleApiError(error);
        console.error(t('rankings.errors.loadFailed'), error);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [selectedMode, rankingType, selectedCountry, currentPage, t]);

  const loadCountryRankings = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    try {
      const response = await rankingsAPI.getCountryRankings(selectedMode, currentPage);

      if (!abortController.signal.aborted) {
        setCountryRankings(response);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        handleApiError(error);
        console.error(t('rankings.errors.loadFailed'), error);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [selectedMode, currentPage, t]);

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedMode, selectedTab, rankingType, selectedCountry]);

  useEffect(() => {
    if (selectedTab === 'users') {
      loadUserRankings();
    } else {
      loadCountryRankings();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedTab, loadUserRankings, loadCountryRankings]);

  useEffect(() => {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-osu-pink/20 text-osu-pink">
              <i className="fa fa-trophy text-lg" />
            </span>
            {t('rankings.title')}
          </h1>
          <p className="text-sm sm:text-base text-slate-500">{t('nav.rankings')}</p>
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
                className=""
              />
            </div>

            {/* Tabs and Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4 xl:flex-1">
              {/* Tab Switching */}
              <div className="flex-1">
                <div className="inline-flex rounded-lg bg-slate-800/50 p-1.5 border border-white/5">
                  <button
                    onClick={() => setSelectedTab('users')}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      selectedTab === 'users'
                        ? 'bg-osu-pink text-white shadow-lg shadow-osu-pink/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className="fa fa-user" />
                    {t('rankings.tabs.users')}
                  </button>
                  <button
                    onClick={() => setSelectedTab('countries')}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      selectedTab === 'countries'
                        ? 'bg-osu-pink text-white shadow-lg shadow-osu-pink/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className="fa fa-flag" />
                    {t('rankings.tabs.countries')}
                  </button>
                </div>
              </div>

              {/* Filter Options */}
              {selectedTab === 'users' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-44">
                    <RankingTypeSelector
                      value={rankingType}
                      onChange={setRankingType}
                    />
                  </div>
                  <div className="w-full sm:w-52">
                    <CountrySelect
                      value={selectedCountry}
                      onChange={setSelectedCountry}
                      placeholder={t('rankings.filters.country')}
                      countries={allCountries}
                      isLoading={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rankings Content */}
        <div className="rounded-xl border border-white/5 bg-slate-900/30 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-osu-pink blur-xl opacity-20" />
                <div className="relative">
                  <LoadingSpinner size="lg" className="text-osu-pink" />
                </div>
              </div>
              <p className="text-slate-500 font-medium">{t('common.loading')}</p>
            </div>
          ) : selectedTab === 'users' ? (
            <UserRankingsList
              rankings={userRankings}
              currentPage={currentPage}
              selectedMode={selectedMode}
              rankingType={rankingType}
            />
          ) : (
            <CountryRankingsList
              rankings={countryRankings}
              currentPage={currentPage}
              selectedMode={selectedMode}
            />
          )}

          {/* Pagination */}
          {!isLoading && (
            <div className="border-t border-white/5 px-4 py-4 sm:px-6">
              <PaginationControls
                total={selectedTab === 'users' ? userRankings?.total || 0 : countryRankings?.total || 0}
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

export default RankingsPage;
