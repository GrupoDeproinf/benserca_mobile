import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeroTitleSection } from '@/features/tabs/components/app-hero-title-section';
import { AppHeroTopBar } from '@/features/tabs/components/app-hero-top-bar';

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F2F2F7',
  },
});

interface OrdersListHeroHeaderProps {
  title: string;
  subtitle: string;
  onNotificationsPress: () => void;
  onScanPress?: () => void;
  children?: ReactNode;
  /** Si false, no renderiza la franja negra (ya está en el layout de tabs). */
  showTopBar?: boolean;
}

/** Header hero completo o solo título (cuando el top bar es compartido). */
export function OrdersListHeroHeader({
  title,
  subtitle,
  onNotificationsPress,
  onScanPress,
  children,
  showTopBar = true,
}: OrdersListHeroHeaderProps) {
  return (
    <View style={styles.wrap}>
      {showTopBar ? (
        <AppHeroTopBar
          onNotificationsPress={onNotificationsPress}
          onScanPress={onScanPress}
        />
      ) : null}
      <AppHeroTitleSection title={title} subtitle={subtitle}>
        {children}
      </AppHeroTitleSection>
    </View>
  );
}
