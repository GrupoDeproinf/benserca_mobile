import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settings.store';
import { type ColorScheme, colors, type Theme } from './tokens';

export * from './tokens';

function normalize(value: ReturnType<typeof useColorScheme>): ColorScheme {
  return value === 'dark' ? 'dark' : 'light';
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const userPreference = useSettingsStore((s) => s.colorScheme);
  const resolved = userPreference === 'system' ? normalize(systemScheme) : userPreference;
  return colors[resolved];
}

export function useResolvedColorScheme(): ColorScheme {
  const systemScheme = useColorScheme();
  const userPreference = useSettingsStore((s) => s.colorScheme);
  return userPreference === 'system' ? normalize(systemScheme) : userPreference;
}
