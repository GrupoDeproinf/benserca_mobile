import firestore from '@react-native-firebase/firestore';
import type { NotificationType } from '@/shared/types';

const COLLECTION = 'notifications';

export interface NotificationRecipient {
  uid: string;
  name: string;
}

export interface CreateNotificationInput {
  message: string;
  type: NotificationType;
  channel: 'web' | 'app' | 'both';
  /** Broadcast a la web = `[]`. Dirigida a picker/jefe en la app = uno o más. */
  recipients: NotificationRecipient[];
  orderNumber?: number;
  motivo?: string;
  createdBy: string;
  createdByName: string;
}

/** Crea un documento en `notifications` con el schema vigente (`recipients`/`read`, ver notifications.md). */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const orderNumber = Number(input.orderNumber);
  // `serverTimestamp()` no está permitido dentro de arrays; se usa la hora del
  // cliente para el `created` de cada recipient.
  const now = firestore.Timestamp.now();

  await firestore()
    .collection(COLLECTION)
    .add({
      message: input.message,
      type: input.type,
      recipients: input.recipients.map((r) => ({ uid: r.uid, name: r.name, created: now })),
      read: [],
      channel: input.channel,
      created_at: firestore.FieldValue.serverTimestamp(),
      ...(Number.isFinite(orderNumber) ? { order_number: orderNumber } : {}),
      ...(input.motivo ? { motivo: input.motivo } : {}),
      created_by: input.createdBy,
      created_by_name: input.createdByName,
    });
}

/** Marca como leído un doc (`read`: array de `{uid, name, created}`). */
export async function markNotificationRead(
  notificationId: string,
  recipient: NotificationRecipient,
): Promise<void> {
  await firestore()
    .collection(COLLECTION)
    .doc(notificationId)
    .update({
      read: firestore.FieldValue.arrayUnion({
        uid: recipient.uid,
        name: recipient.name,
        created: firestore.Timestamp.now(),
      }),
    });
}
