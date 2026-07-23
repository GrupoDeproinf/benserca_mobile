/**
 * Códigos de Firebase que significan "no se pudo hablar con el servidor", en
 * contraste con un rechazo real (permisos, perfil inválido). La diferencia
 * importa: ante una caída de red hay que conservar la sesión, no cerrarla.
 */
const OFFLINE_CODES = new Set([
  'firestore/unavailable',
  'firestore/deadline-exceeded',
  'firestore/internal',
  'unavailable',
  'deadline-exceeded',
  'auth/network-request-failed',
  'auth/timeout',
]);

/** Mensaje típico del SDK cuando no hay red ni caché: "...client is offline". */
const OFFLINE_MESSAGE = /offline|network|unavailable|timed? ?out/i;

export function isOfflineError(error: unknown): boolean {
  if (!error) return false;

  const code = (error as { code?: unknown })?.code;
  if (typeof code === 'string' && OFFLINE_CODES.has(code.toLowerCase())) return true;

  const message = (error as { message?: unknown })?.message;
  return typeof message === 'string' && OFFLINE_MESSAGE.test(message);
}
