import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { notify } from '@/features/notifications/store/notifications.store';
import {
  firestoreAssignTeam,
  firestoreUpdateTeamPickers,
  type TeamPickerRef,
} from '@/features/picking/services/orders.service';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';

function pickerRefs(uids: string[]): TeamPickerRef[] {
  return uids.map((uid) => ({
    uid,
    name: usePickersStore.getState().getPicker(uid)?.nombre ?? uid,
  }));
}

interface TeamsState {
  createTeam: (orderId: string, leadId: string, pickerIds: string[]) => void;
  releasePicker: (orderId: string, pickerUid: string) => void;
  releaseTeam: (orderId: string) => void;
}

/**
 * El equipo de un pedido vive en Firestore (`lo_orders/{id}.team`), no aquí.
 * Este store solo orquesta la escritura + la actualización optimista del
 * store de pedidos; la UI lee `order.teamPickerUids` como fuente de verdad
 * (ver lead-order-detail.screen y lead-orders.screen).
 */
export const useTeamsStore = create<TeamsState>(() => ({
  createTeam: (orderId, _leadId, pickerIds) => {
    // Reservar cada picker (estado local, optimista)
    pickerIds.forEach((uid) => {
      usePickersStore.getState().assignToTeam(uid, orderId, orderId);
    });
    useOrdersStore.getState().setTeamPickers(orderId, pickerIds);

    const chief = useAuthStore.getState().user;
    if (chief) {
      firestoreAssignTeam(orderId, chief, pickerRefs(pickerIds)).catch((e) =>
        console.error('[teams.store] assignTeam Firestore error', e),
      );
    }
  },

  releasePicker: (orderId, pickerUid) => {
    const order = useOrdersStore.getState().getOrderById(orderId);
    if (!order) return;

    usePickersStore.getState().releaseFromTeam(pickerUid);
    notify({
      userId: pickerUid,
      type: 'team_released',
      title: 'Liberado del equipo',
      body: 'Has sido liberado del equipo. Ya puedes aceptar nuevos pedidos.',
      orderId,
    });

    const remaining = order.teamPickerUids.filter((uid) => uid !== pickerUid);
    useOrdersStore.getState().setTeamPickers(orderId, remaining);
    firestoreUpdateTeamPickers(orderId, pickerRefs(remaining)).catch((e) =>
      console.error('[teams.store] releasePicker Firestore error', e),
    );
  },

  releaseTeam: (orderId) => {
    const order = useOrdersStore.getState().getOrderById(orderId);
    if (!order) return;

    order.teamPickerUids.forEach((uid) => {
      usePickersStore.getState().releaseFromTeam(uid);
      notify({
        userId: uid,
        type: 'team_released',
        title: 'Equipo disuelto',
        body: 'El equipo ha sido liberado. Ya puedes aceptar nuevos pedidos.',
        orderId,
      });
    });

    useOrdersStore.getState().setTeamPickers(orderId, []);
    firestoreUpdateTeamPickers(orderId, []).catch((e) =>
      console.error('[teams.store] releaseTeam Firestore error', e),
    );
  },
}));
