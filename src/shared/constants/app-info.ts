import Constants from 'expo-constants';

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}
