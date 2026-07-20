import { Stack } from 'expo-router';
import { useFirestorePickers } from '@/features/warehouse/hooks/use-firestore-pickers';

export default function AuditorStackLayout() {
  // Single pickers listener for the entire auditor session, used to resolve picker names
  useFirestorePickers();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F2F2F7' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="notifications"
        options={{
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
          contentStyle: { backgroundColor: '#F2F2F7' },
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="audit/[id]"
        options={{
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
          contentStyle: { backgroundColor: '#F2F2F7' },
          animation: 'none',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
