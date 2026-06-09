import { useLocalSearchParams } from 'expo-router';
import { LeadOrderDetailScreen } from '@/features/teams/screens/lead-order-detail.screen';

export default function LeadTeamRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <LeadOrderDetailScreen orderId={orderId ?? ''} />;
}
