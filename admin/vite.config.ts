import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { publicEnv } from "./env.public";

export default defineConfig(() => {
  const proxyTarget =
    publicEnv.VITE_BACKEND_ORIGIN?.trim().replace(/\/$/, "") ||
    "https://volt-backend-20cc.onrender.com";
  const port = Number(publicEnv.VITE_ADMIN_PORT || 5174) || 5174;

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      port,
      strictPort: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
