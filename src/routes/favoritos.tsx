import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [{ title: "Favoritos — NeonFlow Commerce" }],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  return (
    <AppShell>
      <header className="flex items-center gap-3 animate-fade-up">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-magenta/15 text-neon-magenta glow-magenta">
          <Heart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            Favoritos
          </h1>
          <p className="text-sm text-muted-foreground">
            Seus produtos salvos aparecem aqui.
          </p>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 2).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </AppShell>
  );
}
