import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/shared/components/ui/text';
import { useNotificationPress } from '../hooks/use-notification-press';
import { useNotificationsStore } from '../store/notifications.store';
import { NOTIFICATION_TYPE_META } from './notification-item';

const AUTO_DISMISS_MS = 4500;
const ENTER_MS = 280;
const EXIT_MS = 180;
const OFFSET_Y = 10;

/**
 * Banner flotante para notificaciones que llegan en vivo, visible sobre
 * cualquier pantalla. Montado una sola vez en app/(app)/_layout.tsx.
 *
 * Usa `Modal` (no un simple overlay absoluto) porque los navegadores basados
 * en `react-native-screens` pueden tapar overlays declarados como hermanos
 * del Stack — un Modal nativo siempre se pinta por encima, sin importar qué
 * pantalla esté activa.
 *
 * La animación replica el fade + desplazamiento sutil (sin spring) que ya
 * usan ScreenEnterFade/TabContentFade en el resto de la app.
 */
export function GlobalNotificationToast() {
  const insets = useSafeAreaInsets();
  const incoming = useNotificationsStore((s) => s.incomingToast);
  const clearIncomingToast = useNotificationsStore((s) => s.clearIncomingToast);
  const handleNotificationPress = useNotificationPress();

  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [displayed, setDisplayed] = useState(incoming);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    progress.value = withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) });
    setTimeout(() => {
      setDisplayed(null);
      clearIncomingToast();
    }, EXIT_MS);
  }, [progress, clearIncomingToast]);

  useEffect(() => {
    if (!incoming) return;

    setDisplayed(incoming);
    progress.value = 0;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    progress.value = withTiming(1, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [incoming, progress, dismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -OFFSET_Y }],
  }));

  if (!displayed) return null;

  const meta = NOTIFICATION_TYPE_META[displayed.type];
  const Icon = meta?.icon;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <View style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Animated.View style={[styles.card, animatedStyle]}>
          <Pressable
            style={styles.pressArea}
            onPress={() => {
              const notification = displayed;
              dismiss();
              if (notification) handleNotificationPress(notification);
            }}
          >
            {Icon ? (
              <View style={[styles.iconBox, { backgroundColor: meta.iconBg }]}>
                <Icon size={18} color={meta.iconColor} strokeWidth={2.2} />
              </View>
            ) : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>
                {displayed.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {displayed.body}
              </Text>
            </View>
          </Pressable>
          <Pressable onPress={dismiss} hitSlop={10} style={styles.closeBtn}>
            <X size={16} color="#8E8E93" />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 500,
    elevation: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 13, fontWeight: '700', color: '#111827' },
  body: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  closeBtn: { padding: 6, marginLeft: 4 },
});
