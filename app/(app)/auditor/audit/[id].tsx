import { useLocalSearchParams } from 'expo-router';
import { AuditDetailScreen } from '@/features/audit/screens/audit-detail.screen';

export default function AuditorDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AuditDetailScreen orderId={id ?? ''} />;
}
