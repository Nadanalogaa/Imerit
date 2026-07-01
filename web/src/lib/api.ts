/**
 * Thin fetch wrapper for talking to the i-Tamil Recruit backend.
 *
 * When `VITE_API_URL` is set at build-time, the app talks to the live API.
 * When it isn't set, `apiEnabled` is false and the legacy localStorage flows
 * stay in charge — that way the Vercel build still works even before the env
 * variable is wired up.
 *
 * Cookies are sent automatically (`credentials: "include"`) so the httpOnly
 * `itr_access` / `itr_refresh` cookies issued by /auth/otp/verify ride along
 * on every request without needing manual token plumbing.
 */

const RAW_BASE = (import.meta.env.VITE_API_URL ?? "").trim();
const BASE = RAW_BASE.replace(/\/$/, "");

export const apiBaseUrl = BASE;
export const apiEnabled = BASE.length > 0;

/** Structured error type so call sites can branch on backend error codes. */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOpts extends Omit<RequestInit, "body"> {
  /** Pass an object to JSON-serialise + set Content-Type. */
  json?: unknown;
}

/**
 * Silent-refresh coordination.
 *
 * The backend issues a short-lived `itr_access` cookie (15 min) alongside a
 * long-lived `itr_refresh` (30 days). Any request that hits an authenticated
 * route after the access token expires gets a 401 → we quietly call
 * `/auth/refresh` to mint a new access cookie, then retry the original.
 *
 * `refreshPromise` de-dupes concurrent refresh attempts — if 5 tabs / 5
 * network calls all 401 at once, we still only hit /auth/refresh once and
 * they all wait on the same promise. That's important because /auth/refresh
 * rotates the refresh token; if we called it 5 times in parallel the last
 * 4 would race and log the user out.
 */
let refreshPromise: Promise<boolean> | null = null;

/** Peek at a response's error.code without consuming the body twice. */
async function peekErrorCode(res: Response): Promise<string | null> {
  try {
    const body = await res.json();
    return body?.error?.code ?? null;
  } catch {
    return null;
  }
}

async function silentRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/**
 * Core request helper. Throws `ApiError` for non-2xx responses, returns the
 * parsed JSON body (or `null` if the response has no body) on success.
 * Transparently retries once through /auth/refresh on 401 AUTH_REQUIRED —
 * so a session that outlived only its 15-minute access-token TTL keeps
 * humming instead of forcing the user to sign in again.
 */
export async function api<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  if (!apiEnabled) {
    throw new ApiError(
      0,
      "API_NOT_CONFIGURED",
      "API is not configured (VITE_API_URL is empty). Falling back to local storage mode.",
    );
  }

  const doFetch = async (): Promise<Response> => {
    const headers = new Headers(opts.headers);
    let body: BodyInit | undefined;
    if (opts.json !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(opts.json);
    }
    return fetch(`${BASE}${path}`, {
      ...opts,
      headers,
      body,
      credentials: "include",
    });
  };

  let res: Response;
  try {
    res = await doFetch();
  } catch (err) {
    // Network / CORS / DNS failures — keep the message generic; the
    // browser console already shows the underlying cause.
    throw new ApiError(0, "NETWORK", err instanceof Error ? err.message : "Network request failed");
  }

  // Silent-refresh path: 401 (access token expired) OR 403 with the
  // ROLE_FORBIDDEN code (JWT has a stale role — e.g. user was promoted
  // in the DB after their current session started) → try /auth/refresh
  // once to mint a fresh access token from the current DB user row,
  // then re-issue the original request. /auth/refresh itself must
  // NEVER re-enter this branch or a bad refresh would loop forever.
  const isAuthEndpoint = path.startsWith("/auth/");
  const shouldRetry =
    !isAuthEndpoint &&
    (res.status === 401 || (res.status === 403 && await peekErrorCode(res.clone()) === "ROLE_FORBIDDEN"));
  if (shouldRetry) {
    const ok = await silentRefresh();
    if (ok) {
      try {
        res = await doFetch();
      } catch (err) {
        throw new ApiError(0, "NETWORK", err instanceof Error ? err.message : "Network request failed");
      }
    }
  }

  // 204 No Content — return null cast as T so callers don't trip on a missing body.
  if (res.status === 204) return null as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const err = (payload as { error?: { code?: string; message?: string; details?: unknown } })?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "ERROR",
      err?.message ?? res.statusText ?? "Request failed",
      err?.details,
    );
  }

  return payload as T;
}
