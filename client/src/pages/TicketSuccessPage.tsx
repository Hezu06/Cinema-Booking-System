import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2 } from 'lucide-react';
import type { BookingDetail } from '../types';
import { api } from '../api/client';
import { BookingStepper } from '../components/booking/BookingStepper';

export const TicketSuccessPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [cachedReceipt, setCachedReceipt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!bookingId) return;
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn hủy đơn vé này không? Ghế đã chọn sẽ được hoàn lại để người khác có thể đặt.'
    );
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const res = await api.cancelBooking(bookingId);
      if (res.success) {
        alert('Đã hủy vé thành công!');
        setBooking((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      } else {
        alert(res.message || 'Hủy vé thất bại.');
      }
    } catch (e: any) {
      alert(e.message || 'Không thể hủy vé lúc này.');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    // Check cached receipt first
    const stored = sessionStorage.getItem('ticketor_latest_receipt');
    if (stored) {
      try {
        setCachedReceipt(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }

    if (bookingId) {
      api.getBookingById(bookingId)
        .then((res) => {
          if (res.success && res.data) {
            setBooking(res.data);
          }
        })
        .catch((err) => console.error('Failed to load booking details:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 animate-pulse space-y-6">
        <div className="h-10 bg-[#161622] rounded-xl w-64 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
          <div className="bg-[#161622] rounded-3xl" />
          <div className="bg-[#161622] rounded-3xl" />
        </div>
      </div>
    );
  }

  // Populate dynamic details from real booking or cached receipt
  const movie = booking?.showtime?.movie || cachedReceipt?.movie || {
    title: 'Phim Chiếu Rạp CBS',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    durationMinutes: 120,
    genre: 'Điện ảnh',
  };

  const cinema = booking?.showtime?.room?.cinema || cachedReceipt?.cinema || {
    name: 'Hệ Thống Rạp Ticketor',
    address: 'Hà Nội / TP. Hồ Chí Minh',
  };

  const room = booking?.showtime?.room || cachedReceipt?.showtime?.room || {
    name: 'Phòng chiếu',
    type: '2D Digital',
  };

  const startTime = booking?.showtime?.startTime || cachedReceipt?.showtime?.startTime;
  const formattedDate = startTime
    ? new Date(startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Hôm nay';
  const formattedTime = startTime
    ? new Date(startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '10:30';

  const seatsList: string[] =
    booking?.bookingSeats?.map((bs) => `${bs.seat.rowLabel}${bs.seat.seatNumber}`) ||
    cachedReceipt?.selectedSeats?.map((s: any) => `${s.seat.rowLabel}${s.seat.seatNumber}`) ||
    [];

  const orderNumber = booking?.bookingCode || cachedReceipt?.bookingCode || bookingId?.slice(0, 8).toUpperCase() || 'CBS-TICKET';

  const customer = {
    name: booking?.user?.fullName || cachedReceipt?.customer?.name || 'Khách hàng',
    phone: booking?.user?.phone || cachedReceipt?.customer?.phone || '0901234567',
    email: booking?.user?.email || cachedReceipt?.customer?.email || 'customer@example.com',
  };

  const grandTotal = booking ? Number(booking.totalAmount) : (cachedReceipt?.grandTotal || 0);

  return (
    <div className="w-full text-[#F1F1F4] pb-24">
      {/* Top Header Row with Title and Stepper */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#20202E]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">{movie.title}</h1>
          <div className="text-xs text-[#8E8E9E] mt-0.5">
            {movie.durationMinutes || 120} phút · {movie.genre || 'Điện ảnh'} · ★ 8.5
          </div>
        </div>

        {/* Stepper: All steps completed / yellow */}
        <div className="w-full md:w-auto">
          <BookingStepper currentStep="ticket" />
        </div>
      </div>

      {/* Main 2-Card Layout (Ticketor Figma Payment Screen 4) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* 1. LEFT CARD: Cinema Boarding Pass with Barcode */}
          <div className="md:col-span-5 bg-[#12121A] border border-[#20202E] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
            {/* Poster */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#181824] border border-[#282838]">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Cinema Details */}
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">{movie.title}</h3>
              <p className="text-xs text-[#FCFC65]">{room.name} · {room.type}</p>
              <div className="pt-2 text-xs">
                <span className="font-semibold text-white block">{cinema.name}</span>
                <span className="text-[#74CFCF] text-[11px] block mt-0.5">{cinema.address}</span>
              </div>
            </div>

            {/* Date, Time, Seats badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs py-3 border-y border-[#1E1E2C]">
              <div>
                <span className="text-[10px] text-[#707085] uppercase block">Ngày chiếu</span>
                <span className="font-bold text-white mt-0.5 block">{formattedDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#707085] uppercase block">Giờ chiếu</span>
                <span className="font-bold text-[#FCFC65] mt-0.5 block">{formattedTime}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#707085] uppercase block">Ghế</span>
                <span className="font-bold text-[#FCFC65] mt-0.5 block truncate">
                  {seatsList.length > 0 ? seatsList.join(', ') : 'Đã chọn'}
                </span>
              </div>
            </div>

            {/* Order Number & Barcode (Figma screen 4) */}
            <div className="space-y-3 pt-1">
              <div className="text-center font-mono text-xs text-[#8E8E9E]">
                Mã đặt vé: <strong className="text-white tracking-widest">{orderNumber}</strong>
              </div>

              {/* Realistic SVG Barcode Graphic */}
              <div className="p-3 bg-white rounded-xl flex flex-col items-center justify-center">
                <svg className="w-full h-12" viewBox="0 0 240 48" preserveAspectRatio="none">
                  {/* Generated clean barcode stripes */}
                  <g fill="#000000">
                    <rect x="0" y="0" width="3" height="48" />
                    <rect x="5" y="0" width="2" height="48" />
                    <rect x="10" y="0" width="4" height="48" />
                    <rect x="17" y="0" width="2" height="48" />
                    <rect x="22" y="0" width="5" height="48" />
                    <rect x="30" y="0" width="2" height="48" />
                    <rect x="35" y="0" width="3" height="48" />
                    <rect x="41" y="0" width="6" height="48" />
                    <rect x="50" y="0" width="2" height="48" />
                    <rect x="55" y="0" width="4" height="48" />
                    <rect x="62" y="0" width="2" height="48" />
                    <rect x="67" y="0" width="5" height="48" />
                    <rect x="75" y="0" width="3" height="48" />
                    <rect x="81" y="0" width="2" height="48" />
                    <rect x="86" y="0" width="6" height="48" />
                    <rect x="95" y="0" width="2" height="48" />
                    <rect x="100" y="0" width="4" height="48" />
                    <rect x="107" y="0" width="3" height="48" />
                    <rect x="113" y="0" width="2" height="48" />
                    <rect x="118" y="0" width="5" height="48" />
                    <rect x="126" y="0" width="2" height="48" />
                    <rect x="131" y="0" width="4" height="48" />
                    <rect x="138" y="0" width="3" height="48" />
                    <rect x="144" y="0" width="6" height="48" />
                    <rect x="153" y="0" width="2" height="48" />
                    <rect x="158" y="0" width="5" height="48" />
                    <rect x="166" y="0" width="2" height="48" />
                    <rect x="171" y="0" width="4" height="48" />
                    <rect x="178" y="0" width="3" height="48" />
                    <rect x="184" y="0" width="2" height="48" />
                    <rect x="189" y="0" width="5" height="48" />
                    <rect x="197" y="0" width="3" height="48" />
                    <rect x="203" y="0" width="2" height="48" />
                    <rect x="208" y="0" width="6" height="48" />
                    <rect x="217" y="0" width="2" height="48" />
                    <rect x="222" y="0" width="4" height="48" />
                    <rect x="229" y="0" width="3" height="48" />
                    <rect x="235" y="0" width="5" height="48" />
                  </g>
                </svg>
                <span className="text-[10px] font-mono text-black font-bold tracking-widest mt-1">
                  {orderNumber}
                </span>
              </div>
            </div>
          </div>

          {/* 2. RIGHT CARD: Payment Successful Confirmation & Details */}
          <div className="md:col-span-7 space-y-8 pl-0 md:pl-4">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Đặt vé thành công!</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#8E8E9E]">
                Vé xem phim cho <strong className="text-white">{movie.title}</strong> đã được xác nhận thành công trong hệ thống.
              </p>
            </div>

            {/* Item Details */}
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Thông tin vé</h3>
              <div className="space-y-2 text-[#A8A8BA]">
                <div className="flex gap-2">
                  <span className="text-[#707085] w-28">Tên phim:</span>
                  <span className="text-white font-medium">{movie.title}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#707085] w-28">Rạp chiếu:</span>
                  <span className="text-white">{cinema.name} · {room.name} · {room.type}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#707085] w-28">Thời gian:</span>
                  <span className="text-white">{formattedDate} · lúc {formattedTime}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#707085] w-28">Ghế đã chọn:</span>
                  <span className="text-[#FCFC65] font-semibold">{seatsList.length > 0 ? seatsList.join(', ') : 'Đã chọn'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#707085] w-28">Trạng thái:</span>
                  <span className={booking?.status === 'CANCELLED' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {booking?.status === 'CANCELLED' ? 'Đã hủy' : 'Đã xác nhận'}
                  </span>
                </div>
                <div className="flex gap-2 pt-1 border-t border-[#20202E]">
                  <span className="text-[#707085] w-28 font-bold">Tổng thanh toán:</span>
                  <span className="text-[#FCFC65] font-black text-sm">{grandTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3 text-xs pt-4 border-t border-[#20202E]">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                Thông tin người nhận
              </h3>
              <div className="space-y-2 text-[#A8A8BA]">
                <div className="flex gap-2">
                  <span className="text-[#707085] w-28">Họ tên:</span>
                  <span className="text-white font-medium">{customer.name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#707085] w-28">Số điện thoại:</span>
                  <span className="text-white">{customer.phone}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#707085] w-28">Email:</span>
                  <span className="text-white">{customer.email}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs flex items-center gap-2 shadow-neon transition"
              >
                <Download size={15} />
                <span>In vé / Lưu PDF</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Đã sao chép liên kết vé vào clipboard!');
                }}
                className="px-6 py-3 rounded-xl bg-[#14141E] hover:bg-[#1E1E2C] border border-[#2E2E3E] text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                <Share2 size={15} />
                <span>Chia sẻ vé</span>
              </button>

              {booking?.status !== 'CANCELLED' && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-xs flex items-center gap-2 transition disabled:opacity-50"
                >
                  <span>{isCancelling ? 'Đang hủy...' : 'Hủy đặt vé'}</span>
                </button>
              )}
            </div>

            {/* Appreciation Note */}
            <div className="text-[11px] text-[#606075] leading-relaxed pt-2">
              Cảm ơn bạn đã lựa chọn Ticketor Cinema Booking System. Vui lòng xuất trình mã vé tại quầy hoặc cửa soát vé trước giờ chiếu 15 phút.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
