import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Save data with timestamp */
export async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
  } catch {}
}

/** Get cached data if not expired (ttl in ms) */
export async function cacheGet<T>(key: string, ttlMs: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`cache_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttlMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/** Get cached data regardless of TTL (for offline fallback) */
export async function cacheGetStale<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`cache_${key}`);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch {
    return null;
  }
}

/** Clear specific cache key */
export async function cacheClear(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`cache_${key}`);
  } catch {}
}
