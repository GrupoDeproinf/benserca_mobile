import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order } from '../types';

const STORAGE_KEY = 'picking.localWork.v1';
const SAVE_DEBOUNCE_MS = 400;

interface StoredLocalWork {
  /** Dueño del trabajo guardado: no debe restaurarse en la sesión de otro. */
  uid: string;
  savedAt: string;
  orders: Order[];
}

/**
 * Pedidos con trabajo local que todavía no está garantizado en el servidor: el
 * picking en curso solo se manda a Firestore por hitos (ver `closeBulto` en
 * orders.store), así que sin esto cerrar la app — o que la mate el sistema —
 * pierde todo lo hecho desde el último hito. Offline el hueco es mayor, porque
 * la escritura encolada tampoco confirmó.
 *
 * Se guarda solo lo mínimo: el resto del listado vuelve del listener o de la
 * caché de Firestore.
 */
export function ordersWithLocalWork(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === 'in_progress' || o.bultos.length > 0);
}

export async function loadLocalWork(uid: string): Promise<Order[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredLocalWork;
    if (parsed?.uid !== uid || !Array.isArray(parsed.orders)) return [];
    return parsed.orders;
  } catch (err) {
    console.error('[orders-local-work] load', err);
    return [];
  }
}

async function writeLocalWork(uid: string, orders: Order[]): Promise<void> {
  try {
    if (orders.length === 0) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: StoredLocalWork = { uid, savedAt: new Date().toISOString(), orders };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('[orders-local-work] save', err);
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
  const pending = ordersWithLocalWork(orders);
  cancelPending();
  timer = setTimeout(() => {
    timer = null;
    void writeLocalWork(uid, pending);
  }, SAVE_DEBOUNCE_MS);
}

/** Vuelca lo pendiente sin esperar el debounce (app pasando a background). */
export function flushLocalWork(uid: string, orders: Order[]): void {
  cancelPending();
  void writeLocalWork(uid, ordersWithLocalWork(orders));
}

export async function clearLocalWork(): Promise<void> {
  cancelPending();
  await AsyncStorage.removeItem(STORAGE_KEY);
}
