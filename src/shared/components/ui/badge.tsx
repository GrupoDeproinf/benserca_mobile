import { View } from 'react-native';
import { useResolvedColorScheme } from '@/theme';
import { Text } from './text';

interface BadgeProps {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  className?: string;
}

export function Badge({
  label,
  backgroundColor,
  textColor,
  borderColor,
  className = '',
}: BadgeProps) {
  return (
    <View
      className={`self-start rounded-full px-2.5 py-1 ${className}`}
      style={{
        backgroundColor,
        borderWidth: borderColor ? 1 : 0,
        borderColor: borderColor ?? 'transparent',
      }}
    >
      <Text className="text-xs font-semibold" style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
}

interface StatusBadgeProps {
  label: string;
  bg: string;
  text: string;
  border: string;
  className?: string;
}

export function StatusBadge({ label, bg, text, border, className }: StatusBadgeProps) {
  return (
    <Badge
      label={label}
      backgroundColor={bg}
      textColor={text}
      borderColor={border}
      className={className}
    />
  );
}

/** Badge que resuelve colores según el tema activo (uso con orderStatusColor / pickerStatusColor). */
export function ThemedStatusBadge({
  label,
  colors,
  className,
}: {
  label: string;
  colors: { bg: string; text: string; border: string };
  className?: string;
}) {
  useResolvedColorScheme();
  return (
    <StatusBadge
      label={label}
      bg={colors.bg}
      text={colors.text}
      border={colors.border}
      className={className}
    />
  );
}
