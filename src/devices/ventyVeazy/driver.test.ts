import PQueue from "p-queue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type ControlCharacteristic, createVentyVeazyDriver } from "./driver";
import { Command } from "./protocol";

class FakeCharacteristic extends EventTarget implements ControlCharacteristic {
  value?: DataView;
  written: number[][] = [];
  stopNotifications = vi.fn(async () => this);
  startNotifications = vi.fn(async () => this);

  async writeValue(value: BufferSource) {
    this.written.push([...new Uint8Array(value as ArrayBuffer)]);
  }

  /** Simulates a notification from the device */
  notify(bytes: number[]) {
    const buffer = new ArrayBuffer(20);
    new Uint8Array(buffer).set(bytes);
    this.value = new DataView(buffer);
    this.dispatchEvent(new Event("characteristicvaluechanged"));
  }

  commands() {
    return this.written.map((frame) => frame[0]);
  }
}

describe("Venty/Veazy driver", () => {
  let characteristic: FakeCharacteristic;
  let queue: PQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    characteristic = new FakeCharacteristic();
    queue = new PQueue({ concurrency: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends the init requests in the order of the legacy app", async () => {
    const driver = createVentyVeazyDriver(characteristic, "VENTY", queue);
    await driver.start();
    expect(characteristic.commands()).toEqual([
      Command.FIRMWARE,
      Command.ADVERTISING_INFO,
      Command.STATUS,
      Command.EXTENDED_DATA,
      Command.DEVICE_DATA,
      Command.BRIGHTNESS_VIBRATION,
    ]);
    await driver.dispose();
  });

  it("dispatches parsed notifications to all subscribers", () => {
    const driver = createVentyVeazyDriver(characteristic, "VENTY", queue);
    const first = vi.fn();
    const second = vi.fn();
    driver.subscribe(first);
    const unsubscribe = driver.subscribe(second);

    characteristic.notify([Command.ADVERTISING_INFO, 0x10]);
    unsubscribe();
    characteristic.notify([Command.ADVERTISING_INFO, 0x00]);

    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({
      command: Command.ADVERTISING_INFO,
      data: { findMyDeviceActive: true },
    });
  });

  it("ignores unknown notifications", () => {
    const driver = createVentyVeazyDriver(characteristic, "VENTY", queue);
    const listener = vi.fn();
    driver.subscribe(listener);
    characteristic.notify([0x42]);
    expect(listener).not.toHaveBeenCalled();
  });

  it("polls the status and every 30th time the extended data", async () => {
    const driver = createVentyVeazyDriver(characteristic, "VENTY", queue);
    await driver.start();
    characteristic.written = [];

    for (let i = 0; i < 30; i++) {
      await vi.advanceTimersByTimeAsync(500);
    }

    const commands = characteristic.commands();
    expect(commands).toHaveLength(30);
    expect(commands.slice(0, 29).every((c) => c === Command.STATUS)).toBe(true);
    expect(commands[29]).toBe(Command.EXTENDED_DATA);
    await driver.dispose();
  });

  it("skips polls while other writes are queued", async () => {
    const driver = createVentyVeazyDriver(characteristic, "VENTY", queue);
    await driver.start();
    characteristic.written = [];

    let release!: () => void;
    queue.add(() => new Promise<void>((resolve) => (release = resolve)));
    await vi.advanceTimersByTimeAsync(2000);
    expect(characteristic.written).toHaveLength(0);

    release();
    await vi.advanceTimersByTimeAsync(500);
    expect(characteristic.commands()).toEqual([Command.STATUS]);
    await driver.dispose();
  });

  it("stops polling and notifications on dispose", async () => {
    const driver = createVentyVeazyDriver(characteristic, "VENTY", queue);
    const listener = vi.fn();
    driver.subscribe(listener);
    await driver.start();
    await driver.dispose();
    characteristic.written = [];

    await vi.advanceTimersByTimeAsync(2000);
    await driver.send(new ArrayBuffer(20));
    characteristic.notify([Command.ADVERTISING_INFO, 0x10]);

    expect(characteristic.written).toHaveLength(0);
    expect(listener).not.toHaveBeenCalled();
    expect(characteristic.stopNotifications).toHaveBeenCalledOnce();
  });
});
