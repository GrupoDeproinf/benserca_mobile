import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { firestore } from '@/services/firebase';
import type { AppNotification, NotificationType } from '@/shared/types';
import { useNotificationsStore } from '../store/notifications.store';

const KNOWN_TYPES = new Set<NotificationType>([
  'order_assigned',
  'order_updated',
  'order_recovered',
  'order_annulled',
  'picking_finished_incomplete',
  'picking_continued_with_mismatch',
  'order_audit_approved',
  'order_audit_rejected',
]);

function toNotificationType(raw: unknown): NotificationType {
  return typeof raw === 'string' && KNOWN_TYPES.has(raw as NotificationType)
    ? (raw as NotificationType)
    : 'order_updated';
}

interface RecipientEntry {
  uid?: string;
}

/**
 * ¿Este doc está dirigido a `uid`? Firestore no permite filtrar por un campo
 * dentro de un array de objetos (`recipients`), así que se resuelve en el
 * cliente sobre el resultado de una query más amplia (por `channel`).
 */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function matchesRecipient(data: Record<string, any>, uid: string): boolean {
  const recipients: RecipientEntry[] = Array.isArray(data.recipients) ? data.recipients : [];
  return recipients.some((r) => r?.uid === uid);
}

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function isReadByUser(data: Record<string, any>, uid: string): boolean {
  const read: RecipientEntry[] = Array.isArray(data.read) ? data.read : [];
  return read.some((r) => r?.uid === uid);
}

function docToAppNotification(
  id: string,
  // biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
  data: Record<string, any>,
  uid: string,
  titleFor: (type: NotificationType) => string,
): AppNotification {
  const createdAtRaw = data.created_at;
  const createdAt =
    createdAtRaw && typeof createdAtRaw.toDate === 'function'
      ? createdAtRaw.toDate().toISOString()
      : new Date().toISOString();

  const type = toNotificationType(data.type);

  return {
    id,
    firestoreId: id,
    userId: uid,
    type,
    title: titleFor(type),
    body: typeof data.message === 'string' ? data.message : '',
    orderNumber: typeof data.order_number === 'number' ? data.order_number : undefined,
    read: isReadByUser(data, uid),
    createdAt,
  };
}

/**
 * Escucha en tiempo real la colección compartida `notifications` (ver
 * notifications.md), filtrando en el cliente las dirigidas a este usuario en
 * la app (`channel` app/both + mi uid dentro de `recipients`).
 *
 * Montado una sola vez en (app)/_layout.tsx, igual que useSessionOrdersListener.
 */
export function useFirestoreNotificationsListener() {
  const user = useCurrentUser();
  const { t } = useTranslation();
  const hydrateFirestoreNotifications = useNotificationsStore(
    (s) => s.hydrateFirestoreNotifications,
  );
  const showIncomingToast = useNotificationsStore((s) => s.showIncomingToast);
  const prevIdsRef = useRef<Set<string> | null>(null);

  // `t` puede cambiar de referencia en renders que no tienen nada que ver con
  // la sesión (p. ej. cada navegación re-renderiza el layout raíz). Usar una
  // ref evita que el listener se desmonte/remonte por eso, perdiendo el
  // tracking de "qué ya se vio" justo mientras el usuario navega por la app.
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!user) return;

    // Nueva suscripción → no avisar de todo lo preexistente al abrir sesión.
    prevIdsRef.current = null;

    const titleFor = (type: NotificationType) => tRef.current(`notifications.type.${type}`);

    const unsub = firestore()
      .collection('notifications')
      .where('channel', 'in', ['app', 'both'])
      .orderBy('created_at', 'desc')
      .limit(200)
      .onSnapshot(
        (snapshot) => {
          const docs = snapshot.docs
            .filter((doc) => matchesRecipient(doc.data(), user.uid))
            .map((doc) => docToAppNotification(doc.id, doc.data(), user.uid, titleFor));
          hydrateFirestoreNotifications(docs);

          // Banner global: solo para llegadas realmente nuevas (no el snapshot inicial).
          if (prevIdsRef.current) {
            const arrived = docs.find((d) => !prevIdsRef.current!.has(d.id) && !d.read);
            if (arrived) showIncomingToast(arrived);
          }
          prevIdsRef.current = new Set(docs.map((d) => d.id));
        },
        (err) => {
          console.error('[useFirestoreNotificationsListener]', err);
        },
      );

    return unsub;
  }, [user?.uid, hydrateFirestoreNotifications, showIncomingToast]);
}
