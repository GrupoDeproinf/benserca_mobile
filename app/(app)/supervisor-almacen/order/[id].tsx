import { useLocalSearchParams } from 'expo-router';
import { PickingDetailScreen } from '@/features/picking/screens/picking-detail.screen';

/** Detalle de pedido en modo solo lectura para el supervisor de almacén. */
export default function SupervisorOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PickingDetailScreen orderId={id ?? ''} readOnly />;
}
