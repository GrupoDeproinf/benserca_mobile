import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order } from '../types';

const STORAGE_KEY_PREFIX = 'picking.localWork.v1';
/** Clave única de la primera versión (un solo usuario por dispositivo). */
const LEGACY_STORAGE_KEY = STORAGE_KEY_PREFIX;
const SAVE_DEBOUNCE_MS = 400;

interface StoredLocalWork {
  /** Dueño del trabajo guardado: no debe restaurarse en la sesión de otro. */
  uid: string;
  savedAt: string;
  orders: Order[];
}

/**
 * Una clave por usuario: el picking de un picker sobrevive a que otro use el
 * mismo dispositivo, y `loadLocalWork` nunca puede leer el de otra sesión.
 */
function storageKey(uid: string): string {
  return `${STORAGE_KEY_PREFIX}.${uid}`;
}

/**
 * Pedidos con trabajo local que todavía no está garantizado en el servidor: el
 * picking en curso solo se manda a Firestore por hitos (ver `closeBulto` en
 * orders.store), así que sin esto cerrar la app — o que la mate el sistema —
 * pierde todo lo hecho desde el último hito. Offline el hueco es mayor, porque
 * la escritura encolada tampoco confirmó.
 *
 * Se guarda solo lo mínimo: el resto del listado vuelve del listener o de la
 * caché de Firestore. Eso incluye filtrar por quien arma el pedido: el
 * supervisor ve todo el almacén y el chequeador una cola de pedidos que ya
 * traen bultos; sin el filtro se serializaba y escribía a disco todo eso con
 * cada cambio del store, aunque ninguno de los dos arma pedidos. Solo quien lo
 * trabaja tiene edición local que proteger (mismo criterio que
 * `isActiveWorker` en orders.store).
 */
export function ordersWithLocalWork(orders: Order[], uid: string): Order[] {
  return orders.filter(
    (o) =>
      (o.assignedPickerId === uid || o.teamPickerUids.includes(uid)) &&
      (o.status === 'in_progress' || o.bultos.length > 0),
  );
}

async function readEntry(key: string, uid: string): Promise<Order[] | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as StoredLocalWork;
  if (parsed?.uid !== uid || !Array.isArray(parsed.orders)) return null;
  return parsed.orders.map(normalizeStoredOrder);
}

/**
 * Respaldos escritos antes de que el mapper normalizara `orderNumber`/`client`
 * pueden traerlos como número; la búsqueda de las listas los trata como texto.
 * Tampoco traen `loadedBundles`, que llegó con el rol de cargador.
 */
function normalizeStoredOrder(order: Order): Order {
  return {
    ...order,
    orderNumber: String(order.orderNumber ?? order.id),
    client: String(order.client ?? ''),
    loadedBundles: order.loadedBundles ?? [],
  };
}

export async function loadLocalWork(uid: string): Promise<Order[]> {
  try {
    const own = await readEntry(storageKey(uid), uid);
    if (own) return own;

    // Migración de la clave única: si lo guardado es de este usuario se mueve a
    // su clave, para no perder el picking en curso al actualizar la app.
    const legacy = await readEntry(LEGACY_STORAGE_KEY, uid);
    if (legacy) {
      await persist(uid, legacy);
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }

    return [];
  } catch (err) {
    console.error('[orders-local-work] load', err);
    return [];
  }
}

async function persist(uid: string, orders: Order[]): Promise<void> {
  const payload: StoredLocalWork = { uid, savedAt: new Date().toISOString(), orders };
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(payload));
}

/**
 * Último respaldo escrito, sin el `savedAt` (que cambia siempre y haría que
 * nada coincidiera nunca). El listener de Firestore reemite el pedido en cada
 * cambio — incluidas las confirmaciones de las escrituras de la propia app —,
 * así que sin esta comparación el mismo contenido se reescribía en disco una y
 * otra vez mientras el picker arma bultos.
 */
let lastWritten: { uid: string; body: string } | null = null;

async function writeLocalWork(uid: string, storeOrders: Order[]): Promise<void> {
  // Un store vacío NO significa "no hay trabajo pendiente": pasa al arrancar
  // (antes del primer snapshot del listener) y en el logout (`resetOrders`).
  // Persistirlo borraría el respaldo, que es justo lo que hay que conservar
  // para que el mismo usuario recupere su picking al volver a entrar.
  if (storeOrders.length === 0) return;

  const pending = ordersWithLocalWork(storeOrders, uid);

  if (pending.length === 0) {
    // El store sí trajo pedidos y ninguno tiene trabajo local: no hay nada
    // que respaldar.
    try {
      await AsyncStorage.removeItem(storageKey(uid));
      lastWritten = null;
    } catch (err) {
      console.error('[orders-local-work] clear', err);
    }
    return;
  }

  // Se serializa UNA vez: el string sirve para comparar, para escribir y para
  // reportar el tamaño si falla.
  let body: string;
  try {
    body = JSON.stringify(pending);
  } catch (err) {
    console.error('[orders-local-work] serialize', err);
    return;
  }

  if (lastWritten?.uid === uid && lastWritten.body === body) return;

  try {
    await persist(uid, pending);
    lastWritten = { uid, body };
  } catch (err) {
    // Un fallo aquí es pérdida de trabajo del picker (p. ej. límite de tamaño
    // de AsyncStorage en Android con pedidos grandes): se registra el peso del
    // payload para poder diagnosticarlo. El tamaño sale del string que ya
    // existe — volver a serializar justo cuando el fallo probable es de
    // tamaño duplicaba el pico de memoria en el peor momento.
    const sizeKb = Math.round(body.length / 1024);
    console.error(`[orders-local-work] save failed (${pending.length} pedidos, ~${sizeKb}KB)`, err);
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

function cancelPending(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/** Guarda con debounce: durante el picking el store cambia en cada ítem. */
export function saveLocalWorkDebounced(uid: string, orders: Order[]): void {
  cancelPending();
  timer = setTimeout(() => {
    timer = null;
    void writeLocalWork(uid, orders);
  }, SAVE_DEBOUNCE_MS);
}

/** Vuelca lo pendiente sin esperar el debounce (app pasando a background). */
export function flushLocalWork(uid: string, orders: Order[]): void {
  cancelPending();
  void writeLocalWork(uid, orders);
}

/**
 * Borra el respaldo de CUALQUIER otro usuario del dispositivo. Se llama al
 * abrir sesión: si entra otro picker, el trabajo del anterior ya no se va a
 * retomar en este teléfono y se prefiere no dejar caché vieja dando vueltas.
 * El del propio usuario nunca se toca: es justo lo que debe sobrevivir a
 * cerrar y volver a abrir sesión.
 */
export async function clearOtherUsersLocalWork(uid: string): Promise<void> {
  try {
    const own = storageKey(uid);
    const keys = await AsyncStorage.getAllKeys();
    const stale = keys.filter(
      (key) =>
        key !== own && (key === LEGACY_STORAGE_KEY || key.startsWith(`${STORAGE_KEY_PREFIX}.`)),
    );

    if (stale.length > 0) await AsyncStorage.multiRemove(stale);
  } catch (err) {
    console.error('[orders-local-work] purge', err);
  }
}
