import { QueryClient, QueryFunction } from "@tanstack/react-query";

// In development we may not be able to rely on HttpOnly cookies (cross-origin dev).
// The server exposes an `X-Debug-Set-Cookie` header in dev containing the cookie
// strings; we capture the refresh token value here so `fetchWithRefresh` can
// send it in `Authorization: Bearer <token>` as a fallback when cookies are
// not sent by the browser. This is strictly a dev convenience and only used
// when running on `localhost`.
let debugRefreshToken: string | null = null;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  const res = await fetchWithRefresh(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Capture debug header containing Set-Cookie strings (dev only)
  try {
    const dbg = res.headers.get("X-Debug-Set-Cookie");
    if (dbg && typeof window !== "undefined" && window.location.hostname === "localhost") {
      const refreshName = "chatapp_refresh";
      const m = dbg.match(new RegExp(`${refreshName}=([^;\\s,]+)`));
      if (m) {
        debugRefreshToken = m[1];
      }
    }
  } catch (e) {}

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetchWithRefresh(queryKey.join("/") as string, {
      credentials: "include",
      cache: "no-store",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 304) {
      // Return cached data if available
      const cached = queryClient.getQueryData(queryKey) as T | undefined | null;
      return cached ?? null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Helper that attempts the fetch and on 401 tries to refresh the access cookie once
async function fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit, triedRefresh = false): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  if (triedRefresh) return res;

  // Attempt refresh endpoint which issues a new access cookie
  try {
    const refreshInit: RequestInit = { method: "POST", credentials: "include" };
    // If we have a dev debug refresh token, send it in Authorization header
    if (debugRefreshToken && typeof window !== "undefined" && window.location.hostname === "localhost") {
      refreshInit.headers = { ...(refreshInit.headers as any), Authorization: `Bearer ${debugRefreshToken}` };
    }
    const refreshRes = await fetch("/api/auth/refresh", refreshInit);
    if (refreshRes.ok) {
      // retry original request once
      return await fetchWithRefresh(input, init, true);
    }
  } catch (e) {
    // ignore
  }

  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
