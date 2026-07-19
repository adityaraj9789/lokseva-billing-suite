// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

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
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        includeAssets: ["favicon.ico", "logo.png"],
        manifest: {
          name: "Lokseva Agro Agency — Billing",
          short_name: "LAA Billing",
          description: "Offline GST billing and invoicing for Lokseva Agro Agency.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#166534",
          icons: [
            { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json}"],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "html-pages", networkTimeoutSeconds: 3 },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname),
              handler: "CacheFirst",
              options: { cacheName: "assets", expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
          ],
        },
      }),
    ],
  },
});
