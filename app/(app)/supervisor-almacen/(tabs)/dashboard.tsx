import { SupervisorDashboardScreen } from '@/features/supervision/screens/supervisor-dashboard.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function SupervisorDashboardTab() {
  return (
    <TabContentFade>
      <SupervisorDashboardScreen />
    </TabContentFade>
  );
}
