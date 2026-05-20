import { TextInput, type TextInputProps } from 'react-native';
import { cssInterop } from 'nativewind';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';

cssInterop(TextInput, { className: 'style' });

interface InputProps extends TextInputProps {
  className?: string;
}

export function Input({ className = '', ...rest }: InputProps) {
  const scheme = useResolvedColorScheme();
  return (
    <TextInput
      placeholderTextColor={colors[scheme].mutedForeground}
      {...rest}
      className={`h-12 px-4 rounded-xl border border-border dark:border-border-dark bg-muted dark:bg-muted-dark text-foreground dark:text-foreground-dark ${className}`}
    />
  );
}
