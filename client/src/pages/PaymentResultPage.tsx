import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { BookingDetail, Payment } from '../types';
import { api } from '../api/client';

export const PaymentResultPage: React.FC = () => {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId') || sessionStorage.getItem('ticketor_pending_booking_id');
  const signatureValid = params.get('valid') !== 'false';
  const returnCode = params.get('responseCode');
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!bookingId || !signatureValid) {
      setChecking(false);
      return;
    }
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      attempts += 1;
      try {
        const [bookingRes, paymentRes] = await Promise.all([
          api.getBookingById(bookingId),
          api.getBookingPayments(bookingId),
        ]);
        if (bookingRes.success && bookingRes.data) setBooking(bookingRes.data as BookingDetail);
        const latest = paymentRes.data?.[0] ?? null;
        setPayment(latest);
        const done = bookingRes.data?.status !== 'PENDING' || (latest && latest.status !== 'PENDING');
        if (!done && attempts < 15) timer = setTimeout(check, 2000);
        else setChecking(false);
      } catch {
        if (attempts < 15) timer = setTimeout(check, 2000);
        else setChecking(false);
      }
    };
    void check();
    return () => { if (timer) clearTimeout(timer); };
  }, [bookingId, signatureValid]);

  const success = booking?.status === 'CONFIRMED' && payment?.status === 'SUCCESS';
  const failed = !signatureValid
    || (returnCode !== null && returnCode !== '00')
    || payment?.status === 'FAILED'
    || payment?.status === 'EXPIRED'
    || booking?.status === 'EXPIRED';

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="bg-brand-card border border-brand-border rounded-3xl p-8 space-y-5">
        {success ? <CheckCircle2 className="mx-auto text-emerald-400" size={56} /> : failed ? <XCircle className="mx-auto text-red-400" size={56} /> : <Clock className="mx-auto text-amber-400 animate-pulse" size={56} />}
        <h1 className="text-2xl font-black text-white">
          {success ? 'Thanh toán Sandbox thành công' : failed ? 'Thanh toán không thành công' : 'Đang xác nhận thanh toán'}
        </h1>
        <p className="text-sm text-gray-400">
          {success
            ? 'Booking đã được xác nhận và vé điện tử đã được tạo. Đây là giao dịch thử nghiệm, không trừ tiền thật.'
            : failed
            ? 'Booking chưa được xác nhận. Ghế sẽ được giải phóng để bạn có thể chọn lại.'
            : checking
            ? 'VNPAY đang gửi kết quả về hệ thống. Vui lòng không đóng trang.'
            : 'Chưa nhận được kết quả IPN. Bạn có thể kiểm tra lại trong lịch sử booking.'}
        </p>
        {bookingId && <div className="text-xs font-mono text-gray-500">Booking: {booking?.bookingCode || bookingId}</div>}
        <div className="flex justify-center gap-3 pt-3">
          {success && bookingId && <Link to={`/ticket/${bookingId}`} className="px-5 py-3 rounded-xl bg-brand-primary text-black font-bold text-sm">Xem vé</Link>}
          <Link to="/my-bookings" className="px-5 py-3 rounded-xl border border-brand-border text-white font-semibold text-sm">Lịch sử booking</Link>
        </div>
      </div>
    </div>
  );
};
