import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Eye, EyeOff, Lock, Mail, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AuthScreenLayout } from '@/features/auth/components/auth-screen-layout';
import { AuthField } from '@/features/auth/components/auth-field';
import { AuthPrimaryButton } from '@/features/auth/components/auth-primary-button';
import { LoginFormCard } from '@/features/auth/components/login-form-card';
import { type LoginFormValues, loginSchema } from '@/features/auth/schemas/login.schema';
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/features/auth/schemas/forgot-password.schema';
import { requestPasswordReset } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Text } from '@/shared/components/ui/text';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';

type Mode = 'login' | 'forgot' | 'sent';

export function LoginScreen() {
  const { t } = useTranslation();
  const scheme = useResolvedColorScheme();
  const palette = colors[scheme];
  const setUser = useAuthStore((s) => s.setUser);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>('login');

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onLoginSubmit = async () => {
    setSubmitting(true);
    try {
      setUser({ id: '1', email: 'demo@benserca.com', name: 'Demo' });
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotSubmit = forgotForm.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await requestPasswordReset(values);
      setMode('sent');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthScreenLayout>
      <LoginFormCard>
        {mode === 'login' && (
          <Animated.View key="login" entering={FadeInDown.duration(250)} style={{ gap: 20 }}>
            <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
              <Text className="text-2xl font-bold text-primary dark:text-foreground-dark tracking-tight text-center">
                {t('auth.loginTitle')}
              </Text>
              <Text className="text-[15px] leading-[22px] text-foreground/60 dark:text-foreground-dark/65 text-center">
                {t('auth.loginSubtitle')}
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <Controller
                control={loginForm.control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <AuthField
                    variant="inset"
                    label={t('auth.email')}
                    placeholder="tu@correo.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    leftIcon={Mail}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={loginForm.formState.errors.email?.message}
                  />
                )}
              />

              <Controller
                control={loginForm.control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <AuthField
                    variant="inset"
                    label={t('auth.password')}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    leftIcon={Lock}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={loginForm.formState.errors.password?.message}
                    rightElement={
                      <Pressable
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={12}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? t('auth.hidePassword') : t('auth.showPassword')
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} color={palette.mutedForeground} />
                        ) : (
                          <Eye size={20} color={palette.mutedForeground} />
                        )}
                      </Pressable>
                    }
                  />
                )}
              />
            </View>

            <View style={{ alignItems: 'flex-end', marginTop: -4 }}>
              <Pressable
                onPress={() => setMode('forgot')}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-sm font-semibold text-primary">
                  {t('auth.forgotPassword')}
                </Text>
              </Pressable>
            </View>

            <AuthPrimaryButton
              label={isSubmitting ? t('common.loading') : t('auth.signIn')}
              onPress={onLoginSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
            />
          </Animated.View>
        )}

        {mode === 'forgot' && (
          <Animated.View key="forgot" entering={FadeInDown.duration(250)} style={{ gap: 20 }}>
            <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
              <Text className="text-2xl font-bold text-primary dark:text-foreground-dark tracking-tight text-center">
                {t('auth.forgotTitle')}
              </Text>
              <Text className="text-[15px] leading-[22px] text-foreground/60 dark:text-foreground-dark/65 text-center">
                {t('auth.forgotSubtitle')}
              </Text>
            </View>

            <Controller
              control={forgotForm.control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <AuthField
                  variant="inset"
                  label={t('auth.email')}
                  placeholder="tu@correo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  leftIcon={Mail}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={forgotForm.formState.errors.email?.message}
                />
              )}
            />

            <AuthPrimaryButton
              label={isSubmitting ? t('common.loading') : t('auth.sendResetLink')}
              onPress={onForgotSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
            />

            <Pressable
              onPress={() => setMode('login')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.88 : 1,
                transform: pressed ? [{ scale: 0.98 }] : [],
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  minHeight: 52,
                  paddingHorizontal: 20,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  borderWidth: 1,
                  borderColor: 'rgba(30,73,118,0.12)',
                  shadowColor: '#1E4976',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <ChevronLeft size={18} color={palette.primary} strokeWidth={2.5} />
                <Text numberOfLines={1} style={{ flexShrink: 1, lineHeight: 18 }} className="text-[15px] font-semibold text-primary">
                  {t('auth.backToLogin')}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {mode === 'sent' && (
          <Animated.View key="sent" entering={FadeIn.duration(350)} style={{ gap: 20 }}>
            <View style={{ alignItems: 'center', gap: 16, paddingVertical: 8 }}>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-muted dark:bg-brand-muted-dark">
                <MailCheck size={32} color={palette.primary} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text className="text-xl font-bold text-primary dark:text-foreground-dark text-center">
                  {t('auth.forgotTitle')}
                </Text>
                <Text className="text-[15px] leading-[22px] text-foreground/60 dark:text-foreground-dark/65 text-center">
                  {t('auth.forgotSuccess')}
                </Text>
                <Text className="text-sm text-foreground/55 dark:text-foreground-dark/55 text-center">
                  {t('auth.forgotCheckInbox')}
                </Text>
              </View>
            </View>

            <AuthPrimaryButton label={t('auth.backToLogin')} onPress={() => setMode('login')} />
          </Animated.View>
        )}
      </LoginFormCard>
    </AuthScreenLayout>
  );
}
