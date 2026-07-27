import { Heart, MessageCircle, QrCode, Share2, ShoppingBag, Star, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { formatBRL, whatsappLink, PLACEHOLDER_IMAGE, type Product } from "@/lib/mock-data";
import { track } from "@/hooks/use-track";
import { useLocalFavorites } from "@/hooks/use-local-favorites";
import { useFavorites } from "@/hooks/use-favorites";

const tagStyles: Record<NonNullable<Product["tag"]>, string> = {
  novo: "bg-neon-green/15 text-neon-green border-neon-green/40",
  oferta: "bg-neon-magenta/15 text-neon-magenta border-neon-magenta/40",
  tendencia: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40",
};

const tagLabel: Record<NonNullable<Product["tag"]>, string> = {
  novo: "Novo",
  oferta: "Oferta",
  tendencia: "Tendência",
};

export function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const local = useLocalFavorites();
  const remote = useFavorites();
  const isFav = remote.isAuthed ? remote.has(product.id) : local.has(product.id);
  const [qrOpen, setQrOpen] = useState(false);
  const navigate = useNavigate();

  const productUrl = typeof window !== "undefined" ? `${window.location.origin}/v/${product.slug}` : `/v/${product.slug}`;
  const waUrl = whatsappLink(product);
  const image = product.image || PLACEHOLDER_IMAGE;

  function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (remote.isAuthed) {
      remote.toggle(product.id);
      if (!isFav) track("favorite_add", { product_id: product.id });
    } else {
      local.toggle(product.id);
      if (!isFav) track("favorite_add", { product_id: product.id });
    }
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    track("share_click", { product_id: product.id });
    const data = { title: product.title, text: product.description, url: productUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(productUrl);
        alert("Link copiado!");
      }
    } catch { /* cancelled */ }
  }

  return (
    <article className="neon-card group flex flex-col overflow-hidden">
      <Link to="/v/$slug" params={{ slug: product.slug }} preload="intent" className="relative block aspect-square overflow-hidden" onClick={() => track("product_click", { product_id: product.id })}>
        <img
          src={image}
          alt={product.title}
          loading="lazy"
          width={768}
          height={768}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
        {product.tag && (
          <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur ${tagStyles[product.tag]}`}>
            {tagLabel[product.tag]}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-neon-yellow px-2.5 py-1 text-[10px] font-bold text-background shadow-[0_0_16px_var(--neon-yellow)]">
            -{discount}%
          </span>
        )}
        <button
          aria-label="Favoritar"
          onClick={toggleFav}
          className={`absolute right-3 bottom-3 grid h-9 w-9 place-items-center rounded-full border bg-background/60 backdrop-blur transition ${isFav ? "border-neon-magenta text-neon-magenta glow-magenta" : "border-white/10 hover:border-neon-magenta/60 hover:text-neon-magenta"}`}
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{product.category}</span>
          {typeof product.rating === "number" && (
            <>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1 text-neon-yellow">
                <Star className="h-3 w-3 fill-current" />
                {product.rating}
              </span>
            </>
          )}
        </div>
        <h3 className="font-display text-base font-bold leading-tight">
          <Link to="/v/$slug" params={{ slug: product.slug }} className="hover:text-neon-cyan">
            {product.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {product.oldPrice && (
              <div className="text-xs text-muted-foreground line-through">
                {formatBRL(product.oldPrice)}
              </div>
            )}
            <div className="font-display text-xl font-bold text-neon-cyan">
              {formatBRL(product.price)}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              aria-label="Compartilhar"
              onClick={handleShare}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-purple/60 hover:text-neon-purple"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              aria-label="QR Code"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQrOpen(true); }}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-cyan/60 hover:text-neon-cyan"
            >
              <QrCode className="h-4 w-4" />
            </button>
            <a
              aria-label="WhatsApp"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { product_id: product.id })}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-green/60 hover:text-neon-green"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("checkout_start", { product_id: product.id })}
          className="btn-neon mt-1 w-full"
        >
          <ShoppingBag className="h-4 w-4" />
          Comprar agora
        </a>
      </div>

      {qrOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur" onClick={() => setQrOpen(false)}>
          <div className="relative w-full max-w-xs rounded-3xl border border-white/10 glass-strong p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Fechar" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" onClick={() => setQrOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-lg font-bold">{product.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Escaneie para abrir</p>
            <img
              alt="QR"
              className="mx-auto mt-4 h-56 w-56 rounded-2xl bg-white p-2"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(productUrl)}`}
            />
            <p className="mt-3 truncate text-xs text-muted-foreground">{productUrl}</p>
          </div>
        </div>
      )}
    </article>
  );
}
