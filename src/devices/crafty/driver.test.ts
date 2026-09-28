import PQueue from "p-queue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CraftyServiceUUIDs,
  CraftyCharacteristicUUIDs as UUID,
} from "../../utils/uuids";
import { type CraftyUpdate, connectCrafty } from "./driver";

type Write = { uuid: string; bytes: number[] };

class FakeCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications = vi.fn(async () => this);
  stopNotifications = vi.fn(async () => this);

  constructor(
    readonly uuid: string,
    private bytes: number[],
    private writes: Write[]
  ) {
    super();
  }

  async readValue() {
    return new DataView(new Uint8Array(this.bytes).buffer);
  }

  async writeValue(value: BufferSource) {
    this.writes.push({
      uuid: this.uuid,
      bytes: [...new Uint8Array(value as ArrayBuffer)],
    });
  }

  notify(bytes: number[]) {
    this.value = new DataView(new Uint8Array(bytes).buffer);
    this.dispatchEvent(new Event("characteristicvaluechanged"));
  }
}

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

// Which service each characteristic lives in, with an initial value
const DEVICE: Record<string, Record<string, number[]>> = {
  [CraftyServiceUUIDs.Crafty1]: {
    [UUID.writeTemp]: [0x3a, 0x07], // 185 °C
    [UUID.currTemperatureChanged]: [0xd0, 0x07], // 200 °C
    [UUID.writeBoostTemp]: [100, 0], // 10 °C
    [UUID.powerChanged]: [80, 0],
    [UUID.ledBrightness]: [70, 0],
    [UUID.autoOffCountdown]: [120, 0],
    [UUID.autoOffCurrentValue]: [90, 0],
    [UUID.heaterOn]: [],
    [UUID.heaterOff]: [],
  },
  [CraftyServiceUUIDs.Crafty2]: {
    [UUID.firmwareVersion]: ascii("V03.01"),
    [UUID.serialNumber]: ascii("CY123456\0\0"),
    [UUID.firmwareBLEVersion]: [1, 2, 3],
  },
  [CraftyServiceUUIDs.Crafty3]: {
    [UUID.useHoursCharacteristic]: [12, 0],
    [UUID.useMinutesCharacteristic]: [34, 0],
    [UUID.handleProjectRegister]: [0x10, 0],
    [UUID.statusRegister2]: [0x04, 0],
    [UUID.sicherheitscode]: [],
    [UUID.systemStatusCharacteristic]: [1, 0],
    [UUID.akkuStatusCharacteristic]: [2, 0],
    [UUID.akkuStatusCharacteristic2]: [3, 0],
    [UUID.factoryResetCharacteristic]: [],
  },
};

const characteristicOf = (
  characteristics: Map<string, FakeCharacteristic>,
  uuid: string
) => {
  const characteristic = characteristics.get(uuid);
  if (!characteristic) throw new Error(`Missing characteristic ${uuid}`);
  return characteristic;
};

const createServer = (firmware = "V03.01") => {
  const writes: Write[] = [];
  const requested: string[] = [];
  const characteristics = new Map<string, FakeCharacteristic>();
  for (const service of Object.values(DEVICE)) {
    for (const [uuid, value] of Object.entries(service)) {
      const initial = uuid === UUID.firmwareVersion ? ascii(firmware) : value;
      characteristics.set(uuid, new FakeCharacteristic(uuid, initial, writes));
    }
  }
  const server = {
    getPrimaryService: async (serviceUuid: string) => ({
      getCharacteristic: async (uuid: string) => {
        requested.push(uuid);
        if (!(uuid in DEVICE[serviceUuid])) {
          throw new Error(`${uuid} not in service ${serviceUuid}`);
        }
        return characteristics.get(uuid);
      },
    }),
  } as unknown as BluetoothRemoteGATTServer;
  return { server, writes, requested, characteristics };
};

describe("Crafty driver", () => {
  let queue: PQueue;

  beforeEach(() => {
    queue = new PQueue({ concurrency: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const collect = async (firmware?: string) => {
    const device = createServer(firmware);
    const driver = await connectCrafty(device.server, queue);
    const state: CraftyUpdate = {};
    driver.subscribe((update) => Object.assign(state, update));
    await driver.start();
    return { ...device, driver, state };
  };

  it("reads all values of a Crafty+", async () => {
    const { driver, state } = await collect();
    expect(driver.firmwareVersion).toBe("V03.01");
    expect(driver.isOldFirmware).toBe(false);
    expect(state).toEqual({
      targetTemp: 185,
      currentTemp: 200,
      boostTemp: 10,
      batteryLevel: 80,
      ledBrightness: 70,
      useHours: 12,
      projectRegister: 0x10,
      statusRegister2: 0x04,
      bleFirmwareVersion: "V1.2.3",
      useMinutes: 34,
      autoOffCountdown: 120,
      autoOffRemaining: 90,
      systemStatus: 1,
      akkuStatus: 2,
      akkuStatus2: 3,
    });
  });

  it("reads the serial number and detects a Crafty+", async () => {
    const { driver } = await collect();
    expect(driver.serialNumber).toBe("CY123456");
    expect(driver.isCraftyPlus).toBe(true);
  });

  it("does not treat Crafty firmware 2.x as Crafty+", async () => {
    const { driver } = await collect("V02.51");
    expect(driver.isOldFirmware).toBe(false);
    expect(driver.isCraftyPlus).toBe(false);
  });

  it("writes status register 2 and reads it back", async () => {
    const { driver, writes, characteristics } = await collect();
    const register = characteristicOf(characteristics, UUID.statusRegister2);
    const read = vi.spyOn(register, "readValue");
    await driver.setStatusRegister2(0x1005);
    expect(writes).toEqual([
      { uuid: UUID.statusRegister2, bytes: [0x05, 0x10] },
    ]);
    expect(read).toHaveBeenCalledOnce();
  });

  it("re-reads the registers for the analysis", async () => {
    const { driver, characteristics } = await collect();
    const reads = [
      UUID.akkuStatusCharacteristic,
      UUID.akkuStatusCharacteristic2,
      UUID.systemStatusCharacteristic,
    ].map((uuid) =>
      vi.spyOn(characteristicOf(characteristics, uuid), "readValue")
    );
    await driver.readDiagnostics();
    for (const read of reads) expect(read).toHaveBeenCalledOnce();
  });

  it("enables notifications like the legacy app", async () => {
    const { characteristics } = await collect();
    const notifying = [...characteristics.values()]
      .filter((c) => c.startNotifications.mock.calls.length > 0)
      .map((c) => c.uuid)
      .sort();
    expect(notifying).toEqual(
      [
        UUID.currTemperatureChanged,
        UUID.powerChanged,
        UUID.statusRegister2,
        UUID.handleProjectRegister,
        UUID.autoOffCurrentValue,
      ].sort()
    );
  });

  it("only uses basic characteristics on old firmware", async () => {
    const { driver, state, requested, characteristics } =
      await collect("V02.40");
    expect(driver.isOldFirmware).toBe(true);
    expect(requested).not.toContain(UUID.heaterOn);
    expect(requested).not.toContain(UUID.sicherheitscode);
    expect(state.useMinutes).toBeUndefined();
    expect(
      characteristics.get(UUID.handleProjectRegister)?.startNotifications
    ).not.toHaveBeenCalled();
    await expect(driver.heaterOn()).rejects.toThrow("not available");
  });

  it("forwards notifications and stops them on dispose", async () => {
    const { driver, state, characteristics } = await collect();
    const current = characteristicOf(
      characteristics,
      UUID.currTemperatureChanged
    );

    current.notify([0x08, 0x07]); // 180 °C
    expect(state.currentTemp).toBe(180);

    await driver.dispose();
    current.notify([0x00, 0x07]);
    expect(state.currentTemp).toBe(180);
    expect(current.stopNotifications).toHaveBeenCalledOnce();
  });

  it("writes the security code directly before the auto-off time", async () => {
    const { driver, writes } = await collect();
    await driver.setAutoOffCountdown(180);
    expect(writes).toEqual([
      { uuid: UUID.sicherheitscode, bytes: [0x2f, 0x03] }, // 815
      { uuid: UUID.autoOffCountdown, bytes: [180, 0] },
    ]);
  });

  it("writes the security code before a factory reset and re-reads values", async () => {
    const { driver, writes, state, characteristics } = await collect();
    vi.useFakeTimers();
    vi.spyOn(
      characteristicOf(characteristics, UUID.writeTemp),
      "readValue"
    ).mockResolvedValue(new DataView(new Uint8Array([0x08, 0x07]).buffer));

    const reset = driver.factoryReset();
    await vi.advanceTimersByTimeAsync(1000);
    await reset;

    expect(writes).toEqual([
      { uuid: UUID.sicherheitscode, bytes: [0xe8, 0x03] }, // 1000
      { uuid: UUID.factoryResetCharacteristic, bytes: [0] },
    ]);
    expect(state.targetTemp).toBe(180);
  });

  it("writes heater commands as 2-byte zero values", async () => {
    const { driver, writes } = await collect();
    await driver.heaterOn();
    await driver.heaterOff();
    expect(writes).toEqual([
      { uuid: UUID.heaterOn, bytes: [0, 0] },
      { uuid: UUID.heaterOff, bytes: [0, 0] },
    ]);
  });
});
