import {
  Box,
  CheckCircle2,
  ClipboardList,
  Package,
  PackageCheck,
  ShieldCheck,
  Timer,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import type { Order, OrderStatus } from '@/features/picking/types';
import { ORDER_STATUS_I18N_KEY } from '@/features/picking/utils/order-status';

/** Agrupación semántica de las cards en el dashboard del supervisor de almacén. */
export type StatusSection = 'enCurso' | 'chequeo';

export type StatusTileTone = 'neutral' | 'danger' | 'success';

export interface StatusCardMeta {
  status: OrderStatus;
  labelKey: string;
  icon: LucideIcon;
  section: StatusSection;
  /** Solo chequeo usa color (rojo/verde). El resto es blanco. */
  tone: StatusTileTone;
}

/**
 * - `new` → KPI "Nuevos por asignar"
 * - en curso → assigned / in_progress / to_pack / packed (blancas)
 * - chequeo → rejected_review / audited (rojo / verde)
 */
export const STATUS_CARD_ORDER: readonly StatusCardMeta[] = [
  { status: 'assigned', labelKey: ORDER_STATUS_I18N_KEY.assigned, icon: Box, section: 'enCurso', tone: 'neutral' },
  {
    status: 'in_progress',
    labelKey: ORDER_STATUS_I18N_KEY.in_progress,
    icon: ClipboardList,
    section: 'enCurso',
    tone: 'neutral',
  },
  { status: 'to_pack', labelKey: ORDER_STATUS_I18N_KEY.to_pack, icon: Package, section: 'enCurso', tone: 'neutral' },
  {
    status: 'packed',
    labelKey: ORDER_STATUS_I18N_KEY.packed,
    icon: PackageCheck,
    section: 'enCurso',
    tone: 'neutral',
  },
  {
    status: 'rejected_review',
    labelKey: 'supervisorAlmacen.dashboard.rejected',
    icon: XCircle,
    section: 'chequeo',
    tone: 'danger',
  },
  {
    status: 'audited',
    labelKey: 'supervisorAlmacen.dashboard.approved',
    icon: CheckCircle2,
    section: 'chequeo',
    tone: 'success',
  },
];

export const STATUS_SECTION_ORDER: readonly StatusSection[] = ['enCurso', 'chequeo'];

export const SECTION_ICON: Record<StatusSection, LucideIcon> = {
  enCurso: Timer,
  chequeo: ShieldCheck,
};

export function countOrdersByStatus(orders: Order[]): Record<OrderStatus, number> {
  const counts = {
    new: 0,
    assigned: 0,
    in_progress: 0,
    to_pack: 0,
    packed: 0,
    rejected_review: 0,
    audited: 0,
    dispatched: 0,
  } satisfies Record<OrderStatus, number>;

  for (const order of orders) {
    counts[order.status] += 1;
  }
  return counts;
}
