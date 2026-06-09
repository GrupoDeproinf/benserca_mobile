import { BlurView } from 'expo-blur';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { cssInterop } from 'nativewind';
import { loginTheme } from '@/features/auth/constants/login-theme';
import { Text } from '@/shared/components/ui/text';
import { useResolvedColorScheme } from '@/theme/hooks';
import { colors } from '@/theme/tokens';

cssInterop(TextInput, { className: 'style' });

interface AuthFieldProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightElement?: ReactNode;
  variant?: 'default' | 'floating' | 'glass' | 'inset' | 'dark';
  /** Etiqueta clara sobre fondos oscuros (login con degradado) */
  labelTone?: 'default' | 'onDark';
}

const floatShadow = {
  shadowColor: '#1E4976',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 8,
} as const;

const insetShadow = {
  shadowColor: '#1E4976',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
} as const;

function AuthFieldDark({
  label,
  error,
  leftIcon: LeftIcon,
  rightElement,
  className = '',
  ...rest
}: AuthFieldProps) {
  const inputRow = (
    <>
      {LeftIcon ? (
        <View className="pl-4">
          <LeftIcon size={20} color={loginTheme.muted} strokeWidth={2} />
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={loginTheme.muted}
        {...rest}
        className={`flex-1 h-[52px] px-3 text-base ${className}`}
        style={{ backgroundColor: 'transparent', color: loginTheme.text }}
      />
      {rightElement ? <View className="pr-4">{rightElement}</View> : null}
    </>
  );

  return (
    <View className="gap-2">
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: loginTheme.label,
        }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.darkRow,
          {
            backgroundColor: loginTheme.inputBg,
            borderColor: error ? loginTheme.inputBorderError : loginTheme.inputBorder,
          },
        ]}
      >
        {inputRow}
      </View>
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}

function AuthFieldDefault({
  label,
  error,
  leftIcon: LeftIcon,
  rightElement,
  variant = 'default',
  labelTone = 'default',
  className = '',
  ...rest
}: AuthFieldProps) {
  const scheme = useResolvedColorScheme();
  const palette = colors[scheme];
  const isGlass = variant === 'glass' || variant === 'floating';
  const isInset = variant === 'inset';
  const blurTint = scheme === 'dark' ? 'dark' : 'light';
  const glassOverlay = scheme === 'dark' ? 'rgba(17,24,39,0.55)' : 'rgba(255,255,255,0.85)';

  const inputRow = (
    <>
      {LeftIcon ? (
        <View className="pl-4">
          <LeftIcon size={20} color={palette.primary} strokeWidth={2} />
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={palette.mutedForeground}
        {...rest}
        className={`flex-1 h-[52px] px-3 text-base text-foreground dark:text-foreground-dark ${className}`}
        style={isGlass || isInset ? { backgroundColor: 'transparent' } : undefined}
      />
      {rightElement ? <View className="pr-4">{rightElement}</View> : null}
    </>
  );

  const shell = isInset ? (
    <View
      className={`flex-row items-center rounded-xl overflow-hidden border ${
        error ? 'border-red-400' : 'border-white/70 dark:border-white/20'
      }`}
      style={[{ backgroundColor: glassOverlay }, insetShadow]}
    >
      {inputRow}
    </View>
  ) : isGlass ? (
    <View
      className={`rounded-2xl overflow-hidden border ${
        error ? 'border-red-400' : 'border-white/90 dark:border-white/15'
      }`}
      style={floatShadow}
    >
      <BlurView intensity={Platform.OS === 'ios' ? 55 : 35} tint={blurTint}>
        <View style={[styles.glassRow, { backgroundColor: glassOverlay }]}>{inputRow}</View>
      </BlurView>
    </View>
  ) : (
    <View
      className={`flex-row items-center rounded-2xl border bg-card dark:bg-card overflow-hidden ${
        error ? 'border-red-400' : 'border-border dark:border-border-dark'
      }`}
    >
      {inputRow}
    </View>
  );

  return (
    <View className="gap-2">
      <Text
        className={
          labelTone === 'onDark'
            ? 'text-sm font-medium text-white/90'
            : 'text-sm font-medium text-primary dark:text-foreground-dark'
        }
      >
        {label}
      </Text>
      {shell}
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}

export function AuthField(props: AuthFieldProps) {
  if (props.variant === 'dark') {
    return <AuthFieldDark {...props} />;
  }
  return <AuthFieldDefault {...props} />;
}

const styles = StyleSheet.create({
  glassRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
