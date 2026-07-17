import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import {
  FirestorePermissionError,
  InvalidProfileError,
  ProfileNotFoundError,
} from '@/features/auth/errors/auth.errors';
import { PROFILE_COLLECTIONS, auth, profileCollection } from '@/services/firebase';
import type { SessionUser, UserRole } from '@/shared/types';

export {
  InvalidProfileError,
  ProfileNotFoundError,
} from '@/features/auth/errors/auth.errors';

const VALID_ROLES: ReadonlySet<UserRole> = new Set([
  'picker',
  'warehouse_lead',
  'auditor',
  'supervisor_almacen',
]);

const ROLE_ALIASES: Record<string, UserRole> = {
  picker: 'picker',
  warehouse_lead: 'warehouse_lead',
  jefe: 'warehouse_lead',
  chief: 'warehouse_lead',
  auditor: 'auditor',
  // Acepta aliases históricos / cortos usados en Firestore.
  supervisor: 'supervisor_almacen',
  supervisor_almacen: 'supervisor_almacen',
  almacen: 'supervisor_almacen',
};

const ROLE_PRIORITY: readonly UserRole[] = [
  'warehouse_lead',
  'supervisor_almacen',
  'auditor',
  'picker',
];

function normalizeRoleValue(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (ROLE_ALIASES[normalized]) return ROLE_ALIASES[normalized];
  return VALID_ROLES.has(normalized as UserRole) ? (normalized as UserRole) : null;
}

function parseUserRoles(data: Record<string, unknown>): UserRole[] {
  const rolesRaw = data.roles;
  if (!Array.isArray(rolesRaw)) return [];

  const parsed = rolesRaw
    .map(normalizeRoleValue)
    .filter((role): role is UserRole => role !== null);

  return [...new Set(parsed)];
}

function resolvePrimaryRole(roles: UserRole[]): UserRole | null {
  for (const candidate of ROLE_PRIORITY) {
    if (roles.includes(candidate)) return candidate;
  }
  return roles[0] ?? null;
}

function resolveDisplayName(data: Record<string, unknown>, email: string): string {
  const name = data.full_name ?? data.name ?? data.displayName ?? data.display_name;
  if (typeof name === 'string' && name.trim().length > 0) {
    return name.trim();
  }
  return email;
}

function mapFirestoreError(error: unknown): never {
  const code = (error as { code?: string })?.code;
  if (code === 'firestore/permission-denied') {
    throw new FirestorePermissionError();
  }
  throw error;
}

function assertActiveProfile(data: Record<string, unknown>): void {
  if (data.is_active === false) {
    throw new InvalidProfileError();
  }
}

async function queryProfileInCollection(
  collection: (typeof PROFILE_COLLECTIONS)[number],
  uid: string,
  email: string,
): Promise<FirebaseFirestoreTypes.DocumentSnapshot | null> {
  const direct = await profileCollection(collection).doc(uid).get();
  if (direct.exists()) return direct;

  const byId = await profileCollection(collection).where('id', '==', uid).limit(1).get();
  if (!byId.empty) return byId.docs[0] ?? null;

  if (email) {
    const byEmail = await profileCollection(collection).where('email', '==', email).limit(1).get();
    if (!byEmail.empty) return byEmail.docs[0] ?? null;
  }

  return null;
}

async function findProfileDocument(
  uid: string,
  email: string,
): Promise<FirebaseFirestoreTypes.DocumentSnapshot | null> {
  for (const collection of PROFILE_COLLECTIONS) {
    try {
      const snapshot = await queryProfileInCollection(collection, uid, email);
      if (snapshot?.exists()) return snapshot;
    } catch (error) {
      mapFirestoreError(error);
    }
  }
  return null;
}

/**
 * Perfil en Firestore (p. ej. `u_pickers/{uid}`):
 * - `roles` (array de strings)
 * - `full_name` o `name`
 * - `email`, `id` (uid de Auth)
 */
export async function fetchSessionUser(
  firebaseUser: FirebaseAuthTypes.User,
): Promise<SessionUser> {
  const email = firebaseUser.email?.trim().toLowerCase() ?? '';

  let snapshot: FirebaseFirestoreTypes.DocumentSnapshot | null;
  try {
    snapshot = await findProfileDocument(firebaseUser.uid, email);
  } catch (error) {
    mapFirestoreError(error);
  }

  if (!snapshot?.exists()) {
    throw new ProfileNotFoundError();
  }

  const data = snapshot.data() ?? {};
  assertActiveProfile(data);

  const roles = parseUserRoles(data);
  const role = resolvePrimaryRole(roles);
  if (!role) {
    throw new InvalidProfileError();
  }

  const resolvedEmail =
    email || (typeof data.email === 'string' ? data.email.trim().toLowerCase() : '');
  if (!resolvedEmail) {
    throw new InvalidProfileError();
  }

  return {
    uid: firebaseUser.uid,
    email: resolvedEmail,
    name: resolveDisplayName(data, resolvedEmail),
    role,
  };
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const firebaseUser = auth().currentUser;
  if (!firebaseUser) return null;
  return fetchSessionUser(firebaseUser);
}
