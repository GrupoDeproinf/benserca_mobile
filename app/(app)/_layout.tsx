import { Stack } from 'expo-router';
import { useRoleGuard } from '@/features/auth/hooks/use-role-guard';
import { useSessionOrdersListener } from '@/features/picking/hooks/use-session-orders-listener';

export default function AppLayout() {
  useRoleGuard();
  useSessionOrdersListener();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="picker" />
      <Stack.Screen name="lead" />
      <Stack.Screen name="auditor" />
    </Stack>
  );
}
