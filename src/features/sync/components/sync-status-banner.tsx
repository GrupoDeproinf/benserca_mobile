import { CloudOff, UploadCloud } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { useSyncStore } from '../store/sync.store';

/**
 * Franja fija que dice si se está trabajando sin servidor y si quedan cambios
 * sin confirmar. Sin esto el picker no tiene forma de saber si su trabajo llegó:
 * la app aplica todo de forma optimista y se ve igual con red que sin ella.
 */
export function SyncStatusBanner() {
  const { t } = useTranslation();
  const tabBarHeight = useAppTabBarHeight();
  const fromCache = useSyncStore((s) => s.fromCache);
  const pending = useSyncStore((s) => s.hasPendingWrites);
  const unknown = useSyncStore((s) => s.unknown);

  if (unknown) return null;
  if (!fromCache && !pending) return null;

  const offline = fromCache;
  const label = offline
    ? pending
      ? t('sync.offlineWithPending')
      : t('sync.offline')
    : t('sync.pending');

  return (
    <View style={[styles.wrap, { bottom: tabBarHeight + 8 }]} pointerEvents="none">
      <View
        style={[styles.pill, offline ? styles.offline : styles.pending]}
        accessibilityRole="alert"
      >
        {offline ? (
          <CloudOff size={14} color="#FFFFFF" strokeWidth={2.2} />
        ) : (
          <UploadCloud size={14} color="#FFFFFF" strokeWidth={2.2} />
        )}
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  offline: { backgroundColor: '#B45309' },
  pending: { backgroundColor: '#1D4ED8' },
  label: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
