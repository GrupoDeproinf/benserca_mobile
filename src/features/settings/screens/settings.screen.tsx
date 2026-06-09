import { useRouter } from 'expo-router';
import { Globe, Monitor, Moon, Sun } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { AUTH_ROUTES } from '@/features/auth/constants/routes';
import { logout } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import { useNotificationsStore } from '@/features/notifications/store/notifications.store';
import { SettingsSection } from '@/features/settings/components';
import { Screen } from '@/shared/components/layout/screen';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';
import { type Language, type ThemePreference, useSettingsStore } from '@/store/settings.store';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';

const themeOptions: { value: ThemePreference; Icon: typeof Sun }[] = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
];

const languageOptions: Language[] = ['es', 'en'];

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  const colorScheme = useSettingsStore((s) => s.colorScheme);
  const language = useSettingsStore((s) => s.language);
  const setColorScheme = useSettingsStore((s) => s.setColorScheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const scheme = useResolvedColorScheme();
  const activeColor = colors[scheme].primary;

  const handleSignOut = async () => {
    await logout();
    useOrdersStore.getState().resetOrders();
    usePickersStore.getState().resetPickers();
    useNotificationsStore.getState().resetNotifications();
    signOut();
    router.replace(AUTH_ROUTES.login);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-8 pb-8">
          <View className="gap-1 pt-2">
            <Text className="text-3xl font-bold">{t('settings.title')}</Text>
            {user?.email && (
              <Text className="text-sm text-foreground/60 dark:text-foreground-dark/60">
                {user.email}
              </Text>
            )}
          </View>

          <SettingsSection label={t('settings.appearance')}>
            <View className="flex-row gap-2">
              {themeOptions.map(({ value, Icon }) => {
                const isActive = colorScheme === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setColorScheme(value)}
                    className={`flex-1 items-center gap-2 rounded-2xl border p-4 active:opacity-80 ${
                      isActive
                        ? 'border-primary bg-brand-muted dark:bg-brand-muted-dark'
                        : 'border-border dark:border-border-dark bg-card dark:bg-card'
                    }`}
                  >
                    <Icon
                      size={22}
                      color={isActive ? activeColor : colors[scheme].mutedForeground}
                    />
                    <Text className={`text-xs font-medium ${isActive ? 'text-primary' : ''}`}>
                      {t(`settings.${value}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SettingsSection>

          <SettingsSection label={t('settings.language')}>
            <View className="flex-row gap-2">
              {languageOptions.map((lang) => {
                const isActive = language === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => {
                      setLanguage(lang);
                      i18n.changeLanguage(lang);
                    }}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl border p-4 active:opacity-80 ${
                      isActive
                        ? 'border-primary bg-brand-muted dark:bg-brand-muted-dark'
                        : 'border-border dark:border-border-dark bg-card dark:bg-card'
                    }`}
                  >
                    <Globe
                      size={18}
                      color={isActive ? activeColor : colors[scheme].mutedForeground}
                    />
                    <Text className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                      {lang === 'es' ? 'Español' : 'English'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SettingsSection>

          <View className="rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card p-4 gap-1">
            <Text className="text-sm font-semibold">{t('common.appName')}</Text>
            <Text className="text-xs text-foreground/50 dark:text-foreground-dark/50">
              {t('brand.copyright')}
            </Text>
          </View>

          <Button label={t('settings.signOut')} variant="secondary" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}
