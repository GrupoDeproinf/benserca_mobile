import type { SessionUser } from '@/shared/types';
import type { ForgotPasswordFormValues } from '../schemas/forgot-password.schema';
import type { LoginFormValues } from '../schemas/login.schema';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

interface MockUserRecord extends SessionUser {
  password: string;
}

/**
 * Usuarios mock (Semana 1). Ver PASO_A_PASO §11.
 */
export const MOCK_USERS: ReadonlyArray<MockUserRecord> = [
  {
    uid: 'user-picker-1',
    email: 'picker@benserca.com',
    password: '123456',
    name: 'Ana Ramírez',
    role: 'picker',
  },
  {
    uid: 'user-lead-1',
    email: 'jefe@benserca.com',
    password: '123456',
    name: 'Carlos Méndez',
    role: 'warehouse_lead',
  },
  {
    uid: 'user-auditor-1',
    email: 'auditor@benserca.com',
    password: '123456',
    name: 'Luisa Torres',
    role: 'auditor',
  },
  {
    uid: 'user-supervisor-1',
    email: 'supervisor@benserca.com',
    password: '123456',
    name: 'Pedro Gómez',
    role: 'supervisor',
  },
];

export const DEMO_CREDENTIALS = {
  picker: { email: 'picker@benserca.com', password: '123456' },
  warehouse_lead: { email: 'jefe@benserca.com', password: '123456' },
  auditor: { email: 'auditor@benserca.com', password: '123456' },
  supervisor: { email: 'supervisor@benserca.com', password: '123456' },
} as const;

export async function loginWithDemoRole(role: keyof typeof DEMO_CREDENTIALS): Promise<SessionUser> {
  const creds = DEMO_CREDENTIALS[role];
  return login({ email: creds.email, password: creds.password });
}

export async function login(values: LoginFormValues): Promise<SessionUser> {
  await new Promise((r) => setTimeout(r, 500));
  const email = values.email.trim().toLowerCase();
  const match = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email && u.password === values.password,
  );
  if (!match) {
    throw new InvalidCredentialsError();
  }
  const { password: _password, ...user } = match;
  return user;
}

export async function logout(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
}

export async function requestPasswordReset(_values: ForgotPasswordFormValues): Promise<void> {
  await new Promise((r) => setTimeout(r, 600));
}
