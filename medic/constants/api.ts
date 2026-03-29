export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, '') ||
  'https://hamshirago-production-0a65.up.railway.app';

// Registered by AuthProvider — called on 401 response.
// Shows an alert before logging out so the medic understands what happened.
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

import { Alert } from 'react-native';

let _unauthorizedFired = false;

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401 && _onUnauthorized && !_unauthorizedFired) {
      _unauthorizedFired = true;
      Alert.alert(
        'Сессия истекла',
        'Ваша сессия истекла. Пожалуйста, войдите заново.',
        [{ text: 'OK', onPress: () => { _onUnauthorized?.(); _unauthorizedFired = false; } }],
      );
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
