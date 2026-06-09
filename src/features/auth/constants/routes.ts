import type { UserRole } from '@/shared/types';

export const AUTH_ROUTES = {
  login: '/(auth)/login',
} as const;

/** Segmento de carpeta en `app/(app)/` por rol. */
export const ROLE_ROUTE_SEGMENT: Record<UserRole, string> = {
  picker: 'picker',
  warehouse_lead: 'lead',
  auditor: 'auditor',
  supervisor: 'lead',
};

export const ROLE_HOME_ROUTES = {
  picker: '/(app)/picker/(tabs)/orders',
  warehouse_lead: '/(app)/lead/(tabs)/orders',
  auditor: '/(app)/auditor/(tabs)/queue',
  supervisor: '/(app)/lead/(tabs)/orders',
} as const satisfies Record<UserRole, `/(app)/${string}`>;

export type RoleHomeRoute = (typeof ROLE_HOME_ROUTES)[UserRole];

export function getRoleHomePath(role: UserRole): RoleHomeRoute {
  return ROLE_HOME_ROUTES[role];
}

export function getRoleRouteSegment(role: UserRole): string {
  return ROLE_ROUTE_SEGMENT[role];
}

export function isRoleRouteSegment(segment: string): segment is (typeof ROLE_ROUTE_SEGMENT)[UserRole] {
  return Object.values(ROLE_ROUTE_SEGMENT).includes(segment);
}
