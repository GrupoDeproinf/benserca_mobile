import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settings.store';
import {
  type ColorScheme,
  colors,
  elevation,
  type ElevationLevel,
  headerGradient,
  type Theme,
} from './tokens';

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

/** Sombra premium del nivel indicado, según el tema activo. */
export function useElevation(level: ElevationLevel = 'md') {
  const scheme = useResolvedColorScheme();
  return elevation[scheme][level];
}

/** Colores del gradiente de header según el tema activo. */
export function useHeaderGradient(): readonly string[] {
  const scheme = useResolvedColorScheme();
  return headerGradient[scheme];
}
