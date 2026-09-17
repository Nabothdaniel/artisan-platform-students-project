import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const expoHost = hostUri?.split(':')[0];

  if (expoHost && expoHost !== '127.0.0.1' && expoHost !== 'localhost') {
    return expoHost;
  }

  return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
};

const API_BASE_URL = `http://${getApiHost()}:8000/api`;

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'An error occurred with API request.');
    }
    return data;
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userPayload: any) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userPayload),
    }),

  getMe: (token: string) =>
    request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Artisans
  getArtisans: (params?: { trade_category?: string; verified_only?: boolean; search?: string; min_rating?: number }) => {
    const query = new URLSearchParams();
    if (params?.trade_category) query.append('trade_category', params.trade_category);
    if (params?.verified_only) query.append('verified_only', 'true');
    if (params?.search) query.append('search', params.search);
    if (params?.min_rating) query.append('min_rating', params.min_rating.toString());

    return request(`/artisans?${query.toString()}`);
  },

  getArtisanDetail: (id: number) => request(`/artisans/${id}`),

  // Skills & Quiz
  getSkills: () => request('/skills'),

  submitQuiz: (payload: { skill_id: number; answers: { question_id: number; selected_option: string }[] }, token: string) =>
    request('/skills/submit-quiz', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  // KYC
  submitKYC: (payload: { id_type: string; id_token: string }, token: string) =>
    request('/kyc/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  getKYCStatus: (token: string) =>
    request('/kyc/status', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Bookings & Bids
  getBookings: (params?: { status?: string; my_jobs?: boolean }, token?: string) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.my_jobs) query.append('my_jobs', 'true');

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return request(`/bookings?${query.toString()}`, { headers });
  },

  createBooking: (payload: any, token: string) =>
    request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  submitBid: (bookingId: number, payload: { proposed_price: number; estimated_hours: number; notes: string }, token: string) =>
    request(`/bookings/${bookingId}/bids`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  acceptBid: (bookingId: number, bidId: number, token: string) =>
    request(`/bookings/${bookingId}/accept-bid/${bidId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateBookingStatus: (bookingId: number, status: string, token: string) =>
    request(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),

  // Reviews
  submitReview: (payload: { booking_id: number; rating: number; comment?: string }, token: string) =>
    request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  getArtisanReviews: (artisanId: number) => request(`/reviews/artisan/${artisanId}`),

  // Admin Module
  getAdminStats: (token?: string) =>
    request('/admin/stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  getAuditLogs: (token?: string) =>
    request('/admin/audit-logs', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  getPendingKYC: (token?: string) =>
    request('/kyc/pending', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  approveKYC: (kycId: number, approved: boolean, notes: string, token?: string) =>
    request(`/kyc/approve/${kycId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ approved, notes }),
    }),
};
