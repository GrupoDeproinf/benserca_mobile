import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useFirestorePickers } from '@/features/warehouse/hooks/use-firestore-pickers';
import { AppHeroTopBar } from '@/features/tabs/components/app-hero-top-bar';
import { AppTabBar } from '@/features/tabs/components/app-tab-bar';
import { ROLE_TABS_CONFIG } from '@/features/tabs/constants/role-tabs';
import { TAB_BAR_COLORS } from '@/features/tabs/constants/tab-bar';

const TAB_TITLES = {
  dashboard: 'tabs.dashboard',
  profile: 'tabs.profile',
} as const;

export default function SupervisorAlmacenTabsLayout() {
  const { t } = useTranslation();
  const config = ROLE_TABS_CONFIG.supervisor_almacen;

  // Listener de pickers para el filtro de las listas por estatus.
  useFirestorePickers();

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <AppHeroTopBar showNotifications={false} />

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
