import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});

interface OrderDetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export function OrderDetailSection({ title, icon: Icon, children }: OrderDetailSectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        {Icon ? <Icon size={18} color="#374151" strokeWidth={2} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function OrderDetailCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
