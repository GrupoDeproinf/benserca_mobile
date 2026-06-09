export interface QueueTimeInfo {
  label: string;
  color: string;
}

export function formatTimeInQueue(iso: string | null): QueueTimeInfo {
  if (!iso) {
    return { label: '—', color: '#6B7280' };
  }

  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  let label: string;
  if (mins < 1) label = 'Ahora';
  else if (mins < 60) label = `Hace ${mins} min`;
  else label = `Hace ${Math.floor(mins / 60)}h`;

  let color = '#111827';
  if (mins >= 20) color = '#EF4444';
  else if (mins >= 10) color = '#F59E0B';

  return { label, color };
}
