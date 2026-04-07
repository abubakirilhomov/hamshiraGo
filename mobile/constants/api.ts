export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, '') ||
  'https://hamshirago-production-0a65.up.railway.app';

// Registered by AuthProvider — called automatically on any 401 response
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

// Current language for Accept-Language header (set by LanguageContext)
let _currentLanguage = 'ru';
export function setApiLanguage(lang: string) {
  _currentLanguage = lang;
}

/** Returns true if the error is a network/timeout failure worth retrying. */
function isRetryableError(err: unknown): boolean {
  if (err instanceof TypeError) return true; // network failure
  if (err instanceof DOMException && err.name === 'AbortError') return true; // timeout
  return false;
}

/** Delay helper. */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const method = (rest.method ?? 'GET').toUpperCase();
  const maxAttempts = method === 'GET' ? 2 : 1; // retry GET once on network error

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20_000);

      const res = await fetch(`${API_BASE}${path}`, {
        ...rest,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': _currentLanguage,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(rest.headers ?? {}),
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 401) {
          _onUnauthorized?.();
        }
        const body = await res.json().catch(() => ({}));
        const msg = body?.message ?? `HTTP ${res.status}`;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
      }
      if (res.status === 204 || res.headers.get('content-length') === '0') {
        return undefined as unknown as T;
      }
      return res.json() as Promise<T>;
    } catch (err) {
      lastError = err;
      // Only retry on retryable errors and if we have attempts left
      if (attempt < maxAttempts - 1 && isRetryableError(err)) {
        await delay(1000);
        continue;
      }
      throw err;
    }
  }

  // Should never reach here, but satisfy TS
  throw lastError;
}
