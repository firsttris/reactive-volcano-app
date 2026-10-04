<div align="center">

# Reactive Vaporizer App

<img src="./docs/ui-1.png" alt="User Interface" height="500" />

[![Build](https://github.com/firsttris/reactive-volcano-app/actions/workflows/build.yml/badge.svg)](https://github.com/firsttris/reactive-volcano-app/actions/workflows/build.yml)
[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Release](https://github.com/firsttris/reactive-volcano-app/actions/workflows/release.yml/badge.svg)](https://github.com/firsttris/reactive-volcano-app/actions/workflows/release.yml)
[![Docker Image Version](https://img.shields.io/docker/v/tristanteu/reactive-volcano-app?sort=semver&logo=docker&logoColor=white&label=Docker%20Hub)](https://hub.docker.com/r/tristanteu/reactive-volcano-app)
[![Docker Pulls](https://img.shields.io/docker/pulls/tristanteu/reactive-volcano-app?logo=docker&logoColor=white)](https://hub.docker.com/r/tristanteu/reactive-volcano-app)
[![Docker Image Size](https://img.shields.io/docker/image-size/tristanteu/reactive-volcano-app?sort=semver&logo=docker&logoColor=white)](https://hub.docker.com/r/tristanteu/reactive-volcano-app)

[![SolidJS](https://img.shields.io/badge/SolidJS-2c4f7c?style=for-the-badge&logo=solid&logoColor=c8c8c8)](https://www.solidjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![solid-ui](https://img.shields.io/badge/solid--ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://www.solid-ui.com)

**Steuern Sie Ihre Storz & Bickel Geräte mit modernster Web Bluetooth Technologie.**

</div>


## 📖 Einführung

Der Volcano, Venty, Veazy und Crafty, hergestellt von Storz & Bickel in Tuttlingen, Deutschland, sind bekannte hochwertige Vaporizer. Diese Geräte können über die Bluetooth Web API gesteuert werden.

Dieses Projekt zeigt, wie man **modernste Technologie** nutzt, um diese Geräte über die Web Bluetooth API zu steuern.

## 📱 Geräteunterstützung

Diese App unterstützt die folgenden Storz & Bickel Geräte:

- **Volcano**
- **Venty**
- **Veazy**
- **Crafty** (Sowohl neue als auch alte Firmware-Versionen)

*Hinweis: Verfügbare Funktionen können je nach Gerätemodell variieren.*

## 🚀 Funktionen

### Volcano
- 🌡️ **Temperatursteuerung** mit Live-Ist-/Solltemperatur und Aufheizfortschritt
- 💨 Steuerung von **Heizung & Luftpumpe**
- 🔁 **Workflows**: mehrstufige Abläufe (Heizen/Halten/Pumpen) erstellen, bearbeiten und ausführen, inkl. JSON-Import & -Export
- ⚙️ **Einstellungen**: Helligkeit, Vibration, Standby-Licht, automatische Abschaltzeit, °C/°F
- 🩺 **Geräteanalyse** (Selbsttest mit Empfehlungen)

### Venty & Veazy
- 🌡️ **Temperatursteuerung** inkl. **Boost** und **Superboost**
- 🔋 **Akkustand** und Ladeinformationen
- ⚙️ **Einstellungen**: Helligkeit, Vibration, permanentes Bluetooth, Ladestromoptimierung, Ladespannungsbegrenzung, Boost-Visualisierung, permanenter Boost
- 📍 **Gerät finden**, Geräteinfo, Werksreset
- 🩺 **Geräteanalyse**

### Crafty
- 🌡️ Steuerung von **Temperatur & Heizung**, automatische Abschaltzeit
- 🔋 **Akkustand**, Ladeanzeige-LED
- 📍 **Gerät finden**, Geräteinfo, Werksreset
- 🩺 **Geräteanalyse**

### App-Funktionen
- 🌑 **Dunkelmodus**
- 📱 **Responsive UI** (Desktop- und Mobilgeräte)
- 🌍 **Lokalisierung** (Deutsch und Englisch)
- 💾 **PWA** (Progressive Web App)

## 🎮 Testen Sie meine App

Greifen Sie auf meine WebApp zu und testen Sie sie hier: **[Reactive Vaporizer App](https://firsttris.github.io/reactive-volcano-app/)**

## 🐳 Self-Hosting mit Docker

Ein fertiges Image (`linux/amd64`, `linux/arm64`) ist auf **[Docker Hub](https://hub.docker.com/r/tristanteu/reactive-volcano-app)** verfügbar.

```bash
docker run -d --name volcano-app -p 8080:80 --restart unless-stopped tristanteu/reactive-volcano-app:latest
```

Oder mit Docker Compose:

```yaml
services:
  volcano-app:
    image: tristanteu/reactive-volcano-app:latest
    ports:
      - "8080:80"
    restart: unless-stopped
```

Anschließend `http://localhost:8080` öffnen. *Hinweis: Web Bluetooth funktioniert nur in einem sicheren Kontext — beim Zugriff von einem anderen Gerät muss die App per HTTPS ausgeliefert werden (z. B. hinter einem Reverse Proxy).*

## 🐧 Voraussetzungen

Die App benötigt einen Browser, der die **[Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility)** unterstützt:

| Plattform | Unterstützte Browser |
| --- | --- |
| Windows, macOS, ChromeOS, Android | Chrome, Edge, Opera (standardmäßig aktiviert) |
| Linux | Chrome / Chromium (Flag muss aktiviert werden, siehe unten) |
| iOS / iPadOS | Von Safari nicht unterstützt. Nutzen Sie einen Web-Bluetooth-Browser wie [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) |
| Firefox, Safari (alle Plattformen) | ❌ Nicht unterstützt |

**Nur unter Linux:** Web Bluetooth manuell aktivieren:

1. Öffnen Sie Chrome und navigieren Sie zu `chrome://flags/#enable-web-bluetooth`.
2. Aktivieren Sie das Flag wie im Bild unten gezeigt und starten Sie Chrome neu.

![Aktivierung der Web Bluetooth API in Chrome](/docs/web-bluetooth-api.png)

## 🖼️ Benutzeroberfläche Übersicht

<details>
<summary><b>Klicken Sie hier, um Screenshots der Benutzeroberfläche anzuzeigen</b></summary>
<br>

Die Benutzeroberfläche ist responsiv und für Desktop- und Mobilgeräte optimiert.

### Klicken Sie auf das Bluetooth-Symbol, um die Bluetooth-Suche zu starten
<div align="center">

![Bluetooth Discovery](/docs/bluetooth-connect.png)

</div>

### Steuern Sie mühelos Ihr Storz & Bickel Gerät
<div align="center">

![User Interface](/docs/ui-1.png)
![User Interface](/docs/ui-2.png)

</div>

### Veazy Venty
<div align="center">

![User Interface](/docs/veazy1.png)
![User Interface](/docs/veazy2.png)

</div>

</details>

## 📲 Hinzufügen der PWA zu Ihrem Startbildschirm

<details>
<summary><b>Klicken, um Schritte zum Hinzufügen der PWA anzuzeigen</b></summary>
<br>

Progressive Web Apps können wie native Apps auf Ihrem Gerät installiert werden.

### Auf Android:
1. Öffnen Sie die PWA in Chrome.
2. Tippen Sie auf das Browser-Menü (normalerweise drei Punkte in der oberen rechten Ecke).
3. Tippen Sie auf "Zum Startbildschirm hinzufügen".

### Auf iOS:
Safari unterstützt kein Web Bluetooth, daher kann sich eine über Safari installierte App nicht mit Ihrem Gerät verbinden. Öffnen Sie die App stattdessen in einem Web-Bluetooth-Browser wie [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055).

</details>



## 🛠️ Entwicklung und Build

<details>
<summary><b>Klicken, um Schritte für Entwicklung und Build anzuzeigen</b></summary>
<br>

**Voraussetzung:** Node.js 22 oder neuer.

1. Klonen Sie das Repository:
   ```bash
   git clone https://github.com/firsttris/reactive-volcano-app.git
   ```
2. Navigieren Sie in das Projektverzeichnis:
   ```bash
   cd reactive-volcano-app
   ```
3. Installieren Sie die Abhängigkeiten:
   ```bash
   npm install
   ```
4. Starten Sie den Entwicklungsserver:
   ```bash
   npm run dev
   ```
5. Um das Projekt zu bauen:
   ```bash
   npm run build        # für GitHub Pages (ausgeliefert unter /reactive-volcano-app/)
   npm run build:root   # für Hosting im Root-Pfad (/), z. B. Docker
   ```

**Qualitätsprüfungen:**

```bash
npm run typecheck    # TypeScript
npm run lint         # Biome (npm run lint:fix zum automatischen Beheben)
npm test             # Unit-Tests (Vitest)
npm run test:e2e     # End-to-End-Tests (Playwright)
```

</details>

### 🐛 Remote-Debugging auf Android

<details>
<summary><b>Klicken, um Schritte für Remote-Debugging anzuzeigen</b></summary>
<br>

1. **USB-Debugging aktivieren** auf Ihrem Android-Gerät.
2. **Gerät verbinden** über USB.
3. **Bluetooth Web API für HTTP aktivieren**: Gehen Sie zu `chrome://flags/#unsafely-treat-insecure-origin-as-secure` in Ihrem Chrome-Browser auf dem PC.
4. **Geben Sie Ihre lokale IP-Adresse ein**: Fügen Sie die IP Ihres Entwicklungsrechners hinzu, aktivieren Sie die Option und starten Sie Chrome neu.
   ![unsafely-treat-insecure-origin-as-secure](docs/chrome-insecure-origins.png)
5. **Öffnen Sie die URL Ihres lokalen Servers**: Öffnen Sie `http://<IHRE_IP>:5173/` auf Ihrem Android-Gerät.
6. **Remote-Debugging aktivieren**: Gehen Sie auf Ihrem PC zu `chrome://inspect/#devices`.
   ![inspect](docs/inspect.png)
7. **Debuggen**: Klicken Sie auf "inspect", um die DevTools zu öffnen.

</details>

## ⚠️ Verbindungsprobleme und Fallstricke

- **Einzelverbindung**: Der Volcano kann nur eine Bluetooth-Verbindung gleichzeitig aufrechterhalten. Trennen Sie bestehende Verbindungen, bevor Sie ein neues Gerät koppeln.

### 🔍 Keine Geräte gefunden? Fehlersuche mit Bluetooth Internals

Chrome bringt eine eingebaute Diagnoseseite mit, mit der Sie herausfinden können, ob das Problem am Adapter, am Browser oder am Gerät liegt.

1. **Adapter prüfen**: Öffnen Sie `chrome://bluetooth-internals` und wählen Sie **Adapter**. *Present* und *Powered* müssen beide einen grünen Haken zeigen. Ein rotes Kreuz bei *Discoverable* und *Discovering* ist normal, solange kein Scan läuft.
   - Fehlt der Adapter, kann Chrome nicht auf Bluetooth zugreifen. Prüfen Sie unter Linux `bluetoothctl show` (muss `Powered: yes` anzeigen). Ein als Flatpak installiertes Chrome kann BlueZ eventuell nicht erreichen – nutzen Sie stattdessen das native Paket.
2. **Nach dem Gerät suchen**: Schalten Sie Ihr Gerät ein, gehen Sie zu **Devices** und klicken Sie auf **Start Scan**.
   - **Gerät erscheint**: Bluetooth funktioniert, das Problem liegt im Browser. Stellen Sie sicher, dass Sie einen unterstützten Browser verwenden (siehe [Voraussetzungen](#-voraussetzungen)). Aktivieren Sie unter Linux das Web-Bluetooth-Flag und zusätzlich `chrome://flags/#enable-experimental-web-platform-features` und starten Sie Chrome neu.
   - **Gerät erscheint nicht**: Das Gerät sendet keine Advertisements. Vermutlich ist es noch mit einem anderen Gerät verbunden (z. B. Ihrem Handy mit der offiziellen App). Trennen Sie die Verbindung dort oder schalten Sie Bluetooth am Handy aus und starten Sie das Gerät neu.
3. **Linux-CLI-Check** (optional): `bluetoothctl scan le` sollte Ihr Gerät auflisten (z. B. `STORZ&BICKEL…` oder `S&B…`).

## 🤝 Mitwirken

Möchten Sie zu diesem Projekt beitragen?
- Besuchen Sie unsere [Issues-Seite](https://github.com/firsttris/reactive-volcano-app/issues).
- Fühlen Sie sich frei, Pull-Requests einzureichen oder Issues für Bugs und Feature-Vorschläge zu öffnen.

## ⚖️ Code-Eigentum & Lizenz

**Code-Eigentum**:
Dieses Projekt wurde mit größter Sorgfalt entwickelt, um die Rechte von Storz & Bickel zu respektieren. Der gesamte Code wurde von Grund auf neu geschrieben. Assets sind Open Source. Falls Bedenken bestehen, kontaktieren Sie mich bitte vor rechtlichen Schritten.

**Lizenz**:
Diese Arbeit ist derzeit unter einer [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/) lizenziert.