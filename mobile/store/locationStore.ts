import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface LocationData {
  pincode: string;
  city: string;
  district?: string;
  state: string;
  lat?: number;
  lng?: number;
  totalStores?: number;
  nearbyOutlets?: Array<{
    storeId: string; storeName: string; storeSlug: string;
    distanceKm: number; deliveryTime?: string; color?: string;
  }>;
  onlineStores?: Array<{
    storeId: string; storeName: string; storeSlug: string;
    deliveryTime?: string; color?: string;
  }>;
}

interface LocationState {
  location: LocationData | null;
  showPicker: boolean;
  setLocation: (data: LocationData) => Promise<void>;
  clearLocation: () => Promise<void>;
  setShowPicker: (v: boolean) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'sb_location';

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  showPicker: false,

  setLocation: async (data) => {
    try { await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data)); } catch {}
    set({ location: data, showPicker: false });
  },

  clearLocation: async () => {
    try { await SecureStore.deleteItemAsync(STORAGE_KEY); } catch {}
    set({ location: null });
  },

  setShowPicker: (v) => set({ showPicker: v }),

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) set({ location: JSON.parse(raw) });
    } catch {}
  },
}));
