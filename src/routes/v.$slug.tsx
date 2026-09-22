import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import {
  Share2,
  MessageCircle,
  QrCode,
  ArrowLeft,
  ExternalLink,
  Laptop,
  Terminal,
  Key,
  ShieldCheck,
  Zap,
  Sparkles,
  Download,
  Cpu,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getPublicProductBySlug } from "@/lib/public.functions";
import { formatBRL, buildWhatsAppUrl, accessLink, isDigitalType, LICENSE_TYPES } from "@/lib/mock-data";
import { track } from "@/hooks/use-track";
import { useEffect } from "react";

export const Route = createFileRoute("/v/$slug")({
  loader: async ({ params }) => {
    const p = await getPublicProductBySlug({ data: { slug: params.slug } });
    if (!p) throw notFound();
    return { product: p };
  },
  head: ({ loaderData, params }) => {
    const SITE = "https://minhavitrineonline.lovable.app";
    const DEFAULT_IMAGE = `${SITE}/og-default.jpg`;
    const p = loaderData?.product;
    if (!p) {
      return {
        meta: [
          { title: "Produto — Minha Vitrine" },
          { name: "description", content: "Descubra produtos e softwares exclusivos." },
        ],
      };
    }
    const title = `${p.title} — Minha Vitrine`;
    const rawDesc =
      (p.description && p.description.trim()) ||
      `${p.title} por ${formatBRL(Number(p.price))} — disponível na Minha Vitrine.`;
    const description = rawDesc.slice(0, 160);
    const img = p.image_url && /^https?:\/\//i.test(p.image_url) ? p.image_url : DEFAULT_IMAGE;
    const url = `${SITE}/v/${params.slug}`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.title,
      description,
      image: img,
      url,
      sku: p.id,
      category: p.category ?? undefined,
      offers: {
        "@type": "Offer",
        price: Number(p.price),
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
        url,
      },
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:image", content: img },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: img },
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(jsonLd) },
      ],
    };
  },
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
  const isDigital = isDigitalType(p.product_type);

  useEffect(() => {
    track("product_view", { product_id: p.id, path: `/v/${p.slug}` });
  }, [p.id, p.slug]);

  const waMsg = isDigital
    ? `Olá! Tenho interesse no software *${p.title}* ${p.software_version ? `(${p.software_version})` : ""}. Como faço para efetuar o pagamento e receber o link de acesso?`
    : `Olá! Vi *${p.title}* (${typeof window !== "undefined" ? window.location.origin : ""}/v/${p.slug}) e quero saber mais.`;

  const waUrl = p.whatsapp ? buildWhatsAppUrl(p.whatsapp, waMsg) : null;

  const access = accessLink({
    productType: p.product_type ?? undefined,
    externalUrl: p.external_url ?? undefined,
    ctaLabel: p.cta_label ?? undefined,
  });

  const licenseLabel =
    LICENSE_TYPES.find((l) => l.id === p.license_type)?.label ?? p.license_type ?? "Vitalícia";

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
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-neon-cyan transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar para a Vitrine
      </Link>
      
      <article className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 glass">
            {p.image_url ? (
              <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground bg-white/5">
                <Laptop className="h-16 w-16 opacity-30 text-neon-cyan" />
              </div>
            )}
          </div>

          {/* Selos de Confiança para Software e Produtos */}
          {isDigital && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-3.5 flex items-start gap-2.5">
                <Zap className="h-5 w-5 text-neon-cyan shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neon-cyan">Entrega Imediata</h4>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Link de download e instruções enviados direto no WhatsApp.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-neon-green/20 bg-neon-green/5 p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-neon-green shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neon-green">Suporte Técnico</h4>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Atendimento direto com o desenvolvedor responsável.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {p.category && (
              <span className="inline-block rounded-full bg-neon-purple/20 px-3 py-1 text-xs text-neon-purple font-medium">
                {p.category}
              </span>
            )}
            {isDigital && (
              <span className="inline-block rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 text-xs font-semibold text-neon-cyan">
                {p.product_type === "software" ? "Software / Sistema" : p.product_type === "app" ? "Aplicativo" : "Produto Digital"}
              </span>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">{p.title}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">{p.description}</p>
          
          <p className="mt-6 font-display text-4xl font-black text-holo">{formatBRL(Number(p.price))}</p>

          {/* Ficha Técnica de Software */}
          {isDigital && (
            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5" /> Ficha Técnica & Licenciamento
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {p.software_platform && (
                  <div className="rounded-xl bg-white/5 p-2.5">
                    <span className="text-muted-foreground block text-[10px]">Plataforma</span>
                    <span className="font-semibold text-foreground">{p.software_platform}</span>
                  </div>
                )}
                {p.software_version && (
                  <div className="rounded-xl bg-white/5 p-2.5">
                    <span className="text-muted-foreground block text-[10px]">Versão Atual</span>
                    <span className="font-semibold font-mono text-neon-cyan">{p.software_version}</span>
                  </div>
                )}
                <div className="rounded-xl bg-white/5 p-2.5">
                  <span className="text-muted-foreground block text-[10px]">Tipo de Licença</span>
                  <span className="font-semibold text-foreground">{licenseLabel}</span>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5">
                  <span className="text-muted-foreground block text-[10px]">Distribuição</span>
                  <span className="font-semibold text-foreground">Download Digital</span>
                </div>
              </div>

              {p.system_requirements && (
                <div className="pt-2 border-t border-white/10 text-xs text-muted-foreground flex items-start gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-neon-purple shrink-0 mt-0.5" />
                  <span><strong>Requisitos:</strong> {p.system_requirements}</span>
                </div>
              )}
            </div>
          )}

          {p.hashtags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.hashtags.map((h: string) => (
                <span key={h} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-neon-cyan">#{h}</span>
              ))}
            </div>
          ) : null}

          {/* Botões de Ação */}
          <div className="mt-8 flex flex-wrap gap-3">
            {p.demo_url && (
              <a
                href={p.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("product_click", { product_id: p.id, metadata: { source: "demo_link" } })}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-neon-purple/50 bg-neon-purple/10 px-5 font-semibold text-neon-purple hover:bg-neon-purple/20 transition-colors"
              >
                <Sparkles className="h-4 w-4" /> Ver Demonstração
              </a>
            )}

            {access && (
              <a
                href={access.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("checkout_start", { product_id: p.id, metadata: { source: "external_link" } })}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-5 font-semibold text-background hover:opacity-90"
              >
                <ExternalLink className="h-4 w-4" /> {access.label}
              </a>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener"
                onClick={() => track("whatsapp_click", { product_id: p.id })}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-neon-green px-6 font-semibold text-background hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,255,102,0.3)]"
              >
                <MessageCircle className="h-4 w-4" /> {isDigital ? "Adquirir Licença / Comprar" : "Comprar via WhatsApp"}
              </a>
            )}

            <button
              onClick={share}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 font-semibold hover:border-neon-cyan/50 transition-colors"
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 glass p-4">
            <img src={qrSrc} alt="QR Code" className="h-20 w-20 rounded-lg" />
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neon-cyan">
                <QrCode className="h-3.5 w-3.5" /> Aponte a câmera
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Abra esta vitrine no smartphone ou compartilhe.</p>
            </div>
          </div>
        </div>
      </article>
    </AppShell>
  );
}
