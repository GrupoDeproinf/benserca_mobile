import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useRoleGuard } from '@/features/auth/hooks/use-role-guard';
import { GlobalNotificationToast } from '@/features/notifications/components/global-notification-toast';
import { useFirestoreNotificationsListener } from '@/features/notifications/hooks/use-firestore-notifications-listener';
import { useArticulosCatalogCleanup } from '@/features/picking/hooks/use-articulos-catalog-cleanup';
import { useLocalWorkPersistence } from '@/features/picking/hooks/use-local-work-persistence';
import { useSessionOrdersListener } from '@/features/picking/hooks/use-session-orders-listener';
import { SyncStatusBanner } from '@/features/sync/components/sync-status-banner';
import { usePickerAvailabilitySync } from '@/features/warehouse/hooks/use-picker-availability-sync';

export default function AppLayout() {
  useRoleGuard();
  useSessionOrdersListener();
  useFirestoreNotificationsListener();
  useLocalWorkPersistence();
  usePickerAvailabilitySync();
  useArticulosCatalogCleanup();

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="picker" />
        <Stack.Screen name="lead" />
        <Stack.Screen name="auditor" />
        <Stack.Screen name="supervisor-almacen" />
        <Stack.Screen name="cargador" />
      </Stack>
      <GlobalNotificationToast />
      <SyncStatusBanner />
    </View>
  );
}
