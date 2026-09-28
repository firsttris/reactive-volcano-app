import { type Accessor, createEffect, onCleanup } from "solid-js";

/**
 * Keeps the screen on while `active` is true. The browser drops the lock when
 * the page is hidden, so it is requested again when the page becomes visible.
 */
export const useWakeLock = (active: Accessor<boolean>) => {
  let sentinel: WakeLockSentinel | undefined;
  let wanted = false;

  const release = () => {
    const current = sentinel;
    sentinel = undefined;
    current?.release().catch(() => {});
  };

  const request = async () => {
    if (!wanted || sentinel || !("wakeLock" in navigator)) return;
    if (document.visibilityState !== "visible") return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      // The state may have changed while the request was pending
      if (!wanted) {
        lock.release().catch(() => {});
        return;
      }
      sentinel = lock;
      lock.addEventListener("release", () => {
        if (sentinel === lock) sentinel = undefined;
      });
    } catch (error) {
      // Denied e.g. in battery saver mode; the app works without it
      console.warn("Wake lock unavailable:", error);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") request();
  };

  createEffect(() => {
    wanted = active();
    if (wanted) request();
    else release();
  });

  document.addEventListener("visibilitychange", handleVisibilityChange);
  onCleanup(() => {
    wanted = false;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    release();
  });
};
