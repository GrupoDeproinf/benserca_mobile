import { Stack } from 'expo-router';

export default function SupervisorAlmacenStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F2F2F7' },
        // Las pantallas tapadas por otra (la lista bajo el detalle del pedido)
        // no se re-renderizan mientras no estén visibles.
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="status/[status]"
        options={{
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
          contentStyle: { backgroundColor: '#F2F2F7' },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="paused"
        options={{
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
          contentStyle: { backgroundColor: '#F2F2F7' },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="order/[id]"
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
