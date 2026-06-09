import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F2F2F7',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 34,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

interface AppHeroTitleSectionProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

/** Título + subtítulo bajo la franja negra (cambia por tab). */
export function AppHeroTitleSection({ title, subtitle, children }: AppHeroTitleSectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </View>
      {children ? <View style={styles.card}>{children}</View> : null}
    </View>
  );
}
