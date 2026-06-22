import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export { auth, firestore };

/** Colecciones de perfil por rol en Firestore (orden de búsqueda al login). */
export const PROFILE_COLLECTIONS = [
  'u_pickers',
  'auditors',
  'warehouse_leads',
  'users',
] as const;

export type ProfileCollection = (typeof PROFILE_COLLECTIONS)[number];

export function profileCollection(name: ProfileCollection) {
  return firestore().collection(name);
}
