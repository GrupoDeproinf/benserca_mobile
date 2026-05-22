import { ScrollView, Pressable, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import type { PickingStatus } from '../types';

export type FilterOption = PickingStatus | 'all';

interface FilterConfig {
  key: FilterOption;
  label: string;
  color: string;
}

const FILTERS: FilterConfig[] = [
  { key: 'all', label: 'Todos', color: '#1E4976' },
  { key: 'pending', label: 'Pendientes', color: '#F59E0B' },
  { key: 'in_progress', label: 'En proceso', color: '#3B82F6' },
  { key: 'completed', label: 'Completados', color: '#16A34A' },
];

interface PickingFilterBarProps {
  selected: FilterOption;
  counts: Record<FilterOption, number>;
  onSelect: (filter: FilterOption) => void;
}

export function PickingFilterBar({ selected, counts, onSelect }: PickingFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {FILTERS.map((filter) => {
        const isActive = selected === filter.key;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onSelect(filter.key)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 99,
              backgroundColor: isActive ? filter.color : '#FFFFFF',
              borderWidth: 1.5,
              borderColor: isActive ? filter.color : '#E2E8F0',
              shadowColor: isActive ? filter.color : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isActive ? 0.25 : 0,
              shadowRadius: 6,
              elevation: isActive ? 3 : 0,
            })}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isActive ? '#FFFFFF' : '#64748B',
              }}
            >
              {filter.label}
            </Text>
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 99,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isActive ? '#FFFFFF' : '#64748B',
                }}
              >
                {counts[filter.key]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
