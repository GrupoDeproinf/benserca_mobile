import * as Haptics from 'expo-haptics';
import { XCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RejectObservationSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (observation: string) => void;
  initialText?: string;
}

export function RejectObservationSheet({
  visible,
  onClose,
  onConfirm,
  initialText = '',
}: RejectObservationSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setText(initialText);
      setError(false);
    }
  }, [visible, initialText]);

  const handleConfirm = () => {
    if (!text.trim()) {
      setError(true);
      inputRef.current?.focus();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm(text.trim());
    setText('');
    setError(false);
  };

  const handleClose = () => {
    setText('');
    setError(false);
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
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <XCircle size={28} color="#DC2626" strokeWidth={2} />
          </View>

          <Text style={styles.title}>{t('audit.reject.title')}</Text>
          <Text style={styles.message}>{t('audit.reject.subtitle')}</Text>

          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              placeholder={t('audit.reject.placeholder')}
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={5}
              value={text}
              onChangeText={(value) => {
                setText(value);
                setError(false);
              }}
              style={[styles.input, error && styles.inputError]}
              textAlignVertical="top"
            />
            {error ? <Text style={styles.errorText}>{t('audit.reject.required')}</Text> : null}
          </View>

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
              style={({ pressed }) => [styles.btnPressable, styles.btnConfirmWrap, pressed && styles.pressed]}
            >
              <View style={[styles.btnSurface, styles.btnDestructiveSurface]} collapsable={false}>
                <Text style={styles.btnPrimaryText}>{t('audit.reject.confirm')}</Text>
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
    backgroundColor: '#FEE2E2',
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
    marginBottom: 16,
  },
  inputWrap: {
    marginBottom: 20,
  },
  input: {
    minHeight: 120,
    maxHeight: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    lineHeight: 21,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
    fontWeight: '500',
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
  btnDestructiveSurface: {
    backgroundColor: '#DC2626',
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
