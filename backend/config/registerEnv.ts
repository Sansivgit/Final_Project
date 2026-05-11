import { appEnvDefaults } from "./appEnv.defaults.js";
import type { AppEnv } from "./appEnv.types.js";

function applyToProcessEnv(merged: AppEnv) {
  for (const [key, val] of Object.entries(merged) as [keyof AppEnv, string | undefined][]) {
    if (val !== undefined && val !== "") {
      process.env[String(key)] = val;
    }
  }
}

const base: AppEnv = { ...appEnvDefaults };

let local: Partial<AppEnv> = {};
try {
  const mod = await import("./appEnv.local.js");
  const patch = (mod as { appEnvLocal?: Partial<AppEnv>; default?: Partial<AppEnv> }).appEnvLocal
    ?? (mod as { default?: Partial<AppEnv> }).default;
  if (patch && typeof patch === "object") {
    local = patch;
  }
} catch {
  /* optional `appEnv.local.ts` */
}

const merged: AppEnv = { ...base };
for (const [k, v] of Object.entries(local) as [keyof AppEnv, string | undefined][]) {
  if (v !== undefined && v !== "") {
    merged[k] = v;
  }
}
applyToProcessEnv(merged);
