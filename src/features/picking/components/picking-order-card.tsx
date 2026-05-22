import { Clock, Layers, Package } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/shared/components/ui/text';
import type { PickingOrder } from '../types';

function getElapsed(date: Date) {
  const ms = Date.now() - date.getTime();
  const totalMins = Math.floor(ms / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hrs = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;
  return {
    days: String(days).padStart(2, '0'),
    hrs: String(hrs).padStart(2, '0'),
    mins: String(mins).padStart(2, '0'),
  };
}

function formatEntryDate(date: Date) {
  return date.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PickingOrderCardProps {
  order: PickingOrder;
  index: number;
  onPress?: (order: PickingOrder) => void;
}

export function PickingOrderCard({ order, index, onPress }: PickingOrderCardProps) {
  const elapsed = getElapsed(order.createdAt);
  const isCritical = order.priority === 'high';
  const timerBg = isCritical ? 'rgba(186,26,26,0.07)' : '#e0e8ff';
  const timerBorder = isCritical ? 'rgba(186,26,26,0.12)' : 'transparent';
  const timerColor = isCritical ? '#ba1a1a' : '#001732';
  const timerLabelColor = isCritical ? '#93000a' : '#43474e';

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 70)}>
      <Pressable
        onPress={() => onPress?.(order)}
        style={({ pressed }) => ({
          transform: pressed ? [{ scale: 0.98 }] : [],
          opacity: pressed ? 0.97 : 1,
        })}
      >
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#c3c6cf',
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {/* Row 1: client + date */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1, gap: 4, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 19, fontWeight: '700', color: '#001732', letterSpacing: -0.3, lineHeight: 26 }} numberOfLines={1}>
                  {order.client}
                </Text>
                {isCritical && (
                  <View style={{ backgroundColor: '#ffdad6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#93000a', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      Crítico
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#042c53' }}>
                {order.orderNumber}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={{ fontSize: 12, color: '#43474e', fontWeight: '500' }}>Ingresó</Text>
              <Text style={{ fontSize: 13, color: '#141b2c', fontWeight: '400' }}>
                {formatEntryDate(order.createdAt)}
              </Text>
            </View>
          </View>

          {/* Stats grid */}
          <View
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: '#c3c6cf',
              paddingVertical: 12,
              marginBottom: 12,
              gap: 12,
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ backgroundColor: '#dce4ea', padding: 8, borderRadius: 8 }}>
                <Layers size={20} color="#042c53" strokeWidth={2} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: '#43474e', fontWeight: '500' }}>SKUs únicos</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#141b2c' }}>
                  {order.skusCount} Items
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ backgroundColor: '#dce4ea', padding: 8, borderRadius: 8 }}>
                <Package size={20} color="#042c53" strokeWidth={2} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: '#43474e', fontWeight: '500' }}>Cant. total</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#141b2c' }}>
                  {order.totalUnits} Unidades
                </Text>
              </View>
            </View>
          </View>

          {/* Timer */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: timerBg,
              borderWidth: 1,
              borderColor: timerBorder,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color={timerLabelColor} strokeWidth={2} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: timerLabelColor }}>
                Tiempo transcurrido:
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TimerUnit value={elapsed.days} label="Días" color={timerColor} labelColor={timerLabelColor} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: timerColor }}>:</Text>
              <TimerUnit value={elapsed.hrs} label="Hrs" color={timerColor} labelColor={timerLabelColor} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: timerColor }}>:</Text>
              <TimerUnit value={elapsed.mins} label="Min" color={timerColor} labelColor={timerLabelColor} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TimerUnit({
  value,
  label,
  color,
  labelColor,
}: {
  value: string;
  label: string;
  color: string;
  labelColor: string;
}) {
  return (
    <View style={{ alignItems: 'center', minWidth: 28 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color, lineHeight: 24 }}>{value}</Text>
      <Text style={{ fontSize: 8, fontWeight: '700', color: labelColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}
