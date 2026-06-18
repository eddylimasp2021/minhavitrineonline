import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, products } from "@/lib/mock-data";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — NeonFlow Commerce" },
      { name: "description", content: "Catálogo completo da vitrine NeonFlow." },
    ],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  return (
    <AppShell>
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-black sm:text-4xl">
          <span className="text-holo">Produtos</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore o catálogo completo da vitrine.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <button className="btn-ghost-neon !py-2 !px-4 text-xs">Todos</button>
        {categories.map((c) => (
          <button
            key={c.id}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs transition hover:border-neon-cyan/40 hover:text-neon-cyan"
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...products, ...products].map((p, i) => (
          <ProductCard key={p.id + i} product={p} />
        ))}
      </div>
    </AppShell>
  );
}
