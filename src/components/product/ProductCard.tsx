import { Heart, MessageCircle, QrCode, Share2, ShoppingBag, Star } from "lucide-react";
import { formatBRL, type Product } from "@/lib/mock-data";

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

  return (
    <article className="neon-card group flex flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          width={768}
          height={768}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
        {product.tag && (
          <span
            className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur ${tagStyles[product.tag]}`}
          >
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
          className="absolute right-3 bottom-3 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-background/60 backdrop-blur transition hover:border-neon-magenta/60 hover:text-neon-magenta"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{product.category}</span>
          <span aria-hidden>•</span>
          <span className="inline-flex items-center gap-1 text-neon-yellow">
            <Star className="h-3 w-3 fill-current" />
            {product.rating}
          </span>
        </div>
        <h3 className="font-display text-base font-bold leading-tight">
          {product.title}
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
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-purple/60 hover:text-neon-purple"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              aria-label="QR Code"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-cyan/60 hover:text-neon-cyan"
            >
              <QrCode className="h-4 w-4" />
            </button>
            <button
              aria-label="WhatsApp"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-green/60 hover:text-neon-green"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button className="btn-neon mt-1 w-full">
          <ShoppingBag className="h-4 w-4" />
          Comprar agora
        </button>
      </div>
    </article>
  );
}
