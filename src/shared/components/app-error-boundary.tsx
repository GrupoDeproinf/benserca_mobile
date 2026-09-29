import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { installGlobalErrorHandler, onFatalError } from '@/shared/lib/fatal-error';

interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Pantalla de error. Muestra el mensaje real a propósito: es una app interna de
 * almacén y, cuando algo falla en turno, lo único que llega es "Benserca se
 * detuvo" — sin el mensaje no hay forma de saber qué pasó.
 */
function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.iconWrap}>
        <AlertTriangle size={28} color="#B45309" strokeWidth={2.2} />
      </View>

      <Text style={styles.title}>{t('errorScreen.title')}</Text>
      <Text style={styles.body}>{t('errorScreen.body')}</Text>

      <ScrollView style={styles.detailBox} contentContainerStyle={styles.detailContent}>
        <Text style={styles.detailText} selectable>
          {error.message || String(error)}
        </Text>
      </ScrollView>

      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('errorScreen.retry')}
        style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.85 }]}
      >
        <RotateCcw size={18} color="#FFFFFF" strokeWidth={2.4} />
        <Text style={styles.retryLabel}>{t('errorScreen.retry')}</Text>
      </Pressable>
    </View>
  );
}

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Corta la caída de toda la app por un error de render de una sola pantalla.
 *
 * En una build de release un error no atrapado mata el proceso y Android
 * muestra "Benserca se detuvo" sin más información. Con este límite el usuario
 * ve qué falló y puede reintentar sin volver a entrar ni perder la sesión.
 *
 * Solo atrapa errores de render/lifecycle de React: lo que pase en un callback
 * asíncrono o en código nativo no llega aquí.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };
  private unsubscribe: (() => void) | null = null;

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidMount(): void {
    // Además de los errores de render que atrapa el propio boundary, se
    // enganchan los de JS que ocurren fuera de React (callbacks, promesas,
    // timers): ver `fatal-error.ts`.
    installGlobalErrorHandler();
    this.unsubscribe = onFatalError((error) => {
      this.setState((current) => (current.error ? current : { error }));
    });
  }

  componentWillUnmount(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) return <ErrorFallback error={error} onRetry={this.handleRetry} />;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  detailBox: {
    alignSelf: 'stretch',
    maxHeight: 180,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  detailContent: {
    padding: 14,
  },
  detailText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#374151',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    marginTop: 'auto',
  },
  retryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
