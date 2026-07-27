import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, products } from "@/lib/mock-data";
import { Search, X } from "lucide-react";

type ProdSearch = { q?: string; cat?: string };

export const Route = createFileRoute("/produtos")({
  validateSearch: (s: Record<string, unknown>): ProdSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Produtos — NeonFlow Commerce" },
      { name: "description", content: "Catálogo completo da vitrine NeonFlow." },
    ],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const { q, cat } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const query = (q ?? "").trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (cat && p.categoryId !== cat) return false;
    if (query && !`${p.title} ${p.category} ${p.description}`.toLowerCase().includes(query)) return false;
    return true;
  });

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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate({ search: (prev: ProdSearch) => ({ ...prev, q: (fd.get("q") as string) || undefined }) });
        }}
        className="relative mt-6"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar produtos…"
          className="h-11 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:border-neon-cyan/60 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
        />
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => navigate({ search: (prev: ProdSearch) => ({ ...prev, cat: undefined }) })}
          className={`rounded-full px-4 py-2 text-xs transition ${!cat ? "border border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan" : "border border-white/10 bg-white/5 hover:border-neon-cyan/40 hover:text-neon-cyan"}`}
        >
          Todos
        </button>
        {categories.map((c) => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => navigate({ search: (prev: ProdSearch) => ({ ...prev, cat: active ? undefined : c.id }) })}
              className={`rounded-full px-4 py-2 text-xs transition ${active ? "border border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan" : "border border-white/10 bg-white/5 hover:border-neon-cyan/40 hover:text-neon-cyan"}`}
            >
              {c.icon} {c.label}
            </button>
          );
        })}
        {(q || cat) && (
          <button
            onClick={() => navigate({ search: {} })}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
