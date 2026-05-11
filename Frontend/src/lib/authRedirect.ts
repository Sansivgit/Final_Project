/** Block open redirects: only same-app relative paths. */
export function safeRedirectPath(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t;
}

export function parseInternalPath(redirect: string): { to: string; search?: Record<string, string> } {
  const safe = safeRedirectPath(redirect);
  try {
    const url = new URL(safe, "https://example.com");
    const search: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      search[k] = v;
    });
    return Object.keys(search).length > 0
      ? { to: url.pathname, search }
      : { to: url.pathname };
  } catch {
    return { to: "/" };
  }
}

/** Search params for `/login` and `/register` links. */
export function loginSearch(redirectPath: string): { redirect: string } {
  return { redirect: safeRedirectPath(redirectPath) };
}

/** After login / register: navigate to safe return URL. */
export function navigateAfterAuth(
  navigate: (opts: { to: string; search?: Record<string, string>; replace?: boolean }) => void,
  redirect: string | undefined,
) {
  const { to, search } = parseInternalPath(safeRedirectPath(redirect));
  if (search && Object.keys(search).length > 0) {
    navigate({ to, search, replace: true });
  } else {
    navigate({ to, replace: true });
  }
}
