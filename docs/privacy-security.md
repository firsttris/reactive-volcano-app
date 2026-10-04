# Privacy & security

The short version: the app has no server. It runs in your browser, talks to your device over Bluetooth
and to nothing else.

## Contents

- [What leaves your device](#what-leaves-your-device)
- [What is stored in your browser](#what-is-stored-in-your-browser)
- [Bluetooth permissions](#bluetooth-permissions)
- [Why HTTPS is required](#why-https-is-required)
- [Hosting and third parties](#hosting-and-third-parties)
- [Supply chain](#supply-chain)
- [Reporting a vulnerability](#reporting-a-vulnerability)

## What leaves your device

**Nothing, as far as the app is concerned.** It makes no network requests of its own: no API, no
analytics, no crash reporting, no fonts or scripts from third-party CDNs (fonts and icons are bundled).
The only network traffic is loading the app's files from where it is hosted, and the service worker
checking that host for a new version.

The device data the app reads (temperatures, settings, serial number, firmware version, runtime) is
held in memory while connected and discarded when you disconnect. The self-diagnosis builds a
support report on screen, but never sends it.

## What is stored in your browser

| What | Where | Key | Purpose |
|---|---|---|---|
| Workflows | IndexedDB `VolcanoWorkflowDB` → `keyValueStore` | `workflowList`, `selectedWorkflowId` | your workflows and the last selected one |
| Theme | `localStorage` | `isDarkModeVReverse` | light / dark choice |
| App files | Cache Storage (service worker) | `workbox-precache-…` | offline start |

No cookies, no identifiers, no device data. Remove everything through the browser's site settings
(*Clear data* for the site), or uninstall the PWA.

## Bluetooth permissions

Web Bluetooth is designed so a page cannot reach any device without you:

- A page can only **ask**; the browser shows its own device chooser and you pick the device.
- The app filters the chooser to device names starting with `STORZ&BICKEL`, `Storz&Bickel` or `S&B` and
  to the known services, so it never sees unrelated devices.
- Access lasts for the page session. The app does not use the experimental *persistent permissions* or
  background scanning; you connect again on every visit.
- Closing the tab or tapping *Disconnect* ends the connection.

The app writes only the values its controls represent (temperatures, heater, pump, display and
charging options, find my device, factory reset after confirmation). It contains no firmware update
function and does not touch the device's bootloader.

## Why HTTPS is required

Browsers expose powerful APIs such as Bluetooth only in a
[secure context](https://developer.mozilla.org/docs/Web/Security/Secure_Contexts): `https://` or
`localhost`. This prevents a network attacker from injecting a page that talks to your devices. If you
host the app yourself, serve it over HTTPS ([Self-hosting](self-hosting.md#https-with-a-reverse-proxy)).

## Hosting and third parties

- The public instance is served by **GitHub Pages**. GitHub, as the host, processes the usual request
  data (IP address, user agent) when your browser loads the files; see the
  [GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
  The app adds nothing on top.
- A **self-hosted** instance involves no third party at all.
- Links in the app and documentation (GitHub, app stores, MDN) are ordinary links; nothing is loaded
  from them until you click.

## Supply chain

- Dependencies are pinned through `package-lock.json` and installed with `npm ci` in CI and in the
  Docker build.
- CI runs type checks, unit tests and end-to-end tests before every deployment to GitHub Pages.
- Docker images are built by GitHub Actions from tagged commits, see [Releases](releases.md).

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's
[private vulnerability reporting](https://github.com/firsttris/reactive-volcano-app/security/advisories/new)
for this repository, or contact the maintainer through the GitHub profile.

---

Next: [Legal notice](legal.md) · [Architecture](architecture.md) · [Documentation index](README.md)
