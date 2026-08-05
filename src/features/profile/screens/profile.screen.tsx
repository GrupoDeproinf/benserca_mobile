import { LogOut, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AUTH_ROUTES } from '@/features/auth/constants/routes';
import { logout } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useNotificationsStore } from '@/features/notifications/store/notifications.store';
import { OrderActionButton } from '@/features/picking/components/order-action-button';
import { AppHeroTitleSection } from '@/features/tabs/components/app-hero-title-section';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';

const SCREEN_BG = '#F2F2F7';

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 24,
  },
  email: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metaLabel: {
    fontSize: 10,
    color: '#8E8E93',
    lineHeight: 14,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
    lineHeight: 18,
  },
});

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase() || '?';
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const tabBarHeight = useAppTabBarHeight();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const displayName = user?.name?.trim() || t('profile.defaultName');
  const roleKey = user?.role ? `roles.${user.role}` : 'profile.role';

  const handleSignOut = async () => {
    await logout();
    // El picking guardado en disco NO se borra: si este mismo usuario vuelve a
    // entrar debe recuperar lo trabajado desde el último hito. La clave por
    // `uid` (ver orders-local-work) impide que otro usuario del dispositivo lo
    // vea, así que no hace falta limpiarlo aquí.
    useOrdersStore.getState().resetOrders();
    usePickersStore.getState().resetPickers();
    useNotificationsStore.getState().resetNotifications();
    signOut();
    router.replace(AUTH_ROUTES.login);
  };

  return (
    <View style={{ flex: 1, backgroundColor: SCREEN_BG }}>
      <AppHeroTitleSection
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={2}>
                  {displayName}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {t(roleKey)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {user?.email ? (
              <View style={styles.metaRow}>
                <View style={styles.iconBox}>
                  <Mail size={18} color="#6B7280" strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.metaLabel}>{t('profile.emailLabel')}</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <OrderActionButton
            label={t('profile.signOut')}
            onPress={handleSignOut}
            variant="secondary"
            icon={LogOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}
