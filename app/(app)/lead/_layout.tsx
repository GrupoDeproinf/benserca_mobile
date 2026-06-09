import { Stack } from 'expo-router';

export default function LeadStackLayout() {
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
        name="team/[orderId]"
        options={{
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
          contentStyle: { backgroundColor: '#F2F2F7' },
          animation: 'none',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="team/assign/[orderId]"
        options={{
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
          contentStyle: { backgroundColor: '#F2F2F7' },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
