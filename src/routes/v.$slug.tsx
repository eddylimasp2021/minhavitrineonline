import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Share2, MessageCircle, QrCode, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getPublicProductBySlug } from "@/lib/public.functions";
import { formatBRL } from "@/lib/mock-data";
import { track } from "@/hooks/use-track";
import { useEffect } from "react";

export const Route = createFileRoute("/v/$slug")({
  loader: async ({ params }) => {
    const p = await getPublicProductBySlug({ data: { slug: params.slug } });
    if (!p) throw notFound();
    return { product: p };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Produto — NeonFlow" }] };
    const title = `${p.title} — NeonFlow`;
    const description = (p.description ?? `${p.title} por ${formatBRL(Number(p.price))}`).slice(0, 160);
    const image = p.image_url ?? undefined;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: PublicProduct,
  notFoundComponent: () => (
    <AppShell>
      <div className="grid place-items-center py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Produto não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Este link pode ter expirado ou o produto foi despublicado.</p>
        <Link to="/" className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-neon-cyan/50">Voltar</Link>
      </div>
    </AppShell>
  ),
});

function PublicProduct() {
  const { product: p } = Route.useLoaderData();

  useEffect(() => {
    track("product_view", { product_id: p.id, path: `/v/${p.slug}` });
  }, [p.id, p.slug]);

  const wa = p.whatsapp?.replace(/\D/g, "");
  const waUrl = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Olá! Vi ${p.title} (${window?.location?.origin ?? ""}/v/${p.slug}) e quero saber mais.`)}`
    : null;

  async function share() {
    track("share_click", { product_id: p.id });
    const url = `${window.location.origin}/v/${p.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: p.title, text: p.description ?? p.title, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  const qrSrc = typeof window !== "undefined"
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=050816&color=00F5FF&data=${encodeURIComponent(`${window.location.origin}/v/${p.slug}`)}`
    : "";

  return (
    <AppShell>
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-neon-cyan">
        <ArrowLeft className="h-4 w-4" /> Vitrine
      </Link>
      <article className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 glass">
          {p.image_url ? (
            <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">Sem imagem</div>
          )}
        </div>
        <div>
          {p.category && (
            <span className="inline-block rounded-full bg-neon-purple/20 px-3 py-1 text-xs text-neon-purple">
              {p.category}
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">{p.title}</h1>
          <p className="mt-4 text-muted-foreground">{p.description}</p>
          <p className="mt-6 font-display text-4xl font-black text-holo">{formatBRL(Number(p.price))}</p>

          {p.hashtags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.hashtags.map((h: string) => (
                <span key={h} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-neon-cyan">#{h}</span>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener"
                onClick={() => track("whatsapp_click", { product_id: p.id })}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-neon-green px-5 font-semibold text-background hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> Comprar via WhatsApp
              </a>
            )}
            <button
              onClick={share}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 font-semibold hover:border-neon-cyan/50"
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 glass p-4">
            <img src={qrSrc} alt="QR Code" className="h-24 w-24 rounded-lg" />
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neon-cyan">
                <QrCode className="h-3.5 w-3.5" /> Aponte a câmera
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Compartilhe este produto instantaneamente.</p>
            </div>
          </div>
        </div>
      </article>
    </AppShell>
  );
}
