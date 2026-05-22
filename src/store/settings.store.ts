import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage/mmkv';
import type { ColorScheme } from '@/theme/tokens';

export type ThemePreference = ColorScheme | 'system';
export type Language = 'es' | 'en';

interface SettingsState {
  colorScheme: ThemePreference;
  language: Language;
  hasCompletedOnboarding: boolean;
  setColorScheme: (value: ThemePreference) => void;
  setLanguage: (value: Language) => void;
  completeOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      colorScheme: 'system',
      language: 'es',
      hasCompletedOnboarding: false,
      setColorScheme: (value) => set({ colorScheme: value }),
      setLanguage: (value) => set({ language: value }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);
