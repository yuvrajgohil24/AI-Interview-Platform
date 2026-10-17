import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Auth lives in httpOnly cookies set by the API (a short-lived access token plus a
// rotating refresh token), so scripts never touch either token.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetriableRequest = InternalAxiosRequestConfig & { _retried?: boolean };

// Endpoints whose 401 means "bad credentials / no session", not "access token expired"
const NO_REFRESH_PATHS = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout'];

// Concurrent 401s share one refresh call, so the token is rotated exactly once
let refreshing: Promise<void> | null = null;
const refreshSession = () => {
  refreshing ??= api.post('/auth/refresh').then(() => undefined).finally(() => { refreshing = null; });
  return refreshing;
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
    // Full reload on purpose: drops all in-memory state for the signed-out user
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/login';
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    if (error.response?.status !== 401 || !original) return Promise.reject(error);

    const path = original.url || '';
    if (NO_REFRESH_PATHS.some(p => path.startsWith(p))) {
      // Refresh itself failed (expired/revoked): the session is over
      if (path.startsWith('/auth/refresh')) redirectToLogin();
      return Promise.reject(error);
    }
    if (original._retried) return Promise.reject(error);

    // Access token expired: refresh once, then replay the request
    original._retried = true;
    try {
      await refreshSession();
    } catch {
      return Promise.reject(error);
    }
    return api(original);
  }
);

export default api;
