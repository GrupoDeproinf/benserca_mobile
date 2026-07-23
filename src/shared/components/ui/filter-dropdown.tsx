import { ChevronDown, type LucideIcon } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  type LayoutRectangle,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

const MENU_GAP = 6;
const SCREEN_EDGE = 16;
const MENU_WIDTH = 220;
const MENU_MAX_HEIGHT = 320;

/** Ancla el menú bajo el botón, sin salirse de los bordes de la pantalla. */
function menuLayout(anchor: LayoutRectangle) {
  const screenWidth = Dimensions.get('window').width;
  const width = Math.min(MENU_WIDTH, screenWidth - SCREEN_EDGE * 2);
  const left = Math.min(
    Math.max(anchor.x, SCREEN_EDGE),
    Math.max(screenWidth - SCREEN_EDGE - width, SCREEN_EDGE),
  );
  return { top: anchor.y + anchor.height + MENU_GAP, left, width };
}

export interface FilterDropdownOption {
  key: string;
  label: string;
}

interface FilterDropdownProps {
  /** Texto del botón cuando no hay filtro aplicado (`value === defaultKey`). */
  placeholder: string;
  value: string;
  options: readonly FilterDropdownOption[];
  onChange: (key: string) => void;
  icon?: LucideIcon;
  /** Valor "sin filtro"; con él el botón queda en estado neutro. */
  defaultKey?: string;
  style?: ViewStyle;
}

/** Botón compacto con menú desplegable, para filtros de una sola selección. */
export function FilterDropdown({
  placeholder,
  value,
  options,
  onChange,
  icon: Icon,
  defaultKey = 'all',
  style,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const btnRef = useRef<View>(null);

  const active = value !== defaultKey;
  const label = active ? (options.find((o) => o.key === value)?.label ?? placeholder) : placeholder;

  const measureAnchor = useCallback(() => {
    const node = btnRef.current;
    if (!node || typeof node.measureInWindow !== 'function') return;
    node.measureInWindow((x, y, width, height) => {
      // En Android la medición puede devolver valores vacíos si la vista no
      // está en la ventana activa; en ese caso se conserva el anchor previo.
      if (!Number.isFinite(y) || !Number.isFinite(height) || height === 0) return;
      setAnchor({ x, y, width, height });
    });
  }, []);

  /**
   * Se mide ANTES de abrir: una vez montado el Modal, en Android la vista del
   * botón queda en la ventana de fondo y `measureInWindow` no responde.
   */
  const toggle = () => {
    measureAnchor();
    setOpen((v) => !v);
  };

  const close = () => setOpen(false);

  const select = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  const menu = anchor ? menuLayout(anchor) : null;

  return (
    <View style={style}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={`${placeholder}: ${label}`}
        style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.92 }]}
        android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
      >
        <View
          ref={btnRef}
          onLayout={measureAnchor}
          style={[styles.btn, (active || open) && styles.btnActive]}
          collapsable={false}
        >
          {Icon ? <Icon size={15} color={active ? '#111827' : '#3C3C43'} strokeWidth={2} /> : null}
          <Text style={[styles.btnLabel, active && styles.btnLabelActive]} numberOfLines={1}>
            {label}
          </Text>
          <ChevronDown
            size={14}
            color={active ? '#111827' : '#3C3C43'}
            strokeWidth={2.5}
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          />
        </View>
      </Pressable>

      {/* `statusBarTranslucent`: sin esto, en Android el contenido del Modal
          arranca bajo la barra de estado mientras que `measureInWindow` mide
          desde el borde de la ventana, y el menú aparece desplazado hacia
          abajo esa misma altura. */}
      <Modal
        visible={open}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={styles.backdrop} onPress={close} />
          {/* Si la medición falló, se cae a una posición por defecto: abrir el
              menú mal ubicado es preferible a abrir un modal vacío. */}
          <View
            style={[
              styles.menu,
              menu ? { top: menu.top, left: menu.left, width: menu.width } : styles.menuFallback,
            ]}
          >
            <ScrollView
              style={{ maxHeight: MENU_MAX_HEIGHT }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option) => {
                const selected = option.key === value;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => select(option.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.item, selected && styles.itemSelected]}
                  >
                    <Text
                      style={[styles.itemText, selected && styles.itemTextSelected]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  btnActive: {
    borderColor: '#111827',
  },
  btnLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
  },
  btnLabelActive: {
    color: '#111827',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  menuFallback: {
    top: '30%',
    left: SCREEN_EDGE,
    width: MENU_WIDTH,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  itemSelected: {
    backgroundColor: '#F2F2F7',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  itemTextSelected: {
    fontWeight: '700',
  },
});
