import { useEffect, useRef, useState } from 'react';
import { firestore } from '@/services/firebase';
import { firestoreDocToOrder } from '../services/orders.mapper';
import type { Order } from '../types';

/**
 * Suscripción en tiempo real a los pedidos de un picker en Firestore.
 * Filtra por assigned_to.uid == pickerId.
 * Devuelve { orders, loading, error }.
 */
export function useFirestorePickerOrders(pickerId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evitar re-suscripción si el pickerId no cambió
  const pickerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pickerId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    pickerIdRef.current = pickerId;
    setLoading(true);
    setError(null);

    const unsub = firestore()
      .collection('lo_orders')
      .where('assigned_to.uid', '==', pickerId)
      .onSnapshot(
        (snapshot) => {
          const mapped = snapshot.docs.map((doc) =>
            firestoreDocToOrder(doc.id, doc.data()),
          );
          setOrders(mapped);
          setLoading(false);
        },
        (err) => {
          console.error('[useFirestorePickerOrders]', err);
          setError(err.message);
          setLoading(false);
        },
      );

    return unsub;
  }, [pickerId]);

  return { orders, loading, error };
}
