import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, SlidersHorizontal, Calendar as CalendarIcon, ChevronRight, Bookmark } from 'lucide-react';
import type { Movie, Showtime, Cinema } from '../types';
import { api } from '../api/client';

export const TimeSelectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả');
  const [selectedFormat, setSelectedFormat] = useState<'All' | 'Standard' | 'IMAX' | '3D'>('All');
  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState('All');
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      api.getMovieById(id),
      api.getShowtimes({ movieId: id }),
      api.getCinemas(),
    ])
      .then(([movieRes, showtimesRes, cinemasRes]) => {
        if (movieRes.success && movieRes.data) {
          setMovie(movieRes.data);
        }
        if (showtimesRes.success && showtimesRes.data) {
          const upcomingShowtimes = (showtimesRes.data as Showtime[]).filter(
            (showtime: Showtime) => showtime.status === 'SCHEDULED'
              && new Date(showtime.startTime).getTime() > Date.now()
          );
          setShowtimes(upcomingShowtimes);
          // Set initial date from first showtime if available
          if (upcomingShowtimes.length > 0) {
            const firstDate = new Date(upcomingShowtimes[0].startTime).toISOString().split('T')[0];
            setSelectedDateStr(firstDate);
          }
        }
        if (cinemasRes.success && cinemasRes.data) {
          setCinemas(cinemasRes.data);
        }
      })
      .catch((err) => console.error('Failed to load showtimes:', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Extract unique showtime dates from database showtimes, or fallback to upcoming dates
  const availableDates = Array.from(
    new Set(
      showtimes.map((st) => new Date(st.startTime).toISOString().split('T')[0])
    )
  ).sort();

  const days = availableDates.length > 0
    ? availableDates.map((dStr, idx) => {
        const d = new Date(dStr + 'T00:00:00');
        const isToday = new Date().toISOString().split('T')[0] === dStr;
        const label = isToday ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }).toUpperCase();
        return { index: idx, label, dateString: dStr };
      })
    : Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const label = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }).toUpperCase();
        return { index: i, label, dateString: d.toISOString().split('T')[0] };
      });

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Unique cities from database
  const cities = ['Tất cả', ...Array.from(new Set(cinemas.map((c) => c.city)))];

  // Filter showtimes
  const filteredShowtimes = showtimes.filter((st) => {
    if (st.status !== 'SCHEDULED' || new Date(st.startTime).getTime() <= currentTime) {
      return false;
    }
    // City filter
    if (selectedCity !== 'Tất cả' && st.room?.cinema?.city !== selectedCity) {
      return false;
    }
    // Cinema filter
    if (selectedCinemaFilter !== 'All' && st.room?.cinema?.name !== selectedCinemaFilter) {
      return false;
    }
    // Format filter
    if (selectedFormat === 'Standard' && st.room?.type !== 'STANDARD') return false;
    if (selectedFormat === 'IMAX' && st.room?.type !== 'IMAX') return false;
    if (selectedFormat === '3D' && st.room?.type !== 'THREE_D') return false;
    // Date filter
    if (selectedDateStr) {
      const stDate = new Date(st.startTime).toISOString().split('T')[0];
      if (stDate !== selectedDateStr) return false;
    }
    return true;
  });

  // Group filtered showtimes by cinema
  const showtimesByCinema: Record<string, Showtime[]> = {};
  filteredShowtimes.forEach((st) => {
    const cName = st.room?.cinema?.name || 'Rạp Chiếu Phim';
    if (!showtimesByCinema[cName]) {
      showtimesByCinema[cName] = [];
    }
    showtimesByCinema[cName].push(st);
  });

  const handleSelectTime = (st: Showtime) => {
    setSelectedShowtime(st);
    navigate(`/booking/${st.id}`);
  };

  if (isLoading || !movie) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center animate-pulse space-y-6">
        <div className="h-44 bg-[#14141E] rounded-3xl" />
        <div className="h-16 bg-[#14141E] rounded-2xl" />
        <div className="h-64 bg-[#14141E] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full text-[#F1F1F4] pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* 1. MOVIE BANNER HEADER (Figma Time Selection Style) */}
        <div className="relative rounded-3xl overflow-hidden bg-[#12121A] border border-[#20202E] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl">
          {/* Poster */}
          <div className="w-32 sm:w-36 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden border border-[#2E2E3E] bg-[#161622] shadow-xl">
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
          </div>

          {/* Metadata */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{movie.title}</h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#9E9EB2]">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-[#FCFC65]" />
                {Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m
              </span>
              <span>·</span>
              <span className="border border-[#353545] px-2 py-0.5 rounded text-[10px] text-white">
                PG-13
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-[#FCFC65] font-bold">
                <Star size={13} fill="currentColor" />
                7.9
              </span>
            </div>

            <p className="text-xs text-[#A0A0B2] line-clamp-2 leading-relaxed max-w-2xl">
              {movie.description}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1">
              <Link to={`/movies/${movie.id}`} className="text-xs text-[#FCFC65] hover:underline font-semibold">
                More Details
              </Link>
              <button className="flex items-center gap-1.5 text-xs text-white hover:text-[#FCFC65] bg-[#1A1A26] px-3.5 py-1.5 rounded-full border border-[#2E2E3E] transition">
                <Bookmark size={13} />
                <span>+ Add to my list</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. DATE SELECTION STRIP */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <div className="shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#14141E] border border-[#262633] text-xs font-semibold text-white">
            <SlidersHorizontal size={14} className="text-[#FCFC65]" />
            <span>Ngày chiếu</span>
          </div>

          {days.map((day) => {
            const isSelected = selectedDateStr === day.dateString;
            return (
              <button
                key={day.dateString}
                onClick={() => setSelectedDateStr(day.dateString)}
                className={`shrink-0 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#FCFC65] text-[#08080C] shadow-neon'
                    : 'bg-[#12121A] border border-[#20202E] text-[#8E8E9E] hover:text-white hover:border-[#353545]'
                }`}
              >
                {day.label}
              </button>
            );
          })}

          <button
            onClick={() => setSelectedDateStr('')}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-semibold transition ${
              selectedDateStr === ''
                ? 'bg-[#FCFC65] text-[#08080C] font-bold border-[#FCFC65]'
                : 'bg-[#14141E] border-[#262633] text-[#8E8E9E] hover:text-white'
            }`}
          >
            <CalendarIcon size={14} />
            <span>Tất cả ngày</span>
          </button>
        </div>

        {/* 3. LOCATION & FORMAT FILTER ROW */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-[#20202E]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[#8E8E9E]">
              <span>Khu vực:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-[#14141E] border border-[#2E2E3E] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#FCFC65]"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8E8E9E]">
              <span>Rạp:</span>
              <select
                value={selectedCinemaFilter}
                onChange={(e) => setSelectedCinemaFilter(e.target.value)}
                className="bg-[#14141E] border border-[#2E2E3E] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#FCFC65]"
              >
                <option value="All">Tất cả cụm rạp</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Format Tabs: All, Standard, IMAX, 3D */}
          <div className="flex items-center gap-1 bg-[#12121A] p-1 rounded-xl border border-[#222230] text-xs">
            {(['All', 'Standard', 'IMAX', '3D'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedFormat === fmt
                    ? 'bg-[#FCFC65] text-black font-bold'
                    : 'text-[#8E8E9E] hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* 4. CINEMA SHOWTIMES LIST */}
        <div className="space-y-5">
          {Object.keys(showtimesByCinema).length === 0 ? (
            <div className="p-12 text-center bg-[#12121A] border border-[#20202E] rounded-3xl space-y-3">
              <Clock size={36} className="mx-auto text-[#606070]" />
              <h3 className="text-base font-bold text-white">Chưa có suất chiếu phù hợp</h3>
              <p className="text-xs text-[#8E8E9E]">
                Vui lòng chọn ngày khác hoặc chọn Tất cả ngày để xem các suất chiếu khả dụng.
              </p>
              <button
                onClick={() => {
                  setSelectedDateStr('');
                  setSelectedCity('Tất cả');
                  setSelectedCinemaFilter('All');
                  setSelectedFormat('All');
                }}
                className="px-5 py-2 rounded-xl bg-[#FCFC65] text-black font-bold text-xs"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            Object.entries(showtimesByCinema).map(([cinemaName, cShowtimes]) => {
              const cinemaAddress =
                cShowtimes[0]?.room?.cinema?.address || 'Hà Nội / TP. Hồ Chí Minh';
              const cinemaCity = cShowtimes[0]?.room?.cinema?.city || '';

              const hasSelectionInThisCinema =
                selectedShowtime && cShowtimes.some((st) => st.id === selectedShowtime.id);

              return (
                <div
                  key={cinemaName}
                  className="rounded-3xl bg-[#12121A] border border-[#20202E] p-6 sm:p-7 space-y-4 transition hover:border-[#2E2E40]"
                >
                  {/* Cinema Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span>{cinemaName}</span>
                      </h3>
                      <p className="text-xs text-[#707086] mt-0.5 flex items-center gap-1">
                        <MapPin size={12} className="text-[#FCFC65]" />
                        <span>{cinemaAddress}</span>
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#74CFCF]">{cinemaCity}</span>
                  </div>

                  {/* Format & Features */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white uppercase tracking-wider">
                      {cShowtimes[0]?.room?.name || 'Phòng chiếu'} · {cShowtimes[0]?.room?.type || 'STANDARD'}
                    </div>
                    <p className="text-[11px] text-[#707086]">
                      Ghế ngồi bọc da cao cấp · Âm thanh vòm Dolby Atmos · Máy chiếu độ phân giải cao
                    </p>
                  </div>

                  {/* Time Chips & Action Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div className="flex flex-wrap gap-2.5">
                      {cShowtimes.map((st) => {
                        const isSelected = selectedShowtime?.id === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => handleSelectTime(st)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${
                              isSelected
                                ? 'bg-[#FCFC65] text-[#08080C] shadow-neon scale-105'
                                : 'bg-[#181824] border border-[#262635] text-white hover:border-[#FCFC65]'
                            }`}
                          >
                            <span>{formatTime(st.startTime)}</span>
                            <span className={`text-[10px] font-normal ${isSelected ? 'text-black' : 'text-[#8E8E9E]'}`}>
                              {Number(st.basePrice).toLocaleString('vi-VN')} đ
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Continue Button appears on selected cinema card! */}
                    {hasSelectionInThisCinema && selectedShowtime && (
                      <button
                        onClick={() => navigate(`/booking/${selectedShowtime.id}`)}
                        className="self-end sm:self-auto px-6 py-2.5 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs flex items-center gap-1.5 shadow-neon transition transform hover:scale-105"
                      >
                        <span>Tiếp tục chọn ghế</span>
                        <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
