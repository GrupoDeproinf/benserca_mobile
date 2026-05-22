import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/components/ui/text';
import { getAppVersion } from '@/shared/constants/app-info';

/** Pie de pantallas auth: solo © y versión. */
export function AuthBrandFooter() {
  const { t } = useTranslation();
  const version = getAppVersion();

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(280)}
      className="items-center gap-1 pt-4 pb-1"
    >
      <Text className="text-xs font-medium text-foreground/45 dark:text-foreground-dark/45">
        {t('brand.version', { version })}
      </Text>
      <Text className="text-xs text-foreground/35 dark:text-foreground-dark/35">
        {t('brand.copyright')}
      </Text>
    </Animated.View>
  );
}
