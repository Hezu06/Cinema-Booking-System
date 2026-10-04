import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Clock, Trash2, Eye, ChevronRight } from 'lucide-react';
import type { BookingDetail } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const MyBookingsPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = () => {
    setIsLoading(true);
    api.getMyBookings()
      .then((res) => {
        if (res.success && res.data) {
          setBookings(res.data);
        }
      })
      .catch((err) => console.error('Failed to load bookings:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn hủy đơn đặt vé này không? Toàn bộ ghế sẽ được hoàn trả về trạng thái trống.'
    );
    if (!confirmed) return;

    setCancellingId(bookingId);
    try {
      const res = await api.cancelBooking(bookingId);
      if (res.success) {
        // Refresh bookings
        fetchBookings();
      } else {
        alert(res.message || 'Không thể hủy đơn đặt vé.');
      }
    } catch (err: any) {
      alert(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4">
          <Ticket size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Đăng nhập để xem vé của bạn</h2>
        <p className="text-xs text-gray-400 mb-6">
          Vui lòng đăng nhập để kiểm tra các vé đã đặt, mã QR vào rạp và quản lý lịch sử đặt vé.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3 px-6 bg-brand-primary text-gray-950 font-bold rounded-xl text-sm shadow-neon"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  const formatShowtimeDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const date = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    return `${time} • ${date}`;
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in max-w-4xl">
      {/* Page Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Ticket className="text-brand-primary" />
            <span>Lịch sử vé của tôi</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Quản lý và xuất trình mã QR các vé đã đặt</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 bg-brand-card border border-brand-border rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'ALL' ? 'bg-brand-primary text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Tất cả ({bookings.length})
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'CONFIRMED'
                ? 'bg-brand-primary text-gray-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Đã xác nhận
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'CANCELLED'
                ? 'bg-brand-primary text-gray-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Đã hủy
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-32 bg-brand-card rounded-2xl border border-brand-border animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';

            return (
              <div
                key={b.id}
                className="p-5 bg-brand-card border border-brand-border rounded-2xl hover:border-brand-border/80 transition flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
              >
                {/* Left: Movie thumbnail and details */}
                <div className="flex gap-4 items-center">
                  <img
                    src={b.showtime.movie?.posterUrl}
                    alt=""
                    className="w-16 h-22 object-cover rounded-xl border border-brand-border shrink-0"
                  />

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-brand-primary bg-brand-dark px-2 py-0.5 rounded">
                        {b.bookingCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isConfirmed
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isConfirmed ? 'Đã xác nhận' : 'Đã hủy'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                      {b.showtime.movie?.title}
                    </h3>

                    <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 text-gray-200">
                        <Clock size={12} className="text-brand-primary" />
                        {formatShowtimeDateTime(b.showtime.startTime)}
                      </span>
                      <span>•</span>
                      <span>{b.showtime.room?.cinema?.name} ({b.showtime.room?.name})</span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Ghế:</span>
                      {b.bookingSeats.map((bs) => (
                        <span
                          key={bs.id}
                          className="px-1.5 py-0.5 bg-brand-dark text-white text-[11px] font-mono font-semibold rounded"
                        >
                          {bs.seat.rowLabel}{bs.seat.seatNumber}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Total price & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-border/60 gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Tổng tiền</span>
                    <span className="text-base sm:text-lg font-black text-brand-primary">
                      {Number(b.totalAmount).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/ticket/${b.id}`}
                      className="py-2 px-3 bg-brand-primary hover:bg-brand-primaryHover text-gray-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-neon transition"
                    >
                      <Eye size={14} />
                      <span>Xem vé</span>
                    </Link>

                    {isConfirmed && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={cancellingId === b.id}
                        title="Hủy vé & Hoàn trả ghế"
                        className="py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-xl text-xs flex items-center gap-1 transition disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        <span>{cancellingId === b.id ? 'Đang hủy...' : 'Hủy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-brand-card border border-brand-border rounded-3xl">
          <Ticket size={40} className="mx-auto text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Chưa có vé nào</h3>
          <p className="text-xs text-gray-400 mb-6">Bạn chưa có đơn đặt vé nào trong mục này</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-gray-950 font-bold rounded-xl text-xs shadow-neon"
          >
            <span>Khám phá phim đang chiếu</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
};
