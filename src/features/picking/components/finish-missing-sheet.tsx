import * as Haptics from 'expo-haptics';
import { PackageOpen } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAndroidKeyboardHeight } from '@/shared/hooks/use-android-keyboard-height';

interface FinishMissingSheetProps {
  visible: boolean;
  /** Renglones que quedan sin asignar, ya formateados para mostrar. */
  items: string[];
  onClose: () => void;
  /** `note` viene recortado; vacío si el picker no escribió nada. */
  onConfirm: (note: string) => void;
}

/**
 * Confirmación de "Finalizar igual" cuando el pedido queda con cantidades sin
 * asignar. A diferencia del `ConfirmSheet` genérico que reemplaza, deja al
 * picker anotar por qué (motivo que antes no se podía registrar): la nota
 * viaja a la notificación de picking incompleto (ver `orders.store.ts`).
 */
export function FinishMissingSheet({
  visible,
  items,
  onClose,
  onConfirm,
}: FinishMissingSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useAndroidKeyboardHeight();
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) setNote('');
  }, [visible]);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm(note.trim());
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { paddingBottom: keyboardHeight }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <PackageOpen size={28} color="#B45309" strokeWidth={2} />
          </View>

          <Text style={styles.title}>{t('picking.finish.missingTitle')}</Text>
          <Text style={styles.message}>{t('picking.finish.missingBody')}</Text>

          {items.length > 0 ? (
            <View style={styles.itemsBox}>
              <ScrollView style={styles.itemsScroll} nestedScrollEnabled>
                {items.map((item, index) => (
                  <View
                    // biome-ignore lint/suspicious/noArrayIndexKey: static list built fresh each time the sheet opens, no reordering.
                    key={`${item}-${index}`}
                    style={[styles.itemRow, index === 0 && styles.itemRowFirst]}
                  >
                    <View style={styles.itemDot} />
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>{t('picking.finish.noteLabel')}</Text>
          <TextInput
            placeholder={t('picking.finish.notePlaceholder')}
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
            style={styles.input}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable
              onPress={handleClose}
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
                <Text style={styles.btnPrimaryText}>{t('picking.finish.missingConfirm')}</Text>
              </View>
            </Pressable>
          </View>
        </View>
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
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  itemsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  itemsScroll: {
    maxHeight: 160,
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  itemRowFirst: {
    borderTopWidth: 0,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  input: {
    minHeight: 80,
    maxHeight: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    lineHeight: 21,
    marginBottom: 20,
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
