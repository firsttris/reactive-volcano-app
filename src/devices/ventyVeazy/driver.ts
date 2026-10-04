import type PQueue from "p-queue";
import {
  VentyVeazyCharacteristicUUIDs,
  VentyVeazyServiceUUIDs,
} from "../../utils/uuids";
import {
  getRequiredCharacteristic,
  getService,
} from "../shared/characteristicDevice";
import {
  Command,
  encodeReadBrightnessVibration,
  encodeRequest,
  parseResponse,
  type Response,
  type VentyVeazyModel,
} from "./protocol";

const POLL_INTERVAL_MS = 500;
// Every ~30 status polls also request the usage times
const EXTENDED_DATA_EVERY_N_POLLS = 30;

// Sent once after connecting
const INIT_REQUESTS: ArrayBuffer[] = [
  encodeRequest(Command.FIRMWARE),
  encodeRequest(Command.ADVERTISING_INFO),
  encodeRequest(Command.STATUS),
  encodeRequest(Command.EXTENDED_DATA),
  encodeRequest(Command.DEVICE_DATA),
  encodeReadBrightnessVibration(),
];

export type ResponseListener = (response: Response) => void;

/**
 * The part of BluetoothRemoteGATTCharacteristic the driver needs; kept
 * minimal so tests can pass a fake.
 */
export interface ControlCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<unknown>;
  stopNotifications(): Promise<unknown>;
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

export interface VentyVeazyDriver {
  readonly model: VentyVeazyModel;
  /** Registers a listener for parsed notifications; returns unsubscribe */
  subscribe(listener: ResponseListener): () => void;
  /** Sends the init requests and starts polling the status */
  start(): Promise<void>;
  /** Writes a command frame (serialized through the Bluetooth queue) */
  send(frame: ArrayBuffer): Promise<void>;
  /** Stops polling and notifications */
  dispose(): Promise<void>;
}

export const createVentyVeazyDriver = (
  characteristic: ControlCharacteristic,
  model: VentyVeazyModel,
  queue: PQueue
): VentyVeazyDriver => {
  const listeners = new Set<ResponseListener>();
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let pollCount = 0;
  let disposed = false;

  const handleNotification = (event: Event) => {
    const value = (event.target as { value?: DataView } | null)?.value;
    if (!value) return;
    const response = parseResponse(value, model);
    if (!response) return;
    for (const listener of listeners) listener(response);
  };
  characteristic.addEventListener(
    "characteristicvaluechanged",
    handleNotification
  );

  const send = async (frame: ArrayBuffer) => {
    if (disposed) return;
    await queue.add(() => characteristic.writeValue(frame));
  };

  const poll = () => {
    // Skip while other commands are waiting so polls never pile up
    if (queue.size > 0 || queue.pending > 0) return;
    pollCount++;
    const request =
      pollCount % EXTENDED_DATA_EVERY_N_POLLS === 0
        ? Command.EXTENDED_DATA
        : Command.STATUS;
    send(encodeRequest(request)).catch((error) =>
      console.warn("Venty/Veazy poll failed:", error)
    );
  };

  const start = async () => {
    for (const request of INIT_REQUESTS) {
      await send(request);
    }
    if (!disposed && pollTimer === undefined) {
      pollTimer = setInterval(poll, POLL_INTERVAL_MS);
    }
  };

  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    clearInterval(pollTimer);
    pollTimer = undefined;
    listeners.clear();
    characteristic.removeEventListener(
      "characteristicvaluechanged",
      handleNotification
    );
    try {
      await characteristic.stopNotifications();
    } catch (error) {
      // Fails when the device is already disconnected
      console.warn("Venty/Veazy stopNotifications failed:", error);
    }
  };

  return {
    model,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    send,
    dispose,
  };
};

/** Gets the control characteristic, enables notifications, returns a driver */
export const connectVentyVeazy = async (
  server: BluetoothRemoteGATTServer,
  model: VentyVeazyModel,
  queue: PQueue
) => {
  const service = await getService(
    server,
    VentyVeazyServiceUUIDs.Primary,
    queue
  );
  const characteristic = await getRequiredCharacteristic(
    service,
    VentyVeazyCharacteristicUUIDs.control,
    queue
  );
  await queue.add(() => characteristic.startNotifications());
  return createVentyVeazyDriver(characteristic, model, queue);
};
