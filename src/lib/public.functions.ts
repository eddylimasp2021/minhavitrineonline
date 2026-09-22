import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ListCache, makeKey } from "./list-cache";
import { products } from "./mock-data";

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
    try {
      const supa = serverClient();
      const { data: prod, error } = await supa
        .from("products")
        .select(
          "id, slug, title, description, price, image_url, video_url, hashtags, whatsapp, category, product_type, external_url, cta_label, software_version, software_platform, license_type, demo_url, download_url, delivery_instructions, system_requirements"
        )
        .eq("slug", data.slug)
        .eq("published", true)
        .maybeSingle();
      
      if (!error && prod) {
        try {
          setResponseHeader(
            "Cache-Control",
            "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
          );
        } catch { /* not in request scope */ }
        return prod;
      }
    } catch {
      // Ignora erro de conexão supabase e tenta fallback
    }

    // Fallback para mock data
    const mock = products.find((m) => m.slug === data.slug || m.id === data.slug);
    if (mock) {
      return {
        id: mock.id,
        slug: mock.slug,
        title: mock.title,
        description: mock.description ?? "",
        price: Number(mock.price),
        image_url: typeof mock.image === "string" ? mock.image : null,
        video_url: null,
        hashtags: [],
        whatsapp: mock.whatsapp ?? null,
        category: mock.category ?? null,
        product_type: mock.productType ?? "physical",
        external_url: mock.externalUrl ?? null,
        cta_label: mock.ctaLabel ?? null,
        software_version: mock.softwareVersion ?? null,
        software_platform: mock.softwarePlatform ?? null,
        license_type: mock.licenseType ?? null,
        demo_url: mock.demoUrl ?? null,
        download_url: mock.downloadUrl ?? null,
        delivery_instructions: mock.deliveryInstructions ?? null,
        system_requirements: mock.systemRequirements ?? null,
      };
    }

    return null;
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
  product_type: string | null;
  external_url: string | null;
  cta_label: string | null;
  software_version?: string | null;
  software_platform?: string | null;
  license_type?: string | null;
  demo_url?: string | null;
  download_url?: string | null;
  delivery_instructions?: string | null;
  system_requirements?: string | null;
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
    const limit = data.limit ?? 12;
    const offset = data.offset ?? 0;
    const term = data.q?.trim() ?? "";
    const cat = data.category ?? "";

    // In-memory server cache (per worker instance) keyed by query shape.
    const cacheKey = makeKey({ q: term, category: cat, limit, offset });
    const now = Date.now();
    const cached = listCache.get(cacheKey);
    if (cached) {
      try {
        setResponseHeader(
          "Cache-Control",
          "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        );
      } catch { /* not in request scope */ }
      return cached;
    }

    const supa = serverClient();

    let result: PublicProductsPage;

    // Ranked search path: pull a wider window, score, sort, paginate in-memory.
    if (term) {
      const safe = term.replace(/[%,()]/g, " ");
      const like = `%${safe}%`;
      let q = supa
        .from("products")
        .select(
          "id, slug, title, description, price, image_url, hashtags, whatsapp, category, product_type, external_url, cta_label, software_version, software_platform, license_type, demo_url, download_url, delivery_instructions, system_requirements, created_at",
          { count: "exact" },
        )
        .eq("published", true)
        .or(
          `title.ilike.${like},description.ilike.${like},category.ilike.${like}`,
        )
        .limit(200);
      if (data.category) {
        const catLower = data.category.toLowerCase();
        if (catLower.includes("software")) {
          q = q.or("category.ilike.%software%,product_type.eq.software");
        } else if (catLower.includes("ia") || catLower.includes("automação") || catLower.includes("automacao")) {
          q = q.or("category.ilike.%ia%,category.ilike.%inteligência%,category.ilike.%automação%,category.ilike.%automacao%");
        } else if (catLower.includes("sistema") || catLower.includes("saas")) {
          q = q.or("category.ilike.%sistema%,category.ilike.%saas%,category.ilike.%web%");
        } else {
          q = q.ilike("category", `%${data.category}%`);
        }
      }

      const { data: rows, error, count } = await q;
      if (error) throw new Error(error.message);

      const t = safe.toLowerCase();
      const scored = (rows ?? []).map((r) => {
        let s = 0;
        const title = r.title?.toLowerCase() ?? "";
        const desc = r.description?.toLowerCase() ?? "";
        const cate = r.category?.toLowerCase() ?? "";
        const tags = (r.hashtags ?? []).join(" ").toLowerCase();
        if (title === t) s += 100;
        if (title.startsWith(t)) s += 40;
        if (title.includes(t)) s += 20;
        if (cate.includes(t)) s += 8;
        if (tags.includes(t)) s += 6;
        if (desc.includes(t)) s += 3;
        return { r, s };
      });
      scored.sort((a, b) => b.s - a.s || (a.r.created_at < b.r.created_at ? 1 : -1));
      const page = scored.slice(offset, offset + limit).map((x) => x.r);
      const total = count ?? scored.length;
      const nextOffset = offset + page.length < total ? offset + page.length : null;
      result = { items: page as PublicProductRow[], nextOffset, total };
    } else {
      // No search: DB-side pagination via range().
      let q = supa
        .from("products")
        .select(
          "id, slug, title, description, price, image_url, hashtags, whatsapp, category, product_type, external_url, cta_label, software_version, software_platform, license_type, demo_url, download_url, delivery_instructions, system_requirements, created_at",
          { count: "exact" },
        )
        .eq("published", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (data.category) {
        const catLower = data.category.toLowerCase();
        if (catLower.includes("software")) {
          q = q.or("category.ilike.%software%,product_type.eq.software");
        } else if (catLower.includes("ia") || catLower.includes("automação") || catLower.includes("automacao")) {
          q = q.or("category.ilike.%ia%,category.ilike.%inteligência%,category.ilike.%automação%,category.ilike.%automacao%");
        } else if (catLower.includes("sistema") || catLower.includes("saas")) {
          q = q.or("category.ilike.%sistema%,category.ilike.%saas%,category.ilike.%web%");
        } else {
          q = q.ilike("category", `%${data.category}%`);
        }
      }

      const { data: rows, error, count } = await q;
      if (error) throw new Error(error.message);
      const total = count ?? (rows?.length ?? 0);
      const nextOffset = offset + (rows?.length ?? 0) < total ? offset + (rows?.length ?? 0) : null;
      result = { items: (rows ?? []) as PublicProductRow[], nextOffset, total };
    }

    listCache.set(cacheKey, result);

    try {
      setResponseHeader(
        "Cache-Control",
        "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      );
    } catch { /* not in request scope */ }

    return result;
  });

// Simple per-worker cache for public product listings.
const LIST_TTL_MS = 30_000;
const listCache = new ListCache<PublicProductsPage>(LIST_TTL_MS);

/** Slugs for products sitemap. */
export const listPublicProductSlugs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    const supa = serverClient();
    const { data, error } = await supa
      .from("products")
      .select("slug, updated_at")
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(50_000);
    if (error) throw new Error(error.message);
    try {
      setResponseHeader(
        "Cache-Control",
        "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
      );
    } catch { /* not in request scope */ }
    return (data ?? []) as { slug: string; updated_at: string }[];
  },
);

