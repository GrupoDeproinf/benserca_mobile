import { AuditPausedScreen } from '@/features/audit/screens/audit-paused.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function AuditorPausedTab() {
  return (
    <TabContentFade>
      <AuditPausedScreen />
    </TabContentFade>
  );
}
