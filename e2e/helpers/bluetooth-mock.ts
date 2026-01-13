import { Page } from '@playwright/test';

export interface MockBluetoothDevice {
  id: string;
  name: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<MockBluetoothRemoteGATTServer>;
    disconnect: () => void;
  };
  addEventListener: (event: string, handler: (e: any) => void) => void;
  removeEventListener: (event: string, handler: (e: any) => void) => void;
}

export interface MockBluetoothRemoteGATTServer {
  connected: boolean;
  device: MockBluetoothDevice;
  getPrimaryService: (uuid: string) => Promise<MockBluetoothRemoteGATTService>;
}

export interface MockBluetoothRemoteGATTService {
  uuid: string;
  device: MockBluetoothDevice; // Service muss Device-Referenz haben
  getCharacteristic: (uuid: string) => Promise<MockBluetoothRemoteGATTCharacteristic>;
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
  addEventListener: (event: string, handler: (e: any) => void) => void;
  removeEventListener: (event: string, handler: (e: any) => void) => void;
}

export type DeviceType = 'VOLCANO' | 'CRAFTY' | 'VENTY' | 'VEAZY';

/**
 * Erstellt einen Mock für die Web Bluetooth API
 * Dieser Mock simuliert Bluetooth-Geräte ohne echte Hardware
 */
export async function mockBluetooth(page: Page, deviceType: DeviceType = 'VOLCANO') {
  await page.addInitScript((deviceType: DeviceType) => {
    // Gerätespezifische Daten
    const deviceConfigs: Record<DeviceType, {
      name: string;
      services: Record<string, {
        characteristics: Record<string, {
          properties: {
            read: boolean;
            notify: boolean;
            write: boolean;
            writeWithoutResponse: boolean;
          };
          value?: Uint8Array;
        }>;
      }>;
    }> = {
      VOLCANO: {
        name: 'S&B VOLCANO HYBRID',
        services: {
          '10100000-5354-4f52-5a26-4249434b454c': { // Volcano State Service
            characteristics: {
              '1010000c-5354-4f52-5a26-4249434b454c': { // Activity/Heater State
                properties: { read: true, notify: true, write: false, writeWithoutResponse: false },
                value: new Uint8Array([0x00]), // OFF
              },
            },
          },
          '10110000-5354-4f52-5a26-4249434b454c': { // Volcano Control Service  
            characteristics: {
              '10110001-5354-4f52-5a26-4249434b454c': { // Current Temperature
                properties: { read: true, notify: true, write: false, writeWithoutResponse: false },
                value: new Uint8Array([0xD0, 0x07]), // 200°C = 2000 in 0.1°C units (Little Endian: 0x07D0)
              },
              '10110003-5354-4f52-5a26-4249434b454c': { // Target Temperature
                properties: { read: true, notify: true, write: false, writeWithoutResponse: false },
                value: new Uint8Array([0xFC, 0x08]), // 230°C = 2300 in 0.1°C units (Little Endian: 0x08FC)
              },
              '1011000f-5354-4f52-5a26-4249434b454c': { // Heater Control (ON)
                properties: { read: false, notify: false, write: true, writeWithoutResponse: false },
              },
              '10110010-5354-4f52-5a26-4249434b454c': { // Heater Control (OFF)
                properties: { read: false, notify: false, write: true, writeWithoutResponse: false },
              },
              '10110013-5354-4f52-5a26-4249434b454c': { // Pump ON
                properties: { read: false, notify: false, write: true, writeWithoutResponse: false },
              },
              '10110014-5354-4f52-5a26-4249434b454c': { // Pump OFF
                properties: { read: false, notify: false, write: true, writeWithoutResponse: false },
              },
            },
          },
        },
      },
      CRAFTY: {
        name: 'STORZ&BICKEL',
        services: {
          '00000001-4c45-4b43-4942-265a524f5453': { // Crafty Service 1
            characteristics: {
              '00000008-4c45-4b43-4942-265a524f5453': { // Serial Number
                properties: { read: true, notify: false, write: false, writeWithoutResponse: false },
                value: new TextEncoder().encode('12345678'),
              },
            },
          },
          '00000002-4c45-4b43-4942-265a524f5453': { // Crafty Service 2
            characteristics: {
              '00000210-4c45-4b43-4942-265a524f5453': { // Target Temperature
                properties: { read: true, notify: true, write: true, writeWithoutResponse: false },
                value: new Uint8Array([0xB4]), // 180°C
              },
            },
          },
          '00000003-4c45-4b43-4942-265a524f5453': { // Crafty Service 3
            characteristics: {
              '00000310-4c45-4b43-4942-265a524f5453': { // Status
                properties: { read: true, notify: true, write: false, writeWithoutResponse: false },
                value: new Uint8Array([0x00]),
              },
            },
          },
        },
      },
      VENTY: {
        name: 'S&B VY123456',
        services: {
          '00000000-5354-4f52-5a26-4249434b454c': { // Primary Service
            characteristics: {
              '00000001-5354-4f52-5a26-4249434b454c': { // Control Characteristic
                properties: { read: true, notify: true, write: true, writeWithoutResponse: false },
                value: new Uint8Array([0x00, 0x00, 0xC8, 0x00, 0xB4, 0x00]), // Current 200°C, Target 180°C
              },
            },
          },
        },
      },
      VEAZY: {
        name: 'S&B VZ123456',
        services: {
          '00000000-5354-4f52-5a26-4249434b454c': { // Primary Service
            characteristics: {
              '00000001-5354-4f52-5a26-4249434b454c': { // Control Characteristic
                properties: { read: true, notify: true, write: true, writeWithoutResponse: false },
                value: new Uint8Array([0x00, 0x00, 0xB4, 0x00, 0xA0, 0x00]), // Current 180°C, Target 160°C
              },
            },
          },
        },
      },
    };

    const config = deviceConfigs[deviceType];
    const eventListeners = new Map<string, Set<(e: any) => void>>();
    
    let currentDevice: any = null;

    // Mock Bluetooth API
    (window.navigator as any).bluetooth = {
      _currentDevice: null, // Expose for test access
      requestDevice: async (options: any) => {
        console.log('[Bluetooth Mock] requestDevice called with options:', options);
        
        // WICHTIG: Wir geben sofort ein Device zurück (simuliert, dass der User ein Gerät ausgewählt hat)
        // Ohne diese Zeile würde der Mock einfach hängen bleiben
        const device: MockBluetoothDevice = {
          id: 'mock-device-' + Date.now(),
          name: config.name,
          addEventListener: (event: string, handler: (e: any) => void) => {
            if (!eventListeners.has(event)) {
              eventListeners.set(event, new Set());
            }
            eventListeners.get(event)!.add(handler);
          },
          removeEventListener: (event: string, handler: (e: any) => void) => {
            eventListeners.get(event)?.delete(handler);
          },
        };

        // GATT Server Mock
        device.gatt = {
          connected: false,
          connect: async () => {
            console.log('[Bluetooth Mock] Connecting to GATT server...');
            device.gatt!.connected = true;
            
            const server: MockBluetoothRemoteGATTServer = {
              connected: true,
              device,
              getPrimaryService: async (uuid: string) => {
                console.log('[Bluetooth Mock] getPrimaryService:', uuid);
                
                if (!config.services[uuid]) {
                  throw new Error(`Service ${uuid} not found`);
                }

                const serviceConfig = config.services[uuid];
                
                const service: MockBluetoothRemoteGATTService = {
                  uuid,
                  device, // WICHTIG: Service braucht eine Referenz zum Device!
                  getCharacteristic: async (charUuid: string) => {
                    console.log('[Bluetooth Mock] getCharacteristic:', charUuid);
                    
                    const charConfig = serviceConfig.characteristics[charUuid];
                    if (!charConfig) {
                      throw new Error(`Characteristic ${charUuid} not found`);
                    }

                    const charEventListeners = new Map<string, Set<(e: any) => void>>();
                    
                    const characteristic: MockBluetoothRemoteGATTCharacteristic = {
                      uuid: charUuid,
                      value: charConfig.value ? new DataView(charConfig.value.buffer) : undefined,
                      properties: charConfig.properties,
                      readValue: async () => {
                        console.log('[Bluetooth Mock] readValue:', charUuid);
                        if (!charConfig.properties.read) {
                          throw new Error('Characteristic does not support read');
                        }
                        return new DataView(charConfig.value ? charConfig.value.buffer : new ArrayBuffer(0));
                      },
                      writeValue: async (value: BufferSource) => {
                        console.log('[Bluetooth Mock] writeValue:', charUuid, value);
                        if (!charConfig.properties.write) {
                          throw new Error('Characteristic does not support write');
                        }
                        // Update internal value
                        if (value instanceof ArrayBuffer) {
                          charConfig.value = new Uint8Array(value);
                        } else {
                          charConfig.value = new Uint8Array(value.buffer);
                        }
                      },
                      writeValueWithoutResponse: async (value: BufferSource) => {
                        console.log('[Bluetooth Mock] writeValueWithoutResponse:', charUuid, value);
                        if (!charConfig.properties.writeWithoutResponse) {
                          throw new Error('Characteristic does not support writeWithoutResponse');
                        }
                        if (value instanceof ArrayBuffer) {
                          charConfig.value = new Uint8Array(value);
                        } else {
                          charConfig.value = new Uint8Array(value.buffer);
                        }
                      },
                      startNotifications: async () => {
                        console.log('[Bluetooth Mock] startNotifications:', charUuid);
                        if (!charConfig.properties.notify) {
                          throw new Error('Characteristic does not support notifications');
                        }
                        
                        // WICHTIG: Nach startNotifications muss ein Event gefeuert werden!
                        // Simuliere, dass das Device den aktuellen Wert sendet
                        setTimeout(() => {
                          console.log('[Bluetooth Mock] Firing characteristicvaluechanged event for:', charUuid);
                          const event = new Event('characteristicvaluechanged');
                          Object.defineProperty(event, 'target', {
                            value: characteristic,
                            writable: false
                          });
                          
                          const listeners = charEventListeners.get('characteristicvaluechanged');
                          if (listeners) {
                            listeners.forEach(handler => handler(event));
                          }
                        }, 100); // Kleine Verzögerung, um echtes BLE zu simulieren
                        
                        return characteristic;
                      },
                      stopNotifications: async () => {
                        console.log('[Bluetooth Mock] stopNotifications:', charUuid);
                        return characteristic;
                      },
                      addEventListener: (event: string, handler: (e: any) => void) => {
                        if (!charEventListeners.has(event)) {
                          charEventListeners.set(event, new Set());
                        }
                        charEventListeners.get(event)!.add(handler);
                      },
                      removeEventListener: (event: string, handler: (e: any) => void) => {
                        charEventListeners.get(event)?.delete(handler);
                      },
                    };

                    return characteristic;
                  },
                  getCharacteristics: async () => {
                    console.log('[Bluetooth Mock] getCharacteristics for service:', uuid);
                    const characteristics = [];
                    for (const charUuid in serviceConfig.characteristics) {
                      characteristics.push(await service.getCharacteristic(charUuid));
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
            console.log('[Bluetooth Mock] Disconnecting...');
            device.gatt!.connected = false;
            
            // Trigger disconnect event
            const disconnectEvent = new Event('gattserverdisconnected');
            const listeners = eventListeners.get('gattserverdisconnected');
            if (listeners) {
              listeners.forEach(handler => handler(disconnectEvent));
            }
          },
        };

        currentDevice = device;
        (window.navigator as any).bluetooth._currentDevice = device; // Also expose via _currentDevice
        return device;
      },
      getAvailability: async () => true,
    };

    console.log(`[Bluetooth Mock] Initialized with device type: ${deviceType}`);
  }, deviceType);
}

/**
 * Hilfsfunktion um Bluetooth-Werte zu aktualisieren (für Tests)
 */
export async function updateBluetoothCharacteristic(
  page: Page,
  serviceUuid: string,
  characteristicUuid: string,
  value: number[]
) {
  await page.evaluate(
    ({ serviceUuid, characteristicUuid, value }) => {
      console.log(`[Bluetooth Mock] Updating characteristic ${characteristicUuid} with value:`, value);
      // In einer echten Implementierung würden wir hier die notification events triggern
      // Dies ist eine vereinfachte Version für Demo-Zwecke
    },
    { serviceUuid, characteristicUuid, value }
  );
}
