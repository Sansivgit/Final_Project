import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { publicEnv } from "./env.public";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    proxy: {
      "/api": {
        target:
          publicEnv.VITE_BACKEND_ORIGIN?.trim().replace(/\/$/, "") ||
          "https://volt-backend-20cc.onrender.com",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
