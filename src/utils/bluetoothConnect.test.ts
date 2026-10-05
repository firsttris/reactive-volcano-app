import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectGatt,
  supportsAdvertisementWatching,
  waitForAdvertisement,
  watchPresence,
} from "./bluetoothConnect";

type FakeDevice = EventTarget & {
  watchAdvertisements?: (options?: { signal?: AbortSignal }) => Promise<void>;
  gatt?: { connect: () => Promise<unknown>; disconnect: () => void };
};

const fakeDevice = (overrides: Partial<FakeDevice> = {}) =>
  Object.assign(new EventTarget(), overrides) as unknown as BluetoothDevice;

describe("waitForAdvertisement", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is unsupported without watchAdvertisements", async () => {
    expect(await waitForAdvertisement(fakeDevice(), 1000)).toBe("unsupported");
  });

  it("is unsupported when watching is refused", async () => {
    const device = fakeDevice({
      watchAdvertisements: () => Promise.reject(new Error("flag off")),
    });
    expect(await waitForAdvertisement(device, 1000)).toBe("unsupported");
  });

  it("resolves when the device advertises and stops watching", async () => {
    let watchSignal: AbortSignal | undefined;
    const device = fakeDevice({
      watchAdvertisements: async (options) => {
        watchSignal = options?.signal;
      },
    });
    const result = waitForAdvertisement(device, 10_000);
    device.dispatchEvent(new Event("advertisementreceived"));
    expect(await result).toBe("seen");
    expect(watchSignal?.aborted).toBe(true);
  });

  it("times out when the device stays silent", async () => {
    const device = fakeDevice({ watchAdvertisements: async () => {} });
    const result = waitForAdvertisement(device, 10_000);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await result).toBe("timeout");
  });

  it("ends early when cancelled", async () => {
    const device = fakeDevice({ watchAdvertisements: async () => {} });
    const cancel = new AbortController();
    const result = waitForAdvertisement(device, 10_000, cancel.signal);
    cancel.abort();
    expect(await result).toBe("timeout");
  });
});

describe("connectGatt", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the server", async () => {
    const server = {};
    const device = fakeDevice({
      gatt: { connect: async () => server, disconnect: () => {} },
    });
    expect(await connectGatt(device, 1000)).toBe(server);
  });

  it("gives up on a hanging attempt and disconnects", async () => {
    const disconnect = vi.fn();
    const device = fakeDevice({
      gatt: { connect: () => new Promise(() => {}), disconnect },
    });
    const result = connectGatt(device, 1000);
    const assertion = expect(result).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(disconnect).toHaveBeenCalled();
  });
});

describe("supportsAdvertisementWatching", () => {
  const watching = fakeDevice({ watchAdvertisements: async () => {} });
  const linux = "Mozilla/5.0 (X11; Linux x86_64) Chrome/140.0";
  const chromeOS = "Mozilla/5.0 (X11; CrOS x86_64 16000.0.0) Chrome/140.0";
  const android = "Mozilla/5.0 (Linux; Android 15; Pixel 7) Chrome/140.0";
  const windows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0";

  it("is off on Linux and ChromeOS, where BlueZ cannot watch", () => {
    expect(supportsAdvertisementWatching(watching, linux)).toBe(false);
    expect(supportsAdvertisementWatching(watching, chromeOS)).toBe(false);
  });

  it("is on for Android and Windows when the API exists", () => {
    expect(supportsAdvertisementWatching(watching, android)).toBe(true);
    expect(supportsAdvertisementWatching(watching, windows)).toBe(true);
    expect(supportsAdvertisementWatching(fakeDevice(), windows)).toBe(false);
  });
});

describe("watchPresence", () => {
  it("reports advertisements until stopped", async () => {
    let signal: AbortSignal | undefined;
    const device = fakeDevice({
      watchAdvertisements: async (options) => {
        signal = options?.signal;
      },
    });
    const onSeen = vi.fn();
    const stop = watchPresence(device, onSeen);
    device.dispatchEvent(new Event("advertisementreceived"));
    expect(onSeen).toHaveBeenCalledTimes(1);
    stop();
    device.dispatchEvent(new Event("advertisementreceived"));
    expect(onSeen).toHaveBeenCalledTimes(1);
    expect(signal?.aborted).toBe(true);
  });
});
