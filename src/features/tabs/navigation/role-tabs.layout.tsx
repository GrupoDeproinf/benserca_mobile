import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { UserRole } from '@/shared/types';
import { TAB_BAR_COLORS } from '../constants/tab-bar';
import { AppTabBar } from '../components/app-tab-bar';
import { ROLE_TABS_CONFIG, type RoleTabsConfig } from '../constants/role-tabs';

interface RoleTabsLayoutProps {
  role: UserRole;
  /** Títulos i18n por nombre de ruta de tab */
  titles: Record<string, string>;
}

export function RoleTabsLayout({ role, titles }: RoleTabsLayoutProps) {
  const { t } = useTranslation();
  const config: RoleTabsConfig = ROLE_TABS_CONFIG[role];

  return (
    <Tabs
      initialRouteName={config.initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
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
          options={{ title: t(titles[routeName] ?? routeName) }}
        />
      ))}
    </Tabs>
  );
}
