import type { AppNotification } from '@/shared/types';
import {
  MOCK_PICKER_ANA_UID,
  MOCK_LEAD_CARLOS_UID,
} from '@/features/picking/data/mock-orders';

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

let _id = 0;
function id(): string {
  return `seed-notif-${++_id}`;
}

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  // ── Picker: Ana ──
  {
    id: id(),
    userId: MOCK_PICKER_ANA_UID,
    type: 'order_assigned',
    title: 'Nuevo pedido asignado',
    body: 'Se te asignó el pedido PED-530 de Farmacia Central. Aún no iniciado.',
    orderId: 'ord-assigned-new',
    read: false,
    createdAt: minsAgo(1),
  },
  {
    id: id(),
    userId: MOCK_PICKER_ANA_UID,
    type: 'order_assigned',
    title: 'Nuevo pedido asignado',
    body: 'Se te asignó el pedido PED-502 de Global Tech Solutions.',
    orderId: 'ord-assigned-1',
    read: false,
    createdAt: minsAgo(5),
  },
  {
    id: id(),
    userId: MOCK_PICKER_ANA_UID,
    type: 'order_audit_rejected',
    title: 'PED-519 rechazado',
    body: 'Observación: Faltan 5 unidades del SKU ACE-MOT-20W en el bulto 1.',
    orderId: 'ord-packed-1',
    read: false,
    createdAt: minsAgo(30),
  },
  {
    id: id(),
    userId: MOCK_PICKER_ANA_UID,
    type: 'order_assigned',
    title: 'Nuevo pedido asignado',
    body: 'Se te asignó el pedido PED-508 de Apex Retail Group.',
    orderId: 'ord-in-progress-1',
    read: true,
    createdAt: minsAgo(120),
  },
  {
    id: id(),
    userId: MOCK_PICKER_ANA_UID,
    type: 'team_released',
    title: 'Liberado del equipo',
    body: 'Has sido liberado del equipo de PED-601. Ya puedes aceptar nuevos pedidos.',
    read: false,
    createdAt: minsAgo(45),
  },
  // ── Auditor: broadcast ──
  {
    id: id(),
    userId: 'broadcast-auditor',
    type: 'order_ready_to_audit',
    title: 'PED-519 listo para auditar',
    body: 'Distribuidora Mercantil XYZ — pedido empaquetado.',
    orderId: 'ord-packed-1',
    read: false,
    createdAt: minsAgo(15),
  },
  {
    id: id(),
    userId: 'broadcast-auditor',
    type: 'order_ready_to_audit',
    title: 'PED-523 listo para auditar',
    body: 'Papelería Central — pedido empaquetado con bultos adicionales.',
    orderId: 'ord-rejected-1',
    read: true,
    createdAt: minsAgo(240),
  },
  // ── Lead: Carlos ──
  {
    id: id(),
    userId: MOCK_LEAD_CARLOS_UID,
    type: 'team_member_done',
    title: 'Luis completó su parte',
    body: 'Luis Herrera terminó el picking del pedido PED-601.',
    orderId: 'ord-large-1',
    read: false,
    createdAt: minsAgo(10),
  },
  {
    id: id(),
    userId: MOCK_LEAD_CARLOS_UID,
    type: 'team_member_done',
    title: 'Elena completó su parte',
    body: 'Elena Vargas terminó el picking del pedido PED-601.',
    orderId: 'ord-large-1',
    read: true,
    createdAt: minsAgo(55),
  },
  // ── Picker no asignado (picker-luis) ──
  {
    id: id(),
    userId: 'picker-luis',
    type: 'team_released',
    title: 'Liberado del equipo',
    body: 'Has sido liberado del equipo. Ya puedes aceptar nuevos pedidos.',
    read: false,
    createdAt: minsAgo(3),
  },
];
