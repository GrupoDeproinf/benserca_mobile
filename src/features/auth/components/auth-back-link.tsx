import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { AUTH_ROUTES } from '@/features/auth/constants/routes';
import { Text } from '@/shared/components/ui/text';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';

interface AuthBackLinkProps {
  /** Botón circular sobre el degradado azul (arriba) */
  variant?: 'icon' | 'button';
}

export function AuthBackLink({ variant = 'icon' }: AuthBackLinkProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useResolvedColorScheme();
  const palette = colors[scheme];

  const goBack = () => {
    Haptics.selectionAsync();
    router.replace(AUTH_ROUTES.login);
  };

  if (variant === 'button') {
    return (
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel={t('auth.backToLogin')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ChevronLeft size={20} color={palette.primary} strokeWidth={2.5} />
        <Text className="text-base font-semibold text-primary">{t('auth.signIn')}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel={t('auth.backToLogin')}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <ChevronLeft size={26} color={palette.primary} strokeWidth={3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
    shadowColor: '#0B1F33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
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
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
