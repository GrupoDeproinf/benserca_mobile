import type { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends PropsWithChildren {
  className?: string;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  className = '',
  style,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background dark:bg-background-dark">
      <View className={`flex-1 px-5 ${className}`} style={style}>
        {children}
      </View>
    </SafeAreaView>
  );
}
