import { AuditQueueScreen } from '@/features/audit/screens/audit-queue.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function AuditorQueueTab() {
  return (
    <TabContentFade>
      <AuditQueueScreen />
    </TabContentFade>
  );
}
