import type { AppEnv } from "./appEnv.types.js";

/**
 * Copy this file to `appEnv.local.ts` (gitignored) and set real values.
 *
 *   copy config\\appEnv.local.example.ts config\\appEnv.local.ts
 *
 * MongoDB Atlas: prefer split fields (password is URL-encoded automatically).
 */
export const appEnvLocal: Partial<AppEnv> = {
  // MONGODB_ATLAS_USER: "",
  // MONGODB_ATLAS_PASSWORD: "",
  // MONGODB_ATLAS_CLUSTER: "cluster0.xxxxx.mongodb.net",
  // MONGODB_ATLAS_DB: "ecommerce",
  // Or a full URI (encode special chars in the password yourself):
  // MONGODB_URL: "mongodb+srv://user:pass@cluster/db?retryWrites=true&w=majority",
  // JWT_SECRET: "your-secret",
  // API_URL: "http://localhost:5000",
};
