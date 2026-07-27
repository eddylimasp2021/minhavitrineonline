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
