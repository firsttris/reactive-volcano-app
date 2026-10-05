import type { Page } from "@playwright/test";

export type MockEventHandler = (event: Event) => void;

export interface MockBluetoothDevice {
  id: string;
  name: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<MockBluetoothRemoteGATTServer>;
    disconnect: () => void;
  };
  addEventListener: (event: string, handler: MockEventHandler) => void;
  removeEventListener: (event: string, handler: MockEventHandler) => void;
}

export interface MockBluetoothRemoteGATTServer {
  connected: boolean;
  device: MockBluetoothDevice;
  getPrimaryService: (uuid: string) => Promise<MockBluetoothRemoteGATTService>;
}

export interface MockBluetoothRemoteGATTService {
  uuid: string;
  device: MockBluetoothDevice; // Service muss Device-Referenz haben
  getCharacteristic: (
    uuid: string
  ) => Promise<MockBluetoothRemoteGATTCharacteristic>;
  getCharacteristics: () => Promise<MockBluetoothRemoteGATTCharacteristic[]>;
}

export interface MockBluetoothRemoteGATTCharacteristic {
  uuid: string;
  value?: DataView;
  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
  };
  readValue: () => Promise<DataView>;
  writeValue: (value: BufferSource) => Promise<void>;
  writeValueWithoutResponse: (value: BufferSource) => Promise<void>;
  startNotifications: () => Promise<MockBluetoothRemoteGATTCharacteristic>;
  stopNotifications: () => Promise<MockBluetoothRemoteGATTCharacteristic>;
  addEventListener: (event: string, handler: MockEventHandler) => void;
  removeEventListener: (event: string, handler: MockEventHandler) => void;
}

export interface MockBluetooth {
  _currentDevice: MockBluetoothDevice | null;
  /** Makes every GATT connect fail, as if the device were out of range */
  _failConnect: boolean;
  requestDevice: (options: unknown) => Promise<MockBluetoothDevice>;
  getDevices: () => Promise<MockBluetoothDevice[]>;
  getAvailability: () => Promise<boolean>;
}

export type DeviceType = "VOLCANO" | "CRAFTY" | "VENTY" | "VEAZY";

/**
 * Erstellt einen Mock für die Web Bluetooth API
 * Dieser Mock simuliert Bluetooth-Geräte ohne echte Hardware
 */
export interface MockOptions {
  /** The browser already has permission for the device (getDevices) */
  remembered?: boolean;
}

export async function mockBluetooth(
  page: Page,
  deviceType: DeviceType = "VOLCANO",
  options: MockOptions = {}
) {
  await page.addInitScript(
    ({ deviceType, remembered }: { deviceType: DeviceType } & MockOptions) => {
      // Gerätespezifische Daten
      const deviceConfigs: Record<
        DeviceType,
        {
          name: string;
          services: Record<
            string,
            {
              characteristics: Record<
                string,
                {
                  properties: {
                    read: boolean;
                    notify: boolean;
                    write: boolean;
                    writeWithoutResponse: boolean;
                  };
                  value?: Uint8Array;
                }
              >;
            }
          >;
        }
      > = {
        VOLCANO: {
          name: "S&B VOLCANO HYBRID",
          services: {
            "10100000-5354-4f52-5a26-4249434b454c": {
              // Volcano State Service
              characteristics: {
                "10100008-5354-4f52-5a26-4249434b454c": {
                  // Serial Number
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new TextEncoder().encode("12345678"),
                },
                "10100003-5354-4f52-5a26-4249434b454c": {
                  // Firmware Version
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new TextEncoder().encode("V01.0.53"),
                },
                "10100004-5354-4f52-5a26-4249434b454c": {
                  // BLE Firmware Version
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new TextEncoder().encode("V01.0.03"),
                },
                "1010000c-5354-4f52-5a26-4249434b454c": {
                  // Project Register 1 (heater/pump state, OFF)
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00]),
                },
                "1010000d-5354-4f52-5a26-4249434b454c": {
                  // Project Register 2 (unit/display)
                  properties: {
                    read: true,
                    notify: true,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00]),
                },
                "1010000e-5354-4f52-5a26-4249434b454c": {
                  // Project Register 3 (vibration)
                  properties: {
                    read: true,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00]),
                },
              },
            },
            "10110000-5354-4f52-5a26-4249434b454c": {
              // Volcano Control Service
              characteristics: {
                "10110001-5354-4f52-5a26-4249434b454c": {
                  // Current Temperature (200°C)
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0xd0, 0x07]),
                },
                "10110003-5354-4f52-5a26-4249434b454c": {
                  // Target Temperature (230°C)
                  properties: {
                    read: true,
                    notify: true,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0xfc, 0x08]),
                },
                "1011000c-5354-4f52-5a26-4249434b454c": {
                  // Auto-Off Remaining (s)
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x2c, 0x01]),
                },
                "1011000d-5354-4f52-5a26-4249434b454c": {
                  // Shutoff Time (s)
                  properties: {
                    read: true,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x58, 0x02]),
                },
                "10110005-5354-4f52-5a26-4249434b454c": {
                  // LED Brightness
                  properties: {
                    read: true,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x46, 0x00]),
                },
                "10110015-5354-4f52-5a26-4249434b454c": {
                  // Heating Hours
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x0c, 0x00]),
                },
                "10110016-5354-4f52-5a26-4249434b454c": {
                  // Heating Minutes
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x22, 0x00]),
                },
                "1011000f-5354-4f52-5a26-4249434b454c": {
                  // Heater ON
                  properties: {
                    read: false,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                },
                "10110010-5354-4f52-5a26-4249434b454c": {
                  // Heater OFF
                  properties: {
                    read: false,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                },
                "10110013-5354-4f52-5a26-4249434b454c": {
                  // Pump ON
                  properties: {
                    read: false,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                },
                "10110014-5354-4f52-5a26-4249434b454c": {
                  // Pump OFF
                  properties: {
                    read: false,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                },
              },
            },
          },
        },
        CRAFTY: {
          name: "STORZ&BICKEL",
          services: {
            "00000001-4c45-4b43-4942-265a524f5453": {
              // Crafty Service 1 (control)
              characteristics: {
                "00000021-4c45-4b43-4942-265a524f5453": {
                  // Target Temperature (185°C)
                  properties: {
                    read: true,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x3a, 0x07]),
                },
                "00000011-4c45-4b43-4942-265a524f5453": {
                  // Current Temperature (180°C)
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x08, 0x07]),
                },
                "00000031-4c45-4b43-4942-265a524f5453": {
                  // Boost Temperature (10°C)
                  properties: {
                    read: true,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x64, 0x00]),
                },
                "00000041-4c45-4b43-4942-265a524f5453": {
                  // Battery (80%)
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x50, 0x00]),
                },
                "00000051-4c45-4b43-4942-265a524f5453": {
                  // LED Brightness
                  properties: {
                    read: true,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x46, 0x00]),
                },
                "00000061-4c45-4b43-4942-265a524f5453": {
                  // Auto-Off Countdown (120 s)
                  properties: {
                    read: true,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x78, 0x00]),
                },
                "00000071-4c45-4b43-4942-265a524f5453": {
                  // Auto-Off Remaining
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x5a, 0x00]),
                },
                "00000081-4c45-4b43-4942-265a524f5453": {
                  // Heater On
                  properties: {
                    read: false,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                },
                "00000091-4c45-4b43-4942-265a524f5453": {
                  // Heater Off
                  properties: {
                    read: false,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                },
              },
            },
            "00000002-4c45-4b43-4942-265a524f5453": {
              // Crafty Service 2 (device info)
              characteristics: {
                "00000032-4c45-4b43-4942-265a524f5453": {
                  // Firmware Version
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new TextEncoder().encode("V03.01"),
                },
                "00000072-4c45-4b43-4942-265a524f5453": {
                  // BLE Firmware Version
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([1, 2, 3]),
                },
              },
            },
            "00000003-4c45-4b43-4942-265a524f5453": {
              // Crafty Service 3 (status)
              characteristics: {
                "00000023-4c45-4b43-4942-265a524f5453": {
                  // Use Hours
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x0c, 0x00]),
                },
                "000001e3-4c45-4b43-4942-265a524f5453": {
                  // Use Minutes
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x22, 0x00]),
                },
                "00000093-4c45-4b43-4942-265a524f5453": {
                  // Project Register
                  properties: {
                    read: true,
                    notify: true,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00]),
                },
                "000001c3-4c45-4b43-4942-265a524f5453": {
                  // Status Register 2
                  properties: {
                    read: true,
                    notify: true,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00]),
                },
                "000001b3-4c45-4b43-4942-265a524f5453": {
                  // Security Code
                  properties: {
                    read: false,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                },
                "00000083-4c45-4b43-4942-265a524f5453": {
                  // System Status
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00]),
                },
                "00000063-4c45-4b43-4942-265a524f5453": {
                  // Akku Status
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00]),
                },
                "00000073-4c45-4b43-4942-265a524f5453": {
                  // Akku Status 2
                  properties: {
                    read: true,
                    notify: false,
                    write: false,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00]),
                },
                "000001d3-4c45-4b43-4942-265a524f5453": {
                  // Factory Reset
                  properties: {
                    read: false,
                    notify: false,
                    write: true,
                    writeWithoutResponse: false,
                  },
                },
              },
            },
          },
        },
        VENTY: {
          name: "S&B VY123456",
          services: {
            "00000000-5354-4f52-5a26-4249434b454c": {
              // Primary Service
              characteristics: {
                "00000001-5354-4f52-5a26-4249434b454c": {
                  // Control Characteristic
                  properties: {
                    read: true,
                    notify: true,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  // Status response like a real Venty: no current
                  // temperature (0x8000), target 185 °C, boost +15,
                  // superboost +15, battery 52 %, heater on (normal mode)
                  value: new Uint8Array([
                    0x01, 0x00, 0x00, 0x80, 0x3a, 0x07, 0x0f, 0x0f, 0x34, 0x00,
                    0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                  ]),
                },
              },
            },
          },
        },
        VEAZY: {
          name: "S&B VZ123456",
          services: {
            "00000000-5354-4f52-5a26-4249434b454c": {
              // Primary Service
              characteristics: {
                "00000001-5354-4f52-5a26-4249434b454c": {
                  // Control Characteristic
                  properties: {
                    read: true,
                    notify: true,
                    write: true,
                    writeWithoutResponse: false,
                  },
                  value: new Uint8Array([0x00, 0x00, 0xb4, 0x00, 0xa0, 0x00]), // Current 180°C, Target 160°C
                },
              },
            },
          },
        },
      };

      const config = deviceConfigs[deviceType];
      const eventListeners = new Map<string, Set<MockEventHandler>>();

      // Mock Bluetooth API
      const createDevice = () => {
        const device: MockBluetoothDevice = {
          // Stable, like the id Chrome keeps for a permitted device
          id: `mock-${deviceType.toLowerCase()}`,
          name: config.name,
          addEventListener: (event: string, handler: MockEventHandler) => {
            const listeners = eventListeners.get(event) ?? new Set();
            listeners.add(handler);
            eventListeners.set(event, listeners);
          },
          removeEventListener: (event: string, handler: MockEventHandler) => {
            eventListeners.get(event)?.delete(handler);
          },
        };

        // GATT Server Mock
        device.gatt = {
          connected: false,
          connect: async () => {
            console.log("[Bluetooth Mock] Connecting to GATT server...");
            if (bluetooth._failConnect) {
              throw new DOMException("Device out of range", "NetworkError");
            }
            if (device.gatt) device.gatt.connected = true;

            const server: MockBluetoothRemoteGATTServer = {
              connected: true,
              device,
              getPrimaryService: async (uuid: string) => {
                console.log("[Bluetooth Mock] getPrimaryService:", uuid);

                if (!config.services[uuid]) {
                  throw new Error(`Service ${uuid} not found`);
                }

                const serviceConfig = config.services[uuid];

                const service: MockBluetoothRemoteGATTService = {
                  uuid,
                  device, // WICHTIG: Service braucht eine Referenz zum Device!
                  getCharacteristic: async (charUuid: string) => {
                    console.log(
                      "[Bluetooth Mock] getCharacteristic:",
                      charUuid
                    );

                    const charConfig = serviceConfig.characteristics[charUuid];
                    if (!charConfig) {
                      throw new Error(`Characteristic ${charUuid} not found`);
                    }

                    const charEventListeners = new Map<
                      string,
                      Set<MockEventHandler>
                    >();

                    const characteristic: MockBluetoothRemoteGATTCharacteristic =
                      {
                        uuid: charUuid,
                        value: charConfig.value
                          ? new DataView(charConfig.value.buffer)
                          : undefined,
                        properties: charConfig.properties,
                        readValue: async () => {
                          console.log("[Bluetooth Mock] readValue:", charUuid);
                          if (!charConfig.properties.read) {
                            throw new Error(
                              "Characteristic does not support read"
                            );
                          }
                          return new DataView(
                            charConfig.value
                              ? charConfig.value.buffer
                              : new ArrayBuffer(0)
                          );
                        },
                        writeValue: async (value: BufferSource) => {
                          console.log(
                            "[Bluetooth Mock] writeValue:",
                            charUuid,
                            value
                          );
                          if (!charConfig.properties.write) {
                            throw new Error(
                              "Characteristic does not support write"
                            );
                          }
                          // Update internal value
                          if (value instanceof ArrayBuffer) {
                            charConfig.value = new Uint8Array(value);
                          } else {
                            charConfig.value = new Uint8Array(value.buffer);
                          }
                        },
                        writeValueWithoutResponse: async (
                          value: BufferSource
                        ) => {
                          console.log(
                            "[Bluetooth Mock] writeValueWithoutResponse:",
                            charUuid,
                            value
                          );
                          if (!charConfig.properties.writeWithoutResponse) {
                            throw new Error(
                              "Characteristic does not support writeWithoutResponse"
                            );
                          }
                          if (value instanceof ArrayBuffer) {
                            charConfig.value = new Uint8Array(value);
                          } else {
                            charConfig.value = new Uint8Array(value.buffer);
                          }
                        },
                        startNotifications: async () => {
                          console.log(
                            "[Bluetooth Mock] startNotifications:",
                            charUuid
                          );
                          if (!charConfig.properties.notify) {
                            throw new Error(
                              "Characteristic does not support notifications"
                            );
                          }

                          // WICHTIG: Nach startNotifications muss ein Event gefeuert werden!
                          // Simuliere, dass das Device den aktuellen Wert sendet
                          setTimeout(() => {
                            console.log(
                              "[Bluetooth Mock] Firing characteristicvaluechanged event for:",
                              charUuid
                            );
                            const event = new Event(
                              "characteristicvaluechanged"
                            );
                            Object.defineProperty(event, "target", {
                              value: characteristic,
                              writable: false,
                            });

                            const listeners = charEventListeners.get(
                              "characteristicvaluechanged"
                            );
                            if (listeners) {
                              for (const handler of listeners) handler(event);
                            }
                          }, 100); // Kleine Verzögerung, um echtes BLE zu simulieren

                          return characteristic;
                        },
                        stopNotifications: async () => {
                          console.log(
                            "[Bluetooth Mock] stopNotifications:",
                            charUuid
                          );
                          return characteristic;
                        },
                        addEventListener: (
                          event: string,
                          handler: MockEventHandler
                        ) => {
                          const listeners =
                            charEventListeners.get(event) ?? new Set();
                          listeners.add(handler);
                          charEventListeners.set(event, listeners);
                        },
                        removeEventListener: (
                          event: string,
                          handler: MockEventHandler
                        ) => {
                          charEventListeners.get(event)?.delete(handler);
                        },
                      };

                    return characteristic;
                  },
                  getCharacteristics: async () => {
                    console.log(
                      "[Bluetooth Mock] getCharacteristics for service:",
                      uuid
                    );
                    const characteristics = [];
                    for (const charUuid in serviceConfig.characteristics) {
                      characteristics.push(
                        await service.getCharacteristic(charUuid)
                      );
                    }
                    return characteristics;
                  },
                };

                return service;
              },
            };

            return server;
          },
          disconnect: () => {
            console.log("[Bluetooth Mock] Disconnecting...");
            if (device.gatt) device.gatt.connected = false;

            // Trigger disconnect event
            const disconnectEvent = new Event("gattserverdisconnected");
            const listeners = eventListeners.get("gattserverdisconnected");
            if (listeners) {
              for (const handler of listeners) handler(disconnectEvent);
            }
          },
        };

        return device;
      };

      const bluetooth: MockBluetooth = {
        _currentDevice: null, // Expose for test access
        _failConnect: false,
        requestDevice: async (options: unknown) => {
          console.log(
            "[Bluetooth Mock] requestDevice called with options:",
            options
          );
          // Answers right away, as if the user picked the device
          bluetooth._currentDevice = createDevice();
          return bluetooth._currentDevice;
        },
        getDevices: async () => {
          if (!remembered) return [];
          bluetooth._currentDevice ??= createDevice();
          return [bluetooth._currentDevice];
        },
        getAvailability: async () => true,
      };
      Object.assign(window.navigator, { bluetooth });

      console.log(
        `[Bluetooth Mock] Initialized with device type: ${deviceType}`
      );
    },
    { deviceType, ...options }
  );
}
