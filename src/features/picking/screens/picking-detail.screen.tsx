import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  Box,
  ClipboardList,
  ListChecks,
  type LucideIcon,
  Package,
  PackageOpen,
  PackagePlus,
  PauseCircle,
  Play,
  RotateCcw,
  Square,
  SquareCheck,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { ConfirmSheet, type ConfirmSheetTone } from '@/shared/components/ui/confirm-sheet';
import { Text } from '@/shared/components/ui/text';
import { Toast, useToast } from '@/shared/components/ui/toast';
import { type AddItemEntry, AddItemSheet } from '../components/add-item-sheet';
import { BultoCard } from '../components/bulto-card';
import { FinishMissingSheet } from '../components/finish-missing-sheet';
import {
  estimateOrderActionsHeight,
  type OrderDetailAction,
  OrderDetailActions,
} from '../components/order-detail-action-bar';
import { OrderDetailAlertBanner, OrderDetailHeader } from '../components/order-detail-header';
import { OrderDetailCard, OrderDetailSection } from '../components/order-detail-section';
import { OrderDetailBodyFade } from '../components/order-detail-transition';
import { OrderLineRow } from '../components/order-line-row';
import { type MarkedMissingLine, PausePickingSheet } from '../components/pause-picking-sheet';
import { QuickBundleCard } from '../components/quick-bundle-card';
import { SkuPreviewSheet } from '../components/sku-preview-sheet';
import { useFirestoreOrder } from '../hooks/use-firestore-order';
import { useOrdersStore } from '../store/orders.store';
import type { MissingItemsMode, OrderLine, PauseReason } from '../types';
import { createBultoItemMaxQty, getMaxQtyForBultoItem } from '../utils/bulto-capacity';
import {
  getAssignedQtyByLine,
  getDuplicateSkus,
  getMissingQuantities,
  getOrphanBultoItems,
} from '../utils/order-snapshot';
import { pauseBannerBodyKey } from '../utils/order-status';
import { getEffectiveQueuePosition } from '../utils/picker-queue';
import { getQuickBundleCandidates } from '../utils/quick-bundles';

interface PickingDetailScreenProps {
  orderId: string;
  /** Modo visualizador (supervisor de almacén): oculta toda acción y edición. */
  readOnly?: boolean;
}

const SCREEN_BG = '#F2F2F7';

type ConfirmState = {
  title: string;
  message: string;
  messageItems?: string[];
  mode: 'confirm' | 'info';
  tone?: ConfirmSheetTone;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  icon?: LucideIcon;
  /** Obligatorio elegir una acción; no cierra al tocar fuera. */
  dismissible?: boolean;
};

/**
 * A partir de estos tamaños las secciones arrancan plegadas.
 *
 * El detalle dibuja TODOS los renglones y TODOS los ítems de todos los bultos
 * de una vez, sin virtualizar. Medido en una tablet con un pedido de 250
 * artículos: abrirlo costaba +241 MB de heap nativo (PSS 192 → 548 MB) y el
 * 50% de los frames con jank. Plegado, esas vistas no se montan y el picker
 * despliega solo lo que necesita mirar.
 */
const MANY_LINES = 25;
const MANY_BULTOS = 10;
/**
 * `getQuickBundleCandidates` devuelve una tarjeta por RENGLÓN, así que un
 * pedido de 250 renglones con `units_per_bundle` dibujaba 250 tarjetas de una
 * vez. Pasado este número la sección arranca plegada: el picker arma de a
 * pocos, no necesita las 250 a la vista.
 */
const MANY_QUICK_BUNDLES = 12;

export function PickingDetailScreen({ orderId, readOnly = false }: PickingDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();

  // Suscripción propia al documento, además del listener de la lista (ver
  // useSessionOrdersListener): esta pantalla se queda abierta mientras el
  // picker arma el pedido, y si el listener de lista tarda o se corta (app en
  // segundo plano, reconexión), el detalle igual se mantiene al día con lo
  // que cambie en el pedido (SKU eliminado, sustituido, etc.) sin esperar a
  // que se cierre sesión.
  useFirestoreOrder(orderId || null);

  // Se selecciona SOLO este pedido (y la posición en cola ya calculada), no la
  // lista entera: así la pantalla no se redibuja cuando cambia otro pedido.
  // Los `useMemo` que había aquí tenían dependencias que no coincidían con lo
  // que leían (`user?.uid` vs `user`), y por eso React Compiler descartaba
  // optimizar la pantalla completa: cada toque recreaba todo.
  const userUid = user?.uid;
  const order = useOrdersStore((s) => s.orders.find((o) => o.id === orderId));
  const effectiveQueuePosition = useOrdersStore((s) => {
    const current = s.orders.find((o) => o.id === orderId);
    if (!current || !userUid) return null;
    const pickerOrders = s.orders.filter(
      (o) => o.assignedPickerId === userUid || o.teamPickerUids.includes(userUid),
    );
    return getEffectiveQueuePosition(current, pickerOrders);
  });
  const startPicking = useOrdersStore((s) => s.startPicking);
  const finishPicking = useOrdersStore((s) => s.finishPicking);
  const markWrapped = useOrdersStore((s) => s.markWrapped);
  const reopenForRevision = useOrdersStore((s) => s.reopenForRevision);
  const openBulto = useOrdersStore((s) => s.openBulto);
  const closeBulto = useOrdersStore((s) => s.closeBulto);
  const reopenBulto = useOrdersStore((s) => s.reopenBulto);
  const deleteBulto = useOrdersStore((s) => s.deleteBulto);
  const deleteBultos = useOrdersStore((s) => s.deleteBultos);
  const moveBultos = useOrdersStore((s) => s.moveBultos);
  const addBultoItem = useOrdersStore((s) => s.addBultoItem);
  const createQuickBundle = useOrdersStore((s) => s.createQuickBundle);
  const removeBultoItem = useOrdersStore((s) => s.removeBultoItem);
  const updateBultoItem = useOrdersStore((s) => s.updateBultoItem);
  const pausePicking = useOrdersStore((s) => s.pausePicking);
  const reportMissingItems = useOrdersStore((s) => s.reportMissingItems);
  const resumePicking = useOrdersStore((s) => s.resumePicking);
  const refreshArticleData = useOrdersStore((s) => s.refreshArticleData);

  const [addSheetBultoId, setAddSheetBultoId] = useState<string | null>(null);
  /**
   * Renglón desde el que se abrió el reporte de faltante. Fija el motivo a
   * "falta de artículo" y lo deja pre-marcado en la hoja.
   */
  const [missingLine, setMissingLine] = useState<OrderLine | null>(null);
  /** Renglón cuya foto y código se están viendo en grande. */
  const [previewLine, setPreviewLine] = useState<OrderLine | null>(null);
  const [pauseSheetVisible, setPauseSheetVisible] = useState(false);
  const [confirmSheet, setConfirmSheet] = useState<ConfirmState | null>(null);
  /** Cantidades sin asignar al tocar "Finalizar"; `null` oculta la hoja. */
  const [finishMissingItems, setFinishMissingItems] = useState<string[] | null>(null);
  const [refreshingArticleData, setRefreshingArticleData] = useState(false);
  /** Modo selección de bultos para borrar varios (o todos) de una vez. */
  const [bultoSelectionMode, setBultoSelectionMode] = useState(false);
  const [selectedBultoIds, setSelectedBultoIds] = useState<string[]>([]);
  const {
    message: capacityToast,
    nudgeToken: capacityToastNudge,
    show: showCapacityToast,
  } = useToast();
  const {
    message: articleDataToast,
    nudgeToken: articleDataToastNudge,
    show: showArticleDataToast,
  } = useToast();
  const {
    message: renumberToast,
    nudgeToken: renumberToastNudge,
    show: showRenumberToast,
  } = useToast();
  const maxReachedTooltip = t('picking.addItem.capacityExceededTooltip');

  /*
   * Handlers que llegan a CADA fila (renglones e ítems de bulto). Van antes del
   * `return` temprano y usan `orderId` + el pedido más nuevo del store en vez
   * de `order`, que cambia con cada toque: así React Compiler los memoriza
   * aparte y las filas que no cambiaron conservan sus props y no se redibujan.
   * Declarados más abajo quedaban agrupados con el resto de la pantalla y se
   * recreaban en cada render.
   */
  const handlePreviewLine = (line: OrderLine) => {
    Haptics.selectionAsync();
    setPreviewLine(line);
  };

  const handlePreviewItem = (lineId: string) => {
    const line = useOrdersStore
      .getState()
      .getOrderById(orderId)
      ?.lines.find((l) => l.id === lineId);
    if (line) setPreviewLine(line);
  };

  const handleReportMissing = (line: OrderLine) => {
    Haptics.selectionAsync();
    setMissingLine(line);
    setPauseSheetVisible(true);
  };

  const handleCloseBulto = (bultoId: string) => {
    const result = closeBulto(orderId, bultoId);
    if (!result.ok) {
      setConfirmSheet({
        title: t('picking.bulto.cannotCloseEmptyTitle'),
        message: t('picking.bulto.cannotCloseEmptyBody'),
        mode: 'info',
        confirmLabel: t('common.understood'),
        icon: PackageOpen,
      });
    }
  };

  const handleReopenBulto = (bultoId: string) => reopenBulto(orderId, bultoId);

  const showEmptyBultoModal = (bultoId: string, bultoNumber: number) => {
    setConfirmSheet({
      title: t('picking.bulto.emptyModalTitle', { number: bultoNumber }),
      message: t('picking.bulto.emptyModalBody'),
      mode: 'confirm',
      tone: 'warning',
      confirmLabel: t('picking.bulto.deleteBulto'),
      cancelLabel: t('picking.bulto.addItem'),
      icon: Trash2,
      dismissible: false,
      onConfirm: () => deleteBulto(orderId, bultoId),
      onCancel: () => setAddSheetBultoId(bultoId),
    });
  };

  const handleRemoveItem = (bultoId: string, itemId: string) => {
    const result = removeBultoItem(orderId, bultoId, itemId);
    if (result.bultoEmpty) {
      showEmptyBultoModal(result.bultoId, result.bultoNumber);
    }
  };

  const handleUpdateItemQty = (bultoId: string, itemId: string, qty: number) => {
    if (qty < 1) {
      handleRemoveItem(bultoId, itemId);
      return;
    }
    const current = useOrdersStore.getState().getOrderById(orderId);
    if (!current) return;
    const maxQty = getMaxQtyForBultoItem(current, itemId);
    if (qty > maxQty) showCapacityToast(maxReachedTooltip);
    updateBultoItem(orderId, bultoId, itemId, Math.min(qty, maxQty));
  };

  const handleCapacityExceeded = () => showCapacityToast(maxReachedTooltip);

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        <Text>{t('picking.detail.notFound')}</Text>
      </View>
    );
  }

  if (!user) return null;

  const isEditable =
    !readOnly && (order.status === 'in_progress' || order.status === 'rejected_review');
  /** Trae foto/descripción más nuevas del catálogo; no tiene sentido en un pedido ya cerrado. */
  const canRefreshArticleData =
    !readOnly && order.status !== 'dispatched' && order.status !== 'annulled';
  const showBultos =
    order.status === 'in_progress' ||
    order.status === 'to_pack' ||
    order.status === 'rejected_review' ||
    order.status === 'packed' ||
    order.status === 'audited';

  /**
   * Al corregir un rechazo el picker solo ve lo que NO fue aprobado: así no
   * puede dañar un bulto que el chequeador ya dio por bueno. Se filtra por lo
   * aprobado (y no por lo rechazado) para que un bulto que abra durante la
   * corrección siga visible aunque lo cierre.
   *
   * Incluye `in_progress` porque al reabrir el picking el pedido pasa a ese
   * estatus. `approvedBundles` solo trae datos tras un rechazo y se vacía al
   * aprobar el pedido, así que en un picking normal la lista queda intacta.
   */
  const inRejectionFix = order.status === 'rejected_review' || order.status === 'in_progress';
  const hiddenApprovedBultos = inRejectionFix ? order.approvedBundles.length : 0;
  const visibleBultos =
    hiddenApprovedBultos > 0
      ? order.bultos.filter((b) => !order.approvedBundles.includes(b.number))
      : order.bultos;

  /**
   * Bultos rápidos: renglones que Profit marca con `units_per_bundle` y que se
   * arman de un toque. Solo mientras el pedido se puede editar; en modo lectura
   * o ya empaquetado no hay nada que armar.
   */
  const quickBundleCandidates = isEditable ? getQuickBundleCandidates(order) : [];

  /**
   * Selección múltiple de bultos. Solo se ofrece sobre los bultos visibles: en
   * una corrección de rechazo los aprobados están ocultos y así quedan fuera
   * del "seleccionar todos". Los ids que ya no existen (borrados, o el pedido
   * cambió de estatus) se descartan al leer en vez de sincronizar estado.
   */
  const canSelectBultos = isEditable && visibleBultos.length > 0;
  const inBultoSelection = bultoSelectionMode && canSelectBultos;
  const selectedVisibleIds = inBultoSelection
    ? visibleBultos.filter((b) => selectedBultoIds.includes(b.id)).map((b) => b.id)
    : [];
  const allBultosSelected = selectedVisibleIds.length === visibleBultos.length;

  /**
   * Cambiar el número = cambiar el orden. En una corrección de rechazo con
   * bultos aprobados ocultos no se ofrece: moverse entre números ocultos
   * cambiaría el número de bultos que el chequeador ya dio por buenos.
   */
  const canRenumberBultos = hiddenApprovedBultos === 0 && order.bultos.length > 1;

  const exitBultoSelection = () => {
    setBultoSelectionMode(false);
    setSelectedBultoIds([]);
  };

  /** Mantener presionado un bulto: entra al modo selección con ese bulto marcado. */
  const startBultoSelectionWith = (bultoId: string) => {
    setSelectedBultoIds([bultoId]);
    setBultoSelectionMode(true);
  };

  /**
   * Número editado en un bulto seleccionado. Sigue seleccionado después de
   * moverlo para poder corregir el número si hizo falta.
   */
  const handleRenumberBulto = (bultoId: string, targetNumber: number) => {
    const from = order.bultos.find((b) => b.id === bultoId)?.number;
    if (from === undefined) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    moveBultos(order.id, [bultoId], targetNumber);
    showRenumberToast(t('picking.bulto.renumberDone', { from, to: targetNumber }));
  };

  const toggleBultoSelected = (bultoId: string) => {
    setSelectedBultoIds((ids) =>
      ids.includes(bultoId) ? ids.filter((id) => id !== bultoId) : [...ids, bultoId],
    );
  };

  const toggleSelectAllBultos = () => {
    Haptics.selectionAsync();
    setSelectedBultoIds(allBultosSelected ? [] : visibleBultos.map((b) => b.id));
  };

  const handleDeleteSelectedBultos = () => {
    const ids = selectedVisibleIds;
    if (ids.length === 0) return;
    const withItems = visibleBultos.filter((b) => ids.includes(b.id) && b.items.length > 0);
    setConfirmSheet({
      title: t('picking.bulto.deleteSelectedTitle', { count: ids.length }),
      message:
        withItems.length > 0
          ? t('picking.bulto.deleteSelectedBodyWithItems')
          : t('picking.bulto.deleteSelectedBody'),
      mode: 'confirm',
      tone: 'warning',
      confirmLabel: t('picking.bulto.deleteSelectedConfirm', { count: ids.length }),
      icon: Trash2,
      onConfirm: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        deleteBultos(order.id, ids);
        exitBultoSelection();
      },
    });
  };

  /**
   * Faltantes sin resolver, indexados por renglón. La identidad es el índice en
   * `lines` (Profit no manda id, ver `makeLineId`), no el SKU: dos renglones del
   * mismo artículo se reportan por separado.
   */
  const pendingMissingByLineIndex = new Map(
    order.missingItems
      .filter((m) => m.resolution === 'pending')
      .map((m) => [m.lineIndex, m] as const),
  );

  /**
   * Renglones que se pueden reportar como faltantes: los que aún no están
   * completos en bultos y que no tienen ya un reporte pendiente (un faltante
   * reportado no se puede editar ni duplicar desde la app).
   */
  const reportableItems = getMissingQuantities(order).filter((item) => {
    const lineIndex = order.lines.findIndex((l) => l.id === item.lineId);
    return lineIndex !== -1 && !pendingMissingByLineIndex.has(lineIndex);
  });

  /**
   * Ítems que quedaron sin renglón porque la web cambió el SKU al resolver un
   * faltante. Si no se resuelven, al empaquetar sus unidades no entrarían en
   * `final_skus`: estarían en el bulto físico pero no en el sistema.
   */
  const orphanItems = getOrphanBultoItems(order);

  /**
   * SKUs que Profit repitió en más de un renglón: son los candidatos que se
   * ofrecen en la hoja de pausa para el motivo `sku_duplicado` (ver
   * `getDuplicateSkus`). El picker elige cuáles de ellos son el problema real.
   */
  const duplicateSkuCandidates = getDuplicateSkus(order.lines);
  /**
   * Lo que el picker efectivamente marcó al pausar por SKU duplicado (no todos
   * los candidatos: ver `duplicateSkuCandidates`). Se resalta en la lista de
   * renglones mientras la pausa siga activa con ese motivo.
   */
  const duplicateSkuSet = new Set(
    order.pauseInfo?.reason === 'sku_duplicado' ? order.pauseInfo.missingSkus : [],
  );

  const handleQuickBundle = (lineId: string) => {
    if (createQuickBundle(order.id, lineId)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const lastObservation = order.auditObservations[order.auditObservations.length - 1];
  const closedBultos = order.bultos.filter(
    (b) => b.status === 'closed' && b.items.length > 0,
  ).length;

  /** Índices de una sola pasada para las filas (ver `getAssignedQtyByLine`). */
  const assignedByLine = getAssignedQtyByLine(order.bultos);
  const getItemMaxQty = createBultoItemMaxQty(order);
  const canReportMissing = isEditable && !order.isPaused;

  const performOpenBulto = () => {
    const result = openBulto(order.id);
    if (!result.ok) {
      setConfirmSheet({
        title: t('picking.bulto.emptyOpenBlockTitle'),
        message: t('picking.bulto.emptyOpenBlockBody'),
        mode: 'info',
        tone: 'warning',
        confirmLabel: t('common.understood'),
        icon: PackagePlus,
      });
      return;
    }
    Haptics.selectionAsync();
    if (result.isExtra) {
      setConfirmSheet({
        title: t('picking.extraBultos.title'),
        message: t('picking.extraBultos.body', { defined: order.definedBultos }),
        mode: 'info',
        tone: 'warning',
        confirmLabel: t('common.understood'),
        icon: PackagePlus,
      });
    }
  };

  const handleOpenBulto = () => {
    const wouldBeExtra = order.bultos.length >= order.definedBultos;
    if (wouldBeExtra) {
      setConfirmSheet({
        title: t('picking.extraBultos.confirmTitle'),
        message: t('picking.extraBultos.confirmBody', { defined: order.definedBultos }),
        mode: 'confirm',
        tone: 'warning',
        confirmLabel: t('picking.extraBultos.continue'),
        icon: PackagePlus,
        onConfirm: performOpenBulto,
      });
      return;
    }
    performOpenBulto();
  };

  const handleStartPicking = () => {
    const result = startPicking(order.id, user.uid);
    if (!result.ok) {
      setConfirmSheet({
        title: t('picking.queue.blockTitle'),
        message: t('picking.queue.alreadyActive'),
        mode: 'info',
        confirmLabel: t('common.understood'),
        icon: AlertCircle,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const showEmptyBultoBlock = (bultoNumber?: number) => {
    setConfirmSheet({
      title: t('picking.finish.emptyBlockTitle'),
      message:
        bultoNumber != null
          ? t('picking.finish.emptyBlockBody', { number: bultoNumber })
          : t('picking.finish.emptyBlockBodyGeneric'),
      mode: 'info',
      tone: 'warning',
      confirmLabel: t('common.understood'),
      icon: PackageOpen,
    });
  };

  const showNoBultosBlock = () => {
    setConfirmSheet({
      title: t('picking.finish.noBultosTitle'),
      message: t('picking.finish.noBultosBody'),
      mode: 'info',
      tone: 'warning',
      confirmLabel: t('common.understood'),
      icon: PackageOpen,
    });
  };

  const doFinishPicking = (missingNote?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const result = finishPicking(order.id, user.uid, missingNote);
    if (!result.ok && result.error === 'empty_open_bulto_exists') {
      const emptyOpen = order.bultos.find((b) => b.status === 'open' && b.items.length === 0);
      showEmptyBultoBlock(emptyOpen?.number);
    } else if (!result.ok && result.error === 'no_bultos') {
      showNoBultosBlock();
    }
  };

  const handleConfirmFinishMissing = (note: string) => {
    setFinishMissingItems(null);
    doFinishPicking(note.length > 0 ? note : undefined);
  };

  const handleFinishPicking = () => {
    // Con un faltante sin resolver el pedido no se cierra: la única salida es
    // pausarlo hasta que la web actualice el pedido.
    if (order.hasMissingItems) {
      setConfirmSheet({
        title: t('picking.missing.blockFinishTitle'),
        message: t('picking.missing.blockFinishBody'),
        mode: 'info',
        tone: 'warning',
        confirmLabel: t('common.understood'),
        icon: AlertTriangle,
      });
      return;
    }

    if (orphanItems.length > 0) {
      setConfirmSheet({
        title: t('picking.missing.orphanTitle'),
        message: t('picking.missing.orphanBody'),
        messageItems: orphanItems.map((o) =>
          t('picking.missing.orphanLine', { bulto: o.bultoNumber, sku: o.sku, qty: o.qty }),
        ),
        mode: 'info',
        tone: 'warning',
        confirmLabel: t('common.understood'),
        icon: AlertTriangle,
      });
      return;
    }

    if (order.bultos.length === 0) {
      showNoBultosBlock();
      return;
    }

    const emptyOpen = order.bultos.find((b) => b.status === 'open' && b.items.length === 0);
    if (emptyOpen) {
      showEmptyBultoBlock(emptyOpen.number);
      return;
    }

    const missing = getMissingQuantities(order);
    if (missing.length > 0) {
      const items = missing.map((m) =>
        t('picking.finish.missingLine', { qty: m.missing, name: m.name }),
      );
      setFinishMissingItems(items);
      return;
    }

    setConfirmSheet({
      title: t('picking.finish.confirmTitle'),
      message: t('picking.finish.confirmBody'),
      mode: 'confirm',
      confirmLabel: t('picking.finish.confirm'),
      icon: PackageOpen,
      onConfirm: doFinishPicking,
    });
  };

  const handleMarkWrapped = () => {
    setConfirmSheet({
      title: t('picking.wrap.confirmTitle'),
      message: t('picking.wrap.confirmBody'),
      mode: 'confirm',
      confirmLabel: t('picking.wrap.confirm'),
      icon: Box,
      onConfirm: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        markWrapped(order.id);
      },
    });
  };

  const handleReopenForRevision = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reopenForRevision(order.id, user.uid);
  };

  const handlePausePicking = () => {
    Haptics.selectionAsync();
    setPauseSheetVisible(true);
  };

  const handleConfirmPause = (
    reason: PauseReason,
    marked: MarkedMissingLine[],
    mode: MissingItemsMode,
    selectedDuplicateSkus: string[],
  ) => {
    if (marked.length > 0) {
      // Con faltantes marcados manda el flujo nuevo: `missing_items` + (según el
      // modo) la pausa. `pausePicking` se reserva para el cambio de prioridad y
      // el SKU duplicado.
      reportMissingItems(order.id, marked, mode);
    } else {
      // Con SKU duplicado, lo que se guarda es lo que el picker marcó en la
      // hoja, no todos los candidatos detectados (ver `duplicateSkuCandidates`).
      pausePicking(order.id, reason, reason === 'sku_duplicado' ? selectedDuplicateSkus : []);
    }
    setPauseSheetVisible(false);
    setMissingLine(null);
  };

  const handleResumePicking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resumePicking(order.id);
  };

  const handleRefreshArticleData = async () => {
    if (refreshingArticleData) return;
    Haptics.selectionAsync();
    setRefreshingArticleData(true);
    const result = await refreshArticleData(order.id);
    setRefreshingArticleData(false);

    if (!result.ok) {
      showArticleDataToast(t('picking.detail.refreshError'));
      return;
    }
    showArticleDataToast(
      result.linesUpdated > 0
        ? t('picking.detail.refreshSuccess', { count: result.linesUpdated })
        : t('picking.detail.refreshNoChanges'),
    );
  };

  /**
   * Tacho individual del header del bulto. Un bulto vacío y abierto se borra
   * de un toque (no hay nada que perder); con ítems o cerrado se confirma
   * antes, igual que el borrado múltiple.
   */
  const handleDeleteSingleBulto = (bultoId: string) => {
    const bulto = order.bultos.find((b) => b.id === bultoId);
    if (!bulto) return;

    if (bulto.status === 'open' && bulto.items.length === 0) {
      deleteBulto(order.id, bultoId);
      return;
    }

    setConfirmSheet({
      title: t('picking.bulto.deleteBultoConfirmTitle', { number: bulto.number }),
      message:
        bulto.items.length > 0
          ? t('picking.bulto.deleteBultoConfirmBodyWithItems')
          : t('picking.bulto.deleteBultoConfirmBody'),
      mode: 'confirm',
      tone: 'warning',
      confirmLabel: t('picking.bulto.deleteBulto'),
      icon: Trash2,
      onConfirm: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        deleteBulto(order.id, bultoId);
      },
    });
  };

  const commitAddItems = (bultoId: string, items: AddItemEntry[]) => {
    items.forEach(({ lineId, sku, name, qty }) => {
      addBultoItem(order.id, bultoId, lineId, sku, name, qty);
    });
    setAddSheetBultoId(null);
  };

  const handleAddItemToBulto = (bultoId: string) => {
    const bulto = order.bultos.find((b) => b.id === bultoId);
    if (!bulto) return;
    setAddSheetBultoId(bultoId);
  };

  // Reanudar picking está disponible para cualquier rol que pueda ver el
  // pedido pausado (incluido supervisor_almacen en modo readOnly): la pausa
  // es la única acción que un visualizador puede ejecutar.
  const footerActions: (OrderDetailAction | OrderDetailAction[])[] = (() => {
    if (order.isPaused) {
      return [
        {
          label: t('picking.detail.resumePicking'),
          onPress: handleResumePicking,
          variant: 'primary',
          icon: Play,
        },
      ];
    }

    if (readOnly) return [];

    switch (order.status) {
      case 'assigned':
        return [
          {
            label: t('picking.detail.startPicking'),
            onPress: handleStartPicking,
            variant: 'primary',
            icon: Play,
          },
        ];
      case 'in_progress':
        return [
          {
            label: t('picking.detail.openBulto'),
            onPress: handleOpenBulto,
            variant: 'secondary',
            icon: PackagePlus,
          },
          [
            {
              label: t('picking.detail.pausePicking'),
              onPress: handlePausePicking,
              variant: 'secondary',
              icon: PauseCircle,
            },
            {
              label: t('picking.detail.finishPicking'),
              onPress: handleFinishPicking,
              variant: 'primary',
              icon: PackageOpen,
            },
          ],
        ];
      case 'to_pack':
        // Auditoría obligatoria: el picker no puede embalar directamente desde
        // Empaquetado; debe esperar la aprobación del chequeador.
        return [];
      case 'audited':
        // Embalar es el último paso del picker: el pedido cambia de estatus y
        // sale de su lista. Despachar ya no es cosa suya.
        return [
          {
            label: t('picking.detail.markWrapped'),
            onPress: handleMarkWrapped,
            variant: 'primary',
            icon: Box,
          },
        ];
      case 'rejected_review':
        return [
          {
            label: t('picking.detail.reopenPicking'),
            onPress: handleReopenForRevision,
            variant: 'primary',
            icon: RotateCcw,
          },
        ];
      default:
        return [];
    }
  })();

  const actionsDockHeight = estimateOrderActionsHeight(footerActions.length, insets.bottom);

  return (
    <View style={styles.screen}>
      <OrderDetailHeader
        orderNumber={order.orderNumber}
        client={order.client}
        status={order.status}
        auditResult={order.auditResult}
        isPaused={order.isPaused}
        onBack={() => router.back()}
        meta={[
          { label: t('picking.detail.definedBultos'), value: String(order.definedBultos) },
          { label: t('picking.detail.bultosClosed'), value: String(closedBultos) },
          {
            label: t('picking.detail.queuePosition'),
            value: effectiveQueuePosition != null ? String(effectiveQueuePosition) : '—',
          },
        ]}
        progress={order.progressPercentage / 100}
        progressLabel={t('picking.detail.progressLabel')}
        onRefresh={canRefreshArticleData ? handleRefreshArticleData : undefined}
        refreshing={refreshingArticleData}
        refreshAccessibilityLabel={t('picking.detail.refreshArticles')}
        footer={
          order.hasExtraBultos ? (
            <View style={styles.extraFlag}>
              <AlertCircle size={14} color="#B45309" />
              <Text style={styles.extraFlagText}>{t('picking.detail.extraBultosFlag')}</Text>
            </View>
          ) : undefined
        }
      />

      <OrderDetailBodyFade style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: actionsDockHeight > 0 ? actionsDockHeight + 8 : 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {order.isPaused && order.pauseInfo ? (
            <OrderDetailAlertBanner
              title={t('picking.pause.bannerTitle')}
              body={t(pauseBannerBodyKey(order.pauseInfo.reason), {
                skus: order.pauseInfo.missingSkus.join(', '),
              })}
              author={order.pauseInfo.authorName}
            />
          ) : null}

          {order.hasMissingItems && !order.isPaused ? (
            <OrderDetailAlertBanner
              title={t('picking.missing.bannerTitle')}
              body={t('picking.missing.bannerBody', {
                skus: [...pendingMissingByLineIndex.values()].map((m) => m.sku).join(', '),
              })}
            />
          ) : null}

          {orphanItems.length > 0 ? (
            <OrderDetailAlertBanner
              title={t('picking.missing.orphanTitle')}
              body={t('picking.missing.orphanBody')}
            />
          ) : null}

          {order.status === 'rejected_review' && lastObservation ? (
            <OrderDetailAlertBanner
              title={t('picking.rejection.title')}
              body={lastObservation.text}
              author={lastObservation.auditorName}
            />
          ) : null}

          {order.status === 'to_pack' ? (
            <OrderDetailAlertBanner
              title={t('picking.check.waitingTitle')}
              body={t('picking.check.waitingBody')}
            />
          ) : null}

          <OrderDetailSection
            title={t('picking.detail.linesTitle')}
            icon={ClipboardList}
            collapsible
            defaultExpanded={order.lines.length <= MANY_LINES}
            badge={String(order.lines.length)}
            marginTop={16}
          >
            <OrderDetailCard>
              {order.lines.map((line, idx) => (
                <OrderLineRow
                  key={line.id}
                  line={line}
                  isLast={idx === order.lines.length - 1}
                  assigned={assignedByLine.get(line.id) ?? 0}
                  // La identidad del faltante es el índice del renglón, no el
                  // SKU: dos renglones del mismo artículo se reportan por separado.
                  reported={pendingMissingByLineIndex.get(idx)}
                  isDuplicateSku={duplicateSkuSet.has(line.sku)}
                  canReportMissing={canReportMissing}
                  onPreview={handlePreviewLine}
                  onReportMissing={handleReportMissing}
                />
              ))}
            </OrderDetailCard>
          </OrderDetailSection>

          {showBultos ? (
            <OrderDetailSection title={t('picking.detail.bultosTitle')} icon={Package}>
              {hiddenApprovedBultos > 0 ? (
                <Text style={styles.onlyRejectedNote}>
                  {t('picking.rejection.onlyRejected', {
                    shown: visibleBultos.length,
                    total: order.bultos.length,
                  })}
                </Text>
              ) : null}
              {quickBundleCandidates.length > 0 ? (
                <OrderDetailSection
                  title={t('picking.quickBundle.title')}
                  collapsible
                  defaultExpanded={quickBundleCandidates.length <= MANY_QUICK_BUNDLES}
                  badge={String(quickBundleCandidates.length)}
                >
                  <View style={styles.quickBundles}>
                    {quickBundleCandidates.map((candidate) => (
                      <QuickBundleCard
                        key={candidate.lineId}
                        candidate={candidate}
                        onCreate={handleQuickBundle}
                      />
                    ))}
                  </View>
                </OrderDetailSection>
              ) : null}

              {canSelectBultos ? (
                inBultoSelection ? (
                  <View style={styles.selectionBar}>
                    <Pressable
                      onPress={toggleSelectAllBultos}
                      hitSlop={8}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: allBultosSelected }}
                      style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                    >
                      <View style={styles.selectAllBtn} collapsable={false}>
                        {allBultosSelected ? (
                          <SquareCheck size={20} color="#111827" strokeWidth={2.2} />
                        ) : (
                          <Square size={20} color="#8E8E93" strokeWidth={2.2} />
                        )}
                        <Text style={styles.selectAllText}>
                          {t('picking.bulto.selectAll')} ({selectedVisibleIds.length}/
                          {visibleBultos.length})
                        </Text>
                      </View>
                    </Pressable>
                    {canRenumberBultos ? (
                      <Text style={styles.selectionHint}>{t('picking.bulto.renumberHint')}</Text>
                    ) : null}
                    <View style={styles.selectionActions} collapsable={false}>
                      <Pressable
                        onPress={exitBultoSelection}
                        hitSlop={8}
                        style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                      >
                        <View style={styles.selectionCancel} collapsable={false}>
                          <Text style={styles.selectionCancelText}>{t('common.cancel')}</Text>
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={handleDeleteSelectedBultos}
                        disabled={selectedVisibleIds.length === 0}
                        accessibilityRole="button"
                        accessibilityLabel={t('picking.bulto.deleteSelected', {
                          count: selectedVisibleIds.length,
                        })}
                        style={({ pressed }) => [pressed && { opacity: 0.75 }]}
                      >
                        <View
                          style={[
                            styles.selectionDelete,
                            selectedVisibleIds.length === 0 && styles.selectionDeleteDisabled,
                          ]}
                          collapsable={false}
                        >
                          <Trash2 size={15} color="#FFFFFF" strokeWidth={2.4} />
                          <Text style={styles.selectionDeleteText}>
                            {t('picking.bulto.deleteSelected', {
                              count: selectedVisibleIds.length,
                            })}
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedBultoIds([]);
                      setBultoSelectionMode(true);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.selectModePressable,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View style={styles.selectModeBtn} collapsable={false}>
                      <ListChecks size={15} color="#111827" strokeWidth={2.2} />
                      <Text style={styles.selectModeText}>{t('picking.bulto.select')}</Text>
                    </View>
                  </Pressable>
                )
              ) : null}

              {visibleBultos.length === 0 ? (
                <OrderDetailCard>
                  <Text style={styles.emptyBultosTitle}>{t('picking.detail.noBultos')}</Text>
                </OrderDetailCard>
              ) : (
                visibleBultos.map((bulto) => (
                  <BultoCard
                    key={bulto.id}
                    bulto={bulto}
                    defaultExpanded={visibleBultos.length <= MANY_BULTOS}
                    editable={isEditable}
                    getItemMaxQty={getItemMaxQty}
                    onClose={handleCloseBulto}
                    onReopen={handleReopenBulto}
                    onAddItem={handleAddItemToBulto}
                    onCapacityExceeded={handleCapacityExceeded}
                    onUpdateItemQty={handleUpdateItemQty}
                    onRemoveItem={handleRemoveItem}
                    onDelete={handleDeleteSingleBulto}
                    selectionMode={inBultoSelection}
                    selected={selectedVisibleIds.includes(bulto.id)}
                    onToggleSelect={toggleBultoSelected}
                    onLongPressSelect={canSelectBultos ? startBultoSelectionWith : undefined}
                    onRenumber={canRenumberBultos ? handleRenumberBulto : undefined}
                    maxNumber={order.bultos.length}
                    onPreviewItem={handlePreviewItem}
                  />
                ))
              )}
            </OrderDetailSection>
          ) : null}
        </ScrollView>

        <OrderDetailActions actions={footerActions} />
      </OrderDetailBodyFade>

      <AddItemSheet
        visible={addSheetBultoId !== null}
        order={order}
        bulto={order.bultos.find((b) => b.id === addSheetBultoId) ?? null}
        onClose={() => setAddSheetBultoId(null)}
        onAddItems={(items) => {
          if (!addSheetBultoId) return;
          commitAddItems(addSheetBultoId, items);
        }}
      />

      <SkuPreviewSheet line={previewLine} onClose={() => setPreviewLine(null)} />

      <PausePickingSheet
        visible={pauseSheetVisible}
        pendingItems={reportableItems}
        duplicateSkus={duplicateSkuCandidates}
        lockedReason={missingLine ? 'falta_articulo' : undefined}
        focusLineId={missingLine?.id}
        alreadyReported={order.hasMissingItems}
        onClose={() => {
          setPauseSheetVisible(false);
          setMissingLine(null);
        }}
        onConfirm={handleConfirmPause}
      />

      <FinishMissingSheet
        visible={finishMissingItems !== null}
        items={finishMissingItems ?? []}
        onClose={() => setFinishMissingItems(null)}
        onConfirm={handleConfirmFinishMissing}
      />

      <Toast message={capacityToast} nudgeToken={capacityToastNudge} topInset={insets.top + 64} />
      <Toast
        message={articleDataToast}
        nudgeToken={articleDataToastNudge}
        topInset={insets.top + 64}
      />
      <Toast message={renumberToast} nudgeToken={renumberToastNudge} topInset={insets.top + 64} />

      <ConfirmSheet
        visible={confirmSheet !== null}
        title={confirmSheet?.title ?? ''}
        message={confirmSheet?.message ?? ''}
        messageItems={confirmSheet?.messageItems}
        mode={confirmSheet?.mode ?? 'confirm'}
        tone={confirmSheet?.tone}
        confirmLabel={confirmSheet?.confirmLabel}
        cancelLabel={confirmSheet?.cancelLabel}
        icon={confirmSheet?.icon}
        onConfirm={confirmSheet?.onConfirm}
        onCancel={confirmSheet?.onCancel}
        dismissible={confirmSheet?.dismissible ?? true}
        onClose={() => setConfirmSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SCREEN_BG, position: 'relative' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, paddingTop: 0 },
  extraFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  extraFlagText: { fontSize: 12, color: '#B45309', fontWeight: '600' },
  quickBundles: {
    marginBottom: 12,
  },
  quickBundlesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  onlyRejectedNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  selectModePressable: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  selectModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E9E9EB',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  selectModeText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  /**
   * Columna, no fila: con contador + 2 botones no siempre entra todo en un
   * mismo renglón, y `marginLeft: 'auto'` combinado con `flexWrap` llegó a
   * empujar "Eliminar" fuera de la vista en pantallas angostas. Apilado
   * queda siempre visible sin depender de cuánto ancho sobre.
   */
  selectionBar: {
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    marginBottom: 12,
  },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
  selectAllText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  selectionCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  selectionCancelText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  selectionDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  selectionDeleteDisabled: { backgroundColor: '#FCA5A5' },
  selectionHint: { fontSize: 12, lineHeight: 16, color: '#6B7280' },
  selectionDeleteText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  emptyBultosTitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
});
