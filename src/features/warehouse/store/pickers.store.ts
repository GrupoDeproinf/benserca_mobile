import { create } from 'zustand';
import { MOCK_PICKERS } from '../data/mock-pickers';
import type { PickerEstado, PickerStatus } from '../types';

function clonePickers(): PickerEstado[] {
  return structuredClone(MOCK_PICKERS);
}

interface PickersState {
  pickers: PickerEstado[];
  getPicker: (uid: string) => PickerEstado | undefined;
  getPickersByStatus: (status: PickerStatus) => PickerEstado[];
  getAvailablePickers: () => PickerEstado[];
  // Mutaciones
  setPickerStatus: (uid: string, status: PickerStatus, activeOrderId?: string | null) => void;
  incrementBultos: (uid: string) => void;
  assignToTeam: (uid: string, teamId: string, orderId: string) => void;
  releaseFromTeam: (uid: string) => void;
  resetPickers: () => void;
}

export const usePickersStore = create<PickersState>((set, get) => ({
  pickers: clonePickers(),

  getPicker: (uid) => get().pickers.find((p) => p.uid === uid),
  getPickersByStatus: (status) => get().pickers.filter((p) => p.status === status),
  getAvailablePickers: () => get().pickers.filter((p) => p.status === 'disponible'),

  setPickerStatus: (uid, status, activeOrderId) =>
    set((state) => ({
      pickers: state.pickers.map((p) =>
        p.uid === uid
          ? {
              ...p,
              status,
              activeOrderId: activeOrderId !== undefined ? activeOrderId : p.activeOrderId,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    })),

  incrementBultos: (uid) =>
    set((state) => ({
      pickers: state.pickers.map((p) =>
        p.uid === uid ? { ...p, bultosToday: p.bultosToday + 1 } : p,
      ),
    })),

  assignToTeam: (uid, teamId, orderId) =>
    set((state) => ({
      pickers: state.pickers.map((p) =>
        p.uid === uid
          ? {
              ...p,
              status: 'reservado' as PickerStatus,
              teamId,
              activeOrderId: orderId,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    })),

  releaseFromTeam: (uid) =>
    set((state) => ({
      pickers: state.pickers.map((p) =>
        p.uid === uid
          ? {
              ...p,
              status: 'disponible' as PickerStatus,
              teamId: null,
              activeOrderId: null,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    })),

  resetPickers: () => set({ pickers: clonePickers() }),
}));
