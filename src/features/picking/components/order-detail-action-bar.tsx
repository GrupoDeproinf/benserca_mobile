import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { OrderActionButton, type OrderActionVariant } from './order-action-button';
import type { LucideIcon } from 'lucide-react-native';

const DOCK_BG = '#F2F2F7';
const BUTTON_HEIGHT = 52;
const BUTTON_GAP = 12;
const DOCK_PADDING_TOP = 12;

export interface OrderDetailAction {
  label: string;
  onPress: () => void;
  variant: OrderActionVariant;
  icon?: LucideIcon;
}

/** Un elemento full-width, o un array anidado para renderizar esas acciones en una misma fila. */
type OrderDetailActionItem = OrderDetailAction | OrderDetailAction[];

interface OrderDetailActionsProps {
  actions: OrderDetailActionItem[];
}

export function estimateOrderActionsHeight(rowCount: number, bottomInset: number): number {
  if (rowCount === 0) return 0;
  const gaps = Math.max(0, rowCount - 1) * BUTTON_GAP;
  return (
    DOCK_PADDING_TOP +
    rowCount * BUTTON_HEIGHT +
    gaps +
    Math.max(bottomInset, 16) +
    8
  );
}

/** Acciones fijas abajo, mismo fondo que la pantalla (sin sombra ni borde). */
export function OrderDetailActions({ actions }: OrderDetailActionsProps) {
  const insets = useSafeAreaInsets();

  if (actions.length === 0) return null;

  return (
    <View
      style={[
        styles.dock,
        {
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {actions.map((item) =>
        Array.isArray(item) ? (
          <View key={item.map((a) => a.label).join('|')} style={styles.row}>
            {item.map((action) => (
              <View key={action.label} style={styles.rowItem}>
                <OrderActionButton
                  label={action.label}
                  onPress={action.onPress}
                  variant={action.variant}
                  icon={action.icon}
                />
              </View>
            ))}
          </View>
        ) : (
          <OrderActionButton
            key={item.label}
            label={item.label}
            onPress={item.onPress}
            variant={item.variant}
            icon={item.icon}
          />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: DOCK_PADDING_TOP,
    gap: BUTTON_GAP,
    backgroundColor: DOCK_BG,
  },
  row: {
    flexDirection: 'row',
    gap: BUTTON_GAP,
  },
  rowItem: {
    flex: 1,
  },
});
