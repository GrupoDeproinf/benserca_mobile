import { ScanLine } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { BensercaLogo } from '@/shared/components/brand/benserca-logo';

const HEADER_LOGO_HEIGHT = 72;

const styles = StyleSheet.create({
  blackBand: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  logoWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
});

interface AppHeroTopBarProps {
  onNotificationsPress?: () => void;
  onScanPress?: () => void;
  /** Oculta la campana de notificaciones (roles sin notificaciones, p. ej. supervisor). */
  showNotifications?: boolean;
}

/** Franja negra fija (logo + campana). Compartida entre tabs del picker. */
export function AppHeroTopBar({
  onNotificationsPress,
  onScanPress,
  showNotifications = true,
}: AppHeroTopBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.blackBand, { paddingTop: insets.top + 2 }]}>
      <View style={styles.logoWrap}>
        <BensercaLogo variant="text" height={HEADER_LOGO_HEIGHT} />
      </View>
      <View style={styles.actions}>
        {showNotifications && onNotificationsPress ? (
          <NotificationBell onPress={onNotificationsPress} color="#FFFFFF" size={22} />
        ) : null}
        {onScanPress ? (
          <Pressable
            onPress={onScanPress}
            hitSlop={12}
            accessibilityLabel={t('picking.screen.scan')}
          >
            <ScanLine size={22} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
