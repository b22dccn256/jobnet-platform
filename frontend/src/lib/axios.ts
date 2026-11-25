import axios, { type InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { logout } from '@/store/authSlice';

const shouldLogApi =
  typeof window !== 'undefined' &&
  (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG_API === 'true');

type TimedConfig = InternalAxiosRequestConfig & { metadata?: { startTime: number } };

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const timedConfig = config as TimedConfig;
  timedConfig.metadata = { startTime: performance.now() };

  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (shouldLogApi) {
    const method = (config.method || 'GET').toUpperCase();
    const url = config.url || '';
    console.info(`[API -->] ${method} ${url}`, {
      params: config.params || undefined,
    });
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (shouldLogApi) {
      const cfg = response.config as TimedConfig;
      const elapsed = cfg.metadata ? Math.round(performance.now() - cfg.metadata.startTime) : 0;
      const method = (cfg.method || 'GET').toUpperCase();
      console.info(
        `[API <--] ${response.status} ${method} ${cfg.url || ''} (${elapsed}ms)`,
        response.data,
      );
    }
    return response;
  },
  (error) => {
    if (shouldLogApi) {
      const cfg = (error?.config || {}) as TimedConfig;
      const elapsed = cfg.metadata ? Math.round(performance.now() - cfg.metadata.startTime) : 0;
      const method = (cfg.method || 'GET').toUpperCase();
      const status = error?.response?.status ?? 'NETWORK/TIMEOUT';
      console.error(
        `[API ERR] ${status} ${method} ${cfg.url || ''} (${elapsed}ms):`,
        error?.response?.data || error?.message,
      );
    }
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  },
);
