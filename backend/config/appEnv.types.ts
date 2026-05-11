/** Keys mirrored to `process.env` (UPPER_SNAKE). Omit or leave empty to skip setting. */
export type AppEnv = {
  PORT?: string;
  NODE_ENV?: string;
  /** Full URI; if set, overrides Atlas split fields. Special characters in password must be URL-encoded. */
  MONGODB_URL?: string;
  /** Build `mongodb+srv://…` with encoded password (recommended when password has @, #, :, etc.). */
  MONGODB_ATLAS_USER?: string;
  MONGODB_ATLAS_PASSWORD?: string;
  MONGODB_ATLAS_CLUSTER?: string;
  MONGODB_ATLAS_DB?: string;
  CLIENT_URL?: string;
  FRONTEND_URL?: string;
  FRONTEND_ALT_URL?: string;
  ADMIN_URL?: string;
  ADMIN_ALT_URL?: string;
  CORS_EXTRA_ORIGINS?: string;
  API_URL?: string;
  RATE_LIMIT_MAX?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SERVICE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_FOLDER?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
};
