import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { rankingsAPI, handleApiError } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import GameModeSelector from '../components/UI/GameModeSelector';
import type { GameMode } from '../types';
import PaginationControls from '../components/Rankings/PaginationControls';
import TopPlayCard from '../components/Rankings/TopPlayCard';

const TopPlaysPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>('osu');
  const [currentPage, setCurrentPage] = useState(1);
  const [topPlays, setTopPlays] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadTopPlays = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await rankingsAPI.getTopPlays(selectedMode, currentPage);
      
      if (!abortController.signal.aborted) {
        if (response && Array.isArray(response.scores)) {
          setTopPlays(response.scores);
          setTotal(response.total || 0);
        } else {
          setTopPlays([]);
          setTotal(0);
        }
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        const errorObj = err as { response?: { status?: number } };
        if (errorObj.response?.status === 401) {
          navigate('/login', { state: { from: '/rankings/top-plays' } });
        } else {
          handleApiError(err);
          setError(t('rankings.errors.loadFailed'));
        }
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [selectedMode, currentPage, navigate, t]);

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

  const handleRetry = () => {
    loadTopPlays();
  };

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            {t('rankings.tabs.topPlays')}
          </h1>
          <p className="text-slate-400 mt-1">
            {t('nav.rankings')}
          </p>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-6">
          <div className="inline-flex rounded-lg bg-slate-800/50 p-1.5 border border-white/5">
            <GameModeSelector
              selectedMode={selectedMode}
              onModeChange={handleModeChange}
              variant="compact"
              className=""
            />
          </div>
          
          <div className="flex-1" />
          
          {total > 0 && (
            <div className="text-slate-400 text-sm">
              {total.toLocaleString()} {t('common.total')}
            </div>
          )}
        </div>

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
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="bg-red-500/10 p-4 rounded-full mb-4">
                <FiAlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 font-medium mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-osu-pink hover:bg-osu-pink/90 text-white rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
                {t('common.retry')}
              </button>
            </div>
          ) : topPlays.length > 0 ? (
            <div className="divide-y divide-white/5">
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
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="bg-slate-800 p-4 rounded-full mb-4">
                <FiAlertCircle className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-500">{t('rankings.errors.noData')}</p>
            </div>
          )}

          {!isLoading && !error && total > 50 && (
            <div className="p-4 border-t border-white/5 bg-slate-800/30">
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