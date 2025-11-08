Hier ist eine präzise Analyse, wie die Legacy-App (`qvap.js`) die BLE-Responses aufteilt und welche Daten in „DeviceStatus“ und „ExtendedDeviceData“ gehören:

---

### DeviceStatus (CMD 0x01, case 1 in `parseBLEResponse`)

**Werte, die direkt aus dem Status-Response (CMD 0x01) geholt und regelmäßig für die UI verwendet werden:**

- Aktuelle Temperatur: `(arrayBufferVal.getUint8(2) + arrayBufferVal.getUint8(3) * 256) / 10`
- Boost-Temperatur: `arrayBufferVal.getUint8(6)`
- Superboost-Temperatur: `arrayBufferVal.getUint8(7)`
- Akkustand: `arrayBufferVal.getUint8(8)`
- Auto-Shutdown-Timer: `arrayBufferVal.getUint8(9) + arrayBufferVal.getUint8(10)`
- Heizmodus: `arrayBufferVal.getUint8(11)`
- Ladezustand: `arrayBufferVal.getUint8(13)`
- Settings-Flags: `arrayBufferVal.getUint8(14)` (enthält: Einheit, Boost-Visualisierung, Charge-Optimierung, Charge-Limit, Permanent Boost, Vibration)
- Permanent Bluetooth: `arrayBufferVal.getUint8(16) & BIT_SETTINGS2_BLE_PERMANENT`
- Zieltemperatur: `(arrayBufferVal.getUint8(4) + arrayBufferVal.getUint8(5) * 256) / 10`
- Diverse UI-Flags (z.B. Boost/Superboost aktiv, Setpoint erreicht, etc.)

**Diese Werte werden direkt in die UI übernommen und sind Teil des „laufenden Gerätestatus“.**

---

### ExtendedDeviceData (CMD 0x04, case 4 in `parseBLEResponse`)

**Werte, die nur alle 30s oder auf explizite Anfrage geholt werden:**

- HeaterRuntimeMinutes: `convertBLEtoUint24(new DataView(arrayBufferVal.buffer.slice(1, 4)))`
- BatteryChargingTimeMinutes: `convertBLEtoUint24(new DataView(arrayBufferVal.buffer.slice(4, 7)))`
- Betriebsstunden, Ladezeit, ggf. weitere Diagnosewerte

**Diese Werte werden nicht für die UI gebraucht, sondern für Diagnose, Support oder seltene Anzeigen.**

---

### Weitere spezielle Kommandos

- **CMD 0x05 (Device Data):** Seriennummer, Farb-Info
  - `setSerialNumber(decoder.decode(tmpPrefix) + decoder.decode(tmpName))`
  - Farb-Index: `arrayBufferVal.getUint8(18)` → UI-Farbwahl

- **CMD 0x06 (Brightness/Vibration):**
  - LED-Brightness: `arrayBufferVal.getUint8(2)`
  - Vibration: `arrayBufferVal.getUint8(5)`
  - Boost/Superboost Timeout: `arrayBufferVal.getUint8(6)`

- **CMD 0x02 (Firmware):**
  - Firmware-Version, Bootloader-Version

- **CMD 0x03/0x35 (Analysis):**
  - Fehlercodes, Analyse-IDs

- **CMD 0x13/0x29 (Find My Device):**
  - Find-My-Device-Status

---

### Fazit

**DeviceStatus (CMD 0x01):**
- Alles, was im UI ständig angezeigt wird und regelmäßig aktualisiert werden muss.
- Settings-Flags, Temperaturen, Akkustand, Heizmodus, Ladezustand, Timer, Permanent Bluetooth, Boost/Superboost, Zieltemperatur.

**ExtendedDeviceData (CMD 0x04):**
- Diagnosewerte, Betriebsstunden, Ladezeit, seltene Infos.

**Weitere Daten:**
- Seriennummer, Farbe (CMD 0x05)
- LED-Brightness, Vibration, Timeout (CMD 0x06)
- Firmware/Bootloader-Version (CMD 0x02)
- Fehlercodes/Analyse (CMD 0x03/0x35)
- Find-My-Device (CMD 0x13/0x29)

**Die Legacy-App ist hier sehr klar getrennt:**
- UI-Status = CMD 0x01
- Diagnose/Info = CMD 0x04, 0x05, 0x06, 0x02, 0x03, 0x13, 0x29

Wenn du eine vollständige Mapping-Tabelle willst, kann ich sie dir direkt aus dem Code extrahieren!