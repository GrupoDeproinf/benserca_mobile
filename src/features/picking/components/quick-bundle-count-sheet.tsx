import * as Haptics from 'expo-haptics';
import { Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAndroidKeyboardHeight } from '@/shared/hooks/use-android-keyboard-height';
import type { QuickBundleCandidate } from '../utils/quick-bundles';
import { QtyStepper } from './qty-stepper';

interface QuickBundleCountSheetProps {
  /** Tarjeta que se está editando; `null` cierra la hoja. */
  candidate: QuickBundleCandidate | null;
  onClose: () => void;
  onConfirm: (lineId: string, count: number) => void;
}

/**
 * Elegir cuántos bultos rápidos armar (mantener presionada la tarjeta o tocar
 * el lápiz). El cálculo (`availableBundles`) es el máximo y el valor inicial:
 * la app no ve el inventario, así que si en almacén no alcanza el picker lo
 * baja. Nunca por encima del cálculo, porque se pasaría de lo pedido.
 */
export function QuickBundleCountSheet({
  candidate,
  onClose,
  onConfirm,
}: QuickBundleCountSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useAndroidKeyboardHeight();
  const [count, setCount] = useState(1);

  const max = candidate?.availableBundles ?? 1;
  const lineId = candidate?.lineId;

  // Cada apertura arranca en el sugerido. Si la tarjeta cambia con la hoja
  // abierta (llega un snapshot), el valor se acota al nuevo máximo.
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo reinicia al abrir otra tarjeta
  useEffect(() => {
    if (lineId) setCount(max);
  }, [lineId]);

  useEffect(() => {
    setCount((c) => Math.min(c, max));
  }, [max]);

  const handleConfirm = () => {
    if (!candidate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(candidate.lineId, count);
  };

  return (
    <Modal
      visible={candidate !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { paddingBottom: keyboardHeight }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />

        {candidate ? (
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.handle} />

            <View style={styles.iconWrap}>
              <Zap size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={styles.title}>{t('picking.quickBundle.editTitle')}</Text>
            <Text style={styles.itemName} numberOfLines={2}>
              {candidate.name}
            </Text>
            <Text style={styles.itemSku}>
              {candidate.sku} ·{' '}
              {t('picking.quickBundle.unitsPill', { units: candidate.unitsPerBundle })}
            </Text>

            <View style={styles.stepperWrap}>
              <QtyStepper
                value={count}
                onChange={setCount}
                min={1}
                max={max}
                size="large"
                editable
              />
              <Text style={styles.suggested}>
                {t('picking.quickBundle.editSuggested', { count: max })}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                style={({ pressed }) => [styles.btnPressable, pressed && styles.pressed]}
              >
                <View style={[styles.btnSurface, styles.btnSecondarySurface]} collapsable={false}>
                  <Text style={styles.btnSecondaryText}>{t('common.cancel')}</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={({ pressed }) => [
                  styles.btnPressable,
                  styles.btnConfirmWrap,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.btnSurface, styles.btnPrimarySurface]} collapsable={false}>
                  <Zap size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.btnPrimaryText}>
                    {t('picking.quickBundle.build', { count })}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
    marginBottom: 20,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FEF3C7',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  itemSku: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  stepperWrap: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  suggested: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  btnPressable: {
    flexShrink: 0,
  },
  btnConfirmWrap: {
    marginLeft: 'auto',
  },
  btnSurface: {
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnPrimarySurface: {
    backgroundColor: '#111827',
  },
  btnSecondarySurface: {
    backgroundColor: '#E9E9EB',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  pressed: {
    opacity: 0.88,
  },
});
