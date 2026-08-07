'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore(s => s.fetchMe);

  useEffect(() => {
    // Rehydrate user session on page load
    fetchMe();
  }, [fetchMe]);

  return <>{children}</>;
}
