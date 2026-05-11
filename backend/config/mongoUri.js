/** Default local MongoDB — database name `ecommerce`. */
export const DEFAULT_LOCAL_MONGO_URI = "mongodb://localhost:27017/ecommerce";

/**
 * Resolves Mongo connection string:
 * 1. `MONGODB_URL` if set (must URL-encode special chars in userinfo yourself).
 * 2. Else `MONGODB_ATLAS_USER` + `MONGODB_ATLAS_PASSWORD` + `MONGODB_ATLAS_CLUSTER` (+ optional `MONGODB_ATLAS_DB`) — password is encoded safely.
 */
export function resolveMongoConnectionString() {
  const direct = process.env.MONGODB_URL?.trim();
  if (direct) return direct;

  const user = process.env.MONGODB_ATLAS_USER?.trim();
  const pass = process.env.MONGODB_ATLAS_PASSWORD;
  const cluster = process.env.MONGODB_ATLAS_CLUSTER?.trim();
  const db = process.env.MONGODB_ATLAS_DB?.trim() || "ecommerce";
  if (user && typeof pass === "string" && pass !== "" && cluster) {
    const u = encodeURIComponent(user);
    const p = encodeURIComponent(pass.trim());
    return `mongodb+srv://${u}:${p}@${cluster}/${db}?retryWrites=true&w=majority`;
  }

  return DEFAULT_LOCAL_MONGO_URI;
}
