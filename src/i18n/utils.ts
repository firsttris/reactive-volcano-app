export const languages = {
    en: 'English',
    de: 'German',
};

export const defaultLang = (() => typeof window !== "undefined" && navigator.language.includes('de') ? 'de' : 'en')(); 

export const ui = {
    en: {
        "settings": "Settings",
        "darkMode": "Dark Mode",
        "standbyLight": "Standby Light",
        "vibration": "Vibration",
        "autoMaticShutdownTime": "Automatic Shutdown Time",
        "deviceBrightness": "Device Brightness",
        "serialNumber": "Serial Number",
        "deviceRuntime": "Device Runtime",
        "hours": "hours",
        "bleFirmwareVersion": "BLE Firmware Version",
        "temperature": "Temperature",
        "holdTime": "Hold Time",
        "pumpTime": "Pump Time",
    },
    de: {
        "settings": "Einstellungen",
        "darkMode": "Dunkelmodus",
        "standbyLight": "Standby-Licht",
        "vibration": "Vibration",
        "autoMaticShutdownTime": "Automatische Abschaltzeit",
        "deviceBrightness": "Gerätehelligkeit",
        "serialNumber": "Seriennummer",
        "deviceRuntime": "Geräte-Laufzeit",
        "hours": "Stunden",
        "bleFirmwareVersion": "BLE-Firmware-Version",
        "temperature": "Temperatur",
        "holdTime": "Haltezeit",
        "pumpTime": "Pumpenzeit",
    },
} as const;

export const useTranslations = () => {
    return (key: keyof typeof ui[typeof defaultLang]) => {
      return ui[defaultLang][key] || ui[defaultLang][key];
    }
  }