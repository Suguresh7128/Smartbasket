import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { authAPI } from '../services/api';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false } },
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

function RootLayoutNav() {
  const { hydrate: hydrateAuth, user } = useAuthStore();
  const { hydrate: hydrateLocation }   = useLocationStore();

  useEffect(() => {
    Promise.all([hydrateAuth(), hydrateLocation()])
      .finally(() => SplashScreen.hideAsync());
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
        const token = await Notifications.getExpoPushTokenAsync({ projectId: 'YOUR_EAS_PROJECT_ID' });
        if (token.data) await authAPI.updateFcmToken(token.data);
      } catch {}
    })();
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="product/[id]" options={{ presentation: 'card', headerShown: true, title: 'Price Comparison' }} />
      <Stack.Screen name="bill/[id]"    options={{ presentation: 'card', headerShown: true, title: 'Bill Details' }} />
      <Stack.Screen name="upload" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
