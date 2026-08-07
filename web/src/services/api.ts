import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = localStorage.getItem('accessToken');
  if (token && config && config.headers) (config.headers as any).Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// Auto-refresh on 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (original.headers) (original.headers as any).Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = (typeof window !== 'undefined') ? localStorage.getItem('refreshToken') : null;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
        }

        refreshQueue.forEach(cb => cb(accessToken));
        refreshQueue = [];

        if (original.headers) (original.headers as any).Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  register: (data: object) => api.post('/auth/register', data),
  login: (data: object) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  updateFcmToken: (fcmToken: string) => api.patch('/auth/fcm-token', { fcmToken }),
};

export const productsAPI = {
  search: (q: string, params?: object) => api.get('/products/search', { params: { q, ...params } }),
  get: (id: string) => api.get(`/products/${id}`),
  trending: () => api.get('/products/trending'),
  categories: () => api.get('/products/categories'),
  create: (data: object) => api.post('/products', data),
  update: (id: string, data: object) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const pricesAPI = {
  compare: (productId: string, pincode?: string) =>
    api.get(`/prices/compare/${productId}`, { params: pincode ? { pincode } : {} }),
  optimizeBasket: (productIds: string[]) => api.post('/prices/optimize', { productIds }),
  history: (productId: string, storeId: string, days?: number) =>
    api.get(`/prices/history/${productId}/${storeId}`, { params: { days } }),
  submit: (data: object) => api.post('/prices', data),
  approve: (id: string) => api.patch(`/prices/${id}/approve`),
  delete: (id: string) => api.delete(`/prices/${id}`),
};

export const billsAPI = {
  upload: (formData: FormData) =>
    api.post('/bills/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  get: (id: string) => api.get(`/bills/${id}`),
  list: (page?: number) => api.get('/bills', { params: { page } }),
  update: (id: string, data: object) => api.patch(`/bills/${id}`, data),
};

export const alertsAPI = {
  list: () => api.get('/alerts'),
  create: (data: object) => api.post('/alerts', data),
  delete: (id: string) => api.delete(`/alerts/${id}`),
  toggle: (id: string) => api.patch(`/alerts/${id}/toggle`),
};

export const analyticsAPI = {
  me: (months?: number) => api.get('/analytics/me', { params: { months } }),
};

export const storesAPI = {
  list: () => api.get('/stores'),
};

export const adminAPI = {
  stats: () => api.get('/analytics/admin/stats'),
  users: (params?: object) => api.get('/admin/users', { params }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
  pendingPrices: () => api.get('/admin/prices/pending'),
  seedStores: () => api.post('/admin/seed-stores'),
};

export default api;

export const locationAPI = {
  lookup: (pincode: string) => api.get(`/location/pincode/${pincode}`),
  getStores: (pincode: string) => api.get(`/location/stores/${pincode}`),
  autocomplete: (q: string) => api.get('/location/autocomplete', { params: { q } }),
  save: (pincode: string) => api.post('/location/save', { pincode }),
};
