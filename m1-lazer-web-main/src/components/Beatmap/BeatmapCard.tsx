import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaPlay, FaPause, FaHeart, FaStar, FaClock, FaMusic } from 'react-icons/fa';
import type { Beatmapset } from '../../types/beatmap';
import LazyBackgroundImage from '../UI/LazyBackgroundImage';
import { formatNumber, formatDuration } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

interface BeatmapCardProps {
  beatmapset: Beatmapset;
  themeColor?: string;
  variant?: 'grid' | 'list';
}

const BeatmapCard: React.FC<BeatmapCardProps> = ({ beatmapset, themeColor = '#ED8EA6', variant = 'grid' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleCardClick = () => {
    navigate(`/beatmapsets/${beatmapset.id}`);
  };

  // Get difficulty range or average
  const difficulties = beatmapset.beatmaps?.map(b => b.difficulty_rating).sort((a, b) => a - b) || [];
  const maxDiff = difficulties.length > 0 ? difficulties[difficulties.length - 1] : 0;
  
  // Calculate average BPM and Length from beatmaps if available, or use set data
  const bpm = beatmapset.bpm || (beatmapset.beatmaps?.length > 0 ? beatmapset.beatmaps[0].bpm : 0);
  const length = beatmapset.beatmaps?.length > 0 ? beatmapset.beatmaps[0].total_length : 0;

  const hexToRgb = (hex: string): string => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const themeRgb = hexToRgb(themeColor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 h-full flex ${
        variant === 'list' ? 'flex-row' : 'flex-col'
      }`}
      onClick={handleCardClick}
    >
      {/* Audio Preview */}
      {beatmapset.preview_url && (
        <audio
          ref={audioRef}
          src={beatmapset.preview_url}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Cover Image */}
      <div className={`relative overflow-hidden ${
        variant === 'list' ? 'w-48 h-full min-w-[12rem]' : 'h-32 w-full'
      }`}>
        <LazyBackgroundImage
          src={beatmapset.covers?.card || '/default.jpg'}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        >
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
              beatmapset.status === 'ranked' ? 'bg-green-500 text-white' :
              beatmapset.status === 'approved' ? 'bg-blue-500 text-white' :
              beatmapset.status === 'qualified' ? 'bg-purple-500 text-white' :
              beatmapset.status === 'loved' ? 'bg-pink-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {t(`beatmap.status.${beatmapset.status}`) || beatmapset.status}
            </span>
            {beatmapset.is_local && (
              <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-lg backdrop-blur-sm bg-opacity-90">
                {t('beatmap.uploaded') || 'Uploaded'}
              </span>
            )}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handlePlayToggle}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all transform hover:scale-110"
            >
              {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
            </button>
          </div>
        </LazyBackgroundImage>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-pink-500 transition-colors" title={beatmapset.title}>
            {beatmapset.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1" title={beatmapset.artist}>
            {beatmapset.artist}
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1" title="BPM">
              <FaMusic className="text-pink-400" />
              <span>{Math.round(bpm)}</span>
            </div>
            <div className="flex items-center gap-1" title="Length">
              <FaClock className="text-blue-400" />
              <span>{formatDuration(length)}</span>
            </div>
            <div className="flex items-center gap-1" title="Plays">
              <FaPlay className="text-green-400" size={10} />
              <span>{formatNumber(beatmapset.play_count)}</span>
            </div>
            <div className="flex items-center gap-1" title="Favorites">
              <FaHeart className="text-red-400" />
              <span>{formatNumber(beatmapset.favourite_count)}</span>
            </div>
          </div>
        </div>

        {/* Difficulty Bar */}
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
             <div className="text-xs text-gray-500 dark:text-gray-500">
                {t('beatmap.mappedBy') || 'mapped by'} <span className="text-gray-700 dark:text-gray-300 font-medium hover:text-pink-500 transition-colors">{beatmapset.creator}</span>
              </div>
          </div>
          
          {/* Difficulty Range Indicator */}
          <div className="flex items-center gap-2">
            <FaStar className="text-yellow-400 text-xs" />
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                style={{ 
                  width: `${Math.min(100, (maxDiff / 10) * 100)}%`,
                  opacity: 0.8 
                }} 
              />
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {maxDiff.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Hover overlay with theme color */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: `rgb(${themeRgb})`
        }}
      />
    </motion.div>
  );
};

export default BeatmapCard;
