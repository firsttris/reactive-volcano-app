/**
 * Delays writes until a value stops changing (e.g. repeated +/- clicks) and
 * reports which values are "held": while a write is pending, and for a short
 * time after it, polled device values must not overwrite the local value.
 */
export interface DebouncedWriter<K extends string> {
  schedule(key: K, write: () => Promise<void>): void;
  isHeld(key: K): boolean;
  dispose(): void;
}

export const createDebouncedWriter = <K extends string>(options: {
  debounceMs: number;
  holdAfterWriteMs: number;
  now?: () => number;
}): DebouncedWriter<K> => {
  const now = options.now ?? Date.now;
  const timers = new Map<K, ReturnType<typeof setTimeout>>();
  const holdUntil = new Map<K, number>();

  return {
    schedule(key, write) {
      clearTimeout(timers.get(key));
      holdUntil.set(key, Number.POSITIVE_INFINITY);
      timers.set(
        key,
        setTimeout(async () => {
          timers.delete(key);
          try {
            await write();
          } catch (error) {
            console.error(`Failed to write ${key}:`, error);
          } finally {
            // A newer value may have been scheduled in the meantime
            if (!timers.has(key)) {
              holdUntil.set(key, now() + options.holdAfterWriteMs);
            }
          }
        }, options.debounceMs)
      );
    },
    isHeld(key) {
      return now() < (holdUntil.get(key) ?? 0);
    },
    dispose() {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      holdUntil.clear();
    },
  };
};
