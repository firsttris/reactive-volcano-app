# Documentation

Everything about the Reactive Vaporizer App in detail: how to use it, how to host it, and how it works
inside. The quick overview is in the [README](../README.md).

> This is an independent, unofficial project with no connection to Storz & Bickel GmbH.
> See the [legal notice](legal.md).

## For users

| | |
|---|---|
| [Getting started](getting-started.md) | what you need, browsers per platform, Linux flag, iOS, connecting, installing as an app, updates, language and theme |
| [Usage](usage.md) | every screen for the desktop device, Venty / Veazy and Crafty: control, boost, settings, self-diagnosis, how values are written |
| [Workflows](workflows.md) | how a workflow runs step by step, pause and resume, managing, built-in examples, JSON file format, storage |
| [Troubleshooting & FAQ](troubleshooting.md) | Web Bluetooth unavailable, device not found, connection drops, wrong values, reporting a problem, common questions |
| [Privacy & security](privacy-security.md) | what leaves your device (nothing), what is stored, Bluetooth permissions, HTTPS, hosting, vulnerability reports |
| [Legal notice](legal.md) | no affiliation, trademarks, no manufacturer code, no warranty, safety and intended use, license, contact (English and German) |

## For self-hosters

| | |
|---|---|
| [Self-hosting](self-hosting.md) | Docker, Compose, Podman Quadlet, HTTPS with Caddy / nginx / Traefik, sub-paths, static hosting, updates, image details |

## For developers

| | |
|---|---|
| [Architecture](architecture.md) | layers, connecting, the Bluetooth queue, device modules, writing values, routing, workflows, UI, i18n, PWA, design decisions |
| [Bluetooth protocol](protocol.md) | discovery, services, characteristics, bit fields and frame layouts for each device family |
| [Development](development.md) | setup, scripts, project structure, conventions, translations, adding settings and devices, Android debugging, screenshots |
| [Testing](testing.md) | unit tests, end-to-end tests, the Bluetooth mock, static checks, CI, real-device checklist |
| [Releases & deployment](releases.md) | GitHub Pages, versioning, cutting a release, Docker images, secrets, checklist |
| [Contributing](../CONTRIBUTING.md) | how to report bugs and send pull requests |

## The app in one minute

- **Client only.** A SolidJS single-page app. No server, no database, no accounts. Hosted as static files
  on GitHub Pages or in an nginx container.
- **Web Bluetooth.** The browser connects to the device over Bluetooth Low Energy after you pick it in the
  browser's own chooser. All GATT operations run through one queue, one at a time.
- **Per device family**: a pure protocol module (bytes ↔ values), a driver (GATT access), a reactive store
  (state and actions) and views. Desktop and Crafty push changes as notifications; Venty and Veazy use
  a command channel that is polled twice a second.
- **Workflows** run in the app and are stored in the browser's IndexedDB.
- **PWA**: installable, starts offline, updates itself.

## Screenshots

<p>
  <img src="screenshot-volcano.png" alt="Desktop control" width="24%">
  <img src="screenshot-volcano-workflows.png" alt="Workflows" width="24%">
  <img src="screenshot-venty.png" alt="Portable control with heater modes" width="24%">
  <img src="screenshot-crafty.png" alt="Crafty control" width="24%">
</p>
