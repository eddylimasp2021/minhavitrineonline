/**
 * Small TTL cache for public product listings.
 * Extracted into its own module so pagination/invalidation semantics
 * are unit-testable without spinning up a server function.
 */

export type CacheEntry<T> = { value: T; expires: number };

export function makeKey(parts: {
  q?: string;
  category?: string;
  limit: number;
  offset: number;
}): string {
  const q = (parts.q ?? "").trim().toLowerCase();
  const c = (parts.category ?? "").trim().toLowerCase();
  return `list:${q}|${c}|${parts.limit}|${parts.offset}`;
}

export class ListCache<T> {
  private map = new Map<string, CacheEntry<T>>();
  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number = 200,
    private readonly targetSize: number = 150,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): T | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    this.map.set(key, { value, expires: this.now() + this.ttlMs });
    if (this.map.size > this.maxEntries) {
      const now = this.now();
      for (const [k, v] of this.map) {
        if (v.expires <= now) this.map.delete(k);
        if (this.map.size <= this.targetSize) break;
      }
      // Still too big? Drop oldest insertion order.
      while (this.map.size > this.targetSize) {
        const first = this.map.keys().next().value;
        if (first === undefined) break;
        this.map.delete(first);
      }
    }
  }

  /** Invalidate every entry whose key matches the predicate. */
  invalidate(predicate: (key: string) => boolean): number {
    let n = 0;
    for (const k of [...this.map.keys()]) {
      if (predicate(k)) {
        this.map.delete(k);
        n += 1;
      }
    }
    return n;
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}
