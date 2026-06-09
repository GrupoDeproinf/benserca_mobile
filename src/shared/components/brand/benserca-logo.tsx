import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View, type ViewStyle } from 'react-native';
import { BENSERCA_ICON, BENSERCA_ICON_TEXT } from '@/shared/constants/brand-assets';

type BensercaLogoVariant = 'icon' | 'text';

/** Proporción real de `icon-text.png` (1000×400). */
const TEXT_ASPECT = 2.5;

interface BensercaLogoProps {
  variant: BensercaLogoVariant;
  /** Alto del logo (ancho se calcula según variante). */
  height?: number;
  color?: string;
  style?: ViewStyle;
}

export function BensercaLogo({
  variant,
  height = 32,
  color = '#FFFFFF',
  style,
}: BensercaLogoProps) {
  const { t } = useTranslation();
  const source = variant === 'text' ? BENSERCA_ICON_TEXT : BENSERCA_ICON;
  const width = variant === 'text' ? height * TEXT_ASPECT : height;

  return (
    <View style={[{ height, width, justifyContent: 'center' }, style]}>
      <Image
        source={source}
        style={{ width, height, tintColor: color }}
        contentFit="contain"
        accessibilityLabel={t('common.appName')}
      />
    </View>
  );
}
