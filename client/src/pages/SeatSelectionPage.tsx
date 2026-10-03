import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, AlertCircle, Armchair, Sparkles, Clock, Lock } from 'lucide-react';
import type { Showtime, ShowtimeSeat } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BookingStepper } from '../components/booking/BookingStepper';

export const SeatSelectionPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<ShowtimeSeat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHoldingSeats, setIsHoldingSeats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active user hold state
  const [userHoldExpiresAt, setUserHoldExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const fetchShowtimeAndSeats = () => {
    if (!showtimeId) return;
    setIsLoading(true);
    Promise.all([
      api.getShowtimeById(showtimeId),
      api.getShowtimeSeats(showtimeId),
    ])
      .then(([stRes, seatsRes]) => {
        if (stRes.success && stRes.data) {
          setShowtime(stRes.data);
        }
        if (seatsRes.success && seatsRes.data) {
          const loadedSeats: ShowtimeSeat[] = seatsRes.data;
          setSeats(loadedSeats);

          // Check if current user already has active held seats for this showtime
          if (user) {
            const now = new Date();
            const myHeld = loadedSeats.filter(
              (s) =>
                s.status === 'HELD' &&
                s.heldByUserId === user.id &&
                s.holdExpiresAt &&
                new Date(s.holdExpiresAt) > now
            );

            if (myHeld.length > 0) {
              const myHeldIds = myHeld.map((s) => s.id);
              setSelectedSeatIds((prev) => (prev.length === 0 ? myHeldIds : prev));

              // Determine earliest expiration date
              const expires = myHeld.reduce((earliest, s) => {
                const d = new Date(s.holdExpiresAt!);
                return !earliest || d < earliest ? d : earliest;
              }, null as Date | null);

              if (expires) {
                setUserHoldExpiresAt(expires);
                setRemainingSeconds(Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000)));
              }
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load showtime seats:', err);
        setError('Không thể tải sơ đồ ghế cho suất chiếu này.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchShowtimeAndSeats();
  }, [showtimeId, user]);

  // Countdown timer for active user hold
  useEffect(() => {
    if (!userHoldExpiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((userHoldExpiresAt.getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff === 0) {
        setUserHoldExpiresAt(null);
        setError('Thời gian giữ ghế đã hết hạn. Ghế đã được tự động mở lại.');
        fetchShowtimeAndSeats();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userHoldExpiresAt]);

  const handleSeatClick = (seat: ShowtimeSeat) => {
    const now = new Date();
    const isHoldActive = !!seat.holdExpiresAt && new Date(seat.holdExpiresAt) > now;
    const isHeldByOther =
      seat.status === 'HELD' &&
      isHoldActive &&
      (!user || seat.heldByUserId !== user.id);

    if (seat.status === 'BOOKED') return;

    if (isHeldByOther) {
      setError('Ghế này hiện đang được khách hàng khác tạm khóa để thanh toán.');
      return;
    }

    setError(null);

    const isAlreadySelected = selectedSeatIds.includes(seat.id);

    if (isAlreadySelected) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 8) {
        setError('Mỗi lượt đặt vé chỉ được chọn tối đa 8 ghế.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalAmount = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  const handleAddToCart = async () => {
    if (selectedSeatIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ghế trên sơ đồ trước khi tiếp tục.');
      return;
    }

    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập tài khoản để tạm giữ ghế và tiến hành thanh toán.');
      openAuthModal('login');
      return;
    }

    setError(null);
    setIsHoldingSeats(true);

    try {
      // Call backend to lock seats for 10 minutes
      const res = await api.holdSeats({
        showtimeId: showtimeId!,
        showtimeSeatIds: selectedSeatIds,
        durationMinutes: 10,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Không thể tạm giữ ghế. Vui lòng thử lại.');
      }

      const holdExpiresAt = res.data.holdExpiresAt;

      // Save session draft
      sessionStorage.setItem(
        'ticketor_booking_draft',
        JSON.stringify({
          showtimeId,
          showtime,
          selectedSeatIds,
          selectedSeats,
          totalSeatsAmount: totalAmount,
          holdExpiresAt,
        })
      );

      // Direct transition to Payment
      navigate(`/booking/${showtimeId}/payment`, {
        state: {
          showtime,
          selectedSeats,
          totalSeatsAmount: totalAmount,
          holdExpiresAt,
        },
      });
    } catch (err: any) {
      console.error('Failed to hold seats:', err);
      setError(
        err.message || 'Ghế bạn chọn vừa có khách hàng khác tạm giữ hoặc đặt trước. Đang làm mới sơ đồ ghế...'
      );
      // Refresh seat diagram
      if (showtimeId) {
        api.getShowtimeSeats(showtimeId).then((r) => {
          if (r.success && r.data) setSeats(r.data);
        });
      }
    } finally {
      setIsHoldingSeats(false);
    }
  };

  const handleReleaseMyHold = async () => {
    if (!showtimeId || !user) return;
    try {
      await api.releaseSeats({ showtimeId, showtimeSeatIds: selectedSeatIds });
      setSelectedSeatIds([]);
      setUserHoldExpiresAt(null);
      setRemainingSeconds(0);
      fetchShowtimeAndSeats();
    } catch (err) {
      console.error('Failed to release hold:', err);
    }
  };

  // Group seats by row
  const seatsByRow: Record<string, ShowtimeSeat[]> = {};
  seats.forEach((s) => {
    const row = s.seat.rowLabel;
    if (!seatsByRow[row]) seatsByRow[row] = [];
    seatsByRow[row].push(s);
  });

  const sortedRows = Object.keys(seatsByRow).sort();
  sortedRows.forEach((row) => {
    seatsByRow[row].sort((a, b) => a.seat.seatNumber - b.seat.seatNumber);
  });

  const upperRows = sortedRows.filter((r) => r <= 'D');
  const lowerRows = sortedRows.filter((r) => r > 'D');

  if (isLoading || !showtime) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center animate-pulse space-y-6">
        <div className="h-44 bg-[#14141E] rounded-3xl" />
        <div className="h-64 bg-[#14141E] rounded-3xl" />
      </div>
    );
  }

  const movie = showtime.movie;
  const cinema = showtime.room?.cinema;

  // Render individual seat item
  const renderSeat = (stSeat: ShowtimeSeat, rowLabel: string) => {
    const isSelected = selectedSeatIds.includes(stSeat.id);
    const now = new Date();
    const isHoldActive = !!stSeat.holdExpiresAt && new Date(stSeat.holdExpiresAt) > now;
    const isHeldByOther =
      stSeat.status === 'HELD' &&
      isHoldActive &&
      (!user || stSeat.heldByUserId !== user.id);
    const isHeldByMe =
      stSeat.status === 'HELD' &&
      isHoldActive &&
      !!user &&
      stSeat.heldByUserId === user.id;

    const isBooked = stSeat.status === 'BOOKED';
    const isUnavailable = isBooked || isHeldByOther;
    const isVip = stSeat.seat.type === 'VIP';
    const isCouple = stSeat.seat.type === 'COUPLE';
    const seatNum = stSeat.seat.seatNumber;

    let seatStyle = '';
    if (isSelected) {
      seatStyle =
        'bg-[#FCFC65] text-[#08080C] shadow-neon scale-110 ring-2 ring-[#FCFC65]/60 font-black border-[#FCFC65] z-10';
    } else if (isHeldByOther) {
      seatStyle =
        'bg-amber-500/20 text-amber-400 border border-dashed border-amber-500/70 cursor-not-allowed opacity-80';
    } else if (isBooked) {
      seatStyle =
        'bg-[#14141C] text-[#363646] cursor-not-allowed border border-[#1E1E26] opacity-60';
    } else if (isHeldByMe) {
      seatStyle =
        'bg-[#FCFC65]/30 text-[#FCFC65] border border-[#FCFC65]/80 hover:scale-105 shadow-sm';
    } else if (isVip) {
      seatStyle =
        'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/80 hover:bg-[#F59E0B]/40 hover:scale-105 shadow-sm';
    } else if (isCouple) {
      seatStyle =
        'bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/80 hover:bg-[#EC4899]/40 hover:scale-105 shadow-sm';
    } else {
      seatStyle =
        'bg-[#262634] text-[#C0C0D0] border border-[#3E3E52] hover:bg-[#353548] hover:border-[#FCFC65]/60 hover:scale-105';
    }

    return (
      <div key={stSeat.id} className="relative group">
        <button
          onClick={() => handleSeatClick(stSeat)}
          disabled={isUnavailable}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md transition-all flex items-center justify-center text-[10px] font-bold ${seatStyle}`}
        >
          {isHeldByOther ? (
            <Lock size={11} className="text-amber-400" />
          ) : (
            <span
              className={
                isSelected || isHeldByMe
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 transition-opacity'
              }
            >
              {seatNum}
            </span>
          )}
        </button>

        {/* Hover Tooltip with Type, Status and Price */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all bg-[#181824] border border-[#303042] text-white font-semibold text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-30">
          <span className="text-[#FCFC65] font-bold">
            {rowLabel}
            {seatNum < 10 ? `0${seatNum}` : seatNum}
          </span>
          <span className="mx-1">·</span>
          {isHeldByOther ? (
            <span className="text-amber-400 font-bold">Tạm giữ bởi khách khác</span>
          ) : isBooked ? (
            <span className="text-gray-400">Đã bán</span>
          ) : (
            <>
              <span
                className={
                  isVip ? 'text-[#FCD34D] font-bold' : isCouple ? 'text-[#F472B6]' : 'text-gray-300'
                }
              >
                {isVip ? 'VIP' : isCouple ? 'Couple' : 'Thường'}
              </span>
              <span className="mx-1">·</span>
              <span>{Number(stSeat.price).toLocaleString('vi-VN')} đ</span>
            </>
          )}
        </div>
      </div>
    );
  };

  const timerMin = Math.floor(remainingSeconds / 60);
  const timerSec = remainingSeconds % 60;
  const formattedCountdown = `${String(timerMin).padStart(2, '0')}:${String(timerSec).padStart(2, '0')}`;

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
          <BookingStepper currentStep="seat" />
        </div>
      </div>

      {/* Active User Hold Banner (if returning from checkout) */}
      {userHoldExpiresAt && remainingSeconds > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <Clock size={16} className="text-amber-400 animate-pulse shrink-0" />
              <span>
                Bạn đang tạm giữ <strong className="text-[#FCFC65]">{selectedSeatIds.length} ghế</strong> cho suất chiếu này. Thời gian giữ ghế còn lại:
              </span>
              <span className="font-mono font-black text-sm text-[#FCFC65] bg-black/40 px-2 py-0.5 rounded border border-amber-500/40">
                {formattedCountdown}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReleaseMyHold}
                className="text-[11px] font-semibold text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-[#3E3E52] hover:bg-[#20202E] transition"
              >
                Hủy giữ ghế
              </button>
              <button
                onClick={handleAddToCart}
                className="text-[11px] font-bold text-black bg-[#FCFC65] hover:bg-[#EAEA48] px-3.5 py-1.5 rounded-lg shadow-sm transition"
              >
                Tiếp tục thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/30 border border-red-800/50 rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main 3-Column Layout (Figma Seat Selection Screen) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
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
                  {showtime.room?.name} · {showtime.room?.type}
                </div>
              </div>

              {/* Date & Time Badges */}
              <div className="flex gap-2">
                <div className="flex-1 bg-[#14141E] border border-[#222230] rounded-xl p-2.5">
                  <div className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">Ngày chiếu</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {new Date(showtime.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </div>
                </div>

                <div className="flex-1 bg-[#14141E] border border-[#222230] rounded-xl p-2.5">
                  <div className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">Giờ chiếu</div>
                  <div className="text-xs font-bold text-[#FCFC65] mt-0.5">
                    {new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                </div>
              </div>

              {/* Price Tier Reference */}
              <div className="p-3 bg-[#12121A] border border-[#20202E] rounded-xl space-y-2 text-xs">
                <div className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#FCFC65]" />
                  <span>Bảng giá theo hạng ghế</span>
                </div>
                <div className="flex justify-between items-center text-[#A0A0B0]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#262634] border border-[#3E3E52]" />
                    <span>Ghế Thường</span>
                  </span>
                  <span className="text-white font-medium">
                    {Number(showtime.basePrice).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#A0A0B0]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#F59E0B]/30 border border-[#F59E0B]" />
                    <span className="text-[#FCD34D] font-semibold">Ghế VIP</span>
                  </span>
                  <span className="text-[#FCD34D] font-bold">
                    {Math.round(Number(showtime.basePrice) * 1.2).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CENTER COLUMN: Interactive Curved Cinema Screen & Seat Grid */}
          <div className="lg:col-span-6 bg-[#101016] border border-[#1E1E2A] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
            {/* Curved Movie Screen Graphic */}
            <div className="w-full max-w-sm mb-10 flex flex-col items-center">
              <svg className="w-full h-8 text-[#FCFC65]/60" viewBox="0 0 300 20" fill="none">
                <path
                  d="M 10,16 Q 150,0 290,16"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[10px] tracking-widest text-[#707085] uppercase font-bold mt-1">
                Màn hình chiếu (Screen)
              </span>
            </div>

            {/* Upper Tier Rows (A, B, C, D) */}
            <div className="space-y-3 w-full flex flex-col items-center">
              {upperRows.map((rowLabel) => (
                <div key={rowLabel} className="flex items-center gap-2 sm:gap-3">
                  <span className="w-4 text-center text-xs font-bold text-[#656578]">
                    {rowLabel}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {seatsByRow[rowLabel]?.map((stSeat) => renderSeat(stSeat, rowLabel))}
                  </div>

                  <span className="w-4 text-center text-xs font-bold text-[#656578]">
                    {rowLabel}
                  </span>
                </div>
              ))}
            </div>

            {/* Aisle Gap */}
            <div className="w-full my-5 border-t border-dashed border-[#20202E]" />

            {/* Lower Tier Rows (E, F, G, H...) */}
            <div className="space-y-3 w-full flex flex-col items-center">
              {lowerRows.map((rowLabel) => (
                <div key={rowLabel} className="flex items-center gap-2 sm:gap-3">
                  <span className="w-4 text-center text-xs font-bold text-[#656578]">
                    {rowLabel}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {seatsByRow[rowLabel]?.map((stSeat) => renderSeat(stSeat, rowLabel))}
                  </div>

                  <span className="w-4 text-center text-xs font-bold text-[#656578]">
                    {rowLabel}
                  </span>
                </div>
              ))}
            </div>

            {/* Selected Seats Bar & Legend */}
            <div className="w-full mt-8 pt-5 border-t border-[#1C1C26] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              {/* Selected List */}
              <div className="flex items-center gap-2">
                <Armchair size={15} className="text-[#FCFC65]" />
                <span className="font-bold text-white">
                  Đã chọn {selectedSeats.length} ghế:
                </span>
                <span className="text-[#74CFCF] font-mono font-semibold ml-1">
                  {selectedSeats.map((s) => `${s.seat.rowLabel}${s.seat.seatNumber}`).join(', ') || 'Chưa chọn'}
                </span>
              </div>

              {/* Legend with VIP & Standard & Held */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8E8E9E]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#262634] border border-[#3E3E52]" />
                  <span>Ghế Thường</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#F59E0B]/30 border border-[#F59E0B]" />
                  <span className="text-[#FCD34D] font-semibold">Ghế VIP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#FCFC65] shadow-sm" />
                  <span className="text-[#FCFC65] font-semibold">Đang chọn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-dashed border-amber-500/70 flex items-center justify-center">
                    <Lock size={8} className="text-amber-400" />
                  </div>
                  <span className="text-amber-400 font-semibold">Tạm giữ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#14141C] border border-[#1E1E26]" />
                  <span>Đã đặt</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RIGHT COLUMN: Selected Seats Breakdown & Checkout CTA */}
          <div className="lg:col-span-3 bg-[#12121A] border border-[#20202E] rounded-3xl p-6 space-y-6 shadow-xl">
            <h3 className="font-bold text-white text-base">Thông tin vé đã chọn</h3>

            {/* Individual selected seats breakdown */}
            <div className="space-y-2.5 text-xs">
              {selectedSeats.length === 0 ? (
                <div className="py-6 text-center text-[#707085] italic">
                  Vui lòng nhấp chọn ghế ngồi mong muốn trên sơ đồ phòng chiếu.
                </div>
              ) : (
                <div className="space-y-2 divide-y divide-[#1E1E2C] max-h-60 overflow-y-auto pr-1">
                  {selectedSeats.map((stSeat) => {
                    const isVip = stSeat.seat.type === 'VIP';
                    return (
                      <div key={stSeat.id} className="flex justify-between items-center pt-2">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="text-[#FCFC65] font-mono">{stSeat.seat.rowLabel}{stSeat.seat.seatNumber}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded ${isVip ? 'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/40' : 'bg-[#252535] text-gray-300'}`}>
                              {isVip ? 'VIP' : 'Thường'}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-white">
                          {Number(stSeat.price).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total Payment */}
            <div className="pt-4 border-t border-[#20202E] flex items-center justify-between">
              <span className="text-xs text-[#8E8E9E]">Tổng thanh toán:</span>
              <span className="text-xl font-black text-[#FCFC65]">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={selectedSeatIds.length === 0 || isHoldingSeats}
                className="w-full py-3.5 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] disabled:opacity-40 disabled:cursor-not-allowed text-[#08080C] font-bold text-xs shadow-neon transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                {isHoldingSeats ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Đang giữ ghế...</span>
                  </>
                ) : (
                  <span>Tiếp tục thanh toán</span>
                )}
              </button>

              <button
                onClick={() => navigate(-1)}
                className="w-full py-3 rounded-xl border border-[#2E2E3E] text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1A1A26] transition"
              >
                Quay lại chọn suất chiếu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
