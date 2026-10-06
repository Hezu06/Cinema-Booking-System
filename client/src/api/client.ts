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
  getMe: () => request('/auth/me'),

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

  createVnpayPayment: (bookingId: string, bankCode?: string) =>
    request<{ payment: Payment; paymentUrl: string }>('/payments/vnpay/create', {
      method: 'POST',
      body: JSON.stringify({ bookingId, ...(bankCode ? { bankCode } : {}) }),
    }),
  getBookingPayments: (bookingId: string) =>
    request<Payment[]>(`/payments/booking/${bookingId}`),
};
