/**
 * Acciones de dominio puro del picking.
 */
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import type { SessionUser } from '@/shared/types';
import type {
  AuditObservation,
  Bulto,
  BultoItem,
  MissingItem,
  MissingItemsMode,
  Order,
  PauseInfo,
  PauseReason,
  PickerActionError,
} from '../types';
import { getActiveOrderLines } from '../utils/bulto-capacity';
import { computeBundlesCreated, computeProgressPercentage } from '../utils/order-progress';
import {
  buildFinalSkus,
  closeOpenBultosWithItems,
  hasEmptyOpenBulto,
  renumberBultos,
} from '../utils/order-snapshot';
import { buildPartialSavePatch } from '../utils/partial-save';
import { getQuickBundleCandidates } from '../utils/quick-bundles';

function syncPickingMetrics(order: Order, bultos: Bulto[]): Partial<Order> {
  const withBultos = { ...order, bultos };
  return {
    bultos,
    progressPercentage: computeProgressPercentage(withBultos),
    bundlesCreated: computeBundlesCreated(bultos),
    finalSkus: buildFinalSkus(withBultos, bultos),
  };
}

// ─── Picking lifecycle ────────────────────────────────────────────────────────

export function applyStartPicking(order: Order, pickerId: string): Partial<Order> {
  usePickersStore.getState().setPickerStatus(pickerId, 'en_proceso', order.id);
  return {
    status: 'in_progress',
    snapshotOriginal: structuredClone(order.lines),
    bultos: order.bultos.length > 0 ? order.bultos : [],
    finalSkus: [],
    progressPercentage: 0,
    bundlesCreated: 0,
    lastSavedMilestone: 0,
  };
}

export function applyFinishPicking(order: Order, pickerId: string): Partial<Order> {
  usePickersStore.getState().setPickerStatus(pickerId, 'disponible', null);

  const closedOpen = closeOpenBultosWithItems(order.bultos);
  const renumbered = renumberBultos(closedOpen);
  const withBultos = { ...order, bultos: renumbered };
  const finalSkus = buildFinalSkus(withBultos, renumbered);
  const progressPercentage = 100;
  const bundlesCreated = computeBundlesCreated(renumbered);

  // Las notificaciones se generan en el dispositivo receptor a partir del
  // listener de Firestore (ver use-session-orders-listener), no aquí.

  return {
    status: 'to_pack',
    bultos: renumbered,
    finalSkus,
    progressPercentage,
    bundlesCreated,
    lastSavedMilestone: 100,
    hasExtraBultos: bundlesCreated > order.definedBultos || order.hasExtraBultos,
  };
}

/** Marcar como embalado (desde Auditado o Empaquetado si omitieron auditoría). */
export function applyMarkWrapped(order: Order): Partial<Order> {
  return {
    status: 'packed',
    packedAt: new Date().toISOString(),
  };
}

/** Marcar como despachado (desde Embalado). Solo cambia el status. */
export function applyMarkDispatched(_order: Order): Partial<Order> {
  return { status: 'dispatched' };
}

export function applyReopenForRevision(order: Order, pickerId: string): Partial<Order> {
  usePickersStore.getState().setPickerStatus(pickerId, 'en_proceso', order.id);
  return { status: 'in_progress' };
}

/**
 * Pausar picking: no cambia `status`, solo marca el flag `isPaused`. El
 * `pauseInfo` es la vista optimista de lo que quedará en el timeline; al
 * re-hidratar desde Firestore, el mapper lo deriva de la entrada real.
 */
export function applyPausePicking(
  _order: Order,
  user: SessionUser,
  reason: PauseReason,
  missingSkus: string[],
): Partial<Order> {
  const pauseInfo: PauseInfo = {
    reason,
    missingSkus,
    authorId: user.uid,
    authorName: user.name,
    authorRole: user.role,
    createdAt: new Date().toISOString(),
    note: null,
  };
  return { isPaused: true, pauseInfo };
}

export function applyResumePicking(_order: Order): Partial<Order> {
  return { isPaused: false, pauseInfo: null };
}

/**
 * Construye los `MissingItem` a reportar a partir de lo que marcó el picker.
 * `availableQty` es cuánto hay realmente en almacén; la resta contra lo pedido
 * en ese renglón es `missingQty`.
 */
export function buildMissingItems(
  order: Order,
  user: SessionUser,
  marked: { lineId: string; availableQty: number }[],
): MissingItem[] {
  const markedAt = new Date().toISOString();

  return marked.flatMap(({ lineId, availableQty }) => {
    // El índice ES la identidad del renglón (Profit no manda id): se busca por
    // posición en `lines`, que el mapper construye desde `original_skus`.
    const lineIndex = order.lines.findIndex((l) => l.id === lineId);
    if (lineIndex === -1) return [];

    const line = order.lines[lineIndex];
    const available = Math.max(0, Math.min(availableQty, line.requiredQty));

    return [
      {
        lineIndex,
        sku: line.sku,
        description: line.name,
        requiredQty: line.requiredQty,
        availableQty: available,
        missingQty: line.requiredQty - available,
        markedByUid: user.uid,
        markedByName: user.name,
        markedAt,
        resolution: 'pending' as const,
        resolvedByUid: null,
        resolvedByName: null,
        resolvedAt: null,
        resolutionNote: null,
      },
    ];
  });
}

/**
 * Reportar faltantes. NO cambia `status` en ninguno de los dos modos: el estado
 * "Por pausar" es `hasMissingItems && !isPaused`. Con `mode: 'pause'` además
 * pausa, reusando el mismo flag ortogonal de siempre.
 */
export function applyReportMissingItems(
  order: Order,
  user: SessionUser,
  items: MissingItem[],
  mode: MissingItemsMode,
): Partial<Order> {
  const patch: Partial<Order> = {
    missingItems: [...order.missingItems, ...items],
    hasMissingItems: true,
  };

  if (mode === 'pause') {
    return {
      ...patch,
      ...applyPausePicking(
        order,
        user,
        'falta_articulo',
        items.map((i) => i.sku),
      ),
    };
  }

  return patch;
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

export function applyApproveAudit(_order: Order): Partial<Order> {
  return {
    status: 'audited',
    auditResult: 'approved',
    rejectedBundles: [],
    approvedBundles: [],
  };
}

export function applyRejectAudit(
  order: Order,
  auditorId: string,
  auditorName: string,
  observationText: string,
  rejectedBundles: number[],
  approvedBundles: number[],
): Partial<Order> {
  const observation: AuditObservation = {
    id: `obs-${Date.now()}`,
    auditorId,
    auditorName,
    text: observationText.trim(),
    createdAt: new Date().toISOString(),
  };

  // La notificación de rechazo se genera en el dispositivo del picker desde el
  // listener de Firestore (ver use-session-orders-listener), no aquí.

  return {
    status: 'rejected_review',
    auditResult: 'rejected',
    auditObservations: [...order.auditObservations, observation],
    rejectedBundles,
    approvedBundles,
  };
}

// ─── Bultos ──────────────────────────────────────────────────────────────────

export function canOpenBulto(order: Order): PickerActionError | null {
  if (hasEmptyOpenBulto(order.bultos)) return 'empty_open_bulto_exists';
  return null;
}

export function canFinishPicking(order: Order): PickerActionError | null {
  if (hasEmptyOpenBulto(order.bultos)) return 'empty_open_bulto_exists';
  if (order.bultos.length === 0) return 'no_bultos';
  return null;
}

export function applyOpenBulto(order: Order): Partial<Order> {
  const nextNumber = order.bultos.length + 1;
  const newBulto: Bulto = {
    id: `bulto-${order.id}-${Date.now()}`,
    number: nextNumber,
    status: 'open',
    items: [],
  };
  const bultos = [...order.bultos, newBulto];
  const hasExtraBultos = nextNumber > order.definedBultos;

  return {
    ...syncPickingMetrics(order, bultos),
    hasExtraBultos: order.hasExtraBultos || hasExtraBultos,
  };
}

/**
 * Bulto rápido: crea de un toque TODOS los bultos completos que el renglón
 * permita, ya cerrados y con `unitsPerBundle` unidades cada uno, sin pasar por
 * abrir bulto → agregar artículo → cerrar.
 *
 * Pedir 12 con empaque de 6 arma dos bultos de 6 en una sola acción. Lo que
 * sobre por debajo del empaque (pedir 14 deja 2) se arma a mano: un bulto
 * rápido siempre lleva la cantidad exacta del empaque.
 *
 * Las unidades salen de UN solo renglón: dos renglones del mismo SKU son
 * cantidades independientes y no se mezclan en el mismo ítem.
 *
 * No toca los bultos abiertos: los rápidos se agregan al final, así que el
 * picker puede tener uno a medias sin que esto lo interrumpa.
 */
export function applyQuickBundle(order: Order, lineId: string): Partial<Order> | null {
  const candidate = getQuickBundleCandidates(order).find((c) => c.lineId === lineId);
  if (!candidate) return null;

  const stamp = Date.now();
  const nuevos: Bulto[] = Array.from({ length: candidate.availableBundles }, (_, idx) => {
    const number = order.bultos.length + idx + 1;
    return {
      id: `bulto-${order.id}-quick-${stamp}-${idx}`,
      number,
      status: 'closed' as const,
      items: [
        {
          id: `bi-${lineId}-quick-${stamp}-${idx}`,
          lineId,
          sku: candidate.sku,
          name: candidate.name,
          qty: candidate.unitsPerBundle,
        },
      ],
    };
  });

  const bultos = [...order.bultos, ...nuevos];
  const withBultos = { ...order, bultos };
  const base = {
    ...syncPickingMetrics(order, bultos),
    hasExtraBultos: order.hasExtraBultos || bultos.length > order.definedBultos,
  };

  // Nacen cerrados, así que mueven el progreso igual que cerrar bultos a mano y
  // deben disparar el mismo guardado por hito.
  const progressPercentage = computeProgressPercentage(withBultos);
  const milestone = getMilestoneForProgress(progressPercentage, order.lastSavedMilestone);
  if (milestone > order.lastSavedMilestone) {
    return { ...base, ...buildPartialSavePatch(withBultos, milestone) };
  }

  return base;
}

export function canCloseBulto(order: Order, bultoId: string): PickerActionError | null {
  const bulto = order.bultos.find((b) => b.id === bultoId);
  if (!bulto || bulto.items.length === 0) return 'cannot_close_empty_bulto';
  return null;
}

export function applyCloseBulto(order: Order, bultoId: string): Partial<Order> {
  const bultos = order.bultos.map((b) =>
    b.id === bultoId ? { ...b, status: 'closed' as const } : b,
  );
  const withBultos = { ...order, bultos };
  const progressPercentage = computeProgressPercentage(withBultos);
  const milestone = getMilestoneForProgress(progressPercentage, order.lastSavedMilestone);
  const base = syncPickingMetrics(order, bultos);

  if (milestone > order.lastSavedMilestone) {
    return {
      ...base,
      ...buildPartialSavePatch(withBultos, milestone),
    };
  }

  return base;
}

function getMilestoneForProgress(progress: number, lastSaved: number): number {
  const milestones = [25, 50, 75, 100];
  let result = lastSaved;
  for (const m of milestones) {
    if (progress >= m && lastSaved < m) result = m;
  }
  return result;
}

export function applyReopenBulto(order: Order, bultoId: string): Partial<Order> {
  const bultos = order.bultos.map((b) =>
    b.id === bultoId ? { ...b, status: 'open' as const } : b,
  );
  return syncPickingMetrics(order, bultos);
}

export function applyDeleteBulto(order: Order, bultoId: string): Partial<Order> {
  const eliminado = order.bultos.find((b) => b.id === bultoId);
  const filtered = order.bultos.filter((b) => b.id !== bultoId);
  const bultos = renumberBultos(filtered);

  return {
    ...syncPickingMetrics(order, bultos),
    ...(eliminado
      ? {
          rejectedBundles: shiftBundleNumbers(order.rejectedBundles, eliminado.number),
          approvedBundles: shiftBundleNumbers(order.approvedBundles, eliminado.number),
        }
      : {}),
  };
}

/**
 * Los bultos se renumeran al borrar uno, pero las listas de la auditoría se
 * guardan por número: sin reajustarlas, "aprobado el 3" pasaría a señalar al
 * bulto que estaba rechazado. Se descarta el número borrado y se baja en uno a
 * los posteriores, igual que hace `renumberBultos` con los bultos.
 */
function shiftBundleNumbers(numbers: number[], deletedNumber: number): number[] {
  return numbers.filter((n) => n !== deletedNumber).map((n) => (n > deletedNumber ? n - 1 : n));
}

export function applyAddBultoItem(
  order: Order,
  bultoId: string,
  lineId: string,
  sku: string,
  name: string,
  qty: number,
  options?: { originalSku?: string; substitutionNote?: string },
): Partial<Order> {
  const bultos = order.bultos.map((b) => {
    if (b.id !== bultoId) return b;

    // La fusión es por RENGLÓN, no por SKU: con "19 + 1" del mismo artículo,
    // cada renglón es un ítem aparte dentro del bulto y se sube o baja solo.
    // El SKU también entra porque una sustitución mete otro artículo para el
    // mismo renglón, y esas cantidades no deben mezclarse.
    const existing = b.items.find((i) => i.lineId === lineId && i.sku === sku);

    const items: BultoItem[] = existing
      ? b.items.map((i) =>
          i.id === existing.id
            ? {
                ...i,
                qty: i.qty + qty,
                substitutionNote: options?.substitutionNote ?? i.substitutionNote,
              }
            : i,
        )
      : [
          ...b.items,
          {
            id: `bi-${lineId}-${sku}-${Date.now()}`,
            lineId,
            sku,
            name,
            qty,
            originalSku: options?.originalSku,
            substitutionNote: options?.substitutionNote,
          },
        ];

    return { ...b, items };
  });

  return syncPickingMetrics(order, bultos);
}

export function applyUpdateBultoItem(
  order: Order,
  bultoId: string,
  itemId: string,
  qty: number,
): Partial<Order> {
  const bultos = order.bultos.map((b) =>
    b.id !== bultoId
      ? b
      : { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, qty } : i)) },
  );
  return syncPickingMetrics(order, bultos);
}

export function applyRemoveBultoItem(
  order: Order,
  bultoId: string,
  itemId: string,
): Partial<Order> {
  const bultos = order.bultos.map((b) =>
    b.id !== bultoId ? b : { ...b, items: b.items.filter((i) => i.id !== itemId) },
  );
  return syncPickingMetrics(order, bultos);
}

/** @deprecated Usar applyMarkWrapped */
export const applyMarkPacked = applyMarkWrapped;
