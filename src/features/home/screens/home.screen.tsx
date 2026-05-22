import { Bell, ClipboardList, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Screen } from '@/shared/components/layout/screen';
import { GlassCard } from '@/shared/components/ui/glass-card';
import { Text } from '@/shared/components/ui/text';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';

const quickActions = [
  { key: 'tasks', Icon: ClipboardList },
  { key: 'reports', Icon: TrendingUp },
  { key: 'alerts', Icon: Bell },
] as const;

export function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const scheme = useResolvedColorScheme();
  const iconColor = colors[scheme].primary;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          <View className="gap-1 pt-2">
            <Text className="text-sm font-medium text-foreground/50 dark:text-foreground-dark/50">
              {t('home.greeting')}
            </Text>
            <Text className="text-3xl font-bold">
              {t('home.welcome', { name: user?.name ?? 'Usuario' })}
            </Text>
          </View>

          <GlassCard className="p-5 gap-2">
            <Text className="text-lg font-semibold">{t('home.dashboardTitle')}</Text>
            <Text className="text-sm leading-5 text-foreground/65 dark:text-foreground-dark/65">
              {t('home.dashboardSubtitle')}
            </Text>
          </GlassCard>

          <View className="gap-3">
            <Text className="text-base font-semibold">{t('home.quickActions')}</Text>
            <View className="flex-row gap-3">
              {quickActions.map(({ key, Icon }) => (
                <View
                  key={key}
                  className="flex-1 items-center gap-2 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card p-4"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-muted dark:bg-brand-muted-dark">
                    <Icon size={20} color={iconColor} strokeWidth={2} />
                  </View>
                  <Text className="text-center text-xs font-medium">
                    {t(`home.actions.${key}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
