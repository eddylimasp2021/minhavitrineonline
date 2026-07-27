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

/**
 * Public read: list published products for the catalog / home / vitrine.
 * Optional search (q) matches title / description / category; optional category label filter.
 */
export const listPublicProducts = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z
      .object({
        q: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data }) => {
    const supa = serverClient();
    let query = supa
      .from("products")
      .select("id, slug, title, description, price, image_url, hashtags, whatsapp, category, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 60);

    if (data.category) query = query.eq("category", data.category);
    if (data.q && data.q.trim()) {
      const term = data.q.trim().replace(/[%,]/g, " ");
      query = query.or(
        `title.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`,
      );
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
