import * as Haptics from 'expo-haptics';
import { Pencil, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { Text } from '@/shared/components/ui/text';
import type { QuickBundleCandidate } from '../utils/quick-bundles';
import { BultoActionButton } from './bulto-action-button';

interface QuickBundleCardProps {
  candidate: QuickBundleCandidate;
  onCreate: (lineId: string) => void;
  /** Abre el editor de cantidad (mantener presionada la tarjeta o tocar el lápiz). */
  onEditCount: (lineId: string) => void;
}

/**
 * Bulto rápido: mismo card que un bulto normal (ver BultoCard), pero en vez de
 * ítems ya metidos muestra lo que va a contener, y en vez de agregar/cerrar
 * trae un solo botón que lo arma y lo cierra de un toque.
 *
 * El ámbar vive solo en la pastilla del rayo: el resto del card se mantiene
 * neutro como los bultos normales, para no gritar más que ellos en la lista.
 *
 * Es una tarjeta por RENGLÓN: si Profit repite el SKU (el "20 + 2"), cada
 * renglón tiene la suya, porque son cantidades independientes. Para poder
 * distinguirlas, en ese caso la fila muestra cuánto pide ese renglón.
 *
 * Solo existe si el renglón da para al menos un bulto completo, así que no hay
 * estado deshabilitado: si no aparece, ese artículo se arma a mano.
 *
 * El botón arma todos los que da el cálculo. Si en almacén no alcanza, se
 * mantiene presionada la tarjeta (o se toca el lápiz) para elegir cuántos.
 */
export function QuickBundleCard({ candidate, onCreate, onEditCount }: QuickBundleCardProps) {
  const { t } = useTranslation();

  const openEditor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEditCount(candidate.lineId);
  };

  return (
    <Pressable style={styles.card} onLongPress={openEditor} delayLongPress={350}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t('picking.quickBundle.cardTitle')}</Text>
          <View style={styles.pill}>
            <Zap size={11} color="#B45309" strokeWidth={2.6} />
            <Text style={styles.pillText}>
              {t('picking.quickBundle.unitsPill', { units: candidate.unitsPerBundle })}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={openEditor}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('picking.quickBundle.editCount')}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <View style={styles.remainingRow}>
            <Text style={styles.remaining}>
              {t('picking.quickBundle.remaining', { count: candidate.availableBundles })}
            </Text>
            <Pencil size={13} color="#8E8E93" strokeWidth={2.2} />
          </View>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.itemRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <ExpandableText style={styles.itemName} numberOfLines={1} onLongPress={openEditor}>
              {candidate.name}
            </ExpandableText>
            <Text style={styles.itemSku}>
              {candidate.sku}
              {candidate.duplicatedSku
                ? ` · ${t('picking.addItem.lineQty', { qty: candidate.requiredQty })}`
                : ''}
            </Text>
          </View>
          <Text style={styles.itemQty}>×{candidate.totalUnits}</Text>
        </View>

        <View style={styles.actions}>
          <BultoActionButton
            label={t('picking.quickBundle.build', { count: candidate.availableBundles })}
            icon={Zap}
            variant="filled"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCreate(candidate.lineId);
            }}
            onLongPress={openEditor}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  remaining: {
    fontSize: 12,
    color: '#8E8E93',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  itemSku: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
});
