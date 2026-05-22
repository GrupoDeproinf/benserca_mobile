import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps } from 'react-native';
import { Text } from './text';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary',
  secondary: 'bg-muted dark:bg-muted-dark',
  ghost: 'bg-transparent',
};

const labelClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white',
  secondary: 'text-foreground dark:text-foreground-dark',
  ghost: 'text-primary',
};

export function Button({
  label,
  variant = 'primary',
  className = '',
  onPress,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      {...rest}
      onPress={(e) => {
        Haptics.selectionAsync();
        onPress?.(e);
      }}
      className={`h-12 px-5 rounded-xl items-center justify-center active:opacity-80 ${variantClasses[variant]} ${className}`}
    >
      <Text className={`text-base font-semibold ${labelClasses[variant]}`}>{label}</Text>
    </Pressable>
  );
}
