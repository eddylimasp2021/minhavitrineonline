import { createFileRoute } from "@tanstack/react-router";
import { listPublicProductSlugs } from "@/lib/public.functions";

const BASE_URL = "https://minhavitrineonline.lovable.app";

export const Route = createFileRoute("/sitemap-products.xml")({
  server: {
    handlers: {
      GET: async () => {
        let rows: { slug: string; updated_at: string }[] = [];
        try {
          rows = await listPublicProductSlugs();
        } catch {
          rows = [];
        }
        const urls = rows
          .map(
            (r) =>
              `  <url>\n    <loc>${BASE_URL}/v/${r.slug}</loc>\n    <lastmod>${new Date(r.updated_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600",
          },
        });
      },
    },
  },
});
