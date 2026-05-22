import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';

interface SettingsSectionProps {
  label: string;
  children: ReactNode;
}

export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-foreground/50 dark:text-foreground-dark/50 uppercase tracking-wide">
        {label}
      </Text>
      {children}
    </View>
  );
}
