import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_BG = '#F2F2F7';

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SCREEN_BG,
  },
  blackBand: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    lineHeight: 18,
  },
});

interface NotificationsHeaderProps {
  title: string;
  subtitle: string;
  showBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
}

/** Header negro compacto (como detalle de pedido), sin logo. */
export function NotificationsHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  backLabel,
}: NotificationsHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      <View style={[styles.blackBand, { paddingTop: insets.top + (showBack ? 8 : 12) }]}>
        {showBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityLabel={backLabel}
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>
        ) : null}

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export { SCREEN_BG as NOTIFICATIONS_HEADER_BG };
