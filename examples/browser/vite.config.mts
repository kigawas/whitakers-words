import { defineConfig } from "vite";
import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";

const dataDir = resolve(import.meta.dirname, "../../data");

const DATA_FILES = ["DICTLINE.GEN", "INFLECTS.LAT", "ADDONS.LAT", "UNIQUES.LAT", "DICTLINE.SUP"];

export default defineConfig({
  publicDir: "public",
  server: {
    fs: {
      allow: [resolve(import.meta.dirname, "../..")],
    },
  },
  plugins: [
    {
      name: "data-files",
      // Dev: serve data files via middleware
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
      // Build: emit data files into dist/data/
      generateBundle() {
        for (const name of DATA_FILES) {
          const filePath = resolve(dataDir, name);
          if (existsSync(filePath)) {
            this.emitFile({
              type: "asset",
              fileName: `data/${name}`,
              source: readFileSync(filePath, "utf-8"),
            });
          }
        }
      },
    },
  ],
});
