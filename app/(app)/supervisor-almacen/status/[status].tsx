import { useLocalSearchParams } from 'expo-router';
import { SupervisorOrdersListScreen } from '@/features/supervision/screens/supervisor-orders-list.screen';
import type { OrderStatus } from '@/features/picking/types';

const VALID_STATUSES: readonly OrderStatus[] = [
  'new',
  'assigned',
  'in_progress',
  'to_pack',
  'packed',
  'rejected_review',
  'audited',
  'dispatched',
];

export default function SupervisorStatusRoute() {
  const { status } = useLocalSearchParams<{ status: string }>();
  const safeStatus: OrderStatus = VALID_STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : 'assigned';

  return <SupervisorOrdersListScreen mode={{ type: 'status', status: safeStatus }} />;
}
