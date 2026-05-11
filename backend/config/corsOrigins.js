import { normalizeUrl } from './urls.js';

function splitCsv(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Allowed `Origin` values for Express `cors` and Socket.IO`.
 *
 * Configure in `config/appEnv.local.ts` (or defaults in `appEnv.defaults.ts`):
 * - `CLIENT_URL` — optional comma-separated list; if set, it is the full CORS allowlist.
 * - Otherwise origins are built from `FRONTEND_URL`, `FRONTEND_ALT_URL`, `ADMIN_URL`,
 *   `ADMIN_ALT_URL`, and optional `CORS_EXTRA_ORIGINS` (comma-separated).
 */
export function getCorsAllowedOrigins() {
  const explicit = splitCsv(process.env.CLIENT_URL);
  if (explicit.length > 0) {
    return [...new Set(explicit.map(normalizeUrl).filter(Boolean))];
  }

  const named = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_ALT_URL,
    process.env.ADMIN_URL,
    process.env.ADMIN_ALT_URL,
    ...splitCsv(process.env.CORS_EXTRA_ORIGINS),
  ]
    .map(normalizeUrl)
    .filter(Boolean);

  return [...new Set(named)];
}
