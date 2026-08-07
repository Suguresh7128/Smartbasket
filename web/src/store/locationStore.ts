import { create } from 'zustand';

export interface LocationData {
  pincode: string;
  city: string;
  district?: string;
  state: string;
  lat?: number;
  lng?: number;
  totalStores?: number;
  nearbyOutlets?: NearbyOutlet[];
  onlineStores?: OnlineStore[];
}

export interface NearbyOutlet {
  storeId: string;
  storeName: string;
  storeSlug: string;
  outletName: string;
  address?: string;
  distanceKm: number;
  deliveryTime?: string;
  color?: string;
}

export interface OnlineStore {
  storeId: string;
  storeName: string;
  storeSlug: string;
  deliveryTime?: string;
  color?: string;
  isOnline: true;
}

interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string;
  showPicker: boolean;
  setLocation: (data: LocationData) => void;
  clearLocation: () => void;
  setShowPicker: (v: boolean) => void;
  hydrateFromStorage: () => void;
}

const STORAGE_KEY = 'sb_location';

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  isLoading: false,
  error: '',
  showPicker: false,

  setLocation: (data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    set({ location: data, showPicker: false, error: '' });
  },

  clearLocation: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    set({ location: null });
  },

  setShowPicker: (v) => set({ showPicker: v }),

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) set({ location: JSON.parse(raw) });
    } catch {}
  },
}));
