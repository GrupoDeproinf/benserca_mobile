/** Fecha de asignación legible (app en español). */
export function formatAssignedDate(iso: string | null): string {
  if (!iso) return '—';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
