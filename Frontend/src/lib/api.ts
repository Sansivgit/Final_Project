import { publicEnv } from "../../env.public";

/** Express API base from `publicEnv.VITE_API_URL` (no trailing slash). When unset, dev uses `VITE_BACKEND_ORIGIN` + path; production client uses same-origin `/api`. */
export function getApiBaseUrl(): string {
  const raw = publicEnv.VITE_API_URL;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().replace(/\/$/, "");
  }
  return "";
}

function ssrBackendBase(): string {
  const fromConfig = publicEnv.VITE_BACKEND_ORIGIN?.trim().replace(/\/$/, "") || "";
  if (fromConfig) return fromConfig;
  return "http://localhost:5000";
}

function isHtmlPayload(text: string): boolean {
  const s = text.trimStart().slice(0, 64).toLowerCase();
  return s.startsWith("<!doctype") || s.startsWith("<html");
}

/** Full URL for API paths: absolute when `VITE_API_URL` is set. In dev, uses backend origin from `env.public.ts` so `/api` is not swallowed by the SPA server. */
export function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base) return `${base}${p}`;
  const backend = ssrBackendBase();
  // Dev (browser + SSR): hit Express directly — TanStack/Vite dev sometimes serves HTML for `/api/*`.
  if (import.meta.env.DEV && backend) {
    return `${backend}${p}`;
  }
  if (typeof window === "undefined") {
    return `${backend}${p}`;
  }
  return p;
}

export type AuthApiResponse = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  token: string;
};

export type ProfileApiResponse = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  createdAt?: string;
};

type ApiErrorBody = {
  message?: string;
  errors?: Array<{ msg?: string; message?: string }>;
};

async function readResponseBody(res: Response): Promise<Record<string, unknown>> {
  const raw = await res.text();
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html") || isHtmlPayload(trimmed)) {
    return {
      message:
        "The server returned a web page instead of API data. Check that Express is running and matches VITE_BACKEND_ORIGIN in env.public.ts.",
    };
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return { message: trimmed.slice(0, 200) };
  }
}

function parseApiError(data: ApiErrorBody, res: Response): string {
  if (Array.isArray(data.errors)) {
    for (const err of data.errors) {
      if (!err || typeof err !== "object") continue;
      const msg =
        typeof err.msg === "string"
          ? err.msg
          : typeof err.message === "string"
            ? err.message
            : "";
      if (msg) return msg;
    }
  }
  if (typeof data.message === "string" && data.message) {
    return data.message;
  }
  const st = res.statusText?.trim();
  if (st) return `${st} (${res.status})`;
  return `Request failed (${res.status})`;
}

function apiNetworkErrorMessage(): string {
  if (getApiBaseUrl()) {
    return "Cannot reach the API. Check your connection, or that the backend allows this origin in CORS (CLIENT_URL / FRONTEND_URL / ADMIN_URL).";
  }
  return "Cannot reach the API. Start the backend (see VITE_BACKEND_ORIGIN in env.public.ts), or set VITE_API_URL.";
}

/** POST JSON to the API; throws Error with a user-facing message on failure. */
export async function postAuthJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = resolveApiUrl(path);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(apiNetworkErrorMessage());
  }
  const data = (await readResponseBody(res)) as T & ApiErrorBody;
  if (!res.ok) {
    throw new Error(parseApiError(data, res));
  }
  return data as T;
}

/** Newsletter signup (public). */
export async function subscribeNewsletter(email: string): Promise<{ message: string }> {
  return postAuthJson<{ message: string }>("/api/subscribers", {
    email: email.trim().toLowerCase(),
  });
}

/** GET JSON with Bearer token. */
export async function getAuthJson<T>(path: string, token: string): Promise<T> {
  const url = resolveApiUrl(path);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(apiNetworkErrorMessage());
  }
  const data = (await readResponseBody(res)) as T & ApiErrorBody;
  if (!res.ok) {
    throw new Error(parseApiError(data, res));
  }
  return data as T;
}

/** POST/PATCH/DELETE JSON with Bearer token. */
export async function requestAuthJson<T>(
  path: string,
  token: string,
  options: { method?: string; body?: Record<string, unknown> },
): Promise<T> {
  const url = resolveApiUrl(path);
  const method = options.method ?? "POST";
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (options.body) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(apiNetworkErrorMessage());
  }
  const data = (await readResponseBody(res)) as T & ApiErrorBody;
  if (!res.ok) {
    throw new Error(parseApiError(data, res));
  }
  return data as T;
}

/** GET current user from DB (requires valid JWT from login/register). */
export async function getAuthProfile(token: string): Promise<ProfileApiResponse> {
  const url = resolveApiUrl("/api/auth/profile");
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(apiNetworkErrorMessage());
  }
  const data = (await readResponseBody(res)) as ProfileApiResponse & ApiErrorBody;
  if (!res.ok) {
    throw new Error(parseApiError(data, res));
  }
  return data as ProfileApiResponse;
}

export async function updateProfile(
  token: string,
  body: { name?: string; phone?: string },
): Promise<ProfileApiResponse> {
  return requestAuthJson<ProfileApiResponse>("/api/auth/profile", token, {
    method: "PATCH",
    body: body as Record<string, unknown>,
  });
}

export async function changePassword(
  token: string,
  body: { currentPassword: string; newPassword: string },
): Promise<{ message: string }> {
  return requestAuthJson("/api/auth/change-password", token, {
    method: "POST",
    body: body as Record<string, unknown>,
  });
}

export async function requestForgotPassword(email: string): Promise<{ message: string }> {
  return postAuthJson("/api/auth/forgot-password", {
    email: email.trim().toLowerCase(),
  });
}

export type ResetPasswordResponse = { message: string; token: string };

export async function requestResetPassword(
  resetToken: string,
  password: string,
): Promise<ResetPasswordResponse> {
  return postAuthJson<ResetPasswordResponse>(
    `/api/auth/reset-password/${encodeURIComponent(resetToken)}`,
    { password },
  );
}
