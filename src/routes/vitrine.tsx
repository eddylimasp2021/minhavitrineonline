import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/product/ProductCard";
import { PLACEHOLDER_IMAGE, type Product } from "@/lib/mock-data";
import { listPublicProducts } from "@/lib/public.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/vitrine")({
  head: () => ({
    meta: [
      { title: "Vitrine Virtual — NeonFlow Commerce" },
      { name: "description", content: "Showroom imersivo dos produtos NeonFlow." },
      { property: "og:title", content: "Vitrine Virtual — NeonFlow Commerce" },
      { property: "og:description", content: "Showroom imersivo dos produtos NeonFlow." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: VitrinePage,
});

function VitrinePage() {
  const q = useQuery({
    queryKey: ["vitrine-products"],
    queryFn: () => listPublicProducts({ data: { limit: 24 } }),
  });

  const items: Product[] = (q.data?.items ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? "",
    price: Number(r.price),
    image: r.image_url ?? PLACEHOLDER_IMAGE,
    category: r.category ?? "Geral",
    whatsapp: r.whatsapp ?? undefined,
    productType: r.product_type ?? undefined,
    externalUrl: r.external_url ?? undefined,
    ctaLabel: r.cta_label ?? undefined,
    softwareVersion: r.software_version ?? undefined,
    softwarePlatform: r.software_platform ?? undefined,
    licenseType: r.license_type ?? undefined,
    demoUrl: r.demo_url ?? undefined,
    downloadUrl: r.download_url ?? undefined,
    deliveryInstructions: r.delivery_instructions ?? undefined,
    systemRequirements: r.system_requirements ?? undefined,
  }));


  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-white/10 glass p-8 sm:p-12 animate-fade-up">
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-xs text-neon-purple">
            <span className="pulse-dot" /> Modo imersivo
          </span>
          <h1 className="mt-4 font-display text-4xl font-black sm:text-5xl">
            <span className="text-holo">Vitrine Virtual</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Apresente seus produtos em um showroom holográfico premium.
          </p>
        </div>
      </section>

      {q.isLoading ? (
        <div className="mt-12 grid place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-white/10 p-10 text-center text-muted-foreground">
          Nenhum produto publicado ainda.{" "}
          <Link to="/produtos" className="text-neon-cyan hover:underline">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
