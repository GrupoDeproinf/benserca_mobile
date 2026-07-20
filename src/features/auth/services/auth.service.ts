import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { SessionUser } from '@/shared/types';
import type { ForgotPasswordFormValues } from '../schemas/forgot-password.schema';
import type { LoginFormValues } from '../schemas/login.schema';
import {
  AuthNotEnabledError,
  FirestorePermissionError,
  InvalidCredentialsError,
  InvalidProfileError,
  NetworkAuthError,
  ProfileNotFoundError,
} from '@/features/auth/errors/auth.errors';
import { auth } from '@/services/firebase';
import { safeFirebaseSignOut } from '@/services/firebase/auth-utils';
import { fetchSessionUser } from '@/services/firebase/user-profile';

export {
  AuthNotEnabledError,
  FirestorePermissionError,
  InvalidCredentialsError,
  InvalidProfileError,
  NetworkAuthError,
  ProfileNotFoundError,
} from '@/features/auth/errors/auth.errors';

function mapFirebaseAuthError(error: unknown): never {
  const code = (error as FirebaseAuthTypes.NativeFirebaseAuthError | undefined)?.code;
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    throw new InvalidCredentialsError();
  }
  if (code === 'auth/operation-not-allowed') {
    throw new AuthNotEnabledError();
  }
  if (code === 'auth/network-request-failed') {
    throw new NetworkAuthError();
  }
  throw error;
}

export async function login(values: LoginFormValues): Promise<SessionUser> {
  const email = values.email.trim().toLowerCase();

  try {
    const credential = await auth().signInWithEmailAndPassword(email, values.password);
    return await fetchSessionUser(credential.user);
  } catch (error) {
    if (
      error instanceof ProfileNotFoundError ||
      error instanceof InvalidProfileError ||
      error instanceof FirestorePermissionError
    ) {
      // onAuthStateChanged también limpia la sesión; no llamar signOut aquí (carrera).
      throw error;
    }
    mapFirebaseAuthError(error);
  }
}

export async function logout(): Promise<void> {
  await safeFirebaseSignOut();
}

export async function requestPasswordReset(values: ForgotPasswordFormValues): Promise<void> {
  const email = values.email.trim().toLowerCase();
  await auth().sendPasswordResetEmail(email);
}
