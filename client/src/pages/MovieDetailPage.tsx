import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Ticket, Play, X, ExternalLink, ChevronLeft } from 'lucide-react';
import type { Movie } from '../types';
import { api } from '../api/client';

export const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState<'ALL' | 'POSITIVE' | 'AVERAGE' | 'NEGATIVE'>('ALL');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.getMovieById(id)
      .then((res) => {
        if (res.success && res.data) {
          setMovie(res.data);
        }
      })
      .catch((err) => console.error('Failed to load movie details:', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 animate-pulse space-y-8">
        <div className="h-12 bg-[#161622] rounded-xl w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
          <div className="bg-[#161622] rounded-3xl" />
          <div className="bg-[#161622] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Movie not found</h2>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FCFC65] text-[#08080C] font-bold rounded-xl text-xs"
        >
          <ChevronLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  // Movie metadata mapping matching actual database films
  const movieMetaMap: Record<string, {
    director: string;
    writers: string;
    sceneImage: string;
    trailerYoutubeId: string;
    cast: Array<{ name: string; character: string; image: string }>;
    reviews: Array<{ score: string; sentiment: 'POSITIVE' | 'AVERAGE' | 'NEGATIVE'; author: string; date: string; text: string }>;
  }> = {
    'Dune: Hành Tinh Cát - Phần Hai': {
      director: 'Denis Villeneuve',
      writers: 'Denis Villeneuve · Jon Spaihts · Frank Herbert',
      sceneImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80',
      trailerYoutubeId: 'Way9Dexny3w',
      cast: [
        { name: 'Timothée Chalamet', character: 'Paul Atreides', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
        { name: 'Zendaya', character: 'Chani', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
        { name: 'Rebecca Ferguson', character: 'Lady Jessica', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
        { name: 'Javier Bardem', character: 'Stilgar', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
        { name: 'Austin Butler', character: 'Feyd-Rautha', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
      ],
      reviews: [
        { score: '9.8', sentiment: 'POSITIVE', author: 'Minh Tuấn', date: '25/03/2026', text: 'Một kiệt tác điện ảnh sci-fi thực sự! Kỹ xảo choáng ngợp, âm thanh Hans Zimmer rung chuyển cả rạp IMAX, cốt truyện Paul Atreides đầy chiều sâu và bi tráng.' },
        { score: '9.4', sentiment: 'POSITIVE', author: 'Lan Phương', date: '28/03/2026', text: 'Phần 2 vượt trội hơn phần 1 về mọi mặt. Các cảnh cưỡi sâu cát và trận đánh Arrakis quá mãn nhãn.' },
        { score: '7.5', sentiment: 'AVERAGE', author: 'Hoàng Nam', date: '01/04/2026', text: 'Phim dài gần 3 tiếng với nhịp điệu chính trị và tôn giáo phức tạp, cần theo dõi kỹ để hiểu hết các gia tộc.' },
        { score: '9.0', sentiment: 'POSITIVE', author: 'Thanh Hằng', date: '05/04/2026', text: 'Diễn xuất của Timothée Chalamet và Austin Butler quá ấn tượng. Xem đi xem lại trên rạp vẫn thấy đỉnh cao.' },
      ],
    },
    'Godzilla x Kong: Đế Chế Mới': {
      director: 'Adam Wingard',
      writers: 'Terry Rossio · Simon Barrett',
      sceneImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      trailerYoutubeId: 'lV1OOlGwExg',
      cast: [
        { name: 'Rebecca Hall', character: 'Dr. Ilene Andrews', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
        { name: 'Brian Tyree Henry', character: 'Bernie Hayes', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
        { name: 'Dan Stevens', character: 'Trapper', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
        { name: 'Kaylee Hottle', character: 'Jia', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
      ],
      reviews: [
        { score: '8.8', sentiment: 'POSITIVE', author: 'Quốc Bảo', date: '10/04/2026', text: 'Trận chiến giữa các Titan ở Trái Đất Rỗng cực kỳ mãn nhãn. Kong dùng găng tay BEAST và Godzilla năng lượng hồng đánh nhau tưng bừng!' },
        { score: '7.0', sentiment: 'AVERAGE', author: 'Văn Khoa', date: '12/04/2026', text: 'Phim mang tính giải trí cao, hành động liên tục, phù hợp đi xem cùng bạn bè cuối tuần.' },
      ],
    },
    'Kung Fu Panda 4': {
      director: 'Mike Mitchell',
      writers: 'Jonathan Aibel · Glenn Berger',
      sceneImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80',
      trailerYoutubeId: '_inKs4eeHiI',
      cast: [
        { name: 'Jack Black', character: 'Po (Lồng tiếng)', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
        { name: 'Awkwafina', character: 'Zhen (Lồng tiếng)', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
        { name: 'Viola Davis', character: 'Tắc Kè Biến Hình', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
        { name: 'Dustin Hoffman', character: 'Sư Phụ Shifu', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
      ],
      reviews: [
        { score: '8.5', sentiment: 'POSITIVE', author: 'Thu Trang', date: '15/04/2026', text: 'Chú gấu Po vẫn hài hước và dễ thương như ngày nào. Đồ họa đẹp mắt và các pha võ thuật kung fu rất vui nhộn.' },
        { score: '8.0', sentiment: 'POSITIVE', author: 'Bảo Anh', date: '18/04/2026', text: 'Gia đình mình dẫn các bé đi xem, cả rạp cười sảng khoái. Một bộ phim hoạt hình trọn vẹn cảm xúc.' },
      ],
    },
    'Oppenheimer': {
      director: 'Christopher Nolan',
      writers: 'Christopher Nolan · Kai Bird · Martin J. Sherwin',
      sceneImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      trailerYoutubeId: 'uYPbbksJxIg',
      cast: [
        { name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
        { name: 'Emily Blunt', character: 'Katherine Oppenheimer', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
        { name: 'Matt Damon', character: 'Leslie Groves', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
        { name: 'Robert Downey Jr.', character: 'Lewis Strauss', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
      ],
      reviews: [
        { score: '9.9', sentiment: 'POSITIVE', author: 'Đức Huy', date: '02/05/2026', text: 'Nghệ thuật điện ảnh đỉnh cao của Christopher Nolan. Sự tĩnh lặng trong khoảnh khắc thử nghiệm Trinity khiến cả khán phòng nín thở.' },
        { score: '9.5', sentiment: 'POSITIVE', author: 'Kim Oanh', date: '04/05/2026', text: 'Cillian Murphy diễn xuất bằng ánh mắt quá xuất thần. Âm nhạc Ludwig Göransson và kỹ thuật dựng phim xứng đáng đạt mọi giải thưởng.' },
      ],
    },
  };

  const currentMeta = movieMetaMap[movie.title] || {
    director: 'Đạo diễn danh tiếng',
    writers: 'Kịch bản chuyển thể xuất sắc',
    sceneImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    trailerYoutubeId: '',
    cast: [
      { name: 'Diễn viên chính 1', character: 'Nhân vật chính', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
      { name: 'Diễn viên chính 2', character: 'Nhân vật đồng hành', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
      { name: 'Diễn viên phụ 1', character: 'Nhân vật phản diện', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
      { name: 'Diễn viên phụ 2', character: 'Cố vấn đặc biệt', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
    ],
    reviews: [
      { score: '9.0', sentiment: 'POSITIVE' as const, author: 'Khán giả rạp', date: 'Gần đây', text: `Bộ phim ${movie.title} mang lại trải nghiệm mãn nhãn, kỹ xảo xuất sắc và câu chuyện giàu cảm xúc.` },
      { score: '7.5', sentiment: 'AVERAGE' as const, author: 'Reviewer phim', date: 'Gần đây', text: 'Một tác phẩm giải trí chỉn chu, diễn xuất đồng đều và hiệu ứng âm thanh sống động tại rạp.' },
    ],
  };

  const castList = currentMeta.cast;
  const reviews = currentMeta.reviews;

  const filteredReviews = reviews.filter((r) => {
    if (activeReviewTab === 'ALL') return true;
    return r.sentiment === activeReviewTab;
  });

  return (
    <div className="w-full text-[#F1F1F4] pb-20">
      {/* Top Header Title */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
          {movie.title}
        </h1>
      </div>

      {/* Main Dual Media Grid (Poster on left, Scene/Trailer on right) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Media Card: Movie Poster */}
          <div className="md:col-span-4 rounded-3xl overflow-hidden bg-[#161622] border border-[#252535] shadow-2xl aspect-[3/4] relative group">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080C]/80 via-transparent to-transparent opacity-60" />
          </div>

          {/* Right Media Card: Trailer / Scene Preview with Center Play Button */}
          <div
            onClick={() => setIsTrailerOpen(true)}
            className="md:col-span-8 rounded-3xl overflow-hidden bg-[#161622] border border-[#252535] shadow-2xl aspect-video relative cursor-pointer group"
          >
            {/* Background Image filling the card */}
            <img
              src={currentMeta.sceneImage}
              alt="Movie scene preview"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-85"
            />
            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 group-hover:from-black/60 transition-colors" />

            {/* Exactly Centered Play Button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:bg-[#FCFC65] group-hover:text-black group-hover:border-[#FCFC65] transition-all duration-300">
                <Play size={28} fill="currentColor" className="translate-x-0.5" />
              </div>
            </div>

            {/* Bottom-left Badge */}
            <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-white/20 flex items-center gap-2">
                <Play size={12} fill="currentColor" />
                <span>Xem Trailer</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-10 border-b border-[#20202E]">
          {/* Left: Summary text, Director, Writers */}
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-bold text-white">Nội dung phim</h2>
            <p className="text-xs sm:text-sm text-[#A8A8BA] leading-relaxed max-w-3xl">
              {movie.description}
            </p>

            <div className="flex flex-wrap gap-8 pt-3 text-xs">
              <div>
                <span className="block text-[#6E6E82] text-[11px] uppercase">Đạo diễn</span>
                <span className="font-semibold text-white">{currentMeta.director}</span>
              </div>
              <div>
                <span className="block text-[#6E6E82] text-[11px] uppercase">Biên kịch</span>
                <span className="font-semibold text-white">{currentMeta.writers}</span>
              </div>
              <div>
                <span className="block text-[#6E6E82] text-[11px] uppercase">Thời lượng</span>
                <span className="font-semibold text-white">{movie.durationMinutes} Phút</span>
              </div>
              <div>
                <span className="block text-[#6E6E82] text-[11px] uppercase">Thể loại</span>
                <span className="font-semibold text-[#FCFC65]">{movie.genre}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions (Get Ticket & Add to Favorites) */}
          <div className="flex flex-col gap-3 shrink-0 sm:w-56">
            <button
              onClick={() => navigate(`/movies/${movie.id}/showtimes`)}
              className="w-full py-3.5 px-6 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-sm flex items-center justify-center gap-2 shadow-neon transition transform hover:scale-105 active:scale-95"
            >
              <Ticket size={18} />
              <span>Get Ticket</span>
            </button>

            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-full py-3 px-6 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                isFavorite
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-[#14141E] border-[#2E2E3E] text-white hover:border-white/30'
              }`}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              <span>{isFavorite ? 'In Favorites' : 'Add to Favorites'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 pb-10 border-b border-[#20202E]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Cast</h2>
          <button className="text-xs font-semibold text-[#8E8E9E] hover:text-[#FCFC65] transition-colors">
            View All &gt;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {castList.map((actor, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#12121A] border border-[#20202E]">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[#2E2E3E]">
                <img src={actor.image} alt={actor.name} className="w-full h-full object-cover" />
              </div>
              <div className="font-bold text-xs text-white truncate w-full">{actor.name}</div>
              <div className="text-[11px] text-[#8E8E9E] truncate w-full">{actor.character}</div>
            </div>
          ))}
        </div>
      </div>

      {/* User Reviews Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">User Reviews</h2>
          <button className="text-xs font-semibold text-[#8E8E9E] hover:text-[#FCFC65] transition-colors">
            View All &gt;
          </button>
        </div>

        {/* Rating Breakdown Block (Ticketor Figma style) */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-[#12121A] border border-[#20202E] rounded-3xl p-6 sm:p-8">
          {/* User Score Box */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FCFC65] flex items-center justify-center font-black text-2xl sm:text-3xl text-[#08080C] shadow-neon">
              7.5
            </div>
            <div>
              <div className="text-xs text-[#8E8E9E]">User Score</div>
              <div className="text-base sm:text-lg font-bold text-white">Generally Favorable</div>
            </div>
          </div>

          {/* Sentiment Distribution Bars */}
          <div className="flex-1 w-full space-y-2.5 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-16 text-[#A0A0B2] text-right">Positive</span>
              <div className="flex-1 h-2 rounded-full bg-[#1A1A24] overflow-hidden">
                <div className="h-full bg-[#74CFCF] rounded-full" style={{ width: '73%' }} />
              </div>
              <span className="w-24 text-[11px] text-[#8E8E9E]">125 Ratings (73%)</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-16 text-[#A0A0B2] text-right">Average</span>
              <div className="flex-1 h-2 rounded-full bg-[#1A1A24] overflow-hidden">
                <div className="h-full bg-[#FCFC65] rounded-full" style={{ width: '15%' }} />
              </div>
              <span className="w-24 text-[11px] text-[#8E8E9E]">27 Ratings (15%)</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-16 text-[#A0A0B2] text-right">Negative</span>
              <div className="flex-1 h-2 rounded-full bg-[#1A1A24] overflow-hidden">
                <div className="h-full bg-[#FF5E5E] rounded-full" style={{ width: '7%' }} />
              </div>
              <span className="w-24 text-[11px] text-[#8E8E9E]">16 Ratings (7%)</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#20202E] pb-3 text-xs">
          {(['ALL', 'POSITIVE', 'AVERAGE', 'NEGATIVE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveReviewTab(tab)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeReviewTab === tab
                  ? 'bg-white text-black font-semibold'
                  : 'text-[#8E8E9E] hover:text-white hover:bg-[#1A1A24]'
              }`}
            >
              {tab === 'ALL'
                ? 'All Reviews'
                : tab === 'POSITIVE'
                ? 'Positive Reviews'
                : tab === 'AVERAGE'
                ? 'Average Reviews'
                : 'Negative Reviews'}
            </button>
          ))}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#12121A] border border-[#20202E] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        Number(rev.score) >= 8
                          ? 'bg-[#74CFCF]/20 text-[#74CFCF] border border-[#74CFCF]/40'
                          : Number(rev.score) >= 5
                          ? 'bg-[#FCFC65]/20 text-[#FCFC65] border border-[#FCFC65]/40'
                          : 'bg-[#FF5E5E]/20 text-[#FF5E5E] border border-[#FF5E5E]/40'
                      }`}
                    >
                      {rev.score}
                    </span>
                    <span className="font-semibold text-white text-xs">{rev.author}</span>
                  </div>
                  <span className="text-[11px] text-[#707080]">{rev.date}</span>
                </div>

                <p className="text-xs text-[#BCBCC8] leading-relaxed line-clamp-3">
                  {rev.text}
                </p>
              </div>

              <div className="pt-2 text-right">
                <button className="text-[11px] text-[#8E8E9E] hover:text-white inline-flex items-center gap-1 font-medium">
                  <span>Full Review</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load more button */}
        <div className="text-center pt-4">
          <button className="px-6 py-2.5 rounded-full border border-[#2E2E3E] text-xs font-semibold text-[#A0A0B2] hover:text-white hover:border-white transition-colors">
            119 more reviews
          </button>
        </div>
      </div>

      {/* Trailer Modal */}
      {isTrailerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden border border-[#303040] shadow-2xl">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            >
              <X size={18} />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={
                  currentMeta.trailerYoutubeId
                    ? `https://www.youtube-nocookie.com/embed/${currentMeta.trailerYoutubeId}?autoplay=1&rel=0`
                    : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
                        movie.title + ' official trailer'
                      )}&autoplay=1`
                }
                title={`${movie.title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
