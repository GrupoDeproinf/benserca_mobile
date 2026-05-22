import { Redirect } from 'expo-router';
import { AUTH_ROUTES } from '@/features/auth/constants/routes';

export default function AuthIndex() {
  return <Redirect href={AUTH_ROUTES.login} />;
}
