import { Stack } from 'expo-router';
import { useRoleGuard } from '@/features/auth/hooks/use-role-guard';

export default function AppLayout() {
  useRoleGuard();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="picker" />
      <Stack.Screen name="lead" />
      <Stack.Screen name="auditor" />
    </Stack>
  );
}
