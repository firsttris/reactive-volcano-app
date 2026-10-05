# Bluetooth protocol

How the app talks to each device family over Bluetooth Low Energy (GATT). This is **not official
documentation**: it describes what this app does to interoperate with compatible devices, it may be
incomplete, and devices or firmware versions may behave differently. The source of truth is the code in
`src/devices/*/protocol.ts` and its unit tests. See the [legal notice](legal.md).

## Contents

- [Conventions](#conventions)
- [Discovery](#discovery)
- [Desktop (Volcano Hybrid)](#desktop-volcano-hybrid)
- [Crafty / Crafty+](#crafty--crafty)
- [Venty / Veazy](#venty--veazy)
- [Self-diagnosis](#self-diagnosis)

## Conventions

- Multi-byte integers are **little-endian**.
- Temperatures are in **1/10 °C** unless stated otherwise (`1850` = 185.0 °C). The app rounds to whole
  degrees.
- UUIDs share a vendor base per family; tables show the full UUID once and the distinguishing part
  after that.
- "Notify" means the app subscribes to notifications for that characteristic; otherwise it reads on
  connect or on demand.

## Discovery

`navigator.bluetooth.requestDevice` is called with these filters (any one matches):

| Filter | Value |
|---|---|
| name prefix | `STORZ&BICKEL`, `Storz&Bickel`, `S&B` |
| services | `00000001-4c45-4b43-4942-265a524f5453`, `…0002…`, `…0003…` (Crafty) |
| services | `10100000-5354-4f52-5a26-4249434b454c` + `10110000-…` (desktop) |
| services | `00000000-5354-4f52-5a26-4249434b454c` (Venty / Veazy) |

On iOS Web Bluetooth browsers only the name-prefix filters are passed. `optionalServices` adds Generic
Access (`0x1800`).

The device type is derived from the advertised name:

| Name contains | Type |
|---|---|
| `S&B VOLCANO` | desktop |
| `S&B VY` | Venty (`S&B VY123456`: serial number after the space) |
| `S&B VZ` | Veazy |
| anything else matching the filters | Crafty |

## Desktop (Volcano Hybrid)

Base `xxxxxxxx-5354-4f52-5a26-4249434b454c`. Two services:

| Service | UUID |
|---|---|
| State | `10100000-…` |
| Control | `10110000-…` |

### Characteristics

| Name | UUID prefix | Service | Access | Format |
|---|---|---|---|---|
| Serial number | `10100008` | state | read | ASCII, first 8 chars |
| Firmware | `10100003` | state | read | ASCII, first 8 chars |
| BLE firmware | `10100004` | state | read | ASCII |
| Register 1 (activity) | `1010000c` | state | read, notify | uint16 bit field |
| Register 2 (display) | `1010000d` | state | read, notify, write | uint16 bit field |
| Register 3 (vibration) | `1010000e` | state | read, write | uint16 bit field |
| History 1 / 2 | `10100015` / `10100016` | state | read (optional) | raw bytes, used for diagnosis |
| Current temperature | `10110001` | control | read, notify | uint16, 1/10 °C; values ≥ 6536 °C while starting are ignored |
| Target temperature | `10110003` | control | read, notify, write | read uint16 / write uint32, 1/10 °C, 40–230 °C |
| Brightness | `10110005` | control | read, write | uint16, 0–100 |
| Auto-off remaining | `1011000c` | control | read, notify | uint16, seconds |
| Auto-off time | `1011000d` | control | read, write | uint16, seconds |
| Heater on / off | `1011000f` / `10110010` | control | write | one byte `0x00` |
| Pump on / off | `10110013` / `10110014` | control | write | one byte `0x00` |
| Heating hours / minutes | `10110015` / `10110016` | control | read, notify | uint16 |

### Register bits

| Register | Bit | Meaning |
|---|---|---|
| 1 | `0x0020` | heater on |
| 1 | `0x0200` | auto-shutdown active |
| 1 | `0x2000` | pump on |
| 2 | `0x0200` | Fahrenheit |
| 2 | `0x1000` | display off while cooling (inverted: set = off) |
| 3 | `0x0400` | vibration off (inverted: set = off) |

Registers are changed with a **uint32 write**: the lower 16 bits select the bit, `0x10000` added means
*set*, otherwise *clear*. Example: enable Fahrenheit → write `0x00010200` to register 2. Register 3 has
no notifications, so the app reads it back after a write.

## Crafty / Crafty+

Base `xxxxxxxx-4c45-4b43-4942-265a524f5453`. Three services:

| Service | UUID | Content |
|---|---|---|
| Control | `00000001-…` | temperatures, battery, LED, auto-off, heater |
| Device info | `00000002-…` | firmware, serial number, BLE firmware |
| Status | `00000003-…` | registers, runtime, security code, factory reset |

### Characteristics

| Name | UUID prefix | Access | Format |
|---|---|---|---|
| Current temperature | `00000011` | read, notify | uint16, 1/10 °C |
| Target temperature | `00000021` | read, write | uint16, 1/10 °C, 40–210 °C. In °F mode the device reports °F, the app converts values > 210 back |
| Boost offset | `00000031` | read, write | uint16, 1/10 °C, 0–30 |
| Battery | `00000041` | read, notify | uint16, percent |
| LED brightness | `00000051` | read, write | uint16, 0–100 |
| Auto-off time | `00000061` | read, write | uint16, seconds, 30–300; needs the security code first |
| Auto-off remaining | `00000071` | read, notify | uint16, seconds |
| Heater on / off | `00000081` / `00000091` | write | uint16 `0x0000` |
| Project register | `00000093` | read, notify | uint16 bit field |
| Usage hours / minutes | `00000023` / `000001e3` | read | uint16 |
| Status register 2 | `000001c3` | read, notify, write | uint16 bit field |
| Security code | `000001b3` | write | uint16 |
| Factory reset | `000001d3` | write | one byte, after security code |
| System / battery status | `00000083`, `00000063`, `00000073` | read | uint16, used for diagnosis |
| Firmware | `00000032` | read | ASCII, e.g. `V02.51` |
| Serial number | `00000052` | read | ASCII, first 8 chars |
| BLE firmware | `00000072` | read | 3 bytes: major, minor, patch |

### Bits

| Register | Bit | Meaning |
|---|---|---|
| project | `1 << 4` | heater active |
| project | `1 << 5` / `1 << 6` | boost / superboost mode |
| project | `1 << 15` | factory reset required |
| status 2 | `1 << 0` | vibration disabled |
| status 2 | `1 << 1` | charge LED disabled |
| status 2 | `1 << 2` | set point reached |
| status 2 | `1 << 3` | find my device active |
| status 2 | `1 << 12` | automatic Bluetooth shutdown enabled (cleared = permanent Bluetooth) |

Status register 2 is changed by read-modify-write of the whole uint16, then read back.

### Security code

Protected values only accept a write right after a code was written to `000001b3`:

| Action | Code |
|---|---|
| auto-off time | `815` |
| factory reset | `1000` |

After a factory reset the app waits for the device to settle and re-reads the affected values.

The app sends code and value with `writeSequence`, so no other queued operation can get in between.

### Firmware variants

| Firmware | Detection | Effect |
|---|---|---|
| older than 2.51 | version `V0x.yy` with major ≤ 2 and minor < 51 | only temperatures, boost, battery, LED, usage hours and the registers exist; no notifications on the project register |
| Crafty+ | major ≥ 3 | find my device available |

## Venty / Veazy

Base `xxxxxxxx-5354-4f52-5a26-4249434b454c`. One service `00000000-…` with **one** characteristic
`00000001-…` (write, notify). Every request is a frame whose byte 0 is the command; the device answers
with a notification that starts with the same command.

### Commands

| Command | Id | Frame | Response |
|---|---|---|---|
| STATUS | `0x01` | 20 bytes | temperatures, battery, heater mode, settings |
| FIRMWARE | `0x02` | 20 bytes | flags, firmware and bootloader version |
| ANALYSIS | `0x03` | 20 bytes | error code and category |
| EXTENDED_DATA | `0x04` | 20 bytes | heater runtime, battery charging time |
| DEVICE_DATA | `0x05` | 20 bytes | serial number, color index |
| BRIGHTNESS_VIBRATION | `0x06` | 7 bytes | brightness, vibration, boost timeout |
| FIND_MY_DEVICE | `0x0d` | 20 bytes, byte 1 = `0x01` | |
| ADVERTISING_INFO | `0x1d` | 20 bytes | find-my-device state |

A **read** is the command byte followed by zeros. After connecting the app sends FIRMWARE,
ADVERTISING_INFO, STATUS, EXTENDED_DATA, DEVICE_DATA and BRIGHTNESS_VIBRATION, then polls STATUS every
500 ms and EXTENDED_DATA every 30th poll.

### STATUS frame

| Byte | Content |
|---|---|
| 0 | `0x01` |
| 1 | write mask (writes only): `1<<1` target, `1<<2` boost, `1<<3` superboost, `1<<5` heater mode, `1<<7` settings |
| 2–3 | current temperature, uint16, 1/10 °C; in practice always `0x8000` (not measured), so the app ignores it, like the official app |
| 4–5 | target temperature, uint16, 1/10 °C, 40–210 °C |
| 6 | boost offset, °C (1–99) |
| 7 | superboost offset, °C (1–99) |
| 8 | battery, percent |
| 9, 10 | auto-shutdown timer (the two bytes are added, not combined into a uint16) |
| 11 | heater mode: 0 off, 1 normal, 2 boost, 3 superboost |
| 13 | charging when > 0 |
| 14 | settings value: `1<<0` Fahrenheit, `1<<1` set point reached, `1<<2` factory reset, `1<<3` charge current optimization, `1<<4` target changed on device, `1<<5` charge voltage limit, `1<<6` boost visualization (**inverted on Veazy**) |
| 15 | settings mask (writes only): which bits of byte 14 to apply |
| 16 | settings 2 value: `1<<0` permanent Bluetooth |
| 17 | settings 2 mask (writes only) |

A write sets only the fields selected in byte 1 (and, for settings, the bits selected in bytes 15 / 17).
Example: target 185 °C → `01 02 00 00 3a 07 00 …`.

### Other responses

| Command | Fields |
|---|---|
| FIRMWARE | byte 1 flags (`1<<0` application mode, `1<<4` invalid application, `1<<5` invalid bootloader), bytes 2–7 firmware ASCII, bytes 11–16 bootloader ASCII |
| EXTENDED_DATA | bytes 1–3 heater runtime in minutes (uint24), bytes 4–6 battery charging time in minutes (uint24) |
| DEVICE_DATA | serial number = ASCII bytes 15–16 followed by bytes 9–14; byte 18 color index if present |
| BRIGHTNESS_VIBRATION | byte 2 brightness (1–9), byte 5 vibration, byte 6 boost timeout disabled. Writes use byte 1 as mask: `1<<0` brightness, `1<<3` vibration, `1<<4` boost timeout |
| ANALYSIS | byte 1 error code, byte 2 error category (4 = issue detected) |
| ADVERTISING_INFO | byte 1 `1<<4`: find my device active |

## Self-diagnosis

Each family has an `analyze<Family>()` function in its protocol module. It checks error bits in the
registers (desktop, Crafty) or the ANALYSIS response (Venty / Veazy) and returns:

- `errorReport`: `null`, or a text block with the serial number and the raw values in hex for the
  manufacturer's support,
- `findings`: message keys such as `analysis_finding_coolDown`, shown as advice in the UI.

Which error bits mean what is in part undocumented; the app only reports them, it does not interpret
them further.

---

Next: [Architecture](architecture.md) · [Development](development.md#adding-a-device) · [Documentation index](README.md)
