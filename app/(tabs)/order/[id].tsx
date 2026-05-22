import { useLocalSearchParams } from 'expo-router';
import { PickingDetailScreen } from '@/features/picking/screens/picking-detail.screen';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PickingDetailScreen orderId={id ?? ''} />;
}
