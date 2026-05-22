import { useRouter } from 'expo-router';
import { BarChart3, ShieldCheck, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AuthScreenLayout, BrandMark } from '@/features/auth/components';
import { AUTH_ROUTES } from '@/features/auth/constants/routes';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';
import { useSettingsStore } from '@/store/settings.store';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';

const features = [
  { key: 'security', Icon: ShieldCheck },
  { key: 'analytics', Icon: BarChart3 },
  { key: 'teams', Icon: Users },
] as const;

export function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const scheme = useResolvedColorScheme();
  const iconColor = colors[scheme].primary;

  const goToLogin = () => {
    completeOnboarding();
    router.push(AUTH_ROUTES.login);
  };

  return (
    <AuthScreenLayout showBrand={false} showFooter={false}>
      <View className="flex-1 justify-between py-6">
        <View className="items-center gap-4 pt-8">
          <BrandMark />
          <Text className="text-center text-base leading-6 text-foreground/70 dark:text-foreground-dark/70 px-4">
            {t('welcome.subtitle')}
          </Text>
        </View>

        <View className="gap-4">
          {features.map(({ key, Icon }) => (
            <View
              key={key}
              className="flex-row items-center gap-4 rounded-2xl border border-border dark:border-border-dark bg-card/80 dark:bg-card px-4 py-4"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-muted dark:bg-brand-muted-dark">
                <Icon size={22} color={iconColor} strokeWidth={2} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-base font-semibold">
                  {t(`welcome.features.${key}.title`)}
                </Text>
                <Text className="text-sm text-foreground/60 dark:text-foreground-dark/60">
                  {t(`welcome.features.${key}.description`)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="gap-3 pb-4">
          <Button label={t('welcome.getStarted')} onPress={goToLogin} />
          <Button label={t('welcome.signIn')} variant="ghost" onPress={goToLogin} />
          <Text className="text-center text-xs text-foreground/40 dark:text-foreground-dark/40">
            {t('brand.copyright')}
          </Text>
        </View>
      </View>
    </AuthScreenLayout>
  );
}
