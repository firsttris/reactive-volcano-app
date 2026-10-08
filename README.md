<div align="center">

# Reactive Volcano App

**Control your vaporizer from the browser.**<br>
Unofficial Web Bluetooth app for the Storz & Bickel Volcano Hybrid, Venty, Veazy and Crafty:
live temperature, heater and pump, heat-up workflows, device settings and self-diagnosis.<br>
No app store, no account, no server: open the page, connect, done.

[![Build](https://github.com/firsttris/reactive-volcano-app/actions/workflows/build.yml/badge.svg?branch=main&event=push)](https://github.com/firsttris/reactive-volcano-app/actions/workflows/build.yml)
[![Release](https://github.com/firsttris/reactive-volcano-app/actions/workflows/release.yml/badge.svg)](https://github.com/firsttris/reactive-volcano-app/actions/workflows/release.yml)
[![Docker Image Version](https://img.shields.io/docker/v/tristanteu/reactive-volcano-app?sort=semver&logo=docker&logoColor=white&label=Docker%20Hub)](https://hub.docker.com/r/tristanteu/reactive-volcano-app)
[![Docker Pulls](https://img.shields.io/docker/pulls/tristanteu/reactive-volcano-app?logo=docker&logoColor=white)](https://hub.docker.com/r/tristanteu/reactive-volcano-app)
[![Platforms](https://img.shields.io/badge/platform-amd64%20%7C%20arm64-lightgrey)](https://hub.docker.com/r/tristanteu/reactive-volcano-app/tags)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
<br>
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-2c4f7c?logo=solid&logoColor=white)](https://www.solidjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8?logo=pwa&logoColor=white)](https://firsttris.github.io/reactive-volcano-app/docs/getting-started.html#install-as-an-app)

[**▶ Open the app**](https://firsttris.github.io/reactive-volcano-app/) •
[Why?](#-why) •
[Features](#-features) •
[Get started](#-get-started) •
[Self-hosting](#-self-hosting) •
[Documentation](https://firsttris.github.io/reactive-volcano-app/docs/) •
[Development](#️-development)

<img src="docs/hero.png" alt="The control screens for a desktop vaporizer, a portable with boost modes and a portable with battery display" width="900">

<sub>Deutsch: [README_de.md](README_de.md)</sub>

</div>

> [!IMPORTANT]
> **Unofficial, independent project.** Not affiliated with, endorsed, sponsored or authorized by
> Storz & Bickel GmbH. *VOLCANO*, *VENTY*, *VEAZY*, *CRAFTY* and *STORZ & BICKEL* are trademarks of
> their respective owner and are used here only to name the devices this app is compatible with.
> For the official app, firmware and support, go to the manufacturer. See [Legal notice](https://firsttris.github.io/reactive-volcano-app/docs/legal.html).

## 💡 Why?

The Volcano Hybrid, Venty, Veazy and Crafty speak Bluetooth Low Energy, and modern browsers can talk to
it directly through the [Web Bluetooth API](https://developer.mozilla.org/docs/Web/API/Web_Bluetooth_API).
This project turns that into a fast, polished control app that runs anywhere Chrome or Edge runs, as an
alternative to the manufacturer's mobile app:

- **Nothing to install**: a web page that becomes an app on your home screen if you want it to.
  Works on Android, Windows, macOS, ChromeOS and Linux, and on iOS through a Web Bluetooth browser.
- **Live**: temperature and state arrive as Bluetooth notifications the moment the device sends them
  (portables with a single control channel are queried twice a second), and every change you make is
  written within a fraction of a second.
- **Workflows**: automate a session on a desktop vaporizer: heat to 170 °C, hold, run the pump, step up
  to 175 °C, and so on. Build your own, share them as JSON.
- **Private by design**: there is no backend. The app talks to your device and nothing else, keeps its
  data in your browser and has no tracking, analytics or accounts.
- **Open and self-hostable**: one small nginx container for amd64 and arm64, or any static web server.

## ✨ Features

| | Desktop · *Volcano Hybrid* | Portable · *Venty* / *Veazy* | Portable · *Crafty / Crafty+* |
|---|:---:|:---:|:---:|
| 🌡️ Live current and target temperature with heat-up progress | ✅ | ✅ | ✅ |
| 🔥 Heater on/off | ✅ | ✅ | ✅ |
| 💨 Air pump on/off | ✅ | | |
| 🚀 Boost and Superboost offsets, heater modes | | ✅ | Boost |
| 🔁 Workflows: multi-step heat / hold / pump, JSON import & export | ✅ | | |
| 🔋 Battery level and charging state | | ✅ | ✅ |
| 🔆 Brightness, vibration, °C / °F | ✅ | ✅ | ✅ |
| ⏱️ Auto-shutdown time | ✅ | | ✅ |
| 🔌 Eco charging (current optimization, voltage limit), permanent boost | | ✅ | |
| 📶 Permanent Bluetooth | | Veazy | ✅ |
| 💡 Charge indicator LED | | | ✅ |
| 📍 Find my device | | Veazy | Crafty+ |
| 🩺 Self-diagnosis with plain-language advice | ✅ | ✅ | ✅ |
| ℹ️ Serial number, firmware, runtime | ✅ | ✅ | ✅ |
| ♻️ Factory reset | | ✅ | ✅ |

Crafty units with firmware older than 2.51 expose fewer values: target and current temperature, boost,
brightness and battery work, the rest is hidden.

**Across the app**: light and dark mode (follows the system), English and German (follows the
browser), installable PWA with offline start, the screen stays on while heating or running a workflow,
clear error messages when the connection drops. Every screen is described in [Usage](https://firsttris.github.io/reactive-volcano-app/docs/usage.html).

## 📸 Screenshots

<table>
  <tr>
    <td width="33%"><img src="docs/screenshot-connect.png" alt="Connect screen with the supported devices and help for devices that are not found"><br><sub><b>Connect</b>: one tap, with help if nothing is found</sub></td>
    <td width="33%"><img src="docs/screenshot-volcano-workflows.png" alt="Workflow list with four workflows and their temperature steps"><br><sub><b>Workflows</b>: run, edit, import, export · <a href="docs/workflows.md">docs →</a></sub></td>
    <td width="33%"><img src="docs/screenshot-volcano-settings.png" alt="Settings for the desktop vaporizer: shutdown time, brightness, vibration, standby light, unit and device info"><br><sub><b>Settings</b>: device options, info and diagnosis</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshot-venty-settings.png" alt="Settings for the portable: LED brightness, vibration, boost options and eco charging"><br><sub><b>Portable settings</b>: boost and eco charging</sub></td>
    <td><img src="docs/screenshot-crafty-settings.png" alt="Settings for the Crafty: brightness, shutdown time, permanent Bluetooth, charge LED"><br><sub><b>Crafty settings</b>: shutdown, LED, Bluetooth</sub></td>
    <td><img src="docs/screenshot-volcano-light.png" alt="The control screen in light mode"><br><sub><b>Light mode</b>: follows your system</sub></td>
  </tr>
</table>

## 🚀 Get started

1. Open **[firsttris.github.io/reactive-volcano-app](https://firsttris.github.io/reactive-volcano-app/)**
   in Chrome, Edge or Opera.
2. Switch on your device and make sure it is **not connected to another phone or app**.
3. Tap **Connect Device** and pick it from the browser's Bluetooth dialog.

### 🌐 Browser support

| Platform | Works with | Notes |
|---|---|---|
| Android, Windows, macOS, ChromeOS | Chrome, Edge, Opera | Web Bluetooth is on by default |
| Linux | Chrome, Chromium | enable `chrome://flags/#enable-web-bluetooth` once, see [Getting started](https://firsttris.github.io/reactive-volcano-app/docs/getting-started.html#linux) |
| iOS, iPadOS | [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) | Safari has no Web Bluetooth |
| Firefox, Safari | ❌ | no Web Bluetooth support |

Device not found? Work through [Troubleshooting](https://firsttris.github.io/reactive-volcano-app/docs/troubleshooting.html): it starts with Chrome's
built-in `chrome://bluetooth-internals` page and tells you in three steps whether the adapter, the
browser or the device is the problem.

## 🐳 Self-hosting

A ready-made image for `linux/amd64` and `linux/arm64` is on
[Docker Hub](https://hub.docker.com/r/tristanteu/reactive-volcano-app):

```bash
docker run -d --name vaporizer-app -p 8080:8080 --restart unless-stopped tristanteu/reactive-volcano-app:latest
```

The container runs nginx without root and listens on port **8080** (older images: 80, see
[upgrading](https://firsttris.github.io/reactive-volcano-app/docs/self-hosting.html#updates)).

<details>
<summary><b>Docker Compose</b></summary>

```yaml
services:
  vaporizer-app:
    image: tristanteu/reactive-volcano-app:latest
    ports:
      - "8080:8080"
    restart: unless-stopped
```

</details>

<details>
<summary><b>Podman Quadlet</b></summary>

```bash
curl -o ~/.config/containers/systemd/volcano-app.container \
  https://raw.githubusercontent.com/firsttris/reactive-volcano-app/main/volcano-app.container
systemctl --user daemon-reload && systemctl --user start volcano-app
```

</details>

> [!NOTE]
> Browsers only allow Bluetooth on **secure origins**: `https://…` or `http://localhost`. To use your
> instance from another device, put it behind a reverse proxy with HTTPS. Examples for Caddy, nginx and
> Traefik, and how to serve the app under a sub-path, are in [Self-hosting](https://firsttris.github.io/reactive-volcano-app/docs/self-hosting.html).

## 📚 Documentation

Also as a website with search: **https://firsttris.github.io/reactive-volcano-app/docs/**

| | |
|---|---|
| [Getting started](https://firsttris.github.io/reactive-volcano-app/docs/getting-started.html) | browsers, Linux flag, iOS, connecting, installing as an app, updates |
| [Usage](https://firsttris.github.io/reactive-volcano-app/docs/usage.html) | every screen for each device: control, boost, settings, diagnosis, find my device |
| [Workflows](https://firsttris.github.io/reactive-volcano-app/docs/workflows.html) | how a workflow runs, editing, the JSON format for import and export |
| [Self-hosting](https://firsttris.github.io/reactive-volcano-app/docs/self-hosting.html) | Docker, Compose, Podman, HTTPS with Caddy / nginx / Traefik, sub-paths, static hosting |
| [Troubleshooting & FAQ](https://firsttris.github.io/reactive-volcano-app/docs/troubleshooting.html) | device not found, connection drops, Linux, iOS, common questions |
| [Privacy & security](https://firsttris.github.io/reactive-volcano-app/docs/privacy-security.html) | what the app stores, what it sends (nothing), permissions, secure context |
| [Architecture](https://firsttris.github.io/reactive-volcano-app/docs/architecture.html) | layers, data flow, Bluetooth queue, stores, routing, PWA, design decisions |
| [Bluetooth protocol](https://firsttris.github.io/reactive-volcano-app/docs/protocol.html) | services, characteristics and encodings for each device family |
| [Development](https://firsttris.github.io/reactive-volcano-app/docs/development.html) | setup, scripts, project structure, conventions, translations, adding a device, debugging on Android |
| [Testing](https://firsttris.github.io/reactive-volcano-app/docs/testing.html) | unit tests, the Bluetooth mock, end-to-end tests, screenshots, CI |
| [Releases & deployment](https://firsttris.github.io/reactive-volcano-app/docs/releases.html) | GitHub Pages, versioning, Docker images, the release workflow |
| [Legal notice](https://firsttris.github.io/reactive-volcano-app/docs/legal.html) | trademarks, no affiliation, no warranty, safety, license |

## 🛠️ Development

Requires Node.js 22 or newer.

```bash
git clone https://github.com/firsttris/reactive-volcano-app.git && cd reactive-volcano-app
npm install
npm run dev        # http://localhost:5173
```

No device at hand? The end-to-end tests run the whole app against a simulated Web Bluetooth stack;
`npm run test:e2e:ui` lets you click through it.

**Stack**: SolidJS with `@solidjs/router` · Tailwind CSS 4 and [solid-ui](https://www.solid-ui.com)
(Kobalte) · Paraglide JS for English and German · `p-queue` to serialize every GATT operation ·
`vite-plugin-pwa` · Vitest, Playwright and Biome. Details in [Development](https://firsttris.github.io/reactive-volcano-app/docs/development.html) and
[Architecture](https://firsttris.github.io/reactive-volcano-app/docs/architecture.html).

```bash
npm run typecheck && npm run lint && npm test && npm run test:e2e
```

## 🤝 Contributing

Bug reports, ideas and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md). Reports
from real devices help most: please include the device, its firmware version (shown under *Settings*),
your browser and operating system.

---

<div align="center">

⭐ Like the Reactive Volcano App? A [star on GitHub](https://github.com/firsttris/reactive-volcano-app) helps others find it.<br>
🐛 [Report a bug](https://github.com/firsttris/reactive-volcano-app/issues/new) · 💡 [Request a feature](https://github.com/firsttris/reactive-volcano-app/issues/new)

<sub>
<a href="LICENSE">AGPL-3.0</a> · © Tristan Teufel and contributors · <a href="README_de.md">Deutsche Version</a><br>
Changed versions you pass on or run for others must offer their source code under the AGPL; a commercial license without these obligations is available via <a href="https://teufel-it.de">teufel-it.de</a>.<br>
This is an independent, unofficial open-source project. It is not affiliated with, endorsed, sponsored or authorized by Storz &amp; Bickel GmbH.<br>
STORZ &amp; BICKEL, VOLCANO, VOLCANO HYBRID, VENTY, VEAZY and CRAFTY are trademarks of Storz &amp; Bickel GmbH, used only to describe compatibility.<br>
Provided “as is”, without warranty. Use at your own risk. <a href="docs/legal.md">Legal notice</a>
</sub>
</div>
