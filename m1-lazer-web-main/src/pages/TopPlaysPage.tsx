import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { rankingsAPI, handleApiError } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import GameModeSelector from '../components/UI/GameModeSelector';
import type { GameMode, Score } from '../types';
import PaginationControls from '../components/Rankings/PaginationControls';
import TopPlayCard from '../components/Rankings/TopPlayCard';

const TopPlaysPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<GameMode>('osu');
  const [currentPage, setCurrentPage] = useState(1);
  const [topPlays, setTopPlays] = useState<Score[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadTopPlays = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsLoading(true);
    try {
      const response = await rankingsAPI.getTopPlays(selectedMode, currentPage);
      if (!abortController.signal.aborted) {
        // Handle different possible response structures
        if (Array.isArray(response)) {
          setTopPlays(response);
          setTotal(response.length); // If it's just an array, we don't know total but we can use current length
        } else if (response.scores) {
          setTopPlays(response.scores);
          setTotal(response.total || response.scores.length);
        } else if (response.ranking) {
          setTopPlays(response.ranking);
          setTotal(response.total || response.ranking.length);
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        handleApiError(error);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [selectedMode, currentPage]);

  useEffect(() => {
    loadTopPlays();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadTopPlays]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('rankings.tabs.topPlays')}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            {t('nav.rankings')}
          </p>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-card rounded-lg shadow-sm border-card p-2">
            <GameModeSelector
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
              variant="compact"
            />
          </div>
        </div>

        <div className="-mx-4 sm:mx-0 sm:bg-card sm:rounded-xl sm:shadow-sm sm:border-card sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-0">
              <LoadingSpinner size="lg" className="mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t('common.loading')}</p>
            </div>
          ) : topPlays && topPlays.length > 0 ? (
            <div className="flex flex-col gap-1">
              {topPlays.map((score, index) => (
                <TopPlayCard 
                  key={score.id} 
                  score={score} 
                  rank={(currentPage - 1) * 50 + index + 1}
                  selectedMode={selectedMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">{t('rankings.errors.noData')}</p>
            </div>
          )}

          {!isLoading && total > 50 && (
            <div className="mt-6">
              <PaginationControls
                total={total}
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

export default TopPlaysPage;
