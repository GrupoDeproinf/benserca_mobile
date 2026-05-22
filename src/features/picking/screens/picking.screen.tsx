import { useRouter } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/shared/components/ui/text';
import { PickingOrderCard } from '../components/picking-order-card';
import { MOCK_ORDERS } from '../data/mock-orders';
import type { PickingOrder } from '../types';


export function PickingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9ff' }}>
      {/* Top App Bar */}
      <View
        style={{
          backgroundColor: '#042c53',
          paddingTop: insets.top,
          paddingHorizontal: 16,
          height: insets.top + 64,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffffff', letterSpacing: -0.2 }}>
          Listado de pedidos
        </Text>
      </View>

      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => console.log('Refresh')}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: '#042c53',
              marginTop: 16,
              marginBottom: 16,
              shadowColor: '#042c53',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <RefreshCw size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff', letterSpacing: 0.1 }}>
              Actualizar listado
            </Text>
          </TouchableOpacity>
        }
        renderItem={({ item, index }: { item: PickingOrder; index: number }) => (
          <PickingOrderCard
            order={item}
            index={index}
            onPress={(order) => router.push(`/(tabs)/order/${order.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 80, gap: 12 }}>
            <Text style={{ fontSize: 48 }}>✓</Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#001732', textAlign: 'center' }}>
              ¡Todo al día!
            </Text>
            <Text style={{ fontSize: 14, color: '#43474e', textAlign: 'center', maxWidth: 260 }}>
              No hay pedidos pendientes de empaque en este momento.
            </Text>
          </View>
        }
      />
    </View>
  );
}
