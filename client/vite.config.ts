/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * Serves MSW's service worker in dev when `VITE_MOCK_API=1`, straight from the
 * installed package so it always matches the library version and never ships
 * in a production build (`apply: "serve"`).
 */
function mockServiceWorker(): Plugin {
  const workerPath = fileURLToPath(
    new URL("./node_modules/msw/lib/mockServiceWorker.js", import.meta.url),
  );
  return {
    name: "cadence-mock-service-worker",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/mockServiceWorker.js", (_req, res) => {
        res.setHeader("Content-Type", "text/javascript");
        res.end(readFileSync(workerPath));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const mockApi = env.VITE_MOCK_API === "1";
  return {
    // Router options live in tsr.config.json so `tsr generate` (yarn gen) agrees with Vite.
    // The router plugin must run before the React plugin.
    plugins: [tanstackRouter(), react(), tailwindcss(), ...(mockApi ? [mockServiceWorker()] : [])],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    build: {
      // Read by scripts/bundle-size.ts to measure the entry route's JavaScript.
      manifest: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      // Same origin in dev, so the API's httpOnly session cookies just work.
      // With the mock API on, the service worker answers /api before the proxy.
      proxy: { "/api": "http://localhost:8080" },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      restoreMocks: true,
    },
  };
});
