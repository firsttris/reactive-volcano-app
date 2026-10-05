/**
 * Helpers for connecting to a device the browser already knows
 * (navigator.bluetooth.getDevices, auto-reconnect). Such a device can only be
 * connected while the system has recently seen it advertise. Where the
 * browser can watch advertisements, connect once one arrives (like Chrome's
 * "watch advertisements & connect" sample). Chromium on Linux and ChromeOS
 * cannot (BlueZ), so there a direct attempt is all an app can do.
 */

/** Chromium on Linux and ChromeOS lacks watchAdvertisements() (BlueZ) */
export const supportsAdvertisementWatching = (
  device: BluetoothDevice,
  userAgent = navigator.userAgent
) =>
  typeof device.watchAdvertisements === "function" &&
  !(/Linux|CrOS/.test(userAgent) && !/Android/.test(userAgent));

/** Whether the last click still allows opening the device chooser */
export const hasUserActivation = () =>
  navigator.userActivation?.isActive ?? false;

/** Calls `onSeen` for every advertisement until the returned stop is called */
export const watchPresence = (device: BluetoothDevice, onSeen: () => void) => {
  const watching = new AbortController();
  device.addEventListener("advertisementreceived", onSeen);
  device
    .watchAdvertisements({ signal: watching.signal })
    .catch((error) => console.warn("Watching advertisements failed:", error));
  return () => {
    watching.abort();
    device.removeEventListener("advertisementreceived", onSeen);
  };
};

export type AdvertisementResult = "seen" | "timeout" | "unsupported";

/** Resolves as soon as the device advertises, after `timeoutMs` at the latest */
export const waitForAdvertisement = async (
  device: BluetoothDevice,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<AdvertisementResult> => {
  if (typeof device.watchAdvertisements !== "function") return "unsupported";
  if (signal?.aborted) return "timeout";

  const watching = new AbortController();
  let onAdvertisement = () => {};
  try {
    return await new Promise<AdvertisementResult>((resolve) => {
      const timer = setTimeout(() => resolve("timeout"), timeoutMs);
      const onAbort = () => finish("timeout");
      const finish = (result: AdvertisementResult) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        resolve(result);
      };
      onAdvertisement = () => finish("seen");
      device.addEventListener("advertisementreceived", onAdvertisement);
      signal?.addEventListener("abort", onAbort, { once: true });
      // Rejects where the feature is behind a flag (e.g. Chromium on Linux)
      device
        .watchAdvertisements({ signal: watching.signal })
        .catch(() => finish("unsupported"));
    });
  } finally {
    device.removeEventListener("advertisementreceived", onAdvertisement);
    watching.abort();
  }
};

/** gatt.connect() with a time limit; BlueZ can leave an attempt hanging */
export const connectGatt = async (
  device: BluetoothDevice,
  timeoutMs: number
): Promise<BluetoothRemoteGATTServer> => {
  const gatt = device.gatt;
  if (!gatt) throw new Error("Device does not support GATT");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      gatt.connect(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          // Ends the pending attempt so a retry starts clean
          gatt.disconnect();
          reject(new DOMException("Connection timed out", "TimeoutError"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

export const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal?.addEventListener("abort", finish, { once: true });
  });
