import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/components/ui/text';
import { BENSERCA_ICON } from '@/shared/constants/brand-assets';
import { useResolvedColorScheme } from '@/theme/hooks';
import { colors } from '@/theme/tokens';

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
  const iconSize = isLarge ? 120 : 80;
  const onDark = tone === 'onDark';
  const logoColor = onDark ? '#FFFFFF' : palette.primary;

  return (
    <View className="items-center gap-1.5">
      <View
        style={
          onDark
            ? { width: iconSize, height: iconSize, alignItems: 'center', justifyContent: 'center' }
            : {
                overflow: 'hidden',
                borderRadius: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: palette.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
              }
        }
      >
        <Image
          source={BENSERCA_ICON}
          style={{ width: iconSize, height: iconSize, tintColor: logoColor }}
          contentFit="contain"
          accessibilityLabel={t('common.appName')}
        />
      </View>
      {showTagline ? (
        <Text
          className={`text-sm text-center max-w-[280px] leading-5 ${
            onDark ? 'text-white/80' : 'text-foreground/55 dark:text-foreground-dark/55'
          }`}
        >
          {t('brand.tagline')}
        </Text>
      ) : null}
    </View>
  );
}
