import { useLocalSearchParams } from 'expo-router';
import { LoadingDetailScreen } from '@/features/loading/screens/loading-detail.screen';

export default function CargadorOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LoadingDetailScreen orderId={id ?? ''} />;
}
