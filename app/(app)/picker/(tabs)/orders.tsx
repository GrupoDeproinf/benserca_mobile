import { PickingScreen } from '@/features/picking/screens/picking.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function PickerOrdersTab() {
  return (
    <TabContentFade>
      <PickingScreen />
    </TabContentFade>
  );
}
