import type { AppEnv } from "./appEnv.types.js";

/**
 * Committed backend config for deployment. This replaces `.env` for values that
 * the Render backend needs at runtime.
 */
export const appEnvProduction: AppEnv = {
  API_URL: "https://volt-backend-20cc.onrender.com",
  ADMIN_URL: "https://volt-admin.onrender.com",
  ADMIN_ALT_URL: "https://volt-admin.onrender.com",
  JWT_SECRET: "volt-prod-jwt-secret-ts-config-2026-change-before-public-release",
  JWT_EXPIRES_IN: "7d",
};
