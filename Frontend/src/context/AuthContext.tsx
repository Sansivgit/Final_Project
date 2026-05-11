import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getAuthProfile, postAuthJson, type AuthApiResponse } from "@/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  createdAt?: string;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  /** After password reset API returns a JWT, hydrate session without password. */
  loginWithToken: (authToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

const USER_KEY = "volt:user";
const TOKEN_KEY = "volt:token";

function hasWebStorage(): boolean {
  return typeof window !== "undefined";
}

function clearAllAuthKeys() {
  if (!hasWebStorage()) return;
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode / blocked storage */
  }
}

/** Prefer localStorage (remember me); otherwise session-only auth in sessionStorage. */
function loadStored(): {
  user: User | null;
  token: string | null;
  storage: "local" | "session";
} {
  if (!hasWebStorage()) {
    return { user: null, token: null, storage: "local" };
  }
  try {
    const lU = localStorage.getItem(USER_KEY);
    const lT = localStorage.getItem(TOKEN_KEY);
    const sU = sessionStorage.getItem(USER_KEY);
    const sT = sessionStorage.getItem(TOKEN_KEY);

    const hasLocal = !!(lU && lT);
    const hasSess = !!(sU && sT);

    if (hasLocal && hasSess) {
      clearAllAuthKeys();
      return { user: null, token: null, storage: "local" };
    }
    if (hasLocal) {
      if (sU || sT) {
        clearAllAuthKeys();
        return { user: null, token: null, storage: "local" };
      }
      return { user: JSON.parse(lU!) as User, token: lT, storage: "local" };
    }
    if (hasSess) {
      if (lU || lT) {
        clearAllAuthKeys();
        return { user: null, token: null, storage: "local" };
      }
      return { user: JSON.parse(sU!) as User, token: sT, storage: "session" };
    }
    if (lU || lT || sU || sT) clearAllAuthKeys();
    return { user: null, token: null, storage: "local" };
  } catch {
    clearAllAuthKeys();
    return { user: null, token: null, storage: "local" };
  }
}

function mapAuthResponseToUser(data: AuthApiResponse): User {
  return {
    id: String(data._id),
    name: data.name,
    email: data.email,
  };
}

function mapProfileToUser(p: {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  createdAt?: string | Date;
}): User {
  let createdAt: string | undefined;
  if (p.createdAt != null) {
    createdAt =
      typeof p.createdAt === "string"
        ? p.createdAt
        : new Date(p.createdAt).toISOString();
  }
  return {
    id: String(p._id),
    name: p.name,
    email: p.email,
    avatar: p.avatar?.trim() ? p.avatar : undefined,
    phone: typeof p.phone === "string" && p.phone.trim() ? p.phone.trim() : undefined,
    createdAt,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  /** Lazy init: SSR returns empty; avoids throwing when storage is missing. */
  const [session, setSession] = useState(() => loadStored());
  const { user, token } = session;

  /** After SSR hydration, read tokens from localStorage / sessionStorage on the client. */
  useEffect(() => {
    if (!hasWebStorage()) return;
    setSession(loadStored());
  }, []);

  const persistSession = useCallback(
    (u: User | null, tok: string | null, nextStorage?: "local" | "session") => {
      setSession((prev) => {
        const storage: "local" | "session" =
          u && tok ? (nextStorage ?? prev.storage) : prev.storage;
        clearAllAuthKeys();
        if (u && tok && hasWebStorage()) {
          try {
            const api = storage === "local" ? localStorage : sessionStorage;
            api.setItem(USER_KEY, JSON.stringify(u));
            api.setItem(TOKEN_KEY, tok);
          } catch {
            /* storage full / blocked */
          }
        }
        return {
          user: u,
          token: tok,
          storage: u && tok ? storage : prev.storage,
        };
      });
    },
    [],
  );

  const login: AuthCtx["login"] = async (email, password, rememberMe = false) => {
    const data = await postAuthJson<AuthApiResponse>("/api/auth/login", {
      email: email.trim(),
      password,
    });
    persistSession(mapAuthResponseToUser(data), data.token, rememberMe ? "local" : "session");
  };

  const loginWithToken = useCallback(
    async (authToken: string) => {
      const profile = await getAuthProfile(authToken);
      persistSession(mapProfileToUser(profile), authToken, "local");
    },
    [persistSession],
  );

  const register: AuthCtx["register"] = async (name, email, password) => {
    const data = await postAuthJson<AuthApiResponse>("/api/auth/register", {
      name: name.trim(),
      email: email.trim(),
      password,
    });
    persistSession(mapAuthResponseToUser(data), data.token, "local");
  };

  const logout = () => {
    clearAllAuthKeys();
    setSession({ user: null, token: null, storage: "local" });
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await getAuthProfile(token);
      persistSession(mapProfileToUser(profile), token);
    } catch {
      /* keep cached session on transient failures */
    }
  }, [token, persistSession]);

  return (
    <Ctx.Provider value={{ user, token, login, loginWithToken, register, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

/** Bearer token for authenticated API calls (cart, profile, etc.). */
export function useAuthToken(): string | null {
  return useAuth().token;
}
