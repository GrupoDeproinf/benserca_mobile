export {
  AUTH_ROUTES,
  ROLE_HOME_ROUTES,
  getRoleHomePath,
  getRoleRouteSegment,
} from './constants/routes';
export * from './components';
export { useProtectedRoute } from './hooks/use-protected-route';
export { useRoleGuard } from './hooks/use-role-guard';
export { useCurrentUser } from './store/auth.store';
export { default as AuthLayout } from './navigation/auth.layout';
export * from './screens';
export * from './schemas/login.schema';
export * from './schemas/forgot-password.schema';
export {
  login,
  loginWithDemoRole,
  logout,
  requestPasswordReset,
  DEMO_CREDENTIALS,
  InvalidCredentialsError,
  ProfileNotFoundError,
  InvalidProfileError,
  FirestorePermissionError,
  AuthNotEnabledError,
  NetworkAuthError,
} from './services/auth.service';
export { useAuthStore, type User } from './store/auth.store';
