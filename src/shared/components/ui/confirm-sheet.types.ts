import type { LucideIcon } from 'lucide-react-native';
import type { ConfirmSheetTone } from './confirm-sheet';

export interface ConfirmSheetPayload {
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  mode?: 'confirm' | 'info';
  tone?: ConfirmSheetTone;
  icon?: LucideIcon;
}
