import { Text as RNText, type TextProps } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(RNText, { className: 'style' });

export function Text(props: TextProps & { className?: string }) {
  return <RNText {...props} className={`text-foreground dark:text-foreground-dark ${props.className ?? ''}`} />;
}
