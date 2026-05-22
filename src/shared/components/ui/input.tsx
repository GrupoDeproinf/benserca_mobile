import { cssInterop } from 'nativewind';
import { TextInput, type TextInputProps, View } from 'react-native';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';
import { Text } from './text';

cssInterop(TextInput, { className: 'style' });

interface InputProps extends TextInputProps {
  className?: string;
  label?: string;
}

export function Input({ className = '', label, ...rest }: InputProps) {
  const scheme = useResolvedColorScheme();
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-sm font-medium text-foreground/80 dark:text-foreground-dark/80">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors[scheme].mutedForeground}
        {...rest}
        className={`h-12 px-4 rounded-xl border border-border dark:border-border-dark bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark ${className}`}
      />
    </View>
  );
}
