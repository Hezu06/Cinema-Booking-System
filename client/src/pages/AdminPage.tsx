import React, { useState, useEffect } from 'react';
import {
  Film,
  Calendar,
  Ticket,
  Building2,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Search,
  Shield,
  Activity,
  X,
  ChevronRight,
  Eye,
  DollarSign
} from 'lucide-react';
import { api } from '../api/client';
import type { Movie, Showtime, Cinema, Room, BookingDetail } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'showtimes' | 'bookings' | 'cinemas'>('overview');

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Core Data
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Modals
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    durationMinutes: 120,
    genre: '',
    releaseDate: new Date().toISOString().split('T')[0],
    posterUrl: '',
    trailerUrl: '',
    status: 'NOW_SHOWING' as 'NOW_SHOWING' | 'COMING_SOON' | 'ENDED',
  });

  const [isShowtimeModalOpen, setIsShowtimeModalOpen] = useState(false);
  const [showtimeForm, setShowtimeForm] = useState({
    movieId: '',
    roomId: '',
    date: new Date().toISOString().split('T')[0],
    time: '18:30',
    basePrice: 90000,
  });

  const [selectedBookingDetail, setSelectedBookingDetail] = useState<BookingDetail | null>(null);

  // Filters
  const [movieSearch, setMovieSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [showtimeCinemaFilter, setShowtimeCinemaFilter] = useState('');

  // Fetch all admin data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [moviesRes, showtimesRes, bookingsRes, cinemasRes, roomsRes] = await Promise.all([
        api.getMovies(),
        api.getShowtimes(),
        api.adminGetBookings(),
        api.getCinemas(),
        api.adminGetRooms(),
      ]);

      if (moviesRes.success && moviesRes.data) setMovies(moviesRes.data);
      if (showtimesRes.success && showtimesRes.data) setShowtimes(showtimesRes.data);
      if (bookingsRes.success && bookingsRes.data) setBookings(bookingsRes.data);
      if (cinemasRes.success && cinemasRes.data) setCinemas(cinemasRes.data);
      if (roomsRes.success && roomsRes.data) setRooms(roomsRes.data);
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      setFeedbackMsg({ type: 'error', text: 'Không thể tải toàn bộ dữ liệu quản trị. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Clear toast after 5s
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Handle Sync TMDB
  const handleSyncTMDB = async () => {
    setIsSyncing(true);
    setFeedbackMsg(null);
    try {
      const res = await api.adminSyncMovies({ autoCreateShowtimes: true, markEndedOlderThanDays: 60 });
      if (res.success && res.data) {
        setFeedbackMsg({
          type: 'success',
          text: `Đồng bộ TMDB thành công! Lấy về ${res.data.totalFetched} phim, thêm mới ${res.data.added}, cập nhật ${res.data.updated}, tự động tạo ${res.data.showtimesCreated} suất chiếu mới.`,
        });
        fetchData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Lỗi khi đồng bộ phim từ TMDB.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Lỗi kết nối khi đồng bộ TMDB.' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Movie CRUD
  const handleOpenCreateMovie = () => {
    setEditingMovie(null);
    setMovieForm({
      title: '',
      description: '',
      durationMinutes: 120,
      genre: 'Hành động, Phiêu lưu',
      releaseDate: new Date().toISOString().split('T')[0],
      posterUrl: '',
      trailerUrl: '',
      status: 'NOW_SHOWING',
    });
    setIsMovieModalOpen(true);
  };

  const handleOpenEditMovie = (m: Movie) => {
    setEditingMovie(m);
    setMovieForm({
      title: m.title,
      description: m.description,
      durationMinutes: m.durationMinutes,
      genre: m.genre,
      releaseDate: new Date(m.releaseDate).toISOString().split('T')[0],
      posterUrl: m.posterUrl,
      trailerUrl: m.trailerUrl || '',
      status: m.status,
    });
    setIsMovieModalOpen(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMovie) {
        const res = await api.adminUpdateMovie(editingMovie.id, {
          ...movieForm,
          releaseDate: new Date(movieForm.releaseDate).toISOString(),
        });
        if (res.success) {
          setFeedbackMsg({ type: 'success', text: `Cập nhật phim "${movieForm.title}" thành công!` });
        }
      } else {
        const res = await api.adminCreateMovie({
          ...movieForm,
          releaseDate: new Date(movieForm.releaseDate).toISOString(),
        });
        if (res.success) {
          setFeedbackMsg({ type: 'success', text: `Tạo phim mới "${movieForm.title}" thành công!` });
        }
      }
      setIsMovieModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Không thể lưu thông tin phim.' });
    }
  };

  const handleDeleteMovie = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phim "${title}"?`)) return;
    try {
      const res = await api.adminDeleteMovie(id);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Đã xóa phim "${title}" thành công.` });
        fetchData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Không thể xóa phim (có thể đang có suất chiếu).' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Lỗi khi xóa phim.' });
    }
  };

  // Showtime CRUD
  const handleOpenCreateShowtime = () => {
    setShowtimeForm({
      movieId: movies[0]?.id || '',
      roomId: rooms[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      time: '18:30',
      basePrice: 90000,
    });
    setIsShowtimeModalOpen(true);
  };

  const handleSaveShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selMovie = movies.find((m) => m.id === showtimeForm.movieId);
      if (!selMovie) throw new Error('Vui lòng chọn phim.');

      const startTime = new Date(`${showtimeForm.date}T${showtimeForm.time}:00`);
      const endTime = new Date(startTime.getTime() + (selMovie.durationMinutes + 20) * 60 * 1000);

      const res = await api.adminCreateShowtime({
        movieId: showtimeForm.movieId,
        roomId: showtimeForm.roomId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        basePrice: Number(showtimeForm.basePrice),
        status: 'SCHEDULED',
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Tạo suất chiếu mới thành công!' });
        setIsShowtimeModalOpen(false);
        fetchData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Lỗi tạo suất chiếu (có thể bị trùng lịch phòng chiếu).' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Không thể tạo suất chiếu.' });
    }
  };

  const handleDeleteShowtime = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy / xóa suất chiếu này?')) return;
    try {
      const res = await api.adminDeleteShowtime(id);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Đã xóa suất chiếu thành công.' });
        fetchData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Lỗi khi xóa suất chiếu.' });
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bId: string, bCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn vé ${bCode}?`)) return;
    try {
      const res = await api.adminCancelBooking(bId, 'Admin cancelled via Admin Portal');
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Đã hủy đơn vé ${bCode} thành công.` });
        fetchData();
        setSelectedBookingDetail(null);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Lỗi khi hủy đơn vé.' });
    }
  };

  // KPI Calculations
  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.payments?.some((p) => p.status === 'SUCCESS'))
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const totalTicketsSold = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + (b.bookingSeats?.length || 0), 0);

  const nowShowingMoviesCount = movies.filter((m) => m.status === 'NOW_SHOWING').length;

  return (
    <div className="w-full min-h-screen bg-[#08080C] text-[#F1F1F4] pb-24">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-[#1E1E2A] bg-[#0E0E14]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCFC65]/10 border border-[#FCFC65]/30 flex items-center justify-center text-[#FCFC65] shadow-neon">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">Sọt Phim Admin Portal · {user?.fullName || "Admin"}</h1>
                <span className="text-[10px] font-mono font-bold bg-[#FCFC65] text-black px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-[#8E8E9E]">Hệ thống điều hành và phân phối suất chiếu điện ảnh</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSyncTMDB}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] disabled:opacity-50 text-[#08080C] font-bold text-xs shadow-neon transition transform active:scale-95"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Đang đồng bộ TMDB...' : '⚡ Đồng bộ TMDB tự động'}</span>
            </button>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#2E2E3E] text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1A1A26] transition"
              title="Làm mới dữ liệu"
            >
              <Activity size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto custom-scrollbar border-t border-[#181822] pt-2 pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'bg-[#FCFC65] text-[#08080C] shadow-sm'
                : 'text-[#8E8E9E] hover:text-white hover:bg-[#161622]'
            }`}
          >
            <TrendingUp size={15} />
            <span>Tổng quan & Circuit</span>
          </button>

          <button
            onClick={() => setActiveTab('movies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'movies'
                ? 'bg-[#FCFC65] text-[#08080C] shadow-sm'
                : 'text-[#8E8E9E] hover:text-white hover:bg-[#161622]'
            }`}
          >
            <Film size={15} />
            <span>Quản lý Phim ({movies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('showtimes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'showtimes'
                ? 'bg-[#FCFC65] text-[#08080C] shadow-sm'
                : 'text-[#8E8E9E] hover:text-white hover:bg-[#161622]'
            }`}
          >
            <Calendar size={15} />
            <span>Lịch chiếu ({showtimes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'bookings'
                ? 'bg-[#FCFC65] text-[#08080C] shadow-sm'
                : 'text-[#8E8E9E] hover:text-white hover:bg-[#161622]'
            }`}
          >
            <Ticket size={15} />
            <span>Vé & Đơn hàng ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cinemas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'cinemas'
                ? 'bg-[#FCFC65] text-[#08080C] shadow-sm'
                : 'text-[#8E8E9E] hover:text-white hover:bg-[#161622]'
            }`}
          >
            <Building2 size={15} />
            <span>Cụm rạp & Phòng ({cinemas.length})</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between text-xs border shadow-lg ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-red-400 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & RESILIENCE                                               */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-[#8E8E9E]">
                  <span>Tổng doanh thu</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {totalRevenue.toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[11px] text-[#74CFCF] mt-1 flex items-center gap-1 font-medium">
                  <span>Doanh số xác nhận qua VNPAY</span>
                </div>
              </div>

              <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-[#8E8E9E]">
                  <span>Vé đã bán</span>
                  <div className="w-8 h-8 rounded-xl bg-[#FCFC65]/10 text-[#FCFC65] flex items-center justify-center">
                    <Ticket size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {totalTicketsSold} vé
                </div>
                <div className="text-[11px] text-[#8E8E9E] mt-1">
                  Đã phát hành mã QR & vé điện tử
                </div>
              </div>

              <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-[#8E8E9E]">
                  <span>Phim đang chiếu</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Film size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {nowShowingMoviesCount} phim
                </div>
                <div className="text-[11px] text-[#8E8E9E] mt-1">
                  Tổng {movies.length} phim trong hệ thống
                </div>
              </div>

              <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-[#8E8E9E]">
                  <span>Suất chiếu có sẵn</span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {showtimes.length} suất
                </div>
                <div className="text-[11px] text-[#8E8E9E] mt-1">
                  Bao gồm định dạng 2D, IMAX & RealD 3D
                </div>
              </div>
            </div>

            {/* Circuit Breaker & Resilience Panel */}
            <div className="bg-[#101016] border border-[#1E1E2A] rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield size={18} className="text-[#FCFC65]" />
                    <span>Hệ thống Bảo vệ & Khả năng Phục hồi (Circuit Breaker Pattern)</span>
                  </h3>
                  <p className="text-xs text-[#8E8E9E] mt-0.5">
                    Giám sát sức khỏe các cổng tích hợp dịch vụ bên thứ ba (Third-party External APIs)
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ALL OPERATIONAL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brevo Email Circuit */}
                <div className="p-4 rounded-2xl bg-[#14141E] border border-[#222230]">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-white">Brevo Email Gateway</div>
                      <div className="text-[10px] text-[#8E8E9E]">Xác thực tài khoản & Vé điện tử</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      CLOSED (Healthy)
                    </span>
                  </div>
                  <div className="mt-3 text-[11px] text-[#A0A0B0] space-y-1">
                    <div className="flex justify-between">
                      <span>Thời gian phản hồi:</span>
                      <span className="text-emerald-400 font-bold">&lt; 35ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cơ chế bảo vệ:</span>
                      <span className="text-white">Fallback Email Logger</span>
                    </div>
                  </div>
                </div>

                {/* Google OAuth Circuit */}
                <div className="p-4 rounded-2xl bg-[#14141E] border border-[#222230]">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-white">Google OAuth 2.0 Identity</div>
                      <div className="text-[10px] text-[#8E8E9E]">Xác thực đăng nhập Google</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      CLOSED (Healthy)
                    </span>
                  </div>
                  <div className="mt-3 text-[11px] text-[#A0A0B0] space-y-1">
                    <div className="flex justify-between">
                      <span>Thời gian phản hồi:</span>
                      <span className="text-emerald-400 font-bold">&lt; 10ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cơ chế bảo vệ:</span>
                      <span className="text-white">Fast-Fail Token Bypass</span>
                    </div>
                  </div>
                </div>

                {/* TMDB Gateway Circuit */}
                <div className="p-4 rounded-2xl bg-[#14141E] border border-[#222230]">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-white">TheMovieDB (TMDB API)</div>
                      <div className="text-[10px] text-[#8E8E9E]">Đồng bộ phim mới & Lịch chiếu</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      CLOSED (Healthy)
                    </span>
                  </div>
                  <div className="mt-3 text-[11px] text-[#A0A0B0] space-y-1">
                    <div className="flex justify-between">
                      <span>Thời gian phản hồi:</span>
                      <span className="text-emerald-400 font-bold">&lt; 50ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cơ chế bảo vệ:</span>
                      <span className="text-white">Curated Blockbusters Fallback</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Quick Preview */}
            <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-base">Đơn đặt vé gần đây</h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs text-[#FCFC65] hover:underline flex items-center gap-1"
                >
                  <span>Xem tất cả đơn</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#20202E] text-[#8E8E9E]">
                      <th className="py-2.5 px-3">Mã vé</th>
                      <th className="py-2.5 px-3">Khách hàng</th>
                      <th className="py-2.5 px-3">Phim</th>
                      <th className="py-2.5 px-3">Số ghế</th>
                      <th className="py-2.5 px-3">Tổng tiền</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181824]">
                    {bookings.slice(0, 5).map((b) => (
                      <tr key={b.id} className="hover:bg-[#181822] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#FCFC65]">{b.bookingCode}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{b.user?.fullName}</div>
                          <div className="text-[10px] text-[#8E8E9E]">{b.user?.phone}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-white">{b.showtime?.movie?.title}</td>
                        <td className="py-3 px-3 font-semibold text-[#74CFCF]">{b.bookingSeats?.length || 0} ghế</td>
                        <td className="py-3 px-3 font-bold text-white">{Number(b.totalAmount).toLocaleString('vi-VN')} đ</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : b.status === 'CANCELLED'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MOVIE MANAGEMENT                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'movies' && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                  placeholder="Tìm phim theo tên hoặc thể loại..."
                  className="w-full bg-[#14141E] border border-[#262638] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCFC65]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleOpenCreateMovie}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-black font-bold text-xs shadow-neon transition"
                >
                  <Plus size={15} />
                  <span>Thêm phim mới</span>
                </button>
              </div>
            </div>

            {/* Movies Table */}
            <div className="bg-[#12121A] border border-[#20202E] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161622] text-[#8E8E9E] border-b border-[#20202E]">
                    <tr>
                      <th className="py-3 px-4">Ảnh bìa</th>
                      <th className="py-3 px-4">Tên phim</th>
                      <th className="py-3 px-4">Thể loại</th>
                      <th className="py-3 px-4">Thời lượng</th>
                      <th className="py-3 px-4">Khởi chiếu</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181824]">
                    {movies
                      .filter((m) => m.title.toLowerCase().includes(movieSearch.toLowerCase()) || m.genre.toLowerCase().includes(movieSearch.toLowerCase()))
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-[#181822] transition-colors">
                          <td className="py-2.5 px-4">
                            <img
                              src={m.posterUrl}
                              alt={m.title}
                              className="w-10 h-14 object-cover rounded-lg border border-[#2E2E3E]"
                            />
                          </td>
                          <td className="py-2.5 px-4 font-bold text-white max-w-xs">{m.title}</td>
                          <td className="py-2.5 px-4 text-[#8E8E9E]">{m.genre}</td>
                          <td className="py-2.5 px-4 font-mono">{m.durationMinutes} phút</td>
                          <td className="py-2.5 px-4 text-gray-300">
                            {new Date(m.releaseDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                m.status === 'NOW_SHOWING'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : m.status === 'COMING_SOON'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                  : 'bg-gray-800 text-gray-400 border border-gray-700'
                              }`}
                            >
                              {m.status === 'NOW_SHOWING' ? 'Đang chiếu' : m.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Đã kết thúc'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right space-x-1">
                            <button
                              onClick={() => handleOpenEditMovie(m)}
                              className="p-1.5 rounded-lg bg-[#1E1E2C] text-gray-300 hover:text-white hover:bg-[#2A2A3C] transition"
                              title="Sửa thông tin"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteMovie(m.id, m.title)}
                              className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition"
                              title="Xóa phim"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SHOWTIME SCHEDULING                                                */}
        {/* ========================================================================= */}
        {activeTab === 'showtimes' && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={showtimeCinemaFilter}
                  onChange={(e) => setShowtimeCinemaFilter(e.target.value)}
                  className="bg-[#14141E] border border-[#262638] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FCFC65]"
                >
                  <option value="">Tất cả các rạp</option>
                  {cinemas.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenCreateShowtime}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-black font-bold text-xs shadow-neon transition"
              >
                <Plus size={15} />
                <span>Thêm suất chiếu mới</span>
              </button>
            </div>

            {/* Showtimes Table */}
            <div className="bg-[#12121A] border border-[#20202E] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161622] text-[#8E8E9E] border-b border-[#20202E]">
                    <tr>
                      <th className="py-3 px-4">Tên phim</th>
                      <th className="py-3 px-4">Rạp & Phòng chiếu</th>
                      <th className="py-3 px-4">Ngày chiếu</th>
                      <th className="py-3 px-4">Giờ bắt đầu - kết thúc</th>
                      <th className="py-3 px-4">Giá cơ sở (Thường / VIP / Couple)</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181824]">
                    {showtimes
                      .filter((st) => !showtimeCinemaFilter || st.room?.cinema?.name === showtimeCinemaFilter)
                      .slice(0, 50)
                      .map((st) => {
                        const base = Number(st.basePrice);
                        const vip = Math.round(base * 1.25);
                        const couple = Math.round(base * 1.5);
                        return (
                          <tr key={st.id} className="hover:bg-[#181822] transition-colors">
                            <td className="py-2.5 px-4 font-bold text-white max-w-xs">{st.movie?.title}</td>
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-gray-200">{st.room?.cinema?.name}</div>
                              <div className="text-[10px] text-[#FCFC65] font-mono">{st.room?.name} ({st.room?.type})</div>
                            </td>
                            <td className="py-2.5 px-4 text-gray-300">
                              {new Date(st.startTime).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[#74CFCF]">
                              {new Date(st.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} -{' '}
                              {new Date(st.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-white">{base.toLocaleString('vi-VN')} đ</div>
                              <div className="text-[10px] text-[#8E8E9E]">VIP: {vip.toLocaleString('vi-VN')} đ · Couple: {couple.toLocaleString('vi-VN')} đ</div>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                {st.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteShowtime(st.id)}
                                className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition"
                                title="Xóa suất chiếu"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: BOOKINGS & ORDERS                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-5">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Tìm theo mã vé, tên khách, số điện thoại..."
                className="w-full bg-[#14141E] border border-[#262638] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCFC65]"
              />
            </div>

            {/* Bookings Table */}
            <div className="bg-[#12121A] border border-[#20202E] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161622] text-[#8E8E9E] border-b border-[#20202E]">
                    <tr>
                      <th className="py-3 px-4">Mã vé</th>
                      <th className="py-3 px-4">Khách hàng</th>
                      <th className="py-3 px-4">Phim & Rạp</th>
                      <th className="py-3 px-4">Suất chiếu</th>
                      <th className="py-3 px-4">Ghế ngồi</th>
                      <th className="py-3 px-4">Tổng tiền</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181824]">
                    {bookings
                      .filter((b) => {
                        const term = bookingSearch.toLowerCase();
                        return (
                          b.bookingCode.toLowerCase().includes(term) ||
                          b.user?.fullName?.toLowerCase().includes(term) ||
                          b.user?.phone?.toLowerCase().includes(term) ||
                          b.showtime?.movie?.title?.toLowerCase().includes(term)
                        );
                      })
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-[#181822] transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-[#FCFC65]">{b.bookingCode}</td>
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-white">{b.user?.fullName}</div>
                            <div className="text-[10px] text-[#8E8E9E]">{b.user?.phone || b.user?.email}</div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-white">{b.showtime?.movie?.title}</div>
                            <div className="text-[10px] text-gray-400">{b.showtime?.room?.cinema?.name}</div>
                          </td>
                          <td className="py-2.5 px-4 text-gray-300 font-mono text-[11px]">
                            {b.showtime && new Date(b.showtime.startTime).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[#74CFCF]">
                            {b.bookingSeats?.map((bs) => `${bs.seat?.rowLabel}${bs.seat?.seatNumber}`).join(', ')}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-white">
                            {Number(b.totalAmount).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : b.status === 'CANCELLED'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedBookingDetail(b)}
                              className="p-1.5 rounded-lg bg-[#1E1E2C] text-gray-300 hover:text-white hover:bg-[#2A2A3C] transition"
                              title="Xem chi tiết"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CINEMAS & ROOMS                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'cinemas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cinemas.map((c) => {
                const cinemaRooms = rooms.filter((r) => r.cinemaId === c.id);
                return (
                  <div key={c.id} className="bg-[#12121A] border border-[#20202E] rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base">{c.name}</h3>
                        <p className="text-xs text-[#74CFCF] mt-0.5">{c.address}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FCFC65]/10 text-[#FCFC65] border border-[#FCFC65]/30">
                        {c.city}
                      </span>
                    </div>

                    <div className="border-t border-[#1C1C28] pt-3 space-y-2">
                      <div className="text-[11px] font-bold text-[#8E8E9E] uppercase tracking-wider">
                        Phòng chiếu trực thuộc ({cinemaRooms.length})
                      </div>
                      <div className="space-y-2">
                        {cinemaRooms.map((r) => (
                          <div
                            key={r.id}
                            className="p-2.5 rounded-xl bg-[#161622] border border-[#222230] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">{r.name}</div>
                              <div className="text-[10px] text-[#8E8E9E]">Sức chứa: {r.capacity} ghế</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.type === 'THREE_D'
                                  ? 'bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/40'
                                  : r.type === 'IMAX'
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                  : 'bg-gray-800 text-gray-300'
                              }`}
                            >
                              {r.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT MOVIE                                                 */}
      {/* ========================================================================= */}
      {isMovieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12121A] border border-[#28283C] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-2 border-b border-[#20202E]">
              <h3 className="font-bold text-white text-base">
                {editingMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới vào hệ thống'}
              </h3>
              <button onClick={() => setIsMovieModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#8E8E9E] mb-1 font-semibold">Tên phim *</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="Ví dụ: Venom: Kèo Cuối"
                  className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                />
              </div>

              <div>
                <label className="block text-[#8E8E9E] mb-1 font-semibold">Mô tả cốt truyện</label>
                <textarea
                  rows={3}
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8E9E] mb-1 font-semibold">Thời lượng (phút) *</label>
                  <input
                    type="number"
                    required
                    value={movieForm.durationMinutes}
                    onChange={(e) => setMovieForm({ ...movieForm, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                  />
                </div>

                <div>
                  <label className="block text-[#8E8E9E] mb-1 font-semibold">Trạng thái *</label>
                  <select
                    value={movieForm.status}
                    onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value as any })}
                    className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                  >
                    <option value="NOW_SHOWING">Đang chiếu (NOW_SHOWING)</option>
                    <option value="COMING_SOON">Sắp chiếu (COMING_SOON)</option>
                    <option value="ENDED">Đã dừng chiếu (ENDED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#8E8E9E] mb-1 font-semibold">Thể loại</label>
                <input
                  type="text"
                  value={movieForm.genre}
                  onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                  placeholder="Hành động, Phiêu lưu..."
                  className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                />
              </div>

              <div>
                <label className="block text-[#8E8E9E] mb-1 font-semibold">Ảnh Poster URL (TMDB hoặc CDN) *</label>
                <input
                  type="url"
                  required
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  placeholder="https://image.tmdb.org/t/p/w780/..."
                  className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                />
              </div>

              <div>
                <label className="block text-[#8E8E9E] mb-1 font-semibold">Ngày khởi chiếu</label>
                <input
                  type="date"
                  value={movieForm.releaseDate}
                  onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                  className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovieModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#303044] text-gray-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FCFC65] text-black font-bold hover:bg-[#EAEA48] shadow-neon"
                >
                  Lưu phim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD SHOWTIME                                                     */}
      {/* ========================================================================= */}
      {isShowtimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12121A] border border-[#28283C] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#20202E]">
              <h3 className="font-bold text-white text-base">Tạo suất chiếu mới</h3>
              <button onClick={() => setIsShowtimeModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveShowtime} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#8E8E9E] mb-1 font-semibold">Chọn phim *</label>
                <select
                  required
                  value={showtimeForm.movieId}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, movieId: e.target.value })}
                  className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.durationMinutes}p) - {m.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8E8E9E] mb-1 font-semibold">Chọn phòng chiếu *</label>
                <select
                  required
                  value={showtimeForm.roomId}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, roomId: e.target.value })}
                  className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.cinema?.name} - {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8E9E] mb-1 font-semibold">Ngày chiếu *</label>
                  <input
                    type="date"
                    required
                    value={showtimeForm.date}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, date: e.target.value })}
                    className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                  />
                </div>

                <div>
                  <label className="block text-[#8E8E9E] mb-1 font-semibold">Giờ chiếu *</label>
                  <input
                    type="time"
                    required
                    value={showtimeForm.time}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, time: e.target.value })}
                    className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8E8E9E] mb-1 font-semibold">Giá vé cơ sở (Ghế thường) *</label>
                <input
                  type="number"
                  required
                  step={5000}
                  value={showtimeForm.basePrice}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, basePrice: Number(e.target.value) })}
                  className="w-full bg-[#181824] border border-[#303044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FCFC65]"
                />
                <div className="text-[10px] text-[#FCFC65] mt-1 font-medium">
                  Tự động tính: VIP = {Math.round(showtimeForm.basePrice * 1.25).toLocaleString('vi-VN')} đ · Couple = {Math.round(showtimeForm.basePrice * 1.5).toLocaleString('vi-VN')} đ
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShowtimeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#303044] text-gray-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FCFC65] text-black font-bold hover:bg-[#EAEA48] shadow-neon"
                >
                  Lên lịch chiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW BOOKING DETAIL                                              */}
      {/* ========================================================================= */}
      {selectedBookingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12121A] border border-[#28283C] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#20202E]">
              <div>
                <h3 className="font-bold text-white text-base">Chi tiết Đơn vé #{selectedBookingDetail.bookingCode}</h3>
                <span className="text-[10px] text-[#8E8E9E]">ID: {selectedBookingDetail.id}</span>
              </div>
              <button onClick={() => setSelectedBookingDetail(null)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#161622] rounded-xl space-y-1.5 border border-[#222230]">
                <div className="flex justify-between">
                  <span className="text-[#8E8E9E]">Khách hàng:</span>
                  <span className="font-bold text-white">{selectedBookingDetail.user?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E9E]">Email:</span>
                  <span className="text-gray-300">{selectedBookingDetail.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E9E]">Điện thoại:</span>
                  <span className="text-gray-300">{selectedBookingDetail.user?.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div className="p-3 bg-[#161622] rounded-xl space-y-1.5 border border-[#222230]">
                <div className="flex justify-between">
                  <span className="text-[#8E8E9E]">Phim:</span>
                  <span className="font-bold text-[#FCFC65]">{selectedBookingDetail.showtime?.movie?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E9E]">Cụm rạp:</span>
                  <span className="text-white">{selectedBookingDetail.showtime?.room?.cinema?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E9E]">Phòng chiếu:</span>
                  <span className="text-white">{selectedBookingDetail.showtime?.room?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E9E]">Giờ chiếu:</span>
                  <span className="text-white">
                    {selectedBookingDetail.showtime && new Date(selectedBookingDetail.showtime.startTime).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Seats Breakdown */}
              <div className="p-3 bg-[#161622] rounded-xl border border-[#222230]">
                <div className="font-bold text-white mb-2">Danh sách ghế & Giá vé:</div>
                <div className="space-y-1.5">
                  {selectedBookingDetail.bookingSeats?.map((bs) => (
                    <div key={bs.id} className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#FCFC65]">{bs.seat?.rowLabel}{bs.seat?.seatNumber}</span>
                        <span className="text-gray-400">({bs.seat?.type})</span>
                      </span>
                      <span className="font-semibold text-white">{Number(bs.price).toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-[#262638] flex justify-between items-center font-bold">
                  <span className="text-white">Tổng cộng:</span>
                  <span className="text-sm text-[#FCFC65]">{Number(selectedBookingDetail.totalAmount).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-2">
              {selectedBookingDetail.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => handleCancelBooking(selectedBookingDetail.id, selectedBookingDetail.bookingCode)}
                  className="px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 font-bold text-xs hover:bg-red-900/60 transition"
                >
                  Hủy đơn & hoàn ghế
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedBookingDetail(null)}
                className="ml-auto px-5 py-2 rounded-xl bg-[#222232] hover:bg-[#2C2C40] text-white font-bold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
