import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AssignPickersHeaderProps {
  orderNumber: string;
  client: string;
  onBack: () => void;
}

/** Franja negra compacta para armar equipo. */
export function AssignPickersHeader({ orderNumber, client, onBack }: AssignPickersHeaderProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.blackBand, { paddingTop: insets.top + 2 }]}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={styles.backBtn}
        accessibilityLabel={t('common.back')}
      >
        <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.2} />
      </Pressable>

      <Text style={styles.orderNumber}>{orderNumber}</Text>
      <Text style={styles.client} numberOfLines={2}>
        {client}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  blackBand: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.3,
  },
  client: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    lineHeight: 26,
  },
});
