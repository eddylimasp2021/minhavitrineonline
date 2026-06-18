import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/vitrine")({
  head: () => ({
    meta: [
      { title: "Vitrine Virtual — NeonFlow Commerce" },
      { name: "description", content: "Showroom imersivo dos produtos NeonFlow." },
    ],
  }),
  component: VitrinePage,
});

function VitrinePage() {
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

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </AppShell>
  );
}
