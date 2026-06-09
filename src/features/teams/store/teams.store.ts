import { create } from 'zustand';
import { notify } from '@/features/notifications/store/notifications.store';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Team } from '@/features/picking/types';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';

let teamCounter = 0;
function nextTeamId(): string {
  return `team-${Date.now()}-${++teamCounter}`;
}

interface TeamsState {
  teams: Team[];
  // Selectores
  getTeam: (teamId: string) => Team | undefined;
  getTeamByOrder: (orderId: string) => Team | undefined;
  // Mutaciones
  createTeam: (orderId: string, leadId: string, pickerIds: string[]) => string;
  releasePicker: (teamId: string, pickerId: string) => void;
  releaseTeam: (teamId: string) => void;
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  teams: [],

  getTeam: (teamId) => get().teams.find((t) => t.id === teamId),
  getTeamByOrder: (orderId) => get().teams.find((t) => t.orderId === orderId),

  createTeam: (orderId, leadId, pickerIds) => {
    const id = nextTeamId();
    const newTeam: Team = {
      id,
      orderId,
      leadId,
      pickerIds: [...pickerIds],
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Reservar cada picker
    pickerIds.forEach((uid) => {
      usePickersStore.getState().assignToTeam(uid, id, orderId);
    });

    // Actualizar el pedido
    useOrdersStore.getState().assignTeam(orderId, id);

    set((s) => ({ teams: [...s.teams, newTeam] }));
    return id;
  },

  releasePicker: (teamId, pickerId) => {
    const team = get().getTeam(teamId);
    if (!team) return;

    usePickersStore.getState().releaseFromTeam(pickerId);

    notify({
      userId: pickerId,
      type: 'team_released',
      title: 'Liberado del equipo',
      body: 'Has sido liberado del equipo. Ya puedes aceptar nuevos pedidos.',
      orderId: team.orderId,
    });

    const remaining = team.pickerIds.filter((uid) => uid !== pickerId);

    if (remaining.length === 0) {
      set((s) => ({
        teams: s.teams.map((t) =>
          t.id !== teamId ? t : { ...t, pickerIds: [], status: 'released' },
        ),
      }));
      useOrdersStore.getState().clearTeam(team.orderId);
      return;
    }

    set((s) => ({
      teams: s.teams.map((t) =>
        t.id !== teamId ? t : { ...t, pickerIds: remaining },
      ),
    }));
  },

  releaseTeam: (teamId) => {
    const team = get().getTeam(teamId);
    if (!team) return;

    team.pickerIds.forEach((uid) => {
      usePickersStore.getState().releaseFromTeam(uid);
      notify({
        userId: uid,
        type: 'team_released',
        title: 'Equipo disuelto',
        body: 'El equipo ha sido liberado. Ya puedes aceptar nuevos pedidos.',
        orderId: team.orderId,
      });
    });

    set((s) => ({
      teams: s.teams.map((t) =>
        t.id !== teamId ? t : { ...t, pickerIds: [], status: 'released' },
      ),
    }));

    useOrdersStore.getState().clearTeam(team.orderId);
  },
}));
