import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSettingsStore } from '@/store/settings.store';
import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
} as const;

export type SupportedLanguage = keyof typeof resources;

function resolveInitialLanguage(): SupportedLanguage {
  const persisted = useSettingsStore.getState().language;
  if (persisted) return persisted;
  const deviceLang = getLocales()[0]?.languageCode ?? 'es';
  return deviceLang === 'en' ? 'en' : 'es';
}

i18n.use(initReactI18next).init({
  resources,
  lng: resolveInitialLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

useSettingsStore.subscribe((state, prev) => {
  if (state.language !== prev.language) {
    i18n.changeLanguage(state.language);
  }
});

export default i18n;
