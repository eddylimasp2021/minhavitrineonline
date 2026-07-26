import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const RangeInput = z.object({
  from: z.string(),
  to: z.string(),
});

async function assertAdmin(ctx: { supabase: { rpc: (n: string, p: unknown) => { data: unknown } }; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("forbidden");
}

/**
 * Admin dashboard: KPI counts + daily buckets for a date range.
 * Uses the caller's authenticated client (RLS ensures admin-only via has_role).
 */
export const getAdminStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RangeInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const from = data.from;
    const to = data.to;

    const { data: rows, error } = await context.supabase
      .from("analytics_events")
      .select("event_type, created_at, product_id")
      .gte("created_at", from)
      .lte("created_at", to);
    if (error) throw new Error(error.message);

    const totals = { page_view: 0, product_view: 0, product_click: 0, favorite_add: 0, whatsapp_click: 0, share_click: 0, checkout_start: 0, conversion: 0 } as Record<string, number>;
    const byDay = new Map<string, Record<string, number>>();
    const byProduct = new Map<string, number>();

    for (const r of rows ?? []) {
      totals[r.event_type] = (totals[r.event_type] ?? 0) + 1;
      const day = r.created_at.slice(0, 10);
      const bucket = byDay.get(day) ?? { views: 0, clicks: 0, favorites: 0, wa: 0 };
      if (r.event_type === "page_view" || r.event_type === "product_view") bucket.views += 1;
      else if (r.event_type === "product_click") bucket.clicks += 1;
      else if (r.event_type === "favorite_add") bucket.favorites += 1;
      else if (r.event_type === "whatsapp_click") bucket.wa += 1;
      byDay.set(day, bucket);
      if (r.product_id && (r.event_type === "product_view" || r.event_type === "product_click")) {
        byProduct.set(r.product_id, (byProduct.get(r.product_id) ?? 0) + 1);
      }
    }

    const days = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v }));

    const topProductIds = Array.from(byProduct.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    let topProducts: Array<{ id: string; title: string; image_url: string | null; views: number }> = [];
    if (topProductIds.length) {
      const { data: prods } = await context.supabase
        .from("products")
        .select("id, title, image_url")
        .in("id", topProductIds.map((p) => p[0]));
      const map = new Map((prods ?? []).map((p) => [p.id, p]));
      topProducts = topProductIds.map(([id, views]) => {
        const p = map.get(id);
        return { id, title: p?.title ?? "?", image_url: p?.image_url ?? null, views };
      });
    }

    return { totals, days, topProducts };
  });
