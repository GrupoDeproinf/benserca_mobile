import { ProfileScreen } from '@/features/profile/screens/profile.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function PickerProfileTab() {
  return (
    <TabContentFade>
      <ProfileScreen />
    </TabContentFade>
  );
}
