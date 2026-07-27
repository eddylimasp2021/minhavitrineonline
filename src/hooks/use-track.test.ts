import { describe, it, expect, beforeEach, vi } from "vitest";

// Stub browser + supabase antes de importar o módulo.
const inserts: unknown[] = [];
vi.stubGlobal("window", { location: { pathname: "/x" } } as unknown as Window);
vi.stubGlobal("localStorage", {
  _s: new Map<string, string>(),
  getItem(k: string) { return this._s.get(k) ?? null; },
  setItem(k: string, v: string) { this._s.set(k, v); },
  removeItem(k: string) { this._s.delete(k); },
} as unknown as Storage);
vi.stubGlobal("crypto", { randomUUID: () => "test-session" } as unknown as Crypto);

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: (row: unknown) => {
        inserts.push(row);
        return Promise.resolve({ error: null });
      },
    }),
  },
}));

import { track, _resetTrackThrottleForTests } from "./use-track";

describe("track() client-side throttle", () => {
  beforeEach(() => {
    inserts.length = 0;
    _resetTrackThrottleForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  it("dedupes identical events fired within 800ms", async () => {
    await track("product_click", { product_id: "p1" });
    await track("product_click", { product_id: "p1" });
    expect(inserts).toHaveLength(1);
  });

  it("allows the same event after the dedupe window", async () => {
    await track("product_click", { product_id: "p1" });
    vi.setSystemTime(Date.now() + 1000);
    await track("product_click", { product_id: "p1" });
    expect(inserts).toHaveLength(2);
  });

  it("caps events per type at 30 per minute", async () => {
    for (let i = 0; i < 40; i += 1) {
      // Different product ids to bypass dedupe.
      await track("product_click", { product_id: `p${i}` });
    }
    expect(inserts).toHaveLength(30);
  });

  it("enforces global cap of 90 events per minute across types", async () => {
    const types = ["product_click", "favorite_add", "share_click", "page_view"] as const;
    for (let i = 0; i < 200; i += 1) {
      await track(types[i % types.length], { product_id: `p${i}` });
    }
    expect(inserts.length).toBeLessThanOrEqual(90);
    // Should hit the global ceiling since per-type cap × 4 types > 90.
    expect(inserts.length).toBe(90);
  });

  it("resets counters after the sliding window elapses", async () => {
    for (let i = 0; i < 30; i += 1) {
      await track("product_click", { product_id: `p${i}` });
    }
    expect(inserts).toHaveLength(30);
    vi.setSystemTime(Date.now() + 61_000);
    await track("product_click", { product_id: "later" });
    expect(inserts).toHaveLength(31);
  });
});
