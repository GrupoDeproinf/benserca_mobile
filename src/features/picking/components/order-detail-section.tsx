import type { ReactNode } from 'react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { Text } from '@/shared/components/ui/text';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  headerCollapsed: {
    marginBottom: 0,
  },
  headerPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
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
  collapsible?: boolean;
  defaultExpanded?: boolean;
  badge?: string;
  marginTop?: number;
}

export function OrderDetailSection({
  title,
  icon: Icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  badge,
  marginTop = 0,
}: OrderDetailSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isOpen = collapsible ? expanded : true;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const headerContent = (
    <>
      {Icon ? <Icon size={18} color="#374151" strokeWidth={2} /> : null}
      <Text style={styles.title}>{title}</Text>
      {badge ? (
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>{badge}</Text>
      ) : null}
      {collapsible ? (
        isOpen ? (
          <ChevronUp size={18} color="#6B7280" />
        ) : (
          <ChevronDown size={18} color="#6B7280" />
        )
      ) : null}
    </>
  );

  return (
    <View style={[styles.wrap, marginTop > 0 ? { marginTop } : null]}>
      {collapsible ? (
        <Pressable
          onPress={toggle}
          style={[styles.header, !isOpen && styles.headerCollapsed]}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
        >
          <View style={styles.headerPressable}>{headerContent}</View>
        </Pressable>
      ) : (
        <View style={styles.header}>{headerContent}</View>
      )}
      {isOpen ? children : null}
    </View>
  );
}

export function OrderDetailCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
