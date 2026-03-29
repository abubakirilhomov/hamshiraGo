export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, '') ||
  'https://hamshirago-production-0a65.up.railway.app';

// Registered by AuthProvider — called automatically on any 401 response
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
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
}
