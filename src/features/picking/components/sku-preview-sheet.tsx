import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/shared/components/ui/text';
import type { OrderLine } from '../types';

interface SkuPreviewSheetProps {
  /** Renglón a previsualizar; `null` cierra la vista. */
  line: OrderLine | null;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Vista previa del artículo de un renglón: sus fotos y el código en grande.
 *
 * Se abre manteniendo presionado el renglón o con el icono del ojo. Cuando el
 * artículo no tiene foto igual se abre, solo con el código ampliado: en el
 * almacén el código es lo que el picker necesita leer de lejos, la foto es
 * ayuda extra.
 */
export function SkuPreviewSheet({ line, onClose }: SkuPreviewSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);

  const images = line?.images ?? [];
  const hasImages = images.length > 0;

  /** Al cerrar se rebobina el carrusel: el próximo artículo abre en su primera foto. */
  const handleClose = () => {
    setPage(0);
    onClose();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPage(next);
  };

  return (
    <Modal
      visible={line !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button" />

      <View style={styles.root} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            style={styles.close}
          >
            <X size={20} color="#8E8E93" />
          </Pressable>

          {hasImages ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScroll}
                style={styles.carousel}
              >
                {images.map((uri) => (
                  <View key={uri} style={styles.slide}>
                    <Image
                      source={{ uri }}
                      style={styles.image}
                      contentFit="contain"
                      transition={150}
                    />
                  </View>
                ))}
              </ScrollView>

              {images.length > 1 ? (
                <View style={styles.dots}>
                  {images.map((uri, idx) => (
                    <View key={uri} style={[styles.dot, idx === page && styles.dotActive]} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          {/* El código siempre, y grande: es lo que se coteja contra la etiqueta. */}
          <Text style={styles.sku} selectable>
            {line?.sku}
          </Text>

          <Text style={styles.name} numberOfLines={3}>
            {line?.name}
          </Text>

          {!hasImages ? (
            <Text style={styles.noImage}>{t('picking.skuPreview.noImage')}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  close: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  carousel: {
    width: SCREEN_WIDTH,
    height: 260,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH - 64,
    height: 240,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
  },
  dotActive: {
    backgroundColor: '#111827',
  },
  sku: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 18,
  },
  name: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  noImage: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 14,
  },
});
