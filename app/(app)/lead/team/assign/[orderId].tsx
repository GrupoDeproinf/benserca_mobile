import { useLocalSearchParams } from 'expo-router';
import { LeadAssignPickersScreen } from '@/features/teams/screens/lead-assign-pickers.screen';

export default function LeadAssignPickersRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <LeadAssignPickersScreen orderId={orderId ?? ''} />;
}
