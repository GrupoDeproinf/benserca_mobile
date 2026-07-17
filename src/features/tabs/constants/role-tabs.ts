import type { Ionicons } from '@expo/vector-icons';
import type { UserRole } from '@/shared/types';

type IconName = keyof typeof Ionicons.glyphMap;

export interface RoleTabIconConfig {
  outline: IconName;
  filled: IconName;
}

export interface RoleTabsConfig {
  initialRoute: string;
  order: string[];
  icons: Record<string, RoleTabIconConfig>;
}

/** Tabs del jefe de almacén (warehouse_lead). */
const WAREHOUSE_MANAGER_TABS: RoleTabsConfig = {
  initialRoute: 'orders',
  order: ['orders', 'pickers', 'profile'],
  icons: {
    orders: { outline: 'file-tray-stacked-outline', filled: 'file-tray-stacked' },
    pickers: { outline: 'people-outline', filled: 'people' },
    profile: { outline: 'person-outline', filled: 'person' },
  },
};

export const ROLE_TABS_CONFIG: Record<UserRole, RoleTabsConfig> = {
  picker: {
    initialRoute: 'orders',
    order: ['orders', 'profile'],
    icons: {
      orders: { outline: 'cube-outline', filled: 'cube' },
      profile: { outline: 'person-outline', filled: 'person' },
    },
  },
  warehouse_lead: WAREHOUSE_MANAGER_TABS,
  auditor: {
    initialRoute: 'queue',
    order: ['queue', 'profile'],
    icons: {
      queue: { outline: 'clipboard-outline', filled: 'clipboard' },
      profile: { outline: 'person-outline', filled: 'person' },
    },
  },
  // Supervisor de almacén: visualizador. Solo dashboard + perfil.
  supervisor_almacen: {
    initialRoute: 'dashboard',
    order: ['dashboard', 'profile'],
    icons: {
      dashboard: { outline: 'grid-outline', filled: 'grid' },
      profile: { outline: 'person-outline', filled: 'person' },
    },
  },
};

export function isWarehouseManagerRole(role: UserRole): boolean {
  return role === 'warehouse_lead';
}
