import { Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppHeroTopBar } from '@/features/tabs/components/app-hero-top-bar';
import { AppTabBar } from '@/features/tabs/components/app-tab-bar';
import { ROLE_TABS_CONFIG } from '@/features/tabs/constants/role-tabs';
import { TAB_BAR_COLORS } from '@/features/tabs/constants/tab-bar';

const TAB_TITLES = {
  queue: 'tabs.auditQueue',
  paused: 'tabs.paused',
  profile: 'tabs.profile',
} as const;

export default function AuditorTabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const config = ROLE_TABS_CONFIG.auditor;

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <AppHeroTopBar
        onNotificationsPress={() => router.push('/(app)/auditor/notifications' as never)}
      />

      <Tabs
        initialRouteName={config.initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          lazy: false,
          tabBarActiveTintColor: TAB_BAR_COLORS.active,
          tabBarInactiveTintColor: TAB_BAR_COLORS.inactive,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarInactiveBackgroundColor: 'transparent',
          sceneStyle: { backgroundColor: '#F2F2F7' },
        }}
        tabBar={(props) => (
          <AppTabBar {...props} tabOrder={config.order} tabIcons={config.icons} />
        )}
      >
        {config.order.map((routeName) => (
          <Tabs.Screen
            key={routeName}
            name={routeName}
            options={{ title: t(TAB_TITLES[routeName as keyof typeof TAB_TITLES] ?? routeName) }}
          />
        ))}
      </Tabs>
    </View>
  );
}
