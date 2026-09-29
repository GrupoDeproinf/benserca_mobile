import * as Haptics from 'expo-haptics';
import { Check, Eye } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { Bulto } from '@/features/picking/types';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { Text } from '@/shared/components/ui/text';

interface LoadingBultoCardProps {
  bulto: Bulto;
  loaded: boolean;
  /** El pedido admite cambios de carga (embalado y sin pausa). */
  editable: boolean;
  onToggle: (bundleNumber: number, loaded: boolean) => void;
  /** Abre la vista previa (foto + código) del renglón dueño del ítem. */
  onPreviewItem: (lineId: string) => void;
  /** Ancho de la celda cuando los bultos van en cuadrícula (tablet). */
  style?: ViewStyle;
}

/**
 * Un bulto de la carga del camión. Toda la cabecera es el botón de marcar: en
 * el andén el cargador lo toca con el pulgar mientras sostiene la caja, así que
 * el blanco tiene que ser grande y el estado verse de lejos (verde = arriba).
 * Los ítems quedan a la vista para cotejar la etiqueta física del bulto.
 */
export function LoadingBultoCard({
  bulto,
  loaded,
  editable,
  onToggle,
  onPreviewItem,
  style,
}: LoadingBultoCardProps) {
  const { t } = useTranslation();
  const units = bulto.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <View style={[styles.card, loaded && styles.cardLoaded, style]}>
      {/* El layout va en el View de adentro y no en el `style` del Pressable:
          con NativeWind, un `style` en forma de función pierde las propiedades
          de layout y la cabecera se apilaba en columna (mismo patrón que
          picking-detail). */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(
            loaded ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
          );
          onToggle(bulto.number, !loaded);
        }}
        disabled={!editable}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: loaded, disabled: !editable }}
        accessibilityLabel={
          loaded
            ? t('loading.detail.unmarkLoaded', { number: bulto.number })
            : t('loading.detail.markLoaded', { number: bulto.number })
        }
        style={({ pressed }) => [pressed && editable && { opacity: 0.8 }]}
      >
        <View style={[styles.header, loaded && styles.headerLoaded]} collapsable={false}>
          <View style={[styles.check, loaded && styles.checkLoaded, !editable && { opacity: 0.4 }]}>
            {loaded ? <Check size={24} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {t('loading.detail.bultoTitle', { number: bulto.number })}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {t('loading.detail.itemCount', { count: bulto.items.length, units })}
            </Text>
          </View>
          <View style={[styles.tag, loaded ? styles.tagLoaded : styles.tagPending]}>
            <Text
              style={[styles.tagText, loaded ? styles.tagTextLoaded : styles.tagTextPending]}
              numberOfLines={1}
            >
              {loaded ? t('loading.detail.loadedTag') : t('loading.detail.pendingTag')}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.body}>
        {bulto.items.map((item, idx) => (
          <View
            key={item.id}
            style={[styles.itemRow, idx < bulto.items.length - 1 && styles.itemRowBorder]}
          >
            <View style={styles.itemText}>
              <ExpandableText style={styles.itemName} numberOfLines={2}>
                {item.name}
              </ExpandableText>
              <Text style={styles.itemSku}>{item.sku}</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onPreviewItem(item.lineId);
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('picking.skuPreview.open')}
              style={({ pressed }) => [pressed && { opacity: 0.5 }]}
            >
              <View style={styles.eyeBtn} collapsable={false}>
                <Eye size={18} color="#8E8E93" strokeWidth={2.2} />
              </View>
            </Pressable>
            <Text style={styles.itemQty}>×{item.qty}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  cardLoaded: {
    borderColor: '#16A34A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  headerLoaded: {
    backgroundColor: '#F0FDF4',
  },
  check: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLoaded: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagLoaded: { backgroundColor: '#DCFCE7' },
  tagPending: { backgroundColor: '#F3F4F6' },
  tagText: { fontSize: 11, fontWeight: '700' },
  tagTextLoaded: { color: '#15803D' },
  tagTextPending: { color: '#6B7280' },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  itemRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#F3F4F6',
  },
  itemText: { flex: 1, minWidth: 0, marginRight: 8 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  itemSku: { fontSize: 11, color: '#8E8E93', marginTop: 1 },
  eyeBtn: { padding: 2, marginRight: 10 },
  itemQty: { fontSize: 15, fontWeight: '700', color: '#111827', minWidth: 36, textAlign: 'right' },
});
