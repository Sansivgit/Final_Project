import type { AppEnv } from "./appEnv.types.js";

/**
 * Safe defaults for local development. Override secrets and URLs in
 * `appEnv.local.ts` (see `appEnv.local.example.ts`).
 */
export const appEnvDefaults: AppEnv = {
  PORT: "5000",
  FRONTEND_URL: "http://localhost:5173",
  /** TanStack / Lovable dev often uses 8080 — must match browser origin for CORS. */
  FRONTEND_ALT_URL: "http://localhost:8080",
  ADMIN_URL: "http://localhost:5174",
  CORS_EXTRA_ORIGINS: "http://127.0.0.1:5173,http://127.0.0.1:8080",
  JWT_EXPIRES_IN: "7d",
};
