/**
 * Public storefront settings (replaces `.env` for VITE_* values).
 * Safe to commit non-secret defaults; override locally as needed.
 */
export const publicEnv = {
  /** Browser API base when not using same-origin `/api`. */
  VITE_API_URL: "https://volt-backend-20cc.onrender.com",
  /** Dev proxy + SSR: Express origin (no trailing slash). */
  VITE_BACKEND_ORIGIN: "https://volt-backend-20cc.onrender.com",
  VITE_RAZORPAY_KEY_ID: "rzp_test_Snh6GjGsBzuwL6",
} as const;
