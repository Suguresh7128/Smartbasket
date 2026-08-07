import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers (SecureStore = encrypted on device) ────────────
export const getToken = async (key: string) => {
  try { return await SecureStore.getItemAsync(key); }
  catch { return null; }
};
export const setToken = async (key: string, value: string) => {
  try { await SecureStore.setItemAsync(key, value); }
  catch {}
};
export const removeToken = async (key: string) => {
  try { await SecureStore.deleteItemAsync(key); }
  catch {}
};

// ─── Attach token ──────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getToken('accessToken');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auto-refresh on 401 ──────────────────────────────────────────
let isRefreshing = false;
type QueueItem = { resolve: (value: unknown) => void; reject: (reason?: any) => void; config: any };
let queue: QueueItem[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, config: original });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await getToken('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await setToken('accessToken', data.data.accessToken);
        await setToken('refreshToken', data.data.refreshToken);

        queue.forEach(q => {
          if (q.config.headers) q.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          q.resolve(api(q.config));
        });
        queue = [];

        if (original.headers) original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (err) {
        queue.forEach(q => q.reject(error));
        queue = [];
        await removeToken('accessToken');
        await removeToken('refreshToken');
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── API exports ──────────────────────────────────────────────────
export const authAPI = {
  register: (d: object) => api.post('/auth/register', d),
  login: (d: object) => api.post('/auth/login', d),
  logout: (r: string) => api.post('/auth/logout', { refreshToken: r }),
  getMe: () => api.get('/auth/me'),
  updateFcmToken: (t: string) => api.patch('/auth/fcm-token', { fcmToken: t }),
};

export const productsAPI = {
  search: (q: string, params?: object) => api.get('/products/search', { params: { q, ...params } }),
  get: (id: string) => api.get(`/products/${id}`),
  trending: () => api.get('/products/trending'),
  categories: () => api.get('/products/categories'),
};

export const pricesAPI = {
  compare: (productId: string, pincode?: string) => api.get(`/prices/compare/${productId}`, { params: pincode ? { pincode } : {} }),
  optimize: (productIds: string[]) => api.post('/prices/optimize', { productIds }),
  history: (productId: string, storeId: string) => api.get(`/prices/history/${productId}/${storeId}`),
  submit: (d: object) => api.post('/prices', d),
};

export const billsAPI = {
  upload: (formData: FormData) => api.post('/bills/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  get: (id: string) => api.get(`/bills/${id}`),
  list: (page?: number) => api.get('/bills', { params: { page } }),
  update: (id: string, d: object) => api.patch(`/bills/${id}`, d),
};

export const alertsAPI = {
  list: () => api.get('/alerts'),
  create: (d: object) => api.post('/alerts', d),
  delete: (id: string) => api.delete(`/alerts/${id}`),
  toggle: (id: string) => api.patch(`/alerts/${id}/toggle`),
};

export const analyticsAPI = {
  me: (months?: number) => api.get('/analytics/me', { params: { months } }),
};

export const storesAPI = {
  list: () => api.get('/stores'),
};

export default api;

export const locationAPI = {
  lookup: (pincode: string) => api.get(`/location/pincode/${pincode}`),
  getStores: (pincode: string) => api.get(`/location/stores/${pincode}`),
  autocomplete: (q: string) => api.get('/location/autocomplete', { params: { q } }),
  save: (pincode: string) => api.post('/location/save', { pincode }),
};
