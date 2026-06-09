import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { PickingDetailScreen } from '@/features/picking/screens/picking-detail.screen';
import { ORDER_DETAIL_HEADER_ENTER_MS } from '@/features/picking/components/order-detail-header';

/** Activa slide nativo al volver (pop). La entrada usa animation:none del stack layout. */
export default function PickerOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const task = InteractionManager.runAfterInteractions(() => {
        timer = setTimeout(() => {
          navigation.setOptions({ animation: 'slide_from_right', gestureEnabled: true });
        }, ORDER_DETAIL_HEADER_ENTER_MS);
      });

      return () => {
        task.cancel();
        if (timer) clearTimeout(timer);
      };
    }, [navigation]),
  );

  return <PickingDetailScreen orderId={id ?? ''} />;
}
