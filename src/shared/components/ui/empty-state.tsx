import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './text';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center px-6 py-12 ${className}`}>
      <Text className="text-center text-lg font-semibold">{title}</Text>
      {description ? (
        <Text className="text-muted-foreground mt-2 text-center text-sm">{description}</Text>
      ) : null}
      {action ? <View className="mt-6">{action}</View> : null}
    </View>
  );
}
