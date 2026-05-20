import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * Adapter de AsyncStorage para el middleware `persist` de Zustand.
 *
 * Si en el futuro se quiere migrar a react-native-mmkv (más rápido,
 * requiere dev build), solo hay que cambiar este archivo.
 */
export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  getItem: (name) => AsyncStorage.getItem(name),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

export const secureKeys = {
  authToken: 'auth.token',
  refreshToken: 'auth.refreshToken',
} as const;
