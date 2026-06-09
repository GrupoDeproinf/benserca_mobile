import { create } from 'zustand';
import type { ConfirmSheetPayload } from './confirm-sheet.types';

interface ConfirmSheetState {
  activeId: string | null;
  payload: ConfirmSheetPayload | null;
  show: (id: string, payload: ConfirmSheetPayload) => void;
  hide: (id: string) => void;
}

export const useConfirmSheetStore = create<ConfirmSheetState>((set, get) => ({
  activeId: null,
  payload: null,
  show: (id, payload) => set({ activeId: id, payload }),
  hide: (id) => {
    if (get().activeId === id) {
      set({ activeId: null, payload: null });
    }
  },
}));

let instanceCounter = 0;
export function nextConfirmSheetId(): string {
  return `confirm-sheet-${++instanceCounter}`;
}
