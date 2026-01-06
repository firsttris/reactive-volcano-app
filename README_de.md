# Reactive Vaporizer App

# Einführung

Der Volcano, Venty, Veazy und Crafty, hergestellt von Storz & Bickel in Tuttlingen, Deutschland, sind bekannte hochwertige Vaporizer. Diese Geräte können über die Bluetooth Web API gesteuert werden.

Dieses Projekt zeigt, wie man modernste Technologie nutzt, um diese Geräte über die Web Bluetooth API zu steuern.

# Code-Eigentum

Bitte beachten Sie, dass dieses Projekt mit größter Sorgfalt entwickelt wurde, um die Rechte von Storz & Bickel zu respektieren und nicht zu verletzen.

Der gesamte Code in diesem Repository wurde von mir von Grund auf neu geschrieben. Ich habe eine andere Sprache und andere Technologien verwendet.
Alle in diesem Projekt verwendeten Assets sind Open Source und frei unter ihren jeweiligen Lizenzen nutzbar. Dieses Projekt enthält kein proprietäres oder urheberrechtlich geschütztes Material.

Falls es Bedenken oder Probleme gibt, kontaktieren Sie mich bitte, bevor Sie rechtliche Schritte einleiten.

# Motivation

Die Motivation hinter der Implementierung einer WebApp für Storz & Bickel Geräte:

- Nutzung modernster Technologie, um eine Vaporizer-Steuerungs-App zu bauen.
- Interesse an der Reverse-Engineering von Geräten mit der Web Bluetooth API.
- Demonstration, warum eine reaktive Anwendung die bessere Wahl für bidirektionale Bluetooth-Kommunikation ist.

# Geräteunterstützung
Diese App unterstützt die Volcano, Venty, Veazy und Crafty Geräte von Storz & Bickel. Für Crafty werden sowohl neue als auch alte Firmware-Versionen unterstützt. Beachten Sie, dass verfügbare Funktionen je nach Gerätemodell variieren können.

# Testen Sie meine App

Greifen Sie auf meine WebApp zu und testen Sie sie über diesen [Link](https://firsttris.github.io/reactive-volcano-app/)

# Technologie-Stack

Dieses Projekt basiert auf einer soliden Grundlage modernster Technologien, um eine hohe Leistung zu bieten:

- **[SolidJS](https://www.solidjs.com/)**: Eine deklarative JavaScript-Bibliothek zum Erstellen von Benutzeroberflächen.
- **[TypeScript](https://www.typescriptlang.org/)**: Eine stark typisierte Obermenge von JavaScript, die statische Typen hinzufügt.
- **[Styled-Components](https://styled-components.com/)**: Visuelle Primitive für das Komponentenzeitalter.
- **[Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)**: Eine Schnittstelle, die die Möglichkeit bietet, sich mit Bluetooth Low Energy Peripheriegeräten zu verbinden und zu interagieren.
- **[p-queue](https://github.com/sindresorhus/p-queue)**: Eine Promise-Queue mit Parallelitätskontrolle, verwendet zur Optimierung der Bluetooth-Kommunikation.

# Browser-Unterstützung

Die App unterstützt Chrome und den Bluefy BLE Browser in iOS.

# Benutzeroberfläche Übersicht

Die Benutzeroberfläche ist responsiv und für Desktop- und Mobilgeräte optimiert.

## Klicken Sie auf das Bluetooth-Symbol, um die Bluetooth-Suche zu starten.
![Bluetooth Discovery](/docs/bluetooth-connect.png)

## Steuern Sie mühelos Ihr Storz & Bickel Gerät.
![User Interface](/docs/ui-1.png)
![User Interface](/docs/ui-2.png)

# Veazy Venty
![User Interface](/docs/veazy1.png)
![User Interface](/docs/veazy2.png)

# Funktionen
Die Anwendung bietet eine Vielzahl von Funktionen, einschließlich:

## App-Funktionen

- Dunkelmodus
- Responsive UI
- Lokalisierung für Deutsch und Englisch
- PWA (Progressive Web App)

## Hinzufügen der PWA zu Ihrem Startbildschirm

Progressive Web Apps können wie native Apps auf Ihrem Gerät installiert werden. Hier erfahren Sie, wie Sie unsere PWA zu Ihrem Startbildschirm hinzufügen:

### Auf Android:
1. Öffnen Sie die PWA in Ihrem Browser (Chrome, Firefox usw.).
2. Tippen Sie auf das Browser-Menü (normalerweise drei Punkte in der oberen rechten Ecke).
3. Tippen Sie auf "Zum Startbildschirm hinzufügen".

### Auf iOS:
1. Öffnen Sie die PWA in Safari.
2. Tippen Sie auf die Teilen-Schaltfläche (das Feld mit einem nach oben zeigenden Pfeil).
3. Scrollen Sie nach unten und tippen Sie auf "Zum Startbildschirm hinzufügen".

Nach diesen Schritten erscheint die PWA als Symbol auf Ihrem Startbildschirm, und Sie können sie wie eine native App verwenden.

## Nicht implementierte Funktionen
Einige Funktionen wurden nicht implementiert:

- Workflows
- Analytics

# Voraussetzungen für Linux

Unter Linux gibt es keine offizielle Unterstützung für die Web Bluetooth API in Chrome.
Sie können jedoch trotzdem die Web Bluetooth API in Chrome unter Linux aktivieren. Folgen Sie diesen Schritten:

1. Öffnen Sie Chrome und navigieren Sie zu `chrome://flags/#enable-web-bluetooth`.
2. Aktivieren Sie das Flag wie im Bild unten gezeigt.

![Aktivierung der Web Bluetooth API in Chrome](/docs/web-bluetooth-api.png)

# Entwicklung und Build

Um dieses Projekt zu entwickeln und zu bauen, folgen Sie diesen Schritten:

1. Klonen Sie das Repository: `git clone https://github.com/firsttris/reactive-volcano-app.git`
2. Navigieren Sie in das Projektverzeichnis: `cd reactive-volcano-app`
3. Installieren Sie die Abhängigkeiten: `npm install`
4. Starten Sie den Entwicklungsserver: `npm run dev`
5. Um das Projekt zu bauen, verwenden Sie: `npm run build`

## Schritte zur Remote-Debugging der App auf Ihrem Android-Gerät

Folgen Sie diesen Schritten, um die Anwendung auf einem Android-Gerät zu entwickeln und zu testen:

1. **USB-Debugging aktivieren**: Gehen Sie zu den Entwicklereinstellungen Ihres Android-Geräts und aktivieren Sie USB-Debugging.

2. **Gerät verbinden**: Verbinden Sie Ihr Android-Gerät mit Ihrem Entwicklungsrechner über ein USB-Kabel. Wenn Sie dazu aufgefordert werden, wählen Sie die Option "Dateiübertragung / Android Auto".

3. **Bluetooth Web API für HTTP aktivieren**: Standardmäßig funktioniert die Bluetooth Web API nur für HTTPS. Um sie für HTTP zu aktivieren, gehen Sie zu `chrome://flags/#unsafely-treat-insecure-origin-as-secure` in Ihrem Chrome-Browser.

4. **Geben Sie Ihre lokale IP-Adresse ein**: Geben Sie im bereitgestellten Feld die IP-Adresse Ihres lokalen Entwicklungsrechners ein. Aktivieren Sie die Option, speichern Sie Ihre Änderungen und laden Sie Chrome neu.
   ![unsafely-treat-insecure-origin-as-secure](docs/chrome-insecure-origins.png)

5. **Öffnen Sie die URL Ihres lokalen Servers**: Öffnen Sie in Chrome auf Ihrem Android-Gerät die URL Ihres lokalen Entwicklungsservers (z.B. `http://192.168.178.134:5174/`). Ersetzen Sie die Beispiel-IP-Adresse durch Ihre eigene.

6. **Remote-Debugging aktivieren**: Gehen Sie auf Ihrem Entwicklungsrechner zu `chrome://inspect/#devices`, um sich über Remote-Debugging mit Chrome auf Ihrem Android-Gerät zu verbinden.
   ![inspect](docs/inspect.png)

7. **Debuggen Sie die Anwendung**: Nach Abschluss der vorherigen Schritte öffnet sich eine neue Chrome DevTools-Konsole auf Ihrem Entwicklungsrechner. Sie können diese Konsole verwenden, um die Anwendung auf Ihrem Android-Gerät zu debuggen.

# Verbindungsprobleme und Fallstricke

- Es ist wichtig zu beachten, dass der Volcano nur eine Bluetooth-Verbindung mit einem Gerät gleichzeitig aufrechterhalten kann. Um ihn mit einem anderen Gerät zu verbinden, müssen Sie zuerst die bestehende Verbindung trennen.

# Mitwirken

Möchten Sie zu diesem Projekt beitragen?

Besuchen Sie unsere [Issues-Seite](https://github.com/firsttris/reactive-volcano-app/issues) für die neuesten Issues und Feature-Anfragen.

Fühlen Sie sich frei, Pull-Requests einzureichen oder Issues für Bugs und Feature-Vorschläge zu öffnen.

# Lizenz

Diese Arbeit ist derzeit unter einer [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/) lizenziert.