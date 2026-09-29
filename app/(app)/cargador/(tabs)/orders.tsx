import { LoadingQueueScreen } from '@/features/loading/screens/loading-queue.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function CargadorOrdersTab() {
  return (
    <TabContentFade>
      <LoadingQueueScreen />
    </TabContentFade>
  );
}
