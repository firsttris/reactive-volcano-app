# Troubleshooting & FAQ

## Contents

- [The connect button says Web Bluetooth is not available](#the-connect-button-says-web-bluetooth-is-not-available)
- [My device does not show up](#my-device-does-not-show-up)
- [Connection fails or drops](#connection-fails-or-drops)
- [Values look wrong or do not update](#values-look-wrong-or-do-not-update)
- [Workflows](#workflows)
- [Reporting a problem](#reporting-a-problem)
- [FAQ](#faq)

## The connect button says Web Bluetooth is not available

| Cause | Fix |
|---|---|
| Firefox or Safari | use Chrome, Edge or Opera ([Browsers](getting-started.md#browsers)) |
| Linux | enable `chrome://flags/#enable-web-bluetooth` and restart Chrome ([Linux](getting-started.md#linux)) |
| iPhone / iPad | use [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) ([iOS](getting-started.md#ios-and-ipados)) |
| Self-hosted over plain `http://` from another device | serve it over HTTPS ([Self-hosting](self-hosting.md#https-with-a-reverse-proxy)) |
| Bluetooth blocked by policy (managed / work devices) | check `chrome://policy` for `DefaultWebBluetoothGuardSetting` |

## My device does not show up

**The most common cause: the device is still connected to something else.** These devices accept only
one Bluetooth connection at a time, and while connected they stop advertising. Close the manufacturer's
app, switch off Bluetooth on that phone, or restart the device.

If that is not it, Chrome's built-in diagnostics page tells you where the problem is:

1. **Check the adapter.** Open `chrome://bluetooth-internals` → **Adapter**. *Present* and *Powered*
   must both show a green check. (*Discoverable* and *Discovering* showing a red cross is normal while
   no scan runs.)
   - Adapter missing: Chrome cannot reach Bluetooth. On Linux check `bluetoothctl show`
     (`Powered: yes`), and use the native Chrome package, not Flatpak or Snap.
   - On macOS: *System Settings → Privacy & Security → Bluetooth* must allow your browser.
2. **Scan for the device.** Switch it on, open **Devices** and click **Start Scan**.
   - **It shows up**: Bluetooth works, the browser is the problem. Use a supported browser; on Linux
     also enable `chrome://flags/#enable-experimental-web-platform-features` and restart.
   - **It does not show up**: the device is not advertising. It is most likely connected elsewhere
     (see above). Disconnect it there and restart the device.
3. **Linux command line** (optional): `bluetoothctl scan le` should list a name starting with
   `STORZ&BICKEL` or `S&B`.

Other things worth checking: the device's battery (portables), distance (BLE range indoors is a few
metres), and on Android that Location / Nearby devices permission is granted to the browser.

## Connection fails or drops

| Symptom | Likely cause and fix |
|---|---|
| *Connection failed* right after choosing the device | the device was grabbed by another phone in between, or the OS cached a stale pairing. Remove the device from the OS Bluetooth settings (the app does not need pairing) and try again |
| *Connection lost* during use | out of range, device switched off, auto-shutdown, or the phone suspended the browser. Reconnect |
| Works once, then not again | close other tabs that use the app; only one page can hold the connection |
| `GATT operation failed` in the console | usually a busy or sleeping device; reconnect. If it persists, restart the device |
| Windows: device found, connection hangs | update the Bluetooth driver; some older adapters handle BLE poorly |

## Values look wrong or do not update

- **Temperature jumps back after pressing + / −**: the app writes 300 ms after your last tap and then
  ignores the device's echo for one second. If it still jumps back, the device rejected the value (for
  example outside its range).
- **Unit looks wrong**: the app shows what the device is set to. Change it under *Settings*.
- **Crafty shows only a few settings**: firmware older than 2.51 does not expose the rest
  ([details](usage.md#portable-crafty-and-crafty)).
- **Battery shows 0 % on a portable right after connecting**: the first status arrives within a second;
  if it stays at 0, reconnect.

## Workflows

- **Workflow stops when the phone locks**: the workflow runs in the browser. Keep the app in front;
  the app already keeps the screen on while it runs.
- **Workflows are gone**: they live in this browser's storage. A different browser, a private window or
  clearing site data starts fresh. Export them to keep a copy ([Workflows](workflows.md#where-workflows-are-stored)).
- **Import says *Invalid workflow file***: check the [file format](workflows.md#file-format); every step
  needs the three numeric fields.

## Reporting a problem

Open an [issue](https://github.com/firsttris/reactive-volcano-app/issues) with:

- device model and firmware version (*Settings → Device info*),
- browser and version, operating system,
- what you did, what you expected, what happened,
- the browser console output (F12 → *Console*; on Android see
  [remote debugging](development.md#debugging-on-android)).

Do not post serial numbers if you prefer to keep them private; they are not needed for most reports.

## FAQ

**Is this the official app?**
No. It is an independent open-source project with no connection to the manufacturer. See the
[legal notice](legal.md).

**Does it work without internet?**
After the first visit, yes: the app is cached by its service worker and talks to the device over
Bluetooth only.

**Does it collect data?**
No. There is no server, no analytics and no tracking. See [Privacy & security](privacy-security.md).

**Can it update the device firmware?**
No, and it will not. Use the manufacturer's official tools for firmware updates.

**Will using it affect my warranty?**
The app only uses the device's Bluetooth interface for the same settings its own buttons offer. Whether
the manufacturer considers third-party apps in warranty cases is up to the manufacturer; ask them if
that matters to you. The app comes without any warranty of its own, see the [legal notice](legal.md).

**Can I control two devices at once?**
Not in one tab: each tab holds one connection. A second tab can connect a second device, but this
setup is not tested.

**Which other devices are supported?**
Only the ones listed in the [feature table](../README.md#-features). Older models without Bluetooth
cannot be supported. Support for others requires their Bluetooth protocol, see
[Development](development.md#adding-a-device).

---

Next: [Getting started](getting-started.md) · [Documentation index](README.md)
