import { LeadOrdersScreen } from '@/features/teams/screens/lead-orders.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function LeadOrdersTab() {
  return (
    <TabContentFade>
      <LeadOrdersScreen />
    </TabContentFade>
  );
}
