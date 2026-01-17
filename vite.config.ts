import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  optimizeDeps: {
    include: ["country-flag-icons/react/3x2"],
  },
  server: {
    cors: true,
    proxy: {
      // In dev, forward API calls to the local express server (server.ts)
      "/steam": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/store": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
