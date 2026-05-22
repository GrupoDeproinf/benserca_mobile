export type PickingStatus = 'pending' | 'in_progress' | 'completed';
export type PickingPriority = 'high' | 'normal';

export interface PickingItem {
  id: string;
  name: string;
  sku: string;
  bin: string;
  quantity: number;
}

export interface PickingOrder {
  id: string;
  orderNumber: string;
  client: string;
  zone: string;
  skusCount: number;
  totalUnits: number;
  status: PickingStatus;
  priority: PickingPriority;
  createdAt: Date;
  assignedTo?: string;
  items: PickingItem[];
  specialInstructions?: string;
}
