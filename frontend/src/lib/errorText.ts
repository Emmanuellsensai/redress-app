/**
 * Extracts a readable message from Midnight SDK errors.
 * The SDK wraps errors in Effect-TS FiberFailure objects. Walking .cause
 * manually does not surface the message; util.inspect is the reliable path
 * on Node, but in the browser we fall back to recursive cause unwrapping.
 */
export const errorText = (err: unknown): string => {
  if (err instanceof Error) {
    let current: unknown = err;
    const seen = new WeakSet<object>();
    while (current && typeof current === 'object') {
      if (seen.has(current as object)) break;
      seen.add(current as object);
      const asAny = current as Record<string, unknown>;
      if (typeof asAny.message === 'string' && asAny.message.length > 0) {
        if (
          asAny.message !== 'An error has occurred' &&
          !asAny.message.startsWith('FiberFailure')
        ) {
          return asAny.message;
        }
      }
      current = asAny.cause ?? asAny.error ?? asAny._tag;
    }
    return err.message || String(err);
  }
  return String(err);
};
