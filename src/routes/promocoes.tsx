import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/promocoes")({
  head: () => ({
    meta: [
      { title: "Promoções — NeonFlow Commerce" },
      { name: "description", content: "Ofertas relâmpago e descontos exclusivos." },
    ],
  }),
  component: PromocoesPage,
});

function PromocoesPage() {
  const onSale = products.filter((p) => p.oldPrice);
  return (
    <AppShell>
      <header className="flex items-center gap-3 animate-fade-up">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-magenta/15 text-neon-magenta glow-magenta">
          <Flame className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            Promoções
          </h1>
          <p className="text-sm text-muted-foreground">
            Ofertas válidas por tempo limitado.
          </p>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...onSale, ...products].map((p, i) => (
          <ProductCard key={p.id + i} product={p} />
        ))}
      </div>
    </AppShell>
  );
}
