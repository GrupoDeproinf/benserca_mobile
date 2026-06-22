import { auth } from '@/services/firebase';

/** Cierra sesión sin fallar si ya no hay usuario (evita carreras con onAuthStateChanged). */
export async function safeFirebaseSignOut(): Promise<void> {
  if (!auth().currentUser) return;

  try {
    await auth().signOut();
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'auth/no-current-user') return;
    throw error;
  }
}
