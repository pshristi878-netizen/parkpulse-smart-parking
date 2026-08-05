// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { copyFileSync, readdirSync, existsSync } from "fs";
import type { Plugin } from "vite";

/**
 * After `vite-plugin-pwa` writes sw.js + workbox-*.js into `dist/`, copy them
 * into `public/` so Nitro's publicAssets step includes them in `.output/public/`.
 * These generated files are listed in .gitignore.
 */
function copySwToPublic(): Plugin {
  return {
    name: "parkpulse-copy-sw-to-public",
    apply: "build",
    enforce: "post",
    closeBundle() {
      if (!existsSync("dist")) return;
      const swFiles = readdirSync("dist").filter(
        (f) =>
          f === "sw.js" || (f.startsWith("workbox-") && f.endsWith(".js")),
      );
      for (const file of swFiles) {
        try {
          copyFileSync(`dist/${file}`, `public/${file}`);
        } catch {
          /* ignore */
        }
      }
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        // Registration is handled manually via the usePWA hook in __root.tsx
        // (safest approach for SSR frameworks where there is no plain index.html)
        injectRegister: null,
        workbox: {
          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,webp,woff,woff2,ttf,eot}",
          ],
          // SSR navigation handled by the server — don't intercept page loads
          navigateFallback: null,
          runtimeCaching: [
            // Unsplash parking photos — cache-first for 30 days
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "parkpulse-images",
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Supabase REST / Realtime — network-first so live data stays fresh
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "parkpulse-api",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5,
                },
                networkTimeoutSeconds: 10,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          name: "ParkPulse — Smart Parking",
          short_name: "ParkPulse",
          description:
            "Find, reserve and pay for parking in seconds. Live availability, QR entry.",
          theme_color: "#34C759",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          categories: ["travel", "utilities", "lifestyle"],
          icons: [
            {
              src: "/pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        devOptions: {
          // Disable SW in dev — avoids cache confusion during development
          enabled: false,
        },
      }),
      copySwToPublic(),
    ],
  },
});
