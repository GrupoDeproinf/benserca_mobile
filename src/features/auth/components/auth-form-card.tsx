import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function AuthFormCard({ children }: PropsWithChildren) {
  return (
    <View className="rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card p-5 shadow-sm">
      {children}
    </View>
  );
}
