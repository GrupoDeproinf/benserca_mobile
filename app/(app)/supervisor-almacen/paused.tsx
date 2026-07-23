import { SupervisorOrdersListScreen } from '@/features/supervision/screens/supervisor-orders-list.screen';

export default function SupervisorPausedRoute() {
  return <SupervisorOrdersListScreen mode={{ type: 'paused' }} />;
}
