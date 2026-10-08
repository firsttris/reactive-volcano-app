import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    // messages/{en,de}.json → src/paraglide (typed message functions). No
    // backend and no switcher: the browser language decides, English otherwise.
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["preferredLanguage", "baseLocale"],
    }),
    legacy({
      targets: ["iOS >= 10", "Safari >= 10"],
    }),
    solid(),
    tailwindcss(),
    VitePWA({
      // UpdatePrompt activates new versions, asking first while connected
      registerType: "prompt",
      // The globPatterns below already cover the icons
      includeManifestIcons: false,
      // Icons are rendered from scripts/icons/icon.svg: npm run icons
      manifest: {
        name: "Reactive Volcano App",
        short_name: "Volcano App",
        description:
          "Control Storz & Bickel vaporizers (Volcano Hybrid, Venty, Veazy, Crafty) via Web Bluetooth",
        lang: "en",
        display: "standalone",
        // Matches the dark theme, so the splash screen does not flash white
        theme_color: "#09090b",
        background_color: "#09090b",
        categories: ["utilities", "lifestyle"],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        // Shown in the richer install dialog on Android
        screenshots: [
          {
            src: "screenshots/control.png",
            sizes: "1082x2202",
            type: "image/png",
            form_factor: "narrow",
            label: "Temperature control",
          },
          {
            src: "screenshots/workflows.png",
            sizes: "1082x2202",
            type: "image/png",
            form_factor: "narrow",
            label: "Workflows",
          },
        ],
      },
      workbox: {
        // Fonts belong to the offline copy; the legacy bundles only serve
        // browsers without service workers. Screenshots, the 512 px icons and
        // the Apple touch icon are only read when installing, which needs a
        // connection anyway (pwa-192x192.png stays: notifications use it)
        globPatterns: ["**/*.{js,css,html,svg,png,ico}", "**/*latin*.woff2"],
        // The documentation website is published next to the app under /docs/
        // (build.yml); it is not an app route, so the service worker must not
        // answer it with the app's index.html
        navigateFallbackDenylist: [/\/docs\//],
        globIgnores: [
          "**/*-legacy-*.js",
          "screenshots/**",
          "*-512x512.png",
          "apple-touch-icon.png",
        ],
      },
    }),
  ],
});
