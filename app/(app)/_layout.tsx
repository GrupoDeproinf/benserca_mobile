import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useRoleGuard } from '@/features/auth/hooks/use-role-guard';
import { GlobalNotificationToast } from '@/features/notifications/components/global-notification-toast';
import { useFirestoreNotificationsListener } from '@/features/notifications/hooks/use-firestore-notifications-listener';
import { useSessionOrdersListener } from '@/features/picking/hooks/use-session-orders-listener';

export default function AppLayout() {
  useRoleGuard();
  useSessionOrdersListener();
  useFirestoreNotificationsListener();

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="picker" />
        <Stack.Screen name="lead" />
        <Stack.Screen name="auditor" />
        <Stack.Screen name="supervisor-almacen" />
      </Stack>
      <GlobalNotificationToast />
    </View>
  );
}
