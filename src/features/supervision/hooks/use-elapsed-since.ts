import { useEffect, useState } from 'react';

/** Devuelve el tiempo transcurrido desde `isoDate` en formato legible, se actualiza cada minuto. */
export function useElapsedSince(isoDate: string): string {
  const [elapsed, setElapsed] = useState(() => calc(isoDate));

  useEffect(() => {
    setElapsed(calc(isoDate));
    const interval = setInterval(() => setElapsed(calc(isoDate)), 60_000);
    return () => clearInterval(interval);
  }, [isoDate]);

  return elapsed;
}

function calc(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const totalMins = Math.floor(diffMs / 60_000);
  if (totalMins < 1) return '< 1 min';
  if (totalMins < 60) return `${totalMins} min`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
