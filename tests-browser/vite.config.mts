import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dataDir = resolve(import.meta.dirname, "../data");

export default defineConfig({
  test: {
    browser: {
      instances: [{ browser: "chromium" },{ browser: "firefox" }, { browser: "webkit" }],
      enabled: true,
      provider: playwright(),
    },
  },
  plugins: [
    {
      name: "serve-data-files",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/data/")) {
            const fileName = req.url.slice(6);
            const filePath = resolve(dataDir, fileName);
            if (existsSync(filePath)) {
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end(readFileSync(filePath, "utf-8"));
              return;
            }
          }
          next();
        });
      },
    },
  ],
});
