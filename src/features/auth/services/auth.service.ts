import type { ForgotPasswordFormValues } from '../schemas/forgot-password.schema';
import type { LoginFormValues } from '../schemas/login.schema';
import type { User } from '../store/auth.store';

/**
 * Dummy auth service. Replace with real API calls when backend is ready.
 * Resolves with a fake user after 600ms so the UI flow can be tested.
 */
export async function login(values: LoginFormValues): Promise<User> {
  await new Promise((r) => setTimeout(r, 600));
  return {
    id: 'demo-user',
    email: values.email,
    name: values.email.split('@')[0] ?? 'Usuario',
  };
}

export async function logout(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
}

export async function requestPasswordReset(_values: ForgotPasswordFormValues): Promise<void> {
  await new Promise((r) => setTimeout(r, 600));
}
