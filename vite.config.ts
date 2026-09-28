import legacy from "@vitejs/plugin-legacy";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
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
