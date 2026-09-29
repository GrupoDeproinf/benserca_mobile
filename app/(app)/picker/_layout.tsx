import { Stack } from 'expo-router';
import { pickingLayoutTheme } from '@/features/picking/constants/layout-theme';

export default function PickerStackLayout() {
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
        name="order/[id]"
        options={{
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
          contentStyle: { backgroundColor: '#F2F2F7' },
          // Entrada: sin slide (header custom). Salida: slide_from_right vía order/[id].tsx
          animation: 'none',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
          contentStyle: { backgroundColor: '#F2F2F7' },
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
