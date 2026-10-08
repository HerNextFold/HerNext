/**
 * In-process TTL cache behind a small interface (docs/API_CONTRACT.md §21a).
 *
 * There is deliberately no Redis in the MVP. This cache is process-local and
 * swappable: consumers depend on the Cache interface, so Redis can replace it
 * later without touching the learning service. Successful results are cached
 * for LEARNING_CACHE_TTL_MS (24h); `get` returns only fresh entries while
 * `getStale` also returns expired entries so the service can serve stale data
 * when the AI/provider is temporarily unavailable (never fabricated data).
 */

export const LEARNING_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface Cache<V> {
  get(key: string): V | undefined;
  getStale(key: string): V | undefined;
  set(key: string, value: V, ttlMs?: number): void;
  delete(key: string): void;
}

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class TtlCache<V> implements Cache<V> {
  private readonly store = new Map<string, CacheEntry<V>>();

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (entry === undefined) return undefined;
    if (Date.now() > entry.expiresAt) {
      return undefined;
    }
    return entry.value;
  }

  /** Returns the entry even when expired, so callers can serve stale data safely. */
  getStale(key: string): V | undefined {
    return this.store.get(key)?.value;
  }

  set(key: string, value: V, ttlMs: number = LEARNING_CACHE_TTL_MS): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}