import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectGatt, waitForAdvertisement } from "./bluetoothConnect";

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
