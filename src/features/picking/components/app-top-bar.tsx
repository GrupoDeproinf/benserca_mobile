import { ScanLine } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { BensercaLogo } from '@/shared/components/brand/benserca-logo';

/** Logo horizontal `icon-text.png` en el header operativo. */
const HEADER_LOGO_HEIGHT = 72;

interface AppTopBarProps {
  onNotificationsPress: () => void;
  onScanPress?: () => void;
}

export function AppTopBar({ onNotificationsPress, onScanPress }: AppTopBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: '#000000',
        paddingTop: insets.top + 2,
        paddingHorizontal: 12,
        paddingBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        <BensercaLogo variant="text" height={HEADER_LOGO_HEIGHT} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <NotificationBell onPress={onNotificationsPress} />
        <Pressable onPress={onScanPress} hitSlop={12} accessibilityLabel={t('picking.screen.scan')}>
          <ScanLine size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
