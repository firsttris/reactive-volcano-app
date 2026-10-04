import PQueue from "p-queue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ServiceUUIDs,
  VolcanoCharacteristicUUIDs as UUID,
} from "../../utils/uuids";
import { connectVolcano, type VolcanoValues } from "./driver";

type Write = { uuid: string; bytes: number[] };

class FakeCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications = vi.fn(async () => this);
  stopNotifications = vi.fn(async () => this);

  constructor(
    readonly uuid: string,
    public bytes: number[],
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

const DEVICE: Record<string, Record<string, number[]>> = {
  [ServiceUUIDs.DeviceState]: {
    [UUID.serialNumber]: ascii("12345678XX"),
    [UUID.firmwareVersion]: ascii("V01.02.03"),
    [UUID.firmwareBLEVersion]: ascii("BLE1.0"),
    [UUID.activity]: [0x20, 0x00], // heater on
    [UUID.display]: [0x00, 0x12], // fahrenheit + display off on cooling
    [UUID.vibration]: [0x00, 0x00],
    [UUID.history1]: [0xde, 0xad],
    [UUID.history2]: [0x01],
  },
  [ServiceUUIDs.DeviceControl]: {
    [UUID.targetTemperature]: [0x3a, 0x07],
    [UUID.currentTemperature]: [0xd0, 0x07],
    [UUID.currentAutoOffValue]: [0x2c, 0x01],
    [UUID.shutoffTime]: [0x58, 0x02],
    [UUID.brightness]: [70, 0],
    [UUID.hoursOfHeating]: [12, 0],
    [UUID.minutesOfHeating]: [34, 0],
    [UUID.heaterOn]: [],
    [UUID.heaterOff]: [],
    [UUID.pumpOn]: [],
    [UUID.pumpOff]: [],
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

const createServer = () => {
  const writes: Write[] = [];
  const characteristics = new Map<string, FakeCharacteristic>();
  for (const service of Object.values(DEVICE)) {
    for (const [uuid, value] of Object.entries(service)) {
      characteristics.set(uuid, new FakeCharacteristic(uuid, value, writes));
    }
  }
  const server = {
    getPrimaryService: async (serviceUuid: string) => ({
      getCharacteristic: async (uuid: string) => {
        if (!(uuid in DEVICE[serviceUuid])) {
          throw new Error(`${uuid} not in service ${serviceUuid}`);
        }
        return characteristics.get(uuid);
      },
    }),
  } as unknown as BluetoothRemoteGATTServer;
  return { server, writes, characteristics };
};

describe("Volcano driver", () => {
  let queue: PQueue;

  beforeEach(() => {
    queue = new PQueue({ concurrency: 1 });
  });

  const connect = async () => {
    const device = createServer();
    const driver = await connectVolcano(device.server, queue);
    const state: Partial<VolcanoValues> = {};
    driver.subscribe((update) => Object.assign(state, update));
    await driver.start();
    return { ...device, driver, state };
  };

  it("reads the device information while connecting", async () => {
    const { driver } = await connect();
    expect(driver.info).toEqual({
      serialNumber: "12345678",
      firmwareVersion: "V01.02.0",
      bleFirmwareVersion: "BLE1.0",
    });
  });

  it("reads all values", async () => {
    const { state } = await connect();
    expect(state).toEqual({
      targetTemp: 185,
      currentTemp: 200,
      register1: 0x20,
      register2: 0x1200,
      register3: 0,
      autoOffRemaining: 300,
      shutoffTime: 600,
      brightness: 70,
      heatingHours: 12,
      heatingMinutes: 34,
    });
  });

  it("enables notifications for the changing values", async () => {
    const { characteristics } = await connect();
    const notifying = [...characteristics.values()]
      .filter((c) => c.startNotifications.mock.calls.length > 0)
      .map((c) => c.uuid)
      .sort();
    expect(notifying).toEqual(
      [
        UUID.targetTemperature,
        UUID.currentTemperature,
        UUID.activity,
        UUID.display,
        UUID.currentAutoOffValue,
        UUID.hoursOfHeating,
        UUID.minutesOfHeating,
      ].sort()
    );
  });

  it("forwards notifications and skips invalid temperatures", async () => {
    const { state, characteristics } = await connect();
    const current = characteristicOf(characteristics, UUID.currentTemperature);
    current.notify([0x08, 0x07]);
    expect(state.currentTemp).toBe(180);
    current.notify([0xff, 0xff]);
    expect(state.currentTemp).toBe(180);
  });

  it("writes heater, pump and temperature commands", async () => {
    const { driver, writes } = await connect();
    await driver.setTargetTemperature(190);
    await driver.heaterOn();
    await driver.pumpOn();
    await driver.pumpOff();
    await driver.heaterOff();
    expect(writes).toEqual([
      { uuid: UUID.targetTemperature, bytes: [0x6c, 0x07, 0, 0] },
      { uuid: UUID.heaterOn, bytes: [0] },
      { uuid: UUID.pumpOn, bytes: [0] },
      { uuid: UUID.pumpOff, bytes: [0] },
      { uuid: UUID.heaterOff, bytes: [0] },
    ]);
  });

  it("disables vibration by setting the bit and reads it back", async () => {
    const { driver, writes, state, characteristics } = await connect();
    characteristicOf(characteristics, UUID.vibration).bytes = [0x00, 0x04];
    await driver.setVibration(false);
    expect(writes).toEqual([
      { uuid: UUID.vibration, bytes: [0x00, 0x04, 0x01, 0x00] },
    ]);
    expect(state.register3).toBe(0x0400);
  });

  it("switches to Fahrenheit by setting the register 2 bit", async () => {
    const { driver, writes } = await connect();
    await driver.setFahrenheit(true);
    await driver.setFahrenheit(false);
    expect(writes).toEqual([
      { uuid: UUID.display, bytes: [0x00, 0x02, 0x01, 0x00] },
      { uuid: UUID.display, bytes: [0x00, 0x02, 0x00, 0x00] },
    ]);
  });

  it("returns the history dumps for the analysis", async () => {
    const { driver } = await connect();
    expect(await driver.readDiagnostics()).toEqual({
      history1: "dead",
      history2: "01",
    });
  });

  it("stops notifications on dispose", async () => {
    const { driver, state, characteristics } = await connect();
    await driver.dispose();
    characteristicOf(characteristics, UUID.currentTemperature).notify([
      0x08, 0x07,
    ]);
    expect(state.currentTemp).toBe(200);
    expect(
      characteristicOf(characteristics, UUID.activity).stopNotifications
    ).toHaveBeenCalledOnce();
  });
});
