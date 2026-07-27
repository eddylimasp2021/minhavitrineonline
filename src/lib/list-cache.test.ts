import { describe, it, expect, beforeEach } from "vitest";
import { ListCache, makeKey } from "./list-cache";
import { collapse } from "./favorites-queue";

describe("makeKey", () => {
  it("normalizes q/category case and trims", () => {
    expect(makeKey({ q: " Foo ", category: "Moda ", limit: 12, offset: 0 })).toBe(
      "list:foo|moda|12|0",
    );
  });

  it("splits distinct pages of the same query", () => {
    const a = makeKey({ q: "x", limit: 12, offset: 0 });
    const b = makeKey({ q: "x", limit: 12, offset: 12 });
    expect(a).not.toBe(b);
  });

  it("splits distinct categories on the same page", () => {
    const a = makeKey({ q: "", category: "moda", limit: 12, offset: 0 });
    const b = makeKey({ q: "", category: "casa", limit: 12, offset: 0 });
    expect(a).not.toBe(b);
  });
});

describe("ListCache", () => {
  let now = 0;
  let cache: ListCache<{ items: number[] }>;

  beforeEach(() => {
    now = 1_000;
    cache = new ListCache<{ items: number[] }>(30_000, 5, 3, () => now);
  });

  it("returns undefined on miss", () => {
    expect(cache.get("nope")).toBeUndefined();
  });

  it("returns fresh values before TTL", () => {
    cache.set("k", { items: [1] });
    now += 10_000;
    expect(cache.get("k")).toEqual({ items: [1] });
  });

  it("expires values after TTL", () => {
    cache.set("k", { items: [1] });
    now += 31_000;
    expect(cache.get("k")).toBeUndefined();
  });

  it("invalidates by predicate — targeted by search term", () => {
    cache.set(makeKey({ q: "shoe", limit: 12, offset: 0 }), { items: [1] });
    cache.set(makeKey({ q: "shoe", limit: 12, offset: 12 }), { items: [2] });
    cache.set(makeKey({ q: "bag", limit: 12, offset: 0 }), { items: [3] });

    const n = cache.invalidate((k) => k.includes("|") && k.startsWith("list:shoe|"));
    expect(n).toBe(2);
    expect(cache.get(makeKey({ q: "shoe", limit: 12, offset: 0 }))).toBeUndefined();
    expect(cache.get(makeKey({ q: "bag", limit: 12, offset: 0 }))).toEqual({ items: [3] });
  });

  it("invalidates all list: keys (broad DB change)", () => {
    for (let i = 0; i < 3; i += 1) {
      cache.set(makeKey({ q: "x", limit: 12, offset: i * 12 }), { items: [i] });
    }
    const n = cache.invalidate((k) => k.startsWith("list:"));
    expect(n).toBe(3);
    expect(cache.size).toBe(0);
  });

  it("evicts expired entries first when the cap is exceeded", () => {
    // Two stale entries.
    cache.set("a", { items: [1] });
    cache.set("b", { items: [2] });
    now += 40_000;
    // Fresh entries added after expiry.
    cache.set("c", { items: [3] });
    cache.set("d", { items: [4] });
    cache.set("e", { items: [5] });
    cache.set("f", { items: [6] }); // triggers trim (>5)
    // Stale ones must not survive.
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
    // Fresh ones stay reachable.
    expect(cache.get("f")).toEqual({ items: [6] });
  });

  it("keeps offset pages independent — invalidation of one page doesn't nuke siblings unless requested", () => {
    const k0 = makeKey({ q: "shoe", limit: 12, offset: 0 });
    const k1 = makeKey({ q: "shoe", limit: 12, offset: 12 });
    cache.set(k0, { items: [0] });
    cache.set(k1, { items: [1] });
    cache.invalidate((k) => k === k0);
    expect(cache.get(k0)).toBeUndefined();
    expect(cache.get(k1)).toEqual({ items: [1] });
  });
});

describe("favorites-queue collapse", () => {
  it("keeps last op per product id", () => {
    const out = collapse([
      { product_id: "a", op: "add", ts: 1 },
      { product_id: "a", op: "remove", ts: 2 },
      { product_id: "b", op: "add", ts: 3 },
    ]);
    expect(out).toEqual([
      { product_id: "a", op: "remove", ts: 2 },
      { product_id: "b", op: "add", ts: 3 },
    ]);
  });
});

/**
 * Simulates the /produtos incremental pagination flow against the server cache.
 * Guarantees: after Supabase changes trigger a full invalidation, every
 * subsequent page fetch (including pages already viewed) misses the cache
 * and re-reads from the source — no stale mixed with fresh in one session.
 */
describe("incremental pagination cache invalidation", () => {
  type Row = { id: number; title: string };
  type Page = { items: Row[]; nextOffset: number | null; total: number };

  function makeSource(rows: Row[]) {
    const calls: Array<{ offset: number; limit: number }> = [];
    const fetchPage = (offset: number, limit: number): Page => {
      calls.push({ offset, limit });
      const slice = rows.slice(offset, offset + limit);
      const next = offset + slice.length < rows.length ? offset + slice.length : null;
      return { items: slice, nextOffset: next, total: rows.length };
    };
    return { calls, fetchPage };
  }

  async function loadPage(
    cache: ListCache<Page>,
    src: { fetchPage: (o: number, l: number) => Page },
    q: string,
    limit: number,
    offset: number,
  ) {
    const key = makeKey({ q, limit, offset });
    const hit = cache.get(key);
    if (hit) return { page: hit, hit: true };
    const page = src.fetchPage(offset, limit);
    cache.set(key, page);
    return { page, hit: false };
  }

  it("serves each incremental page from cache on re-visit until invalidated", async () => {
    const cache = new ListCache<Page>(30_000);
    const rows: Row[] = Array.from({ length: 30 }, (_, i) => ({ id: i, title: `p${i}` }));
    const src = makeSource(rows);

    const a = await loadPage(cache, src, "", 12, 0);
    const b = await loadPage(cache, src, "", 12, 12);
    expect(a.hit).toBe(false);
    expect(b.hit).toBe(false);
    expect(src.calls).toHaveLength(2);

    // Re-visit both pages — both should hit cache, zero new source calls.
    const a2 = await loadPage(cache, src, "", 12, 0);
    const b2 = await loadPage(cache, src, "", 12, 12);
    expect(a2.hit).toBe(true);
    expect(b2.hit).toBe(true);
    expect(src.calls).toHaveLength(2);
    expect(a2.page.items[0].id).toBe(0);
    expect(b2.page.items[0].id).toBe(12);
  });

  it("after realtime invalidation every page re-fetches fresh — no stale rows served", async () => {
    const cache = new ListCache<Page>(30_000);
    let rows: Row[] = Array.from({ length: 30 }, (_, i) => ({ id: i, title: `old-${i}` }));
    const src = { calls: [] as Array<{ offset: number; limit: number }>, fetchPage: (o: number, l: number): Page => {
      src.calls.push({ offset: o, limit: l });
      const slice = rows.slice(o, o + l);
      return { items: slice, nextOffset: o + slice.length < rows.length ? o + slice.length : null, total: rows.length };
    } };

    await loadPage(cache, src, "", 12, 0);
    await loadPage(cache, src, "", 12, 12);
    expect(src.calls).toHaveLength(2);

    // Supabase change: a product's title flips. Realtime invalidates all list keys.
    rows = rows.map((r) => ({ ...r, title: `new-${r.id}` }));
    const removed = cache.invalidate((k) => k.startsWith("list:"));
    expect(removed).toBe(2);

    // Every subsequent page load must miss cache and reflect the new rows.
    const a = await loadPage(cache, src, "", 12, 0);
    const b = await loadPage(cache, src, "", 12, 12);
    expect(a.hit).toBe(false);
    expect(b.hit).toBe(false);
    expect(a.page.items.every((r) => r.title.startsWith("new-"))).toBe(true);
    expect(b.page.items.every((r) => r.title.startsWith("new-"))).toBe(true);
    expect(src.calls).toHaveLength(4);
  });

  it("invalidating one query never leaks stale pages of a different query", async () => {
    const cache = new ListCache<Page>(30_000);
    const rowsShoe = Array.from({ length: 24 }, (_, i) => ({ id: i, title: `shoe-${i}` }));
    const rowsBag = Array.from({ length: 24 }, (_, i) => ({ id: i + 100, title: `bag-${i}` }));
    const srcShoe = makeSource(rowsShoe);
    const srcBag = makeSource(rowsBag);

    await loadPage(cache, srcShoe, "shoe", 12, 0);
    await loadPage(cache, srcShoe, "shoe", 12, 12);
    await loadPage(cache, srcBag, "bag", 12, 0);

    // Scope invalidation to shoe listings only.
    cache.invalidate((k) => k.startsWith("list:shoe|"));

    const bagAgain = await loadPage(cache, srcBag, "bag", 12, 0);
    expect(bagAgain.hit).toBe(true); // bag pages untouched
    const shoeAgain = await loadPage(cache, srcShoe, "shoe", 12, 0);
    expect(shoeAgain.hit).toBe(false); // shoe pages refetched
  });

  it("expired page during incremental scroll is refetched, not served stale", async () => {
    let now = 1_000;
    const cache = new ListCache<Page>(30_000, 200, 150, () => now);
    const rows = Array.from({ length: 24 }, (_, i) => ({ id: i, title: `p${i}` }));
    const src = makeSource(rows);

    await loadPage(cache, src, "", 12, 0);
    now += 40_000; // page 0 expires before user scrolls to page 1
    const nextPage = await loadPage(cache, src, "", 12, 12);
    const page0Again = await loadPage(cache, src, "", 12, 0);
    expect(nextPage.hit).toBe(false);
    expect(page0Again.hit).toBe(false); // must refetch after TTL, not serve stale
    expect(src.calls).toHaveLength(3);
  });
});
