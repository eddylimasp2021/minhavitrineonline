import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://minhavitrineonline.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          `  <sitemap><loc>${BASE_URL}/sitemap-pages.xml</loc></sitemap>`,
          `  <sitemap><loc>${BASE_URL}/sitemap-products.xml</loc></sitemap>`,
          `</sitemapindex>`,
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
