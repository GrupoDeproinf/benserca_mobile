import { cssInterop } from 'nativewind';
import { Text as RNText, type TextProps } from 'react-native';

cssInterop(RNText, { className: 'style' });

export function Text(props: TextProps & { className?: string }) {
  return (
    <RNText
      {...props}
      className={`text-foreground dark:text-foreground-dark ${props.className ?? ''}`}
    />
  );
}
