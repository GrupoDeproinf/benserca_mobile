import type { LucideIcon } from 'lucide-react-native';
import { AlertCircle, Info } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useConfirmSheetStore } from './confirm-sheet.store';

export type ConfirmSheetTone = 'default' | 'warning' | 'info';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  /** Lista opcional que se muestra en un bloque alineado a la izquierda debajo del mensaje. */
  messageItems?: string[];
  onClose: () => void;
  /** Solo en modo confirm */
  onConfirm?: () => void;
  /** Acción del botón cancelar; si no se define, usa onClose. */
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  mode?: 'confirm' | 'info';
  tone?: ConfirmSheetTone;
  icon?: LucideIcon;
  /** Si es false, no se cierra al tocar fuera ni con botón atrás. */
  dismissible?: boolean;
}

export function ConfirmSheet({
  visible,
  title,
  message,
  messageItems,
  onClose,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  mode = 'confirm',
  tone = 'default',
  icon: IconProp,
  dismissible = true,
}: ConfirmSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isInfo = mode === 'info';
  const hasItems = Array.isArray(messageItems) && messageItems.length > 0;

  const Icon =
    IconProp ?? (tone === 'warning' || tone === 'info' ? AlertCircle : Info);

  const iconBg =
    tone === 'warning' ? '#FEF3C7' : tone === 'info' ? '#E0E7FF' : '#F3F4F6';
  const iconColor =
    tone === 'warning' ? '#D97706' : tone === 'info' ? '#4F46E5' : '#111827';

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : () => {}}
    >
      <View style={styles.root}>
        {dismissible ? (
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        ) : (
          <View style={styles.backdrop} accessibilityElementsHidden importantForAccessibility="no" />
        )}

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <Icon size={28} color={iconColor} strokeWidth={2} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.message, hasItems && styles.messageWithList]}>{message}</Text>

          {hasItems ? (
            <View style={[styles.itemsBox, { borderLeftColor: iconColor }]}>
              {messageItems!.map((item, index) => (
                <View
                  key={`${item}-${index}`}
                  style={[styles.itemRow, index === 0 && styles.itemRowFirst]}
                >
                  <View style={[styles.itemDot, { backgroundColor: iconColor }]} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={[styles.actions, !isInfo && styles.actionsRow]}>
            {!isInfo ? (
              <Pressable
                onPress={() => {
                  if (onCancel) onCancel();
                  onClose();
                }}
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                style={({ pressed }) => [styles.btnPressable, pressed && styles.pressed]}
              >
                <View style={[styles.btnSurface, styles.btnSecondarySurface]} collapsable={false}>
                  <Text style={styles.btnSecondaryText}>
                    {cancelLabel ?? t('common.cancel')}
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {!isInfo ? (
              <Pressable
                onPress={handleConfirm}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={({ pressed }) => [styles.btnPressable, styles.btnConfirmWrap, pressed && styles.pressed]}
              >
                <View style={[styles.btnSurface, styles.btnPrimarySurface]} collapsable={false}>
                  <Text style={styles.btnPrimaryText}>
                    {confirmLabel ?? t('common.continue')}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={onClose}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={({ pressed }) => [styles.btnPressable, pressed && styles.pressed]}
              >
                <View style={[styles.btnSurface, styles.btnPrimarySurface]} collapsable={false}>
                  <Text style={styles.btnPrimaryText}>
                    {confirmLabel ?? t('common.understood')}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
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
    marginBottom: 24,
  },
  messageWithList: {
    marginBottom: 12,
  },
  itemsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 3,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 24,
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
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    fontWeight: '500',
  },
  actions: {
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#000000',
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

/** Host global para sheets disparados vía store. */
export function ConfirmSheetHost() {
  const activeId = useConfirmSheetStore((s) => s.activeId);
  const payload = useConfirmSheetStore((s) => s.payload);
  const hide = useConfirmSheetStore((s) => s.hide);

  if (!activeId || !payload) return null;

  return (
    <ConfirmSheet
      visible
      title={payload.title}
      message={payload.message}
      mode={payload.mode}
      tone={payload.tone}
      icon={payload.icon}
      confirmLabel={payload.confirmLabel}
      cancelLabel={payload.cancelLabel}
      onConfirm={payload.onConfirm}
      onClose={() => hide(activeId)}
    />
  );
}
