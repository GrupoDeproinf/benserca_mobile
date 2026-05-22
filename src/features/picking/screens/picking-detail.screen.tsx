import { useRouter } from 'expo-router';
import { ArrowLeft, Box, Calendar, MoreVertical } from 'lucide-react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/shared/components/ui/text';
import { MOCK_ORDERS } from '../data/mock-orders';
import type { PickingItem } from '../types';

interface PickingDetailScreenProps {
  orderId: string;
}

export function PickingDetailScreen({ orderId }: PickingDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const order = MOCK_ORDERS.find((o) => o.id === orderId);

  if (!order) return null;

  const isCritical = order.priority === 'high';

  const entryDate = order.createdAt.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9ff' }}>
      {/* Top App Bar */}
      <View
        style={{
          backgroundColor: '#ffffff',
          paddingTop: insets.top,
          height: insets.top + 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 3,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 10, borderRadius: 99 }}>
          <ArrowLeft size={24} color="#001732" strokeWidth={2} />
        </TouchableOpacity>

        <Text style={{ fontSize: 17, fontWeight: '700', color: '#001732' }}>
          Pedido {order.orderNumber}
        </Text>

        <TouchableOpacity activeOpacity={0.7} style={{ padding: 10, borderRadius: 99 }}>
          <MoreVertical size={24} color="#001732" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 90 + Math.max(insets.bottom, 16) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order info card */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#c3c6cf',
            padding: 16,
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 3, marginRight: 10 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#141b2c', letterSpacing: -0.3 }}>
                {order.client}
              </Text>
              <Text style={{ fontSize: 14, color: '#43474e' }}>Pedido ID: {order.orderNumber}</Text>
            </View>
            {isCritical && (
              <View style={{ backgroundColor: '#ba1a1a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#ffffff', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Crítico
                </Text>
              </View>
            )}
          </View>

          <View>
            <View style={{ backgroundColor: '#d4e3ff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#001c3a' }}>Empaque pendiente</Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: '#c3c6cf', paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="#43474e" strokeWidth={2} />
            <Text style={{ fontSize: 12, color: '#43474e', fontWeight: '500' }}>
              {'Ingresó: '}
              <Text style={{ fontWeight: '600', color: '#141b2c' }}>{entryDate}</Text>
            </Text>
          </View>
        </View>

        {/* Items header */}
        <View style={{ paddingHorizontal: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#141b2c' }}>
            Lista de empaque ({order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'})
          </Text>
        </View>

        {/* Items list */}
        <View style={{ gap: 8 }}>
          {order.items.map((item: PickingItem) => (
            <View
              key={item.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#c3c6cf',
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#e9edff', alignItems: 'center', justifyContent: 'center' }}>
                <Box size={20} color="#416089" strokeWidth={2} />
              </View>

              <View style={{ flex: 1, gap: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#141b2c', lineHeight: 20 }} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#001732' }}>
                    {String(item.quantity).padStart(2, '0')}x
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Text style={{ fontSize: 12, color: '#43474e', fontWeight: '500' }}>
                    {'SKU: '}<Text style={{ color: '#141b2c', fontWeight: '400' }}>{item.sku}</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: '#43474e', fontWeight: '500' }}>
                    {'Bin: '}<Text style={{ color: '#141b2c', fontWeight: '400' }}>{item.bin}</Text>
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed bottom action bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#c3c6cf',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => console.log('Iniciar picking:', order.id)}
          style={{
            height: 52,
            borderRadius: 10,
            backgroundColor: '#042c53',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            shadowColor: '#042c53',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Box size={20} color="#ffffff" strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }}>Iniciar Picking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
