import PQueue from "p-queue";

/**
 * Global Bluetooth queue to ensure all Bluetooth operations are serialized.
 * This prevents race conditions and ensures only one Bluetooth operation
 * happens at a time across the entire application.
 */
export const bluetoothQueue = new PQueue({ concurrency: 1 });
