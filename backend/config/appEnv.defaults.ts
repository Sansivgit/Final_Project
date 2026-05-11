import type { AppEnv } from "./appEnv.types.js";

/**
 * Safe defaults for local development. Override secrets and URLs in
 * `appEnv.local.ts` (see `appEnv.local.example.ts`).
 */
export const appEnvDefaults: AppEnv = {
  PORT: "5000",
  FRONTEND_URL: "https://volt-frontend-x4ed.onrender.com",
  FRONTEND_ALT_URL: "https://volt-frontend-x4ed.onrender.com",
  ADMIN_URL: "https://volt-admin.onrender.com",
  /** Fallback only. Deployment-specific values live in appEnv.production.ts. */
  JWT_SECRET: "volt-dev-jwt-secret-change-in-render",
  JWT_EXPIRES_IN: "7d",
};
