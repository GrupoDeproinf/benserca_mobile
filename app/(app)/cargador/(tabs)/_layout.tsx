import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppHeroTopBar } from '@/features/tabs/components/app-hero-top-bar';
import { AppTabBar } from '@/features/tabs/components/app-tab-bar';
import { ROLE_TABS_CONFIG } from '@/features/tabs/constants/role-tabs';
import { TAB_BAR_COLORS } from '@/features/tabs/constants/tab-bar';

const TAB_TITLES = {
  orders: 'tabs.orders',
  profile: 'tabs.profile',
} as const;

export default function CargadorTabsLayout() {
  const { t } = useTranslation();
  const config = ROLE_TABS_CONFIG.pedido_cargador;

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {/* Nadie le envía notificaciones al cargador: sin campana. */}
      <AppHeroTopBar showNotifications={false} />

      <Tabs
        initialRouteName={config.initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          // Las pestañas ocultas no se re-renderizan hasta volver a ellas: una
          // vez visitadas quedan montadas y suscritas a los stores.
          freezeOnBlur: true,
          tabBarActiveTintColor: TAB_BAR_COLORS.active,
          tabBarInactiveTintColor: TAB_BAR_COLORS.inactive,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarInactiveBackgroundColor: 'transparent',
          sceneStyle: { backgroundColor: '#F2F2F7' },
        }}
        tabBar={(props) => <AppTabBar {...props} tabOrder={config.order} tabIcons={config.icons} />}
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
