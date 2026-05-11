/**
 * Public admin app settings (replaces `.env` for VITE_* values).
 */
export const publicEnv = {
  VITE_API_URL: "",
  VITE_BACKEND_ORIGIN: "http://localhost:5000",
  VITE_ADMIN_PORT: "5174",
  /** Optional: customer storefront URL for links in admin UI. */
  VITE_STORE_URL: "",
} as const;
