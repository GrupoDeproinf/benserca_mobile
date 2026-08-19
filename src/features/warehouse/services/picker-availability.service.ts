import firestore from '@react-native-firebase/firestore';

const PICKERS = 'u_pickers';

/**
 * Libera el flag `is_available` del propio usuario cuando quedó pegado en
 * `false` sin tener ningún pedido activo.
 *
 * El flag lo escribe solo el dispositivo del picker (iniciar/reanudar lo ponen
 * en `false`; finalizar y pausar en `true`), así que cualquier final del pedido
 * que ocurra fuera de ahí —anulación o reasignación desde la web, un despacho
 * hecho por otro, la app cerrada a mitad, o simplemente la escritura fallando—
 * lo deja ocupado para siempre, y el jefe lo ve "En proceso" sin nada en mano.
 *
 * Se corrige desde el dispositivo del propio picker porque es el único que
 * conoce TODOS sus pedidos (asignados a él y de equipo); el del jefe solo ve
 * los de su equipo y podría liberar a alguien que sí está ocupado.
 *
 * Solo libera: nunca marca a nadie como ocupado. Marcar ocupado es decisión de
 * las transiciones del pedido, y equivocarse ahí bloquearía asignaciones.
 *
 * @returns true si hubo que corregir el flag.
 */
export async function releasePickerIfStuck(uid: string): Promise<boolean> {
  try {
    const ref = firestore().collection(PICKERS).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return false;

    // Solo interesa el caso "marcado ocupado sin estarlo".
    if (snap.data()?.is_available !== false) return false;

    await ref.update({
      is_available: true,
      current_order_id: null,
      last_activity_at: new Date().toISOString(),
    });

    return true;
  } catch (e) {
    console.error(`[picker-availability] no se pudo liberar el flag de ${uid}`, e);
    return false;
  }
}
