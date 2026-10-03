import { paraglideVitePlugin } from "@inlang/paraglide-js";
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
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Reactive Volcano App",
        short_name: "Volcano App",
        icons: [
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
