import functions from '@react-native-firebase/functions';
import { firestore } from './index';

/** Tipos de correo que la app dispara (ver correos.md §3). `order_change` es solo de la web. */
export type MailType = 'order_duplicate_skus' | 'order_rejected' | 'order_completed';

/**
 * Staff activo con `email_types` array-contains `emailType`. Mismo índice de
 * Firestore para los tres tipos: no hace falta uno distinto por correo.
 */
export async function listStaffEmailsForType(emailType: MailType): Promise<string[]> {
  const snap = await firestore()
    .collection('u_staff')
    .where('email_types', 'array-contains', emailType)
    .get();

  return [
    ...new Set(
      snap.docs
        .map((doc) => {
          const data = doc.data();
          if (data.is_active === false) return '';
          return String(data.email || '')
            .trim()
            .toLowerCase();
        })
        .filter(Boolean),
    ),
  ];
}

export interface SendMailInput {
  to: string[];
  subject: string;
  text: string;
  html: string;
}

/**
 * Llama a la Cloud Function `send_mail` (misma que usa la web). No valida
 * `to` vacío: eso lo decide quien arma el correo antes de llegar aquí (ver
 * checklist §9.2 — salir en silencio si no hay destinatarios).
 */
export async function sendMail(input: SendMailInput): Promise<void> {
  const response = await functions().httpsCallable('send_mail')({
    to: input.to.join(','),
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  const data = response?.data as { status?: boolean | number; data?: { status?: boolean } };
  const ok = data?.data?.status === true || data?.status === true || data?.status === 200;

  if (!ok) {
    throw new Error(
      `[mail.service] send_mail respondió sin éxito: ${JSON.stringify(response?.data)}`,
    );
  }
}
