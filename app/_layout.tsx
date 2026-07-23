import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useProtectedRoute } from '@/features/auth/hooks/use-protected-route';
import { useFirebaseAuthSync } from '@/features/auth/hooks/use-firebase-auth-sync';
import { AppProviders } from '@/providers/app-providers';
import { SplashGate } from '@/shared/components/splash-gate';
import { useResolvedColorScheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => null);
// `fade` solo aplica en iOS; en Android el fade lo hace `SplashGate`.
SplashScreen.setOptions({ duration: 320, fade: true });

function ProtectedRouter() {
  useFirebaseAuthSync();
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
      <SplashGate>
        <ProtectedRouter />
      </SplashGate>
    </AppProviders>
  );
}
