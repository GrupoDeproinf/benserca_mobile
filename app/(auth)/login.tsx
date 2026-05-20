import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/shared/components/layout/screen';
import { Text } from '@/shared/components/ui/text';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema';
import { login } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function LoginScreen() {
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const [isSubmitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const user = await login(values);
      setUser(user);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center"
      >
        <View className="gap-2 mb-10">
          <Text className="text-4xl font-bold">{t('auth.loginTitle')}</Text>
          <Text className="text-base text-foreground/60">{t('auth.loginSubtitle')}</Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="gap-1">
                <Input
                  placeholder={t('auth.email')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {formState.errors.email && (
                  <Text className="text-sm text-red-500">{formState.errors.email.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="gap-1">
                <Input
                  placeholder={t('auth.password')}
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {formState.errors.password && (
                  <Text className="text-sm text-red-500">{formState.errors.password.message}</Text>
                )}
              </View>
            )}
          />

          <Button
            label={isSubmitting ? t('common.loading') : t('auth.signIn')}
            onPress={onSubmit}
            disabled={isSubmitting}
            className="mt-2"
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
