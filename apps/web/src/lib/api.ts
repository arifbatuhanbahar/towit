const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "/api";

/** Sunucudan dönen hata — hem `code` (makine okuyabilir) hem `message` (insan okuyabilir) taşır. */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAccess() {
  return localStorage.getItem("towit_access");
}
function getRefresh() {
  return localStorage.getItem("towit_refresh");
}
function setTokens(access: string, refresh: string) {
  localStorage.setItem("towit_access", access);
  localStorage.setItem("towit_refresh", refresh);
}
export function clearTokens() {
  localStorage.removeItem("towit_access");
  localStorage.removeItem("towit_refresh");
}

export async function refreshSession(): Promise<boolean> {
  const r = getRefresh();
  if (!r) return false;
  const res = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: r }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  const access = getAccess();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const doFetch = () =>
    fetch(`${base}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });

  let res = await doFetch();
  if (res.status === 401 && getRefresh()) {
    const ok = await refreshSession();
    if (ok) {
      const h2 = new Headers(init.headers);
      h2.set("Authorization", `Bearer ${getAccess()}`);
      res = await fetch(`${base}${path}`, {
        ...init,
        headers: h2,
        body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      });
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const code = (data?.error?.code as string | undefined) ?? "UNKNOWN";
    const msg = (data?.error?.message as string | undefined) ?? res.statusText;
    throw new ApiError(code, msg);
  }
  return data as T;
}
