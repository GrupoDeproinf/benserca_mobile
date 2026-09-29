type FatalErrorListener = (error: Error) => void;

let listener: FatalErrorListener | null = null;
let installed = false;

/**
 * Handler global de errores de JS de React Native. Vive fuera de React porque
 * los errores que más cuestan diagnosticar aquí no son de render: pasan en un
 * callback del store, en una escritura a Firestore o en un `setTimeout`, y a
 * esos un Error Boundary no llega. Sin handler, en una build de release el
 * error mata el proceso y el usuario solo ve "Benserca continúa fallando".
 *
 * Ojo: esto solo alcanza a errores de JavaScript. Un crash nativo (OOM del
 * sistema, una excepción en un módulo nativo) mata el proceso sin pasar por
 * aquí y no hay forma de atraparlo desde JS.
 */

/** Suscribe la pantalla de error. Devuelve la función para darse de baja. */
export function onFatalError(fn: FatalErrorListener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

export function installGlobalErrorHandler(): void {
  if (installed) return;

  // `ErrorUtils` lo instala React Native en el global; no está en los tipos.
  // biome-ignore lint/suspicious/noExplicitAny: global sin tipar de React Native
  const errorUtils = (globalThis as any).ErrorUtils;
  if (typeof errorUtils?.setGlobalHandler !== 'function') return;

  const previous: ((error: unknown, isFatal?: boolean) => void) | undefined =
    errorUtils.getGlobalHandler?.();

  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const normalized = error instanceof Error ? error : new Error(String(error));
    console.error(`[fatal-error] ${isFatal ? 'fatal' : 'no fatal'}:`, normalized);

    // En desarrollo se deja pasar al handler por defecto para no perder la
    // pantalla roja, que tiene el stack completo y el mapeo de fuentes.
    if (isFatal && !__DEV__ && listener) {
      listener(normalized);
      return;
    }

    previous?.(error, isFatal);
  });

  installed = true;
}
