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
import {
  AuthNotEnabledError,
  FirestorePermissionError,
  InvalidCredentialsError,
  InvalidProfileError,
  NetworkAuthError,
  ProfileNotFoundError,
  login,
  requestPasswordReset,
} from '@/features/auth/services/auth.service';
import { loginTheme } from '@/features/auth/constants/login-theme';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Text } from '@/shared/components/ui/text';

type Mode = 'login' | 'forgot' | 'sent';

function resolveAuthErrorMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof InvalidCredentialsError) return t('auth.invalidCredentials');
  if (err instanceof ProfileNotFoundError) return t('auth.profileNotFound');
  if (err instanceof InvalidProfileError) return t('auth.invalidProfile');
  if (err instanceof FirestorePermissionError) return t('auth.firestorePermission');
  if (err instanceof AuthNotEnabledError) return t('auth.authNotEnabled');
  if (err instanceof NetworkAuthError) return t('auth.networkError');
  if (__DEV__) {
    console.warn('[auth] Login failed:', err);
  }
  return t('auth.genericError');
}

export function LoginScreen() {
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [authError, setAuthError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submitLogin = async (values: LoginFormValues) => {
    setSubmitting(true);
    setAuthError(null);
    try {
      const user = await login(values);
      setUser(user);
    } catch (err) {
      setAuthError(resolveAuthErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const onLoginSubmit = loginForm.handleSubmit(submitLogin);

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
    <AuthScreenLayout footerTone="onDark" compact>
      <LoginFormCard variant="dark">
        {mode === 'login' && (
          <Animated.View key="login" entering={FadeInDown.duration(250)} style={{ gap: 20 }}>
            <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 4 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: loginTheme.lockBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={26} color={loginTheme.text} strokeWidth={1.75} />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: loginTheme.text,
                  letterSpacing: -0.3,
                  textAlign: 'center',
                }}
              >
                {t('auth.loginTitle')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 21,
                  color: loginTheme.muted,
                  textAlign: 'center',
                  paddingHorizontal: 8,
                }}
              >
                {t('auth.loginSubtitle')}
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <Controller
                control={loginForm.control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <AuthField
                    variant="dark"
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
                    variant="dark"
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
                          <EyeOff size={20} color={loginTheme.muted} />
                        ) : (
                          <Eye size={20} color={loginTheme.muted} />
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
                <Text style={{ fontSize: 13, fontWeight: '500', color: loginTheme.muted }}>
                  {t('auth.forgotPassword')}
                </Text>
              </Pressable>
            </View>

            {authError && (
              <View
                style={{
                  backgroundColor: 'rgba(127, 29, 29, 0.35)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.45)',
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ fontSize: 13, color: '#fca5a5', fontWeight: '500' }}>
                  {authError}
                </Text>
              </View>
            )}

            <AuthPrimaryButton
              variant="dark"
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
              <Text style={{ fontSize: 24, fontWeight: '700', color: loginTheme.text, textAlign: 'center' }}>
                {t('auth.forgotTitle')}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 21, color: loginTheme.muted, textAlign: 'center' }}>
                {t('auth.forgotSubtitle')}
              </Text>
            </View>

            <Controller
              control={forgotForm.control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <AuthField
                  variant="dark"
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
              variant="dark"
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
                  borderRadius: 12,
                  backgroundColor: loginTheme.buttonBg,
                  borderWidth: 1,
                  borderColor: loginTheme.buttonBorder,
                }}
              >
                <ChevronLeft size={18} color={loginTheme.text} strokeWidth={2.5} />
                <Text
                  numberOfLines={1}
                  style={{ flexShrink: 1, lineHeight: 18, fontSize: 15, fontWeight: '600', color: loginTheme.text }}
                >
                  {t('auth.backToLogin')}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {mode === 'sent' && (
          <Animated.View key="sent" entering={FadeIn.duration(350)} style={{ gap: 20 }}>
            <View style={{ alignItems: 'center', gap: 16, paddingVertical: 8 }}>
              <View
                style={{
                  height: 64,
                  width: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 32,
                  backgroundColor: loginTheme.inputBg,
                  borderWidth: 1,
                  borderColor: loginTheme.inputBorder,
                }}
              >
                <MailCheck size={32} color={loginTheme.text} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: loginTheme.text, textAlign: 'center' }}>
                  {t('auth.forgotTitle')}
                </Text>
                <Text style={{ fontSize: 15, lineHeight: 22, color: loginTheme.muted, textAlign: 'center' }}>
                  {t('auth.forgotSuccess')}
                </Text>
                <Text style={{ fontSize: 14, color: loginTheme.muted, textAlign: 'center', opacity: 0.85 }}>
                  {t('auth.forgotCheckInbox')}
                </Text>
              </View>
            </View>

            <AuthPrimaryButton
              variant="dark"
              label={t('auth.backToLogin')}
              onPress={() => setMode('login')}
            />
          </Animated.View>
        )}
      </LoginFormCard>
    </AuthScreenLayout>
  );
}
