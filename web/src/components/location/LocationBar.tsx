'use client';
import { useEffect, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useLocationStore } from '@/store/locationStore';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false });

export default function LocationBar() {
  const { location, showPicker, setShowPicker, hydrateFromStorage } = useLocationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700 transition-colors group"
      >
        <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
        {location ? (
          <span className="max-w-[160px] truncate font-medium">
            {location.pincode} — {location.city}
          </span>
        ) : (
          <span className="text-gray-500">Set Location</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600" />
      </button>

      {showPicker && (
        <LocationPicker onClose={() => setShowPicker(false)} isModal={true} />
      )}
    </>
  );
}
