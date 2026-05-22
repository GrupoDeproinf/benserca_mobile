import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthBackLink } from '@/features/auth/components/auth-back-link';
import { AuthBrandFooter } from '@/features/auth/components/auth-brand-footer';
import { AuthBrandHeader } from '@/features/auth/components/auth-brand-header';
import { LoginBackdrop } from '@/features/auth/components/login-backdrop';

interface AuthScreenLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  showBrand?: boolean;
  showFooter?: boolean;
}

/**
 * Columna auth: marca arriba, tarjeta que crece hasta el pie, footer anclado abajo.
 */
export function AuthScreenLayout({
  children,
  showBack = false,
  showBrand = true,
  showFooter = true,
}: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const content = (
    <View
      style={[
        styles.column,
        {
          minHeight: height,
          paddingTop: showBack ? insets.top + 28 : insets.top + 80,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {showBrand ? (
        <View style={styles.header}>
          {showBack ? (
            <>
              <AuthBackLink variant="icon" />
              <View style={styles.brandSection}>
                <AuthBrandHeader compact />
              </View>
            </>
          ) : (
            <AuthBrandHeader compact />
          )}
        </View>
      ) : null}

      <View style={styles.cardSlot}>{children}</View>

      {showFooter ? <View style={styles.footerSlot}><AuthBrandFooter /></View> : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <LoginBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollGrow}
        >
          {content}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollGrow: {
    flexGrow: 1,
  },
  column: {
    flexGrow: 1,
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingBottom: 90,
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: 4,
  },
  cardSlot: {
    minHeight: 0,
  },
  footerSlot: {
    marginTop: 'auto',
  },
});
