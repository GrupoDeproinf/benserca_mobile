import { useLocalSearchParams } from 'expo-router';
import { PickingDetailScreen } from '@/features/picking/screens/picking-detail.screen';

/**
 * Picking del jefe de almacén cuando trabaja un pedido él solo (sin equipo).
 * Reutiliza la pantalla del picker: las acciones son exactamente las mismas.
 */
export default function LeadPickingRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <PickingDetailScreen orderId={orderId ?? ''} />;
}
