import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Play, Clock, Sparkles } from 'lucide-react';
import type { Movie } from '../../types';

interface HeroBannerProps {
  movie: Movie | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movie }) => {
  if (!movie) return null;

  return (
    <div className="relative w-full h-[450px] lg:h-[520px] rounded-3xl overflow-hidden mb-12 border border-brand-border/60 shadow-2xl">
      {/* Background Backdrop Image */}
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.45] scale-105"
      />

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/70 to-transparent w-full lg:w-3/4" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 sm:p-10 lg:p-14 max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/20 border border-brand-primary/40 text-brand-primary font-semibold text-xs rounded-full uppercase tracking-wider">
            <Sparkles size={13} />
            Phim bom tấn nổi bật
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-300 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
            <Clock size={12} className="text-brand-primary" />
            {movie.durationMinutes} phút
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
          {movie.title}
        </h1>

        <p className="text-sm sm:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 mb-6 font-normal leading-relaxed">
          {movie.description}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            to={`/movies/${movie.id}`}
            className="py-3 px-6 bg-brand-primary hover:bg-brand-primaryHover text-gray-950 font-bold rounded-xl flex items-center gap-2 transition duration-200 shadow-neon active:scale-95 text-sm"
          >
            <Ticket size={18} />
            <span>Đặt vé ngay</span>
          </Link>

          <a
            href={movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl flex items-center gap-2 backdrop-blur-md border border-white/15 transition active:scale-95 text-sm"
          >
            <Play size={16} className="text-brand-primary fill-brand-primary" />
            <span>Xem Trailer</span>
          </a>
        </div>
      </div>
    </div>
  );
};
