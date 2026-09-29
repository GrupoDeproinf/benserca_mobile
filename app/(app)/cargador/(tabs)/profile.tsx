import { ProfileScreen } from '@/features/profile/screens/profile.screen';
import { TabContentFade } from '@/features/tabs/components/tab-content-fade';

export default function CargadorProfileTab() {
  return (
    <TabContentFade>
      <ProfileScreen />
    </TabContentFade>
  );
}
