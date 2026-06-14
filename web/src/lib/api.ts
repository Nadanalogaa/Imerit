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
 * Core request helper. Throws `ApiError` for non-2xx responses, returns the
 * parsed JSON body (or `null` if the response has no body) on success.
 */
export async function api<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  if (!apiEnabled) {
    throw new ApiError(
      0,
      "API_NOT_CONFIGURED",
      "API is not configured (VITE_API_URL is empty). Falling back to local storage mode.",
    );
  }

  const headers = new Headers(opts.headers);
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers,
      body,
      credentials: "include",
    });
  } catch (err) {
    // Network / CORS / DNS failures — keep the message generic; the
    // browser console already shows the underlying cause.
    throw new ApiError(0, "NETWORK", err instanceof Error ? err.message : "Network request failed");
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
