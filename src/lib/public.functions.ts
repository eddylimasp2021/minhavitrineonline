import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/**
 * Public read: fetch a published product by slug for /v/:slug OG rendering.
 */
export const getPublicProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const supa = serverClient();
    const { data: prod, error } = await supa
      .from("products")
      .select("id, slug, title, description, price, image_url, video_url, hashtags, whatsapp, category")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return prod;
  });

export type PublicProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  hashtags: string[] | null;
  whatsapp: string | null;
  category: string | null;
  created_at: string;
};

export type PublicProductsPage = {
  items: PublicProductRow[];
  nextOffset: number | null;
  total: number;
};

/**
 * Public read: list published products with pagination, category filter,
 * and ranked search (title > category/hashtags > description).
 */
export const listPublicProducts = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z
      .object({
        q: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(60).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data }): Promise<PublicProductsPage> => {
    const supa = serverClient();
    const limit = data.limit ?? 12;
    const offset = data.offset ?? 0;
    const term = data.q?.trim() ?? "";

    // Ranked search path: pull a wider window, score, sort, paginate in-memory.
    if (term) {
      const safe = term.replace(/[%,()]/g, " ");
      const like = `%${safe}%`;
      let q = supa
        .from("products")
        .select(
          "id, slug, title, description, price, image_url, hashtags, whatsapp, category, created_at",
          { count: "exact" },
        )
        .eq("published", true)
        .or(
          `title.ilike.${like},description.ilike.${like},category.ilike.${like}`,
        )
        .limit(200);
      if (data.category) q = q.eq("category", data.category);

      const { data: rows, error, count } = await q;
      if (error) throw new Error(error.message);

      const t = safe.toLowerCase();
      const scored = (rows ?? []).map((r) => {
        let s = 0;
        const title = r.title?.toLowerCase() ?? "";
        const desc = r.description?.toLowerCase() ?? "";
        const cat = r.category?.toLowerCase() ?? "";
        const tags = (r.hashtags ?? []).join(" ").toLowerCase();
        if (title === t) s += 100;
        if (title.startsWith(t)) s += 40;
        if (title.includes(t)) s += 20;
        if (cat.includes(t)) s += 8;
        if (tags.includes(t)) s += 6;
        if (desc.includes(t)) s += 3;
        return { r, s };
      });
      scored.sort((a, b) => b.s - a.s || (a.r.created_at < b.r.created_at ? 1 : -1));
      const page = scored.slice(offset, offset + limit).map((x) => x.r);
      const total = count ?? scored.length;
      const nextOffset = offset + page.length < total ? offset + page.length : null;
      return { items: page as PublicProductRow[], nextOffset, total };
    }

    // No search: DB-side pagination via range().
    let q = supa
      .from("products")
      .select(
        "id, slug, title, description, price, image_url, hashtags, whatsapp, category, created_at",
        { count: "exact" },
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (data.category) q = q.eq("category", data.category);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    const total = count ?? (rows?.length ?? 0);
    const nextOffset = offset + (rows?.length ?? 0) < total ? offset + (rows?.length ?? 0) : null;
    return { items: (rows ?? []) as PublicProductRow[], nextOffset, total };
  });
