import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useProtectedRoute } from '@/features/auth/hooks/use-protected-route';
import { AppProviders } from '@/providers/app-providers';
import { useResolvedColorScheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => null);

function ProtectedRouter() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useResolvedColorScheme();
  return (
    <AppProviders>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ProtectedRouter />
    </AppProviders>
  );
}
