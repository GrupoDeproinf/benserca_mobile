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

interface OrderDetailActionsProps {
  actions: OrderDetailAction[];
}

export function estimateOrderActionsHeight(actionCount: number, bottomInset: number): number {
  if (actionCount === 0) return 0;
  const gaps = Math.max(0, actionCount - 1) * BUTTON_GAP;
  return (
    DOCK_PADDING_TOP +
    actionCount * BUTTON_HEIGHT +
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
      {actions.map((action) => (
        <OrderActionButton
          key={action.label}
          label={action.label}
          onPress={action.onPress}
          variant={action.variant}
          icon={action.icon}
        />
      ))}
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
});
