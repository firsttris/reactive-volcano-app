# E2E Tests mit Playwright

Dieses Verzeichnis enthält End-to-End-Tests für die Reactive Volcano App mit Playwright.

## 🎭 Über die Tests

Die Tests verwenden einen **Bluetooth-Mock**, da echte Bluetooth-Geräte in CI-Umgebungen oder beim lokalen Testen nicht verfügbar sind. Der Mock simuliert die Web Bluetooth API und ermöglicht vollständige Tests aller Geräte-Interaktionen.

## 🎯 Was wurde implementiert?

### 1. Bluetooth-Mock-System
- **Vollständiger Web Bluetooth API Mock** für Tests ohne echte Hardware
- Unterstützung für alle 4 Gerätetypen: Volcano, Crafty, Venty, Veazy
- Simulation von Services, Characteristics, Lesen/Schreiben, Notifications

### 2. Test-Suites
- **app.spec.ts** - Allgemeine App-Tests (Laden, Dark Mode, Responsive)
- **volcano.spec.ts** - Volcano-spezifische Tests (Verbindung, Temperatur, Heizung)
- **crafty.spec.ts** - Crafty-spezifische Tests
- **venty-veazy.spec.ts** - Venty/Veazy-spezifische Tests

### 3. Test-Helper
- Custom Fixtures für einfache Bluetooth-Mock-Integration
- Wiederverwendbare Test-Utilities

## 📁 Struktur

```
e2e/
├── helpers/
│   ├── bluetooth-mock.ts    # Bluetooth API Mock
│   └── fixtures.ts          # Test-Fixtures
├── app.spec.ts              # Allgemeine App-Tests
├── volcano.spec.ts          # Volcano-Geräte-Tests
├── crafty.spec.ts           # Crafty-Geräte-Tests
└── venty-veazy.spec.ts      # Venty/Veazy-Geräte-Tests
```

## 🔧 Bluetooth-Mock

Der Bluetooth-Mock in `helpers/bluetooth-mock.ts` simuliert:

- ✅ Geräteerkennung (`navigator.bluetooth.requestDevice`)
- ✅ GATT-Server-Verbindung
- ✅ Services und Characteristics
- ✅ Lesen und Schreiben von Werten
- ✅ Notifications
- ✅ Verschiedene Gerätetypen (Volcano, Crafty, Venty, Veazy)

### Verwendung im Test

```typescript
import { test, expect } from './helpers/fixtures';

test('Mein Test', async ({ page, bluetoothDevice }) => {
  // Bluetooth-Mock für Volcano initialisieren
  await bluetoothDevice('VOLCANO');
  
  await page.goto('/');
  
  // Test durchführen...
});
```

### Unterstützte Gerätetypen

- `VOLCANO` - S&B Volcano Hybrid
- `CRAFTY` - Storz & Bickel Crafty
- `VENTY` - S&B Venty
- `VEAZY` - S&B Veazy

## 🔍 Debugging

### Browser DevTools öffnen
```bash
PWDEBUG=1 bun run test:e2e
```

### Trace Viewer verwenden
Nach einem fehlgeschlagenen Test:
```bash
bunx playwright show-trace trace.zip
```

### Screenshots bei Fehlern
Screenshots werden automatisch bei Fehlern erstellt und sind im Test-Report verfügbar.

## 🤖 CI/CD Integration

Die Tests sind für CI/CD vorbereitet:

- Automatische Browser-Installation
- Headless-Modus in CI
- Retry-Mechanismus bei Fehlern
- HTML-Report-Generierung

### GitHub Actions Beispiel
```yaml
- name: Install Playwright Browsers
  run: bunx playwright install --with-deps

- name: Run E2E tests
  run: bun run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 📝 Neue Tests hinzufügen

1. Erstelle eine neue `.spec.ts` Datei im `e2e/` Verzeichnis
2. Importiere die Test-Fixtures:
   ```typescript
   import { test, expect } from './helpers/fixtures';
   ```
3. Verwende den `bluetoothDevice` Fixture für Tests mit Bluetooth:
   ```typescript
   test('Mein Test', async ({ page, bluetoothDevice }) => {
     await bluetoothDevice('VOLCANO');
     // ...
   });
   ```

## 🛠️ Erweiterung des Bluetooth-Mocks

Um neue Characteristics oder Services hinzuzufügen, bearbeite `helpers/bluetooth-mock.ts`:

```typescript
const deviceConfigs = {
  VOLCANO: {
    services: {
      'service-uuid': {
        characteristics: {
          'characteristic-uuid': {
            properties: { read: true, notify: true, write: false },
            value: new Uint8Array([...]),
          },
        },
      },
    },
  },
};
```

## 💡 Tipps

- Verwende `page.pause()` zum Debuggen während der Test-Ausführung
- Nutze `test.only()` um einzelne Tests auszuführen
- Verwende `test.skip()` um Tests temporär zu überspringen
- Setze `timeout` für langsame Tests: `test.setTimeout(60000)`
- Die Tests laufen komplett **ohne echte Bluetooth-Geräte**
- Ideal für CI/CD-Pipelines
- Lokales Testen ohne Hardware
- Schnelle Feedback-Schleife während der Entwicklung

## 📝 Nächste Schritte

1. **Tests erweitern**: Füge weitere Testfälle hinzu
2. **Mock verbessern**: Mehr Bluetooth-Szenarien abdecken
3. **Screenshots**: Visuelle Regression-Tests hinzufügen
4. **Performance**: Lighthouse-Tests integrieren
