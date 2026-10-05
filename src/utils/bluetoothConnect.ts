/**
 * Helpers for connecting to a device the browser already knows
 * (navigator.bluetooth.getDevices, auto-reconnect). Such a device can only be
 * connected while the system has recently seen it advertise, so wait for an
 * advertisement first where the browser supports watching for one.
 */

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
      const finish = (result: AdvertisementResult) => {
        clearTimeout(timer);
        resolve(result);
      };
      onAdvertisement = () => finish("seen");
      device.addEventListener("advertisementreceived", onAdvertisement);
      signal?.addEventListener("abort", () => finish("timeout"), {
        once: true,
      });
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
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
