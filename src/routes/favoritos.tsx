import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos — NeonFlow Commerce" }] }),
  component: FavoritosPage,
});

type FavRow = { product_id: string; products: { id: string; slug: string; title: string; price: number; image_url: string | null } | null };

function FavoritosPage() {
  const { user, loading } = useAuth();
  const { favorites, isLoading } = useFavorites();

  return (
    <AppShell>
      <header className="flex items-center gap-3 animate-fade-up">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-magenta/15 text-neon-magenta glow-magenta">
          <Heart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-black sm:text-4xl">Favoritos</h1>
          <p className="text-sm text-muted-foreground">Seus produtos salvos aparecem aqui.</p>
        </div>
      </header>

      {!loading && !user && (
        <div className="mt-10 rounded-3xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-muted-foreground">Entre para salvar seus produtos favoritos.</p>
          <Link to="/auth" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta px-5 py-2 font-semibold text-background">
            Entrar
          </Link>
        </div>
      )}

      {user && isLoading && <p className="mt-8 text-muted-foreground">Carregando…</p>}

      {user && !isLoading && favorites.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">Você ainda não favoritou nada.</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(favorites as FavRow[]).map((f) =>
          f.products ? (
            <Link key={f.product_id} to="/v/$slug" params={{ slug: f.products.slug }} className="group overflow-hidden rounded-3xl border border-white/10 glass hover:border-neon-cyan/40">
              {f.products.image_url && <img src={f.products.image_url} alt={f.products.title} className="h-48 w-full object-cover transition group-hover:scale-105" />}
              <div className="p-4">
                <h3 className="truncate font-semibold">{f.products.title}</h3>
                <p className="mt-1 font-display text-lg text-neon-cyan">{formatBRL(Number(f.products.price))}</p>
              </div>
            </Link>
          ) : null,
        )}
      </div>
    </AppShell>
  );
}
