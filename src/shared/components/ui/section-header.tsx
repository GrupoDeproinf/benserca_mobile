import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './text';

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className = '' }: SectionHeaderProps) {
  return (
    <View className={`mb-3 flex-row items-center justify-between ${className}`}>
      <Text className="text-base font-semibold">{title}</Text>
      {action}
    </View>
  );
}
