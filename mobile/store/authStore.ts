import { create } from 'zustand';
import { authAPI, getToken, setToken, removeToken } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  city: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: object) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isHydrating: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login({ email, password });
      await setToken('accessToken', data.data.accessToken);
      await setToken('refreshToken', data.data.refreshToken);
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (formData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(formData);
      await setToken('accessToken', data.data.accessToken);
      await setToken('refreshToken', data.data.refreshToken);
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = await getToken('refreshToken');
    if (refreshToken) await authAPI.logout(refreshToken).catch(() => {});
    await removeToken('accessToken');
    await removeToken('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const token = await getToken('accessToken');
      if (!token) return set({ isHydrating: false });
      const { data } = await authAPI.getMe();
      set({ user: data.data, isAuthenticated: true });
    } catch {
      await removeToken('accessToken');
      await removeToken('refreshToken');
    } finally {
      set({ isHydrating: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));
