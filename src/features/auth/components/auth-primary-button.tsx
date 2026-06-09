import { ActivityIndicator, Pressable, View } from 'react-native';
import { loginTheme } from '@/features/auth/constants/login-theme';
import { Text } from '@/shared/components/ui/text';

interface AuthPrimaryButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'dark';
}

export function AuthPrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'default',
}: AuthPrimaryButtonProps) {
  const isDark = variant === 'dark';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        opacity: pressed || disabled ? 0.72 : 1,
        transform: pressed ? [{ scale: 0.985 }] : [],
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 52,
          paddingHorizontal: 20,
          borderRadius: 12,
          backgroundColor: isDark ? '#ffffff' : loginTheme.buttonBg,
          borderWidth: isDark ? 0 : 1,
          borderColor: loginTheme.buttonBorder,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={isDark ? '#000000' : loginTheme.text} />
        ) : null}
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            fontSize: 15,
            fontWeight: '600',
            lineHeight: 18,
            color: isDark ? '#000000' : loginTheme.text,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
