import type { ApiResponse, HoldSeatsResponse, Payment } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('ticketor_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('ticketor_token', token);
  } else {
    localStorage.removeItem('ticketor_token');
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 404) {
      throw new Error(`Không tìm thấy endpoint API (${BASE_URL}${endpoint}). Vui lòng kiểm tra lại cấu hình biến môi trường VITE_API_URL trên Vercel.`);
    }
    if (res.status >= 500) {
      throw new Error(`Máy chủ Backend đang khởi động lại hoặc gặp sự cố (HTTP ${res.status}). Vui lòng đợi khoảng 30 giây rồi thử lại.`);
    }
    throw new Error(`Máy chủ trả về trang HTML thay vì JSON (HTTP ${res.status}). Vui lòng kiểm tra biến môi trường VITE_API_URL trên Vercel.`);
  }

  const data = await res.json();
  if (!res.ok && !data.message) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (payload: { fullName: string; email: string; phone: string; password: string }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyEmail: (payload: { email: string; code: string }) =>
    request<{ accessToken: string; user: any }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resendVerification: (payload: { email: string; force?: boolean }) =>
    request<{ success: boolean; message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  googleLogin: (idToken: string) =>
    request<{ accessToken: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),
  getMe: () => request('/auth/me'),
  forgotPassword: (payload: { email: string }) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Movies
  getMovies: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request(`/movies${qs ? `?${qs}` : ''}`);
  },
  getMovieById: (id: string) => request(`/movies/${id}`),

  // Cinemas
  getCinemas: (params?: { city?: string }) => {
    const query = new URLSearchParams();
    if (params?.city) query.set('city', params.city);
    const qs = query.toString();
    return request(`/cinemas${qs ? `?${qs}` : ''}`);
  },

  // Showtimes
  getShowtimes: (params?: { movieId?: string; cinemaId?: string; roomId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.movieId) query.set('movieId', params.movieId);
    if (params?.cinemaId) query.set('cinemaId', params.cinemaId);
    if (params?.roomId) query.set('roomId', params.roomId);
    if (params?.date) query.set('date', params.date);
    const qs = query.toString();
    return request(`/showtimes${qs ? `?${qs}` : ''}`);
  },
  getShowtimeById: (id: string) => request(`/showtimes/${id}`),
  getShowtimeSeats: (id: string) => request(`/showtimes/${id}/seats`),

  // Bookings
  holdSeats: (payload: { showtimeId: string; showtimeSeatIds: string[]; durationMinutes?: number }) =>
    request<HoldSeatsResponse>('/bookings/hold', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  releaseSeats: (payload: { showtimeId: string; showtimeSeatIds?: string[] }) =>
    request<{ releasedCount: number }>('/bookings/release', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createBooking: (payload: { showtimeId: string; showtimeSeatIds: string[] }) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyBookings: () => request('/bookings/my-bookings'),
  getBookingById: (id: string) => request(`/bookings/${id}`),
  cancelBooking: (id: string) =>
    request(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Customer cancelled booking' }),
    }),
  resendBookingEmail: (id: string) =>
    request<{ success: boolean; message: string }>(`/bookings/${id}/resend-email`, {
      method: 'POST',
    }),

  createVnpayPayment: (bookingId: string, bankCode?: string) =>
    request<{ payment: Payment; paymentUrl: string }>('/payments/vnpay/create', {
      method: 'POST',
      body: JSON.stringify({ bookingId, ...(bankCode ? { bankCode } : {}) }),
    }),
  getBookingPayments: (bookingId: string) =>
    request<Payment[]>(`/payments/booking/${bookingId}`),
};
