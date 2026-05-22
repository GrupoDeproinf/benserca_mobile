import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/components/ui/text';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';

const appIcon = require('@assets/images/icon.png');

interface BrandMarkProps {
  size?: 'sm' | 'lg';
  showTagline?: boolean;
  /** Texto claro sobre fondos oscuros (hero de login, etc.) */
  tone?: 'default' | 'onDark';
}

export function BrandMark({
  size = 'lg',
  showTagline = false,
  tone = 'default',
}: BrandMarkProps) {
  const { t } = useTranslation();
  const scheme = useResolvedColorScheme();
  const palette = colors[scheme];
  const isLarge = size === 'lg';
  const iconSize = isLarge ? 72 : 52;
  const onDark = tone === 'onDark';

  return (
    <View className="items-center gap-2.5">
      <View
        className="overflow-hidden rounded-2xl bg-white"
        style={{
          shadowColor: onDark ? '#000' : palette.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: onDark ? 0.2 : 0.15,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Image
          source={appIcon}
          style={{ width: iconSize, height: iconSize }}
          contentFit="cover"
          accessibilityLabel={t('common.appName')}
        />
      </View>
      <View className="items-center gap-1">
        <Text
          className={`font-bold tracking-tight ${isLarge ? 'text-2xl' : 'text-xl'} ${
            onDark ? 'text-white' : 'text-foreground dark:text-foreground-dark'
          }`}
        >
          {t('common.appName')}
        </Text>
        {showTagline && (
          <Text
            className={`text-sm text-center max-w-[280px] leading-5 ${
              onDark ? 'text-white/80' : 'text-foreground/55 dark:text-foreground-dark/55'
            }`}
          >
            {t('brand.tagline')}
          </Text>
        )}
      </View>
    </View>
  );
}
