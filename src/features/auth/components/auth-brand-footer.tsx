import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/components/ui/text';
import { getAppVersion } from '@/shared/constants/app-info';

interface AuthBrandFooterProps {
  tone?: 'default' | 'onDark';
}

/** Pie de pantallas auth: solo © y versión. */
export function AuthBrandFooter({ tone = 'default' }: AuthBrandFooterProps) {
  const { t } = useTranslation();
  const version = getAppVersion();
  const onDark = tone === 'onDark';

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(280)}
      className="items-center gap-1 pt-4 pb-1"
    >
      <Text
        className={
          onDark
            ? 'text-xs font-medium text-white/40'
            : 'text-xs font-medium text-foreground/45 dark:text-foreground-dark/45'
        }
      >
        {t('brand.version', { version })}
      </Text>
      <Text
        className={
          onDark ? 'text-xs text-white/30' : 'text-xs text-foreground/35 dark:text-foreground-dark/35'
        }
      >
        {t('brand.copyright')}
      </Text>
    </Animated.View>
  );
}
