import { useTranslation } from 'react-i18next';
import { ThemedStatusBadge } from '@/shared/components/ui/badge';
import { orderStatusColor } from '@/theme/status-theme';
import { useResolvedColorScheme } from '@/theme';
import type { OrderStatus } from '../types';
import { ORDER_STATUS_I18N_KEY } from '../utils/order-status';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const { t } = useTranslation();
  const scheme = useResolvedColorScheme();
  const colors = orderStatusColor(status, scheme);
  const label = t(ORDER_STATUS_I18N_KEY[status]);
  return <ThemedStatusBadge label={label} colors={colors} className={className} />;
}
