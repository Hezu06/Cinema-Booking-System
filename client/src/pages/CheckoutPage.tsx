import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, Eye, EyeOff, AlertCircle, Armchair, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { BookingStepper } from '../components/booking/BookingStepper';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [bookingDraft, setBookingDraft] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'MOMO' | 'VNPAY' | 'ZALOPAY' | 'APPLE'>('VNPAY');

  // Card form state matching Figma
  const [cardNumber, setCardNumber] = useState('9704 2201 8492 5618');
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2028');
  const [cvv, setCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState('NGUYEN VAN A');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  // Seat hold timer states
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const passed = location.state;
    let draft = passed;
    if (!draft) {
      const stored = sessionStorage.getItem('ticketor_booking_draft');
      if (stored) {
        draft = JSON.parse(stored);
      }
    }

    if (draft) {
      setBookingDraft(draft);
      if (draft.holdExpiresAt) {
        const expires = new Date(draft.holdExpiresAt);
        setHoldExpiresAt(expires);
        const diff = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
        setRemainingSeconds(diff);
        if (diff <= 0) {
          setIsExpired(true);
        }
      } else {
        // Fallback to 10 minutes if no expiration timestamp found
        const fallbackExpires = new Date(Date.now() + 10 * 60 * 1000);
        setHoldExpiresAt(fallbackExpires);
        setRemainingSeconds(600);
      }
    } else {
      navigate('/');
    }
  }, [location, navigate]);

  // Active countdown timer
  useEffect(() => {
    if (!holdExpiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((holdExpiresAt.getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  if (!bookingDraft) return null;

  const showtime = bookingDraft.showtime;
  const movie = showtime?.movie;
  const cinema = showtime?.room?.cinema;
  const selectedSeats = bookingDraft.selectedSeats || [];
  const grandTotal =
    bookingDraft.totalSeatsAmount ||
    selectedSeats.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);

  const handleReturnToSeats = () => {
    sessionStorage.removeItem('ticketor_booking_draft');
    if (showtime?.id) {
      navigate(`/booking/${showtime.id}`);
    } else {
      navigate('/');
    }
  };

  const handleCompletePayment = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (isExpired || remainingSeconds <= 0) {
      setError('Thời gian giữ ghế đã hết hạn. Vui lòng chọn lại ghế để tiếp tục.');
      return;
    }

    if (paymentMethod !== 'VNPAY') {
      setError('Giai đoạn này chỉ hỗ trợ thanh toán mô phỏng qua VNPAY Sandbox.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      let bookingId = pendingBookingId;
      let bookingCode: string | undefined;

      if (!bookingId) {
        const seatIds = selectedSeats.map((s: any) => s.id);
        const res = await api.createBooking({
          showtimeId: showtime.id,
          showtimeSeatIds: seatIds,
        });

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Xử lý đặt vé thất bại. Vui lòng thử lại.');
        }

        bookingId = res.data.id;
        bookingCode = res.data.bookingCode;
        setPendingBookingId(bookingId);
      }

      if (!bookingId) throw new Error('Không xác định được booking cần thanh toán.');
      const activeBookingId = bookingId;
      const paymentRes = await api.createVnpayPayment(activeBookingId);
      if (!paymentRes.success || !paymentRes.data?.paymentUrl) {
        throw new Error(paymentRes.message || 'Không thể tạo liên kết thanh toán VNPAY.');
      }

      // Save receipt state with populated data
      sessionStorage.setItem(
        'ticketor_latest_receipt',
        JSON.stringify({
          bookingId: activeBookingId,
          bookingCode: bookingCode || activeBookingId.slice(0, 8).toUpperCase(),
          movie,
          cinema,
          showtime,
          selectedSeats,
          grandTotal,
          customer: {
            name: user?.fullName || 'Khách hàng',
            phone: user?.phone || '0901234567',
            email: user?.email || 'user@example.com',
          },
        })
      );

      sessionStorage.removeItem('ticketor_booking_draft');
      sessionStorage.setItem('ticketor_pending_booking_id', activeBookingId);
      window.location.assign(paymentRes.data.paymentUrl);
    } catch (err: any) {
      console.error('Booking checkout error:', err);
      setError(err.message || 'Đặt vé thất bại. Một số ghế có thể đã hết hạn giữ chỗ hoặc được người khác đặt trước.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timerMin = Math.floor(remainingSeconds / 60);
  const timerSec = remainingSeconds % 60;
  const formattedCountdown = `${String(timerMin).padStart(2, '0')}:${String(timerSec).padStart(2, '0')}`;
  const isLowTime = remainingSeconds > 0 && remainingSeconds <= 120;

  return (
    <div className="w-full text-[#F1F1F4] pb-24">
      {/* Top Header Row with Title and Stepper */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#20202E]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">{movie?.title}</h1>
          <div className="flex items-center gap-2 text-xs text-[#8E8E9E] mt-0.5">
            <span>{movie?.durationMinutes} phút</span>
            <span>·</span>
            <span className="border border-[#353545] px-1.5 py-0.5 rounded text-[10px] text-white">T16</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-[#FCFC65] font-bold">
              <Star size={12} fill="currentColor" />
              {movie?.genre || 'Điện ảnh'}
            </span>
          </div>
        </div>

        {/* Stepper */}
        <div className="w-full md:w-auto">
          <BookingStepper currentStep="payment" />
        </div>
      </div>

      {/* Seat Holding Timer Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
        <div
          className={`rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl ${
            isExpired
              ? 'bg-red-950/50 border-red-500/80 text-red-300'
              : isLowTime
              ? 'bg-red-950/40 border-red-500/60 ring-2 ring-red-500/30 animate-pulse'
              : 'bg-[#14141E] border-amber-500/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center ${
                isExpired
                  ? 'bg-red-500/30 text-red-300'
                  : isLowTime
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <Clock size={20} className={isLowTime ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="text-xs text-white font-bold flex items-center gap-2">
                <span>Thời gian giữ ghế thanh toán</span>
                {isLowTime && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold">
                    Sắp hết giờ!
                  </span>
                )}
                {isExpired && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-bold">
                    Đã hết giờ
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#A0A0B0] mt-0.5">
                {isExpired
                  ? 'Hết thời gian giữ ghế. Vui lòng bấm chọn lại ghế để thực hiện lại.'
                  : 'Ghế của bạn đang được tạm khóa. Vui lòng hoàn tất thanh toán trước khi hết giờ.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#8E8E9E] block">
                Thời gian còn lại
              </span>
              <span
                className={`font-mono text-2xl font-black ${
                  isExpired ? 'text-red-400' : isLowTime ? 'text-red-400' : 'text-[#FCFC65]'
                }`}
              >
                {formattedCountdown}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/30 border border-red-800/50 rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 1. LEFT COLUMN: Order Summary */}
          <div className="lg:col-span-3 space-y-5">
            <div className="aspect-[2/3] rounded-3xl overflow-hidden bg-[#161622] border border-[#252535] shadow-xl">
              <img
                src={movie?.posterUrl}
                alt={movie?.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-white text-sm">
                  {cinema?.name || 'Rạp Chiếu Phim'}
                </h4>
                <p className="text-[11px] text-[#74CFCF] mt-0.5">
                  {cinema?.address || 'Hà Nội / TP. Hồ Chí Minh'}
                </p>
                <div className="mt-1 text-xs text-[#FCFC65] font-semibold">
                  {showtime?.room?.name} · {showtime?.room?.type}
                </div>
              </div>

              {/* Date & Time Badges */}
              <div className="flex gap-2">
                <div className="flex-1 bg-[#14141E] border border-[#222230] rounded-xl p-2.5">
                  <div className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">Ngày chiếu</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {showtime?.startTime ? new Date(showtime.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }) : 'Hôm nay'}
                  </div>
                </div>

                <div className="flex-1 bg-[#14141E] border border-[#222230] rounded-xl p-2.5">
                  <div className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">Giờ chiếu</div>
                  <div className="text-xs font-bold text-[#FCFC65] mt-0.5">
                    {showtime?.startTime ? new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '10:30'}
                  </div>
                </div>
              </div>

              {/* Selected Seats Badges */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-[#8E8E9E] flex items-center gap-1">
                  <Armchair size={12} className="text-[#FCFC65]" />
                  <span>Ghế đang giữ</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.length > 0 ? (
                    selectedSeats.map((s: any) => (
                      <span
                        key={s.id}
                        className="px-2.5 py-1 bg-[#181824] border border-[#2A2A3A] text-[#FCFC65] text-xs font-mono font-bold rounded-lg shadow-sm"
                      >
                        {s.seat.rowLabel}{s.seat.seatNumber}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Chưa chọn ghế</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. CENTER COLUMN: Method of Payment & Details */}
          <div className="lg:col-span-6 bg-[#101016] border border-[#1E1E2A] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <h3 className="font-bold text-white text-base">Phương thức thanh toán</h3>

            {/* Payment Method Radio Options */}
            <div className="space-y-3">
              {[
                { id: 'VNPAY', label: 'VNPAY Sandbox (không trừ tiền thật)' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id as any)}
                  className="flex items-center gap-3 cursor-pointer py-2 px-3.5 rounded-xl border border-[#1F1F2B] hover:border-[#353545] bg-[#14141E] transition text-xs text-[#BCBCC8] hover:text-white"
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition shrink-0 ${
                      paymentMethod === opt.id
                        ? 'border-[#FCFC65] bg-[#FCFC65]'
                        : 'border-[#404055] bg-transparent'
                    }`}
                  >
                    {paymentMethod === opt.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#08080C]" />
                    )}
                  </div>
                  <span className={paymentMethod === opt.id ? 'font-bold text-white' : ''}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            {/* If Card Payment: Figma form */}
            {paymentMethod === 'CARD' && (
              <div className="space-y-4 pt-2 border-t border-[#1C1C26]">
                <div className="text-xs text-[#8E8E9E]">Thông tin thẻ ngân hàng:</div>
                {/* Card Number */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-[#8E8E9E]">Số thẻ (Card Number)</label>
                  <div className="relative">
                    <input
                      type={showCardNumber ? 'text' : 'password'}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-[#161622] border border-[#282838] rounded-xl px-4 py-2.5 text-xs text-white tracking-widest focus:outline-none focus:border-[#FCFC65]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCardNumber(!showCardNumber)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707085] hover:text-white"
                    >
                      {showCardNumber ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Card Holder */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-[#8E8E9E]">Tên chủ thẻ (Cardholder Name)</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="w-full bg-[#161622] border border-[#282838] rounded-xl px-4 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-[#FCFC65]"
                  />
                </div>

                {/* Exp Month & Exp Year & CVV */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-[#8E8E9E]">Tháng hết hạn</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      className="w-full bg-[#161622] border border-[#282838] rounded-xl px-3 py-2.5 text-xs text-white text-center focus:outline-none focus:border-[#FCFC65]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-[#8E8E9E]">Năm hết hạn</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      className="w-full bg-[#161622] border border-[#282838] rounded-xl px-3 py-2.5 text-xs text-white text-center focus:outline-none focus:border-[#FCFC65]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-[#8E8E9E]">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full bg-[#161622] border border-[#282838] rounded-xl px-3 py-2.5 text-xs text-white text-center focus:outline-none focus:border-[#FCFC65]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* If E-Wallet (MoMo, VNPay, ZaloPay): Instant QR info */}
            {paymentMethod !== 'CARD' && (
              <div className="p-4 bg-[#14141E] border border-[#222230] rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FCFC65]/10 border border-[#FCFC65]/30 flex items-center justify-center shrink-0 text-[#FCFC65] font-black text-sm">
                  QR
                </div>
                <div className="text-xs text-[#A0A0B0]">
                  <p className="font-semibold text-white">Thanh toán thử nghiệm qua VNPAY Sandbox</p>
                  <p className="text-[11px] text-[#707085] mt-0.5">
                    Bạn sẽ được chuyển sang cổng VNPAY Sandbox. Không có tiền thật bị trừ; vé chỉ được tạo sau khi callback thanh toán thành công.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. RIGHT COLUMN: Order Details (Figma screen 1 & 2) */}
          <div className="lg:col-span-3 bg-[#12121A] border border-[#20202E] rounded-3xl p-6 space-y-5 shadow-xl">
            <h3 className="font-bold text-white text-base">Chi tiết đơn hàng</h3>

            {/* Selected seats list breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#8E8E9E] font-semibold border-b border-[#1E1E2C] pb-2">
                <span>Ghế đã chọn</span>
                <span>Giá</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {selectedSeats.map((s: any) => {
                  const type = s.seat?.type || 'STANDARD';
                  const isVip = type === 'VIP';
                  const isCouple = type === 'COUPLE';

                  return (
                    <div key={s.id} className="flex justify-between items-center text-xs py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white px-2 py-0.5 bg-[#181824] border border-[#2A2A3A] rounded">
                          {s.seat.rowLabel}{s.seat.seatNumber}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            isVip
                              ? 'bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#FCD34D]'
                              : isCouple
                              ? 'bg-[#EC4899]/20 border-[#EC4899]/40 text-[#F472B6]'
                              : 'bg-[#262634] border-[#3E3E52] text-[#8E8E9E]'
                          }`}
                        >
                          {isVip ? 'VIP' : isCouple ? 'Ghế đôi' : 'Thường'}
                        </span>
                      </div>
                      <span className="font-semibold text-white">
                        {Number(s.price).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Convenience fee & Taxes */}
            <div className="space-y-1.5 text-xs text-[#8E8E9E] pt-2 border-t border-[#1C1C26]">
              <div className="flex justify-between">
                <span>Phí tiện ích:</span>
                <span className="text-emerald-400 font-semibold">Miễn phí</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế VAT:</span>
                <span className="text-white">Đã bao gồm trong giá vé</span>
              </div>
            </div>

            {/* TOTAL */}
            <div className="pt-4 border-t border-[#20202E] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">TỔNG TIỀN</span>
              <span className="text-xl font-black text-[#FCFC65]">{grandTotal.toLocaleString('vi-VN')} đ</span>
            </div>

            {/* Complete Payment Button */}
            <div className="pt-2 space-y-2.5">
              <button
                onClick={handleCompletePayment}
                disabled={isSubmitting || isExpired || remainingSeconds <= 0}
                className="w-full py-3.5 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] disabled:opacity-40 disabled:cursor-not-allowed text-[#08080C] font-bold text-xs shadow-neon transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Đang tạo liên kết VNPAY...</span>
                  </>
                ) : (
                  <span>Thanh toán qua VNPAY Sandbox</span>
                )}
              </button>

              <button
                onClick={handleReturnToSeats}
                className="w-full py-2.5 rounded-xl border border-[#2E2E3E] text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1A1A26] transition"
              >
                Quay lại chọn ghế
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeout Expiration Modal */}
      {isExpired && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14141E] border border-red-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Hết thời gian giữ ghế</h3>
              <p className="text-xs text-[#8E8E9E] mt-2 leading-relaxed">
                Thời gian 10 phút tạm khóa giữ ghế của bạn đã hết hạn. Hệ thống đã tự động giải phóng ghế để nhường quyền chọn cho khách hàng khác. Vui lòng chọn lại ghế để tiếp tục đặt vé.
              </p>
            </div>
            <button
              onClick={handleReturnToSeats}
              className="w-full py-3.5 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-black font-bold text-xs shadow-neon transition transform active:scale-95"
            >
              Chọn lại ghế ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
