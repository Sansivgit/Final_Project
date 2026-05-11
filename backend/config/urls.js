/** Trim trailing slash from a public URL. */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/$/, '');
}

/** Express public base URL (logs, links). Prefer `API_URL` in appEnv.local.ts. */
export function getApiPublicUrl(fallbackPort) {
  const fromEnv = normalizeUrl(process.env.API_URL);
  if (fromEnv) return fromEnv;
  const p = Number(fallbackPort) || 5000;
  return `http://localhost:${p}`;
}
