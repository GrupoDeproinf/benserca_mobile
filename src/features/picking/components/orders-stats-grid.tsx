import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';

export interface OrdersStatItem {
  icon: LucideIcon;
  value: number;
  label: string;
}

interface OrdersStatsGridProps {
  stats: OrdersStatItem[];
}

export function OrdersStatsGrid({ stats }: OrdersStatsGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <View
            key={stat.label}
            style={{
              width: '48%',
              flexGrow: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#111827',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', lineHeight: 26 }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }} numberOfLines={2}>
                {stat.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
