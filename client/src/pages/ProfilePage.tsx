import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User,
  Ticket,
  Wallet,
  CreditCard,
  Bookmark,
  Settings,
  ChevronRight,
  X,
  Download,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getAuthToken } from '../api/client';
import type { BookingDetail, Movie } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();
  const location = useLocation();

  // Active Tab from location or default to 'account'
  const [activeTab, setActiveTab] = useState<'account' | 'tickets' | 'wallet' | 'payments' | 'watchlist' | 'settings'>(
    location.pathname.includes('my-bookings') ? 'tickets' : 'account'
  );

  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [activeTicketModal, setActiveTicketModal] = useState<BookingDetail | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn hủy đơn vé này không? Ghế đã chọn sẽ được hoàn lại để người khác có thể đặt.'
    );
    if (!confirmed) return;

    setCancellingId(bookingId);
    try {
      const res = await api.cancelBooking(bookingId);
      if (res.success) {
        alert('Đã hủy vé thành công! Ghế của bạn đã được giải phóng.');
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
        );
        if (activeTicketModal && activeTicketModal.id === bookingId) {
          setActiveTicketModal((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        }
      } else {
        alert(res.message || 'Hủy vé thất bại. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      alert(err.message || 'Không thể hủy vé lúc này.');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    const hasToken = !!getAuthToken();
    if (isAuthenticated || hasToken) {
      Promise.all([
        api.getMyBookings().catch((err) => {
          console.error('Failed to fetch bookings:', err);
          return { success: false, data: [] as BookingDetail[] };
        }),
        api.getMovies().catch((err) => {
          console.error('Failed to fetch movies:', err);
          return { success: false, data: [] as Movie[] };
        }),
      ])
        .then(([bookingsRes, moviesRes]) => {
          if (bookingsRes.success && bookingsRes.data) {
            setBookings(bookingsRes.data);
          }
          if (moviesRes.success && moviesRes.data) {
            setMovies(moviesRes.data);
          }
        })
        .finally(() => {
          setIsDataLoading(false);
        });
    } else if (!authLoading) {
      setIsDataLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // If verifying auth or fetching user data on page load, render skeleton loader
  if (authLoading || (getAuthToken() && isDataLoading && bookings.length === 0)) {
    return (
      <div className="w-full text-[#F1F1F4] pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-3 bg-[#12121A] border border-[#20202E] rounded-3xl p-6 space-y-6">
              <div className="flex items-center gap-3.5 pb-6 border-b border-[#1E1E2C]">
                <div className="w-12 h-12 rounded-full bg-[#1F1F2B]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#1F1F2B] rounded w-3/4" />
                  <div className="h-3 bg-[#1F1F2B] rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-[#161622] rounded-xl" />
                ))}
              </div>
            </div>
            <div className="md:col-span-9 bg-[#12121A] border border-[#20202E] rounded-3xl p-8 space-y-6">
              <div className="h-6 bg-[#1F1F2B] rounded w-1/4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-40 bg-[#161622] rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !getAuthToken()) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#181824] border border-[#2A2A3A] flex items-center justify-center mx-auto text-[#FCFC65]">
          <User size={30} />
        </div>
        <h2 className="text-2xl font-bold text-white">Đăng nhập tài khoản</h2>
        <p className="text-xs text-[#8E8E9E]">
          Xem thông tin vé xem phim của bạn, mã vạch vào rạp, điểm thưởng tích lũy và danh sách phim yêu thích.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3 bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold rounded-xl text-xs shadow-neon transition"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const now = new Date();
  const upcomingTickets = bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.showtime.startTime) >= now);
  const pastTickets = bookings.filter((b) => b.status === 'CANCELLED' || new Date(b.showtime.startTime) < now);

  const watchlistMovies = movies.filter((m) => m.status === 'COMING_SOON').length > 0
    ? movies.filter((m) => m.status === 'COMING_SOON')
    : movies.slice(0, 3);


  return (
    <div className="w-full text-[#F1F1F4] pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* 1. LEFT SIDEBAR NAVIGATION (Figma Profile layout) */}
          <div className="md:col-span-3 bg-[#12121A] border border-[#20202E] rounded-3xl p-6 space-y-6 shadow-2xl">
            {/* User Profile Card */}
            <div className="flex items-center gap-3.5 pb-6 border-b border-[#1E1E2C]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                alt="Profile avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#FCFC65]"
              />
              <div className="overflow-hidden">
                <div className="font-bold text-white text-sm truncate">
                  {user?.fullName || 'Luna Caldwell'}
                </div>
                <div className="text-[11px] text-[#8E8E9E] truncate">
                  {user?.email || 'L.caldwell@gmail.com'}
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="space-y-1.5 text-xs font-semibold">
              {[
                { id: 'account', label: 'My Account', icon: User },
                { id: 'tickets', label: 'My Tickets', icon: Ticket },
                { id: 'wallet', label: 'My Wallet', icon: Wallet },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'watchlist', label: 'My Watchlist', icon: Bookmark },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                      isActive
                        ? 'bg-[#181824] text-[#FCFC65] border border-[#2A2A3A]'
                        : 'text-[#8E8E9E] hover:text-white hover:bg-[#14141E]'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#FCFC65]' : 'text-[#707085]'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 2. RIGHT MAIN CONTENT AREA */}
          <div className="md:col-span-9 space-y-6">
            {/* TAB: MY ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Welcome Card & Progress */}
                <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-6 sm:p-8 space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Xin chào, {user?.fullName?.split(' ').slice(-1)[0] || 'Khách hàng'}!
                    </h2>
                    <p className="text-xs text-[#8E8E9E]">Tổng quan hoạt động đặt vé và thành viên của bạn</p>
                  </div>

                  {/* Points progress bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        {1000 - Math.min(bookings.length * 100, 1000)} điểm nữa để đổi 01 Vé Miễn Phí 🎟
                      </span>
                      <span className="text-[#FCFC65] font-bold">{bookings.length * 100} / 1000 pts</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#181824] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FCFC65] shadow-neon"
                        style={{ width: `${Math.min((bookings.length * 100) / 10, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-6 text-center space-y-1">
                    <div className="text-3xl font-black text-white">{bookings.length * 100}</div>
                    <div className="text-xs text-[#8E8E9E]">Điểm thưởng tích lũy</div>
                  </div>

                  <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-6 text-center space-y-1">
                    <div className="text-3xl font-black text-white">{bookings.length}</div>
                    <div className="text-xs text-[#8E8E9E]">Đơn vé đã đặt</div>
                  </div>

                  <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-6 text-center space-y-1">
                    <div className="text-2xl font-black text-[#FCFC65]">Thân Thiết</div>
                    <div className="text-xs text-[#8E8E9E]">Hạng thành viên Sọt phim</div>
                  </div>
                </div>

                {/* Quick Action Rows */}
                <div className="space-y-3">
                  <div
                    onClick={() => setActiveTab('tickets')}
                    className="p-5 rounded-2xl bg-[#12121A] border border-[#20202E] hover:border-[#303042] cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">Vé phim sắp chiếu</div>
                      <div className="text-xs text-[#8E8E9E] mt-0.5">
                        Bạn có {upcomingTickets.length} suất chiếu sắp diễn ra
                      </div>
                    </div>
                    <span className="text-xs text-[#FCFC65] font-semibold flex items-center gap-1">
                      <span>Xem danh sách vé</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('watchlist')}
                    className="p-5 rounded-2xl bg-[#12121A] border border-[#20202E] hover:border-[#303042] cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">Phim đang & sắp chiếu</div>
                      <div className="text-xs text-[#8E8E9E] mt-0.5">
                        Có {movies.length} tựa phim hấp dẫn trong hệ thống
                      </div>
                    </div>
                    <span className="text-xs text-[#FCFC65] font-semibold flex items-center gap-1">
                      <span>Khám phá ngay</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MY TICKETS */}
            {activeTab === 'tickets' && (
              <div className="space-y-8">
                {/* Upcoming Tickets Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-base">Vé xem phim sắp chiếu</h3>
                  {upcomingTickets.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-[#12121A] border border-[#20202E] text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#181824] border border-[#282838] flex items-center justify-center mx-auto text-[#FCFC65]">
                        <Ticket size={24} />
                      </div>
                      <div className="font-bold text-white text-base">Bạn chưa có vé phim sắp chiếu nào</div>
                      <p className="text-xs text-[#8E8E9E]">Hãy chọn phim yêu thích và đặt vé để trải nghiệm ngay hôm nay!</p>
                      <Link
                        to="/"
                        className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-[#FCFC65] text-black font-bold text-xs shadow-neon"
                      >
                        Khám phá phim đang chiếu
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingTickets.map((t) => (
                        <div
                          key={t.id}
                          className="p-5 bg-[#12121A] border border-[#20202E] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={t.showtime?.movie?.posterUrl}
                              alt=""
                              className="w-14 h-18 object-cover rounded-xl border border-[#252535] shrink-0"
                            />
                            <div className="space-y-1">
                              <h4 className="font-bold text-white text-sm">
                                {t.showtime?.movie?.title}
                              </h4>
                              <p className="text-xs text-[#8E8E9E]">
                                {new Date(t.showtime.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })} · {new Date(t.showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </p>
                              <p className="text-[11px] text-[#74CFCF]">
                                {t.showtime?.room?.cinema?.name} · {t.showtime?.room?.name} · {t.bookingSeats?.length || 1} Ghế
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveTicketModal(t)}
                              className="px-3.5 py-2 rounded-xl border border-[#2E2E3E] hover:border-[#FCFC65] text-xs font-semibold text-white hover:text-[#FCFC65] transition"
                            >
                              Chi tiết
                            </button>
                            <Link
                              to={`/ticket/${t.id}`}
                              className="px-3.5 py-2 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-black text-xs font-bold shadow-neon transition"
                            >
                              Mã vé
                            </Link>
                            <button
                              onClick={() => handleCancelBooking(t.id)}
                              disabled={cancellingId === t.id}
                              className="px-3.5 py-2 rounded-xl border border-red-500/40 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition disabled:opacity-50"
                            >
                              {cancellingId === t.id ? 'Đang hủy...' : 'Hủy vé'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Tickets Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-base">Lịch sử vé đã xem / đã hủy</h3>
                  {pastTickets.length === 0 ? (
                    <p className="text-xs text-[#707085] italic">Chưa có lịch sử vé xem phim nào.</p>
                  ) : (
                    <div className="space-y-3">
                      {pastTickets.map((pt) => (
                        <div
                          key={pt.id}
                          className="p-5 bg-[#12121A] border border-[#20202E] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-80"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={pt.showtime?.movie?.posterUrl}
                              alt=""
                              className="w-14 h-18 object-cover rounded-xl border border-[#252535] shrink-0"
                            />
                            <div className="space-y-1">
                              <h4 className="font-bold text-white text-sm">{pt.showtime?.movie?.title}</h4>
                              <p className="text-xs text-[#8E8E9E]">
                                {new Date(pt.showtime.startTime).toLocaleDateString('vi-VN')} lúc {new Date(pt.showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </p>
                              <p className="text-[11px] text-[#707085]">
                                {pt.showtime?.room?.cinema?.name} · {pt.bookingSeats?.length || 1} Ghế · Trạng thái: {pt.status === 'CANCELLED' ? 'Đã hủy' : 'Đã hoàn tất'}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveTicketModal(pt)}
                            className="px-4 py-2 rounded-xl border border-[#2E2E3E] text-xs font-semibold text-[#8E8E9E] hover:text-white transition"
                          >
                            Xem lại vé
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MY WATCHLIST */}
            {activeTab === 'watchlist' && (
              <div className="space-y-8">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-lg">Danh sách phim nổi bật</h3>
                  <p className="text-xs text-[#8E8E9E]">Các bộ phim đang chiếu và sắp ra mắt tại rạp</p>
                </div>

                <div className="space-y-4">
                  {watchlistMovies.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 bg-[#12121A] border border-[#20202E] rounded-3xl flex flex-col sm:flex-row gap-6 items-start"
                    >
                      <div className="w-full sm:w-44 aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-[#181824] border border-[#282838] shrink-0">
                        <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                      </div>

                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-base">{m.title}</h4>
                          <span className="text-xs font-bold text-[#FCFC65] flex items-center gap-1">
                            ★ 8.8
                          </span>
                        </div>

                        <div className="text-[11px] text-[#707085]">{m.durationMinutes} phút · {m.genre}</div>

                        <p className="text-xs text-[#A0A0B2] line-clamp-3 leading-relaxed">
                          {m.description}
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                          <Link
                            to={`/movies/${m.id}`}
                            className="px-5 py-2 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-black font-bold text-xs shadow-neon transition"
                          >
                            Đặt vé ngay
                          </Link>
                          <Link
                            to={`/movies/${m.id}/showtimes`}
                            className="px-4 py-2 rounded-xl border border-[#2E2E3E] text-xs text-[#8E8E9E] hover:text-white transition"
                          >
                            Xem lịch chiếu
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: MY WALLET & PAYMENTS & SETTINGS */}
            {(activeTab === 'wallet' || activeTab === 'payments' || activeTab === 'settings') && (
              <div className="bg-[#12121A] border border-[#20202E] rounded-3xl p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#181824] border border-[#282838] flex items-center justify-center mx-auto text-[#FCFC65]">
                  <Wallet size={26} />
                </div>
                <h3 className="font-bold text-white text-lg capitalize">
                  {activeTab === 'wallet' ? 'Ví Voucher & Điểm' : activeTab === 'payments' ? 'Phương thức thanh toán đã lưu' : 'Cài đặt tài khoản'}
                </h3>
                <p className="text-xs text-[#8E8E9E] max-w-md mx-auto">
                  Quản lý tích điểm thưởng thành viên, mã khuyến mại và thông tin tài khoản Sọt phim của bạn.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <span className="inline-block px-4 py-2 rounded-xl bg-[#181824] border border-[#282838] text-xs text-[#FCFC65] font-mono font-bold">
                    Điểm tích lũy: {bookings.length * 100} PTS
                  </span>
                  <span className="inline-block px-4 py-2 rounded-xl bg-[#181824] border border-[#282838] text-xs text-white font-mono">
                    Hạng thành viên: Thân Thiết
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Details Barcode Modal (Figma Profile Ticket Popup) */}
      {activeTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#12121A] border border-[#262636] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <button
              onClick={() => setActiveTicketModal(null)}
              className="absolute top-5 right-5 text-[#8E8E9E] hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              {/* Left: Poster + Barcode */}
              <div className="sm:col-span-5 space-y-4">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#181824] border border-[#282838]">
                  <img
                    src={activeTicketModal.showtime?.movie?.posterUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">
                    {activeTicketModal.showtime?.movie?.title}
                  </h4>
                  <div className="text-[11px] text-[#74CFCF] mt-0.5">
                    {activeTicketModal.showtime?.room?.cinema?.name} · {activeTicketModal.showtime?.room?.name}
                  </div>
                  <div className="text-[10px] text-[#FCFC65] mt-1 font-semibold">
                    {new Date(activeTicketModal.showtime?.startTime).toLocaleDateString('vi-VN')} · {new Date(activeTicketModal.showtime?.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                </div>

                {/* Barcode */}
                <div className="p-3 bg-white rounded-xl flex flex-col items-center">
                  <div className="w-full h-10 bg-black/90 rounded-sm flex items-center justify-center text-[10px] font-mono font-black text-white tracking-widest">
                    ||| | |||| || ||| | ||| |||| |
                  </div>
                  <span className="text-[9px] font-mono text-black font-bold mt-1">
                    Mã vé: {activeTicketModal.bookingCode}
                  </span>
                </div>
              </div>

              {/* Right: Details & Breakdown */}
              <div className="sm:col-span-7 space-y-4 text-xs">
                <div>
                  <h5 className="font-bold text-white mb-2 uppercase tracking-wider text-[11px]">
                    Thông tin khách hàng
                  </h5>
                  <div className="space-y-1 text-[#8E8E9E]">
                    <div>Họ tên: <span className="text-white font-medium">{user?.fullName || 'Khách hàng'}</span></div>
                    <div>Số điện thoại: <span className="text-white">{user?.phone || '0901234567'}</span></div>
                    <div>Email: <span className="text-white">{user?.email || 'user@example.com'}</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1E1E2C]">
                  <h5 className="font-bold text-white mb-2 uppercase tracking-wider text-[11px]">
                    Chi tiết vé
                  </h5>
                  <div className="space-y-1.5 text-[#8E8E9E]">
                    <div className="flex justify-between">
                      <span>Ghế đã chọn:</span>
                      <span className="text-[#FCFC65] font-semibold">
                        {activeTicketModal.bookingSeats?.map((bs: any) => `${bs.seat.rowLabel}${bs.seat.seatNumber}`).join(', ') || 'Ghế tiêu chuẩn'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className={activeTicketModal.status === 'CONFIRMED' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                        {activeTicketModal.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Đã hủy'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#1E1E2C] font-bold">
                      <span className="text-white">TỔNG TIỀN</span>
                      <span className="text-[#FCFC65]">{Number(activeTicketModal.totalAmount).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-3">
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-2.5 rounded-xl bg-[#FCFC65] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-neon"
                    >
                      <Download size={14} />
                      <span>In vé</span>
                    </button>

                    <Link
                      to={`/ticket/${activeTicketModal.id}`}
                      className="flex-1 py-2.5 rounded-xl border border-[#2E2E3E] text-white hover:text-[#FCFC65] font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Share2 size={14} />
                      <span>Xem mã QR</span>
                    </Link>
                  </div>

                  {activeTicketModal.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelBooking(activeTicketModal.id)}
                      disabled={cancellingId === activeTicketModal.id}
                      className="w-full py-2.5 rounded-xl border border-red-500/50 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition disabled:opacity-50"
                    >
                      {cancellingId === activeTicketModal.id ? 'Đang hủy...' : 'Hủy đặt vé này'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
