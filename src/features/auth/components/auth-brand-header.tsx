import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrandMark } from './brand-mark';

interface AuthBrandHeaderProps {
  compact?: boolean;
}

export function AuthBrandHeader({ compact = false }: AuthBrandHeaderProps) {
  return (
    <View
      className={`items-center justify-center px-4 ${compact ? 'py-0' : 'pb-2 pt-0'}`}
    >
      <Animated.View entering={FadeInDown.duration(600).delay(80)}>
        <BrandMark
          size={compact ? 'sm' : 'lg'}
          showTagline
          tone="onDark"
        />
      </Animated.View>
    </View>
  );
}
