import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import fs from "node:fs";
import path from "node:path";

const CACHE_DIR = path.resolve(".cache/steam");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    {
      name: "steam-cache",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith("/store/api/appdetails")) return next();
          const id = new URL(req.url, "http://h").searchParams.get("appids");

          if (id && !id.includes(",")) {
            const cache = path.join(CACHE_DIR, `${id}.json`);
            if (fs.existsSync(cache)) return res.end(fs.readFileSync(cache));

            try {
              const r = await fetch(
                `https://store.steampowered.com/api/appdetails?appids=${id}`
              );
              if (r.ok && r.headers.get("content-type")?.includes("json")) {
                const data = (await r.json()) as any;
                if (data?.[id]?.success)
                  fs.writeFileSync(cache, JSON.stringify(data));
                res.setHeader("Content-Type", "application/json");
                return res.end(JSON.stringify(data));
              }
            } catch (e) {
              console.error("Vite cache fetch error:", e);
            }
          }
          next();
        });
      },
    },
  ],
  optimizeDeps: {
    include: ["country-flag-icons/react/3x2"],
  },
  server: {
    cors: true,
    proxy: {
      "/steam": {
        target: "https://api.steampowered.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/steam/, ""),
      },
      "/store": {
        target: "https://store.steampowered.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/store/, ""),
      },
    },
  },
});
