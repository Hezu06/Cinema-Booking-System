import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft, Star, Plus, Minus, Smartphone, CheckCircle, Sparkles } from 'lucide-react';
import type { Movie, Cinema } from '../types';
import { api } from '../api/client';
import { MovieCard } from '../components/movies/MovieCard';

const movieBackdrops: Record<string, string> = {
  'Dune: Hành Tinh Cát - Phần Hai': 'https://image.tmdb.org/t/p/original/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
  'Godzilla x Kong: Đế Chế Mới': 'https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
  'Kung Fu Panda 4': 'https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
  'Oppenheimer': 'https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
  'Inception': 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
  'Deadpool & Wolverine': 'https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
  'Avatar: Lửa và Tro Tàn': 'https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
};

export const HomePage: React.FC = () => {
  const location = useLocation();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([api.getMovies(), api.getCinemas()])
      .then(([moviesRes, cinemasRes]) => {
        if (moviesRes.success && moviesRes.data) {
          setMovies(moviesRes.data);
        }
        if (cinemasRes.success && cinemasRes.data) {
          setCinemas(cinemasRes.data);
        }
      })
      .catch((err) => console.error('Failed to load initial data:', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (location.hash === '#cinemas' || location.search.includes('cinemas') || location.pathname === '/cinemas') {
      setTimeout(() => {
        const el = document.getElementById('cinemas');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [location, isLoading]);

  const nowShowingMovies = movies.filter((m) => m.status === 'NOW_SHOWING');
  const comingSoonMovies = movies.filter((m) => m.status === 'COMING_SOON');
  const displayNowShowing = nowShowingMovies.length > 0 ? nowShowingMovies : movies;
  const displayComingSoon = comingSoonMovies.length > 0 ? comingSoonMovies : movies.slice(0, 5);
  const heroMovies = displayNowShowing.length > 0 ? displayNowShowing : movies;

  useEffect(() => {
    if (heroMovies.length <= 1 || isHeroPaused) return;

    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [heroMovies.length, isHeroPaused]);

  const handlePrevHero = () => {
    setCurrentHeroIndex((prev) => (prev === 0 ? heroMovies.length - 1 : prev - 1));
  };

  const handleNextHero = () => {
    setCurrentHeroIndex((prev) => (prev + 1) % heroMovies.length);
  };

  const testimonials = [
    {
      text: "I messed up the showtime and customer support fixed it in under 5 minutes on chat. Didn't even lose my loyalty points. Impressed.",
      author: "Ada",
      role: "Movie goer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    },
    {
      text: "Three taps, ticket bought, QR scanned and done. This is how it should work.",
      author: "Jumi",
      role: "Developer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    },
    {
      text: "Booked two IMAX seats in 45 seconds; the live seat map never stuttered and highlighted rows I'd rated before. Indie titles and blockbusters in one place.",
      author: "Jennifer",
      role: "Movie goer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    },
    {
      text: "The dark mode and minimal pop-ups made late-night browsing painless. Other sites spam me with trailers auto-playing; this one respected my bandwidth.",
      author: "Mathew",
      role: "Artist",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    },
    {
      text: "Wish list feature is underrated. I tagged three upcoming releases and got opening-night seat drops before they sold out. Chose recliners, prepaid popcorn!",
      author: "James",
      role: "Teacher",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    },
    {
      text: "Ticketor consistently goes above and beyond my expectations. Cleanest UI in cinema booking hands down.",
      author: "John",
      role: "Banker",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
    },
  ];

  const faqs = [
    {
      q: "What is Ticketor?",
      a: "Ticketor is a digital cinema booking platform designed to provide a fast, seamless way to discover showtimes, pick your favorite seats in real-time, order concessions, and manage your tickets all in one sleek dashboard.",
    },
    {
      q: "Can I modify my seat selection after booking a ticket?",
      a: "You can modify or exchange your seat reservations up to 2 hours before the movie showtime through your Profile under 'My Tickets', subject to auditorium availability.",
    },
    {
      q: "Is my payment information secure with Ticketor?",
      a: "Yes, Ticketor adheres strictly to PCI-DSS Level 1 compliance and uses end-to-end 256-bit encryption for all card transactions and digital wallets.",
    },
    {
      q: "What if I have trouble booking tickets through the app?",
      a: "Our customer success team is available 24/7 via live chat and email to assist you with instant seat reallocation, refunds, or payment queries.",
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
    }
  };

  return (
    <div className="w-full text-[#F1F1F4] overflow-hidden -mt-16 sm:-mt-20">
      {/* 1. HERO SLIDER SECTION (Smooth Auto-Sliding to Left) */}
      <section
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
        className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-[#08080C] pt-24 pb-12 select-none"
      >
        {/* Carousel Track: slides smoothly to the left */}
        <div
          className="flex transition-transform duration-700 ease-in-out w-full"
          style={{ transform: `translateX(-${currentHeroIndex * 100}%)` }}
        >
          {heroMovies.map((movie) => {
            const backdrop =
              movieBackdrops[movie.title] ||
              movie.posterUrl ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&auto=format&fit=crop&q=80';

            return (
              <div
                key={movie.id}
                className="w-full min-w-full flex-shrink-0 relative flex flex-col items-center justify-center text-center px-4 sm:px-8 py-16"
              >
                {/* Full-bleed Backdrop with Cinema Vignettes */}
                <div
                  className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                  style={{ backgroundImage: `url('${backdrop}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080C] via-[#08080C]/75 to-[#08080C]/85" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#08080C]/80 via-transparent to-[#08080C]/80" />
                </div>

                {/* Central Movie Info */}
                <div className="max-w-4xl mx-auto space-y-6 pt-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FCFC65]/40 bg-[#FCFC65]/10 text-[#FCFC65] text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={14} />
                    <span>Phim Nổi Bật · Suất Chiếu Hôm Nay</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-2xl">
                    {movie.title}
                  </h1>

                  {/* Badges: Duration, Genre, Formats */}
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-[#BCBCC8]">
                    <span className="px-2.5 py-1 bg-[#181824] border border-[#2E2E3E] rounded-md font-semibold text-white">
                      {movie.durationMinutes} phút
                    </span>
                    <span className="px-2.5 py-1 bg-[#181824] border border-[#2E2E3E] rounded-md font-semibold text-[#FCFC65]">
                      {movie.genre}
                    </span>
                    <span className="px-2.5 py-1 bg-[#181824] border border-[#2E2E3E] rounded-md font-semibold text-[#74CFCF]">
                      2D · IMAX · 3D
                    </span>
                    <span className="px-2.5 py-1 bg-[#F59E0B]/20 border border-[#F59E0B]/40 rounded-md font-semibold text-[#FCD34D] flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      9.6
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-[#BCBCC8] max-w-2xl mx-auto font-normal line-clamp-3 leading-relaxed">
                    {movie.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <Link
                      to={`/movies/${movie.id}/showtimes`}
                      className="bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-sm px-8 py-3.5 rounded-full flex items-center gap-2 shadow-neon transition-all transform hover:scale-105 active:scale-95"
                    >
                      <span>Đặt vé ngay</span>
                      <ArrowRight size={16} />
                    </Link>

                    <Link
                      to={`/movies/${movie.id}`}
                      className="bg-[#181822]/90 hover:bg-[#232330] border border-[#353545] text-white font-medium text-sm px-8 py-3.5 rounded-full transition-all hover:border-[#FCFC65]/50 flex items-center gap-2"
                    >
                      <span>Chi tiết phim</span>
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Left & Right Navigation Arrows */}
        {heroMovies.length > 1 && (
          <>
            <button
              onClick={handlePrevHero}
              aria-label="Previous movie"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#FCFC65] hover:text-black border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md shadow-2xl"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={handleNextHero}
              aria-label="Next movie"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#FCFC65] hover:text-black border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md shadow-2xl"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Dots & Statistics Strip at Bottom */}
        <div className="relative z-10 max-w-5xl mx-auto w-full px-4 pt-6 space-y-6">
          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2">
            {heroMovies.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentHeroIndex(i)}
                className={`transition-all duration-300 rounded-full ${
                  currentHeroIndex === i
                    ? 'w-8 h-2 bg-[#FCFC65] shadow-neon'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Statistics Strip */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-6 border-t border-white/10 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#FCFC65]">
                {movies.length > 0 ? `${movies.length} +` : '7 +'}
              </div>
              <div className="text-xs text-[#8E8E9E] mt-1">Phim Tại Rạp</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {cinemas.length > 0 ? `${cinemas.length}` : '3'}
              </div>
              <div className="text-xs text-[#8E8E9E] mt-1">Cụm Rạp Toàn Quốc</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#FCFC65]">40</div>
              <div className="text-xs text-[#8E8E9E] mt-1">Ghế / Khán Phòng</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SPECIAL OFFER STRIP */}
      <section className="border-y border-[#262633] bg-[#0E0E14] py-3.5 text-center text-xs sm:text-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-2 text-[#C4C4D2]">
          <Sparkles size={16} className="text-[#FCFC65]" />
          <span>
            Special Offer: <span className="font-semibold text-white">Buy 2 Tickets, Get 1 FREE!</span> Valid This Weekend Only.
          </span>
          <a href="#currently-in-cinemas" className="text-[#FCFC65] hover:underline font-semibold ml-2">
            Learn More
          </a>
        </div>
      </section>

      {/* Main Container for Catalog Sections */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-20">
        {/* 3. CURRENTLY IN CINEMAS */}
        <section id="currently-in-cinemas" className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Currently In Cinemas</h2>
              <p className="text-xs sm:text-sm text-[#8E8E9E] mt-1">
                Discover The Latest Movies Now Playing in Cinemas – Book Your Tickets Today!
              </p>
            </div>
            <Link
              to="/?status=NOW_SHOWING"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#8E8E9E] hover:text-[#FCFC65] transition-colors"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#161620] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {displayNowShowing.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* 4. TOP 10 MOVIES THIS WEEK */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Top 10 Movies This Week</h2>
              <p className="text-xs sm:text-sm text-[#8E8E9E] mt-1">
                Hot This Week: Top Movies And Where To Watch Them.
              </p>
            </div>
            <Link
              to="/?sort=top_rated"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#8E8E9E] hover:text-[#FCFC65] transition-colors"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {displayNowShowing.slice(0, 5).map((movie, index) => (
              <MovieCard key={`top-${movie.id}`} movie={movie} rank={index + 1} />
            ))}
          </div>
        </section>

        {/* 5. PROMO EVENT BANNERS: FESTIVALS & STUDENT DISCOUNT */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-white">
              Now Showing With Festivals, Screenings and Special Offers
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E9E]">
              Unique Film Events And Limited-Time Offers – Don't Miss What's Coming Next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Promo Card 1: Horror Film Festival */}
            <div className="relative rounded-3xl overflow-hidden border border-[#252535] bg-[#12121A] p-8 flex flex-col justify-between min-h-[260px] group">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&auto=format&fit=crop&q=80')`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C12] via-[#0C0C12]/80 to-transparent" />
              </div>

              <div className="relative z-10 space-y-2">
                <span className="inline-block px-3 py-1 rounded-full border border-[#FCFC65] text-[#FCFC65] text-[11px] font-bold uppercase tracking-wider">
                  Special Event
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Horror Film Festival</h3>
                <p className="text-xs text-[#9E9EB2]">Spine-Chilling Classics & Midnight Screenings</p>
              </div>

              <div className="relative z-10 pt-6">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs shadow-neon transition-all"
                >
                  <span>Learn More</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Promo Card 2: Student Discount */}
            <div className="relative rounded-3xl overflow-hidden border border-[#252535] bg-[#12121A] p-8 flex flex-col justify-between min-h-[260px] group">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80')`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C12] via-[#0C0C12]/80 to-transparent" />
              </div>

              <div className="relative z-10 space-y-2">
                <span className="inline-block px-3 py-1 rounded-full border border-[#FCFC65] text-[#FCFC65] text-[11px] font-bold uppercase tracking-wider">
                  Limit Time
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Student Discount</h3>
                <p className="text-xs text-[#9E9EB2]">
                  <strong className="text-[#FCFC65]">50% Off</strong> All Weekday Matinee Shows
                </p>
              </div>

              <div className="relative z-10 pt-6">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs shadow-neon transition-all"
                >
                  <span>Learn More</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6. COMING SOON */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Coming Soon</h2>
              <p className="text-xs sm:text-sm text-[#8E8E9E] mt-1">Get Ready For These Upcoming Releases</p>
            </div>
            <Link
              to="/?status=COMING_SOON"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#8E8E9E] hover:text-[#FCFC65] transition-colors"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {displayComingSoon.map((movie) => (
              <MovieCard key={`coming-${movie.id}`} movie={movie} />
            ))}
          </div>
        </section>

        {/* 6.5 REAL CINEMAS FROM DATABASE */}
        <section id="cinemas" className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Hệ Thống Cụm Rạp</h2>
              <p className="text-xs sm:text-sm text-[#8E8E9E] mt-1">Trải nghiệm điện ảnh đỉnh cao tại các cụm rạp hiện đại trên toàn quốc</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cinemas.map((cinema) => (
              <div
                key={cinema.id}
                className="bg-[#12121A] border border-[#20202E] rounded-3xl p-6 space-y-4 hover:border-[#FCFC65]/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold text-[#FCFC65] uppercase tracking-wider bg-[#FCFC65]/10 px-3 py-1 rounded-full border border-[#FCFC65]/30">
                    {cinema.city}
                  </span>
                  <span className="text-xs text-[#8E8E9E]">40 Ghế / Phòng</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#FCFC65] transition-colors">
                    {cinema.name}
                  </h3>
                  <p className="text-xs text-[#8E8E9E] mt-1 line-clamp-2">
                    {cinema.address}
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href="#currently-in-cinemas"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#FCFC65] transition-colors"
                  >
                    <span>Xem suất chiếu tại rạp này</span>
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. CINEMA EXPERIENCE FEATURE BANNER */}
        <section className="relative rounded-3xl overflow-hidden border border-[#232330] bg-[#121218] p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Photo: Popcorn & 3D glasses girl */}
            <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-[#1A1A24] border border-[#2E2E3E]">
              <img
                src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80"
                alt="Cinema popcorn experience"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Text */}
            <div className="space-y-5">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Book Tickets To Your <br />
                Favorite Movies Online
              </h3>
              <p className="text-xs sm:text-sm text-[#8E8E9E] leading-relaxed">
                Get A Sneak Peek At The Most Popular Current Movie Trailers And Be The First To Know About The Hottest Upcoming Releases. Enjoy seamless mobile check-ins and concession ordering.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#currently-in-cinemas"
                  className="bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-neon transition"
                >
                  Book Movie Ticket
                </a>
                <a
                  href="#about"
                  className="bg-transparent hover:bg-white/5 border border-[#353545] text-white font-medium text-xs sm:text-sm px-6 py-3 rounded-xl transition"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 8. PARTNER LOGOS */}
        <section className="py-6 border-y border-[#1A1A24]">
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all text-xs font-black tracking-widest text-[#8E8E9E]">
            <span className="text-red-500 font-black text-xl tracking-tight">NETFLIX</span>
            <span className="text-cyan-400 font-bold text-lg">showmax</span>
            <span className="text-blue-400 font-bold text-xl">Disney+</span>
            <span className="text-amber-400 font-black text-xl">IMDb</span>
            <span className="text-red-500 font-bold text-lg">Rotten Tomatoes</span>
            <span className="text-blue-300 font-semibold text-lg">prime video</span>
          </div>
        </section>

        {/* 9. MOBILE APP SHOWCASE */}
        <section className="relative rounded-3xl border border-[#232330] bg-gradient-to-r from-[#121219] to-[#0A0A0F] p-8 sm:p-14 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Phone Mockup Graphic */}
            <div className="flex justify-center">
              <div className="relative w-64 h-[440px] bg-[#0E0E14] border-4 border-[#2E2E3E] rounded-[40px] shadow-2xl p-4 flex flex-col justify-between overflow-hidden">
                {/* Notch */}
                <div className="w-24 h-4 bg-[#20202E] mx-auto rounded-b-xl" />

                {/* Screen content mockup */}
                <div className="my-auto text-center space-y-4 px-2">
                  <div className="inline-block p-3 rounded-2xl bg-[#FCFC65]/10 border border-[#FCFC65]/30">
                    <Smartphone size={32} className="text-[#FCFC65] mx-auto" />
                  </div>
                  <div className="font-bold text-white text-base">Ticketor Mobile</div>
                  <p className="text-[11px] text-[#8E8E9E]">
                    Scan QR codes at turnstiles, choose recliners, and preorder food in seconds.
                  </p>
                  <div className="w-full py-2 bg-[#FCFC65] text-[#08080C] font-bold text-xs rounded-xl shadow-neon">
                    Quick Booking
                  </div>
                </div>

                {/* Bottom line */}
                <div className="w-20 h-1 bg-[#333344] mx-auto rounded-full" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Enjoy Ticketor Mobile <br />
                App Experience
              </h3>
              <p className="text-xs sm:text-sm text-[#8E8E9E] leading-relaxed">
                Watch trailers on the go, receive notifications when advance tickets go live for midnight premieres, and download tickets directly to your Apple Wallet or Google Pay.
              </p>

              {/* Store Badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black border border-[#353545] hover:border-white transition-colors text-left">
                  <span className="text-2xl"></span>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">Download on the</div>
                    <div className="text-xs font-bold text-white">App Store</div>
                  </div>
                </button>

                <button className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black border border-[#353545] hover:border-white transition-colors text-left">
                  <span className="text-xl">▶</span>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">GET IT ON</div>
                    <div className="text-xs font-bold text-white">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 10. HAPPY CUSTOMERS (TESTIMONIALS) */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              Happy Customers
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E9E]">
              Hear What Our Satisfied Moviegoers Have To Say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-[#12121A] border border-[#232332] rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-[#FCFC65]/40 transition-colors"
              >
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-[#FCFC65]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xs text-[#C8C8D6] leading-relaxed">
                  "{t.text}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#1C1C26]">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-9 h-9 rounded-full object-cover border border-[#353545]"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{t.author}</div>
                    <div className="text-[11px] text-[#8E8E9E]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 11. FAQ ACCORDION */}
        <section className="space-y-8 max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E9E]">
              Find Answers To Their Most Common Questions Quickly And Easily.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[#12121A] border border-[#232332] rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white hover:text-[#FCFC65] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="p-1 rounded-full bg-[#1C1C26] text-[#8E8E9E]">
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#A0A0B2] leading-relaxed border-t border-[#1C1C26] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4 space-y-3">
            <p className="text-xs text-[#8E8E9E]">Still Have A Question? Please contact us</p>
            <button className="bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs px-6 py-2.5 rounded-full shadow-neon transition">
              Contact Us
            </button>
          </div>
        </section>

        {/* 12. NEWSLETTER SUBSCRIPTION */}
        <section className="relative rounded-3xl border border-[#262633] bg-[#0E0E14] p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-5">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready To Watch & Book Movies?
          </h3>
          <p className="text-xs sm:text-sm text-[#8E8E9E] max-w-md mx-auto">
            Subscribe to our newsletter. Enter your email to create or restart your membership.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-sm text-[#FCFC65] font-semibold py-3">
              <CheckCircle size={18} />
              <span>Thank you for subscribing! Check your inbox soon.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email"
                className="w-full sm:flex-1 bg-[#181822] border border-[#353545] rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-[#606070] focus:outline-none focus:border-[#FCFC65]"
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-neon transition"
              >
                Sign Up
              </button>
            </form>
          )}

          <p className="text-[11px] text-[#555566]">
            By clicking Sign Up you're confirming that you agree with our Terms and Conditions.
          </p>
        </section>
      </div>
    </div>
  );
};
