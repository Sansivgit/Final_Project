/**
 * Public admin app settings (replaces `.env` for VITE_* values).
 */
export const publicEnv = {
  VITE_API_URL: "https://volt-backend-20cc.onrender.com",
  VITE_BACKEND_ORIGIN: "https://volt-backend-20cc.onrender.com",
  VITE_ADMIN_PORT: "5174",
  /** Optional: customer storefront URL for links in admin UI. */
  VITE_STORE_URL: "",
} as const;
