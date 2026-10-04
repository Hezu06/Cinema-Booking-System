import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import type { Movie } from '../../types';

interface MovieCardProps {
  movie: Movie;
  rank?: number;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, rank }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Generate deterministic realistic rating based on title length
  const ratingScore = ((movie.title.length * 7) % 25 + 75) / 10;

  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group flex flex-col cursor-pointer transition-all duration-300"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#161620] border border-[#232330] group-hover:border-[#FCFC65]/60 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/70">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
          }}
        />

        {/* Top-left Rank badge (for Top 10 section) */}
        {rank !== undefined && (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/75 backdrop-blur-md border border-[#FCFC65]/40 flex items-center justify-center font-black text-sm text-[#FCFC65] shadow-lg">
            {rank}
          </div>
        )}

        {/* Subtle gradient vignette at bottom of poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Hover overlay CTA */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <span className="w-full py-2 bg-[#FCFC65] hover:bg-[#EAEA48] text-[#0B0B0E] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-neon">
            Get Ticket
          </span>
        </div>
      </div>

      {/* Movie Details below poster (exact Figma Ticketor style) */}
      <div className="pt-3 pb-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#FCFC65] transition-colors">
            {movie.title}
          </h3>
          <div className="flex items-center gap-1 text-[#FCFC65] font-semibold text-xs shrink-0">
            <Star size={12} fill="currentColor" />
            <span>{ratingScore.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#8E8E9E]">
          <span className="truncate max-w-[110px]">{movie.genre.split(',')[0]}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-[#656578]" />
              {formatDuration(movie.durationMinutes)}
            </span>
            <span className="border border-[#38384A] px-1.5 py-0.5 rounded text-[10px] text-[#B0B0C0] font-medium leading-none">
              PG-13
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
