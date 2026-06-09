import { LeadPickersScreen } from '@/features/teams/screens/lead-pickers.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function LeadPickersTab() {
  return (
    <TabContentFade>
      <LeadPickersScreen />
    </TabContentFade>
  );
}
