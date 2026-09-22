import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, PLACEHOLDER_IMAGE, type Product } from "@/lib/mock-data";
import { listPublicProducts } from "@/lib/public.functions";
import { track } from "@/hooks/use-track";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Loader2, PackageSearch, AlertTriangle, RefreshCw } from "lucide-react";

type ProdSearch = { q?: string; cat?: string };
const PAGE_SIZE = 12;
const DEBOUNCE_MS = 350;
const SITE = "https://minhavitrineonline.lovable.app";

export const Route = createFileRoute("/produtos")({
  validateSearch: (s: Record<string, unknown>): ProdSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Produtos — NeonFlow Commerce" },
      { name: "description", content: "Catálogo completo da vitrine NeonFlow." },
      { property: "og:title", content: "Produtos — NeonFlow Commerce" },
      { property: "og:description", content: "Catálogo completo da vitrine NeonFlow." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/produtos` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/produtos` }],
  }),
  component: ProdutosPage,
});

function ProductSkeleton() {
  return (
    <div className="neon-card overflow-hidden">
      <div className="aspect-square animate-pulse bg-white/5" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded bg-white/5" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function ProdutosPage() {
  const { q, cat } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();

  // Invalidate cached listings when products change in Supabase (realtime).
  useEffect(() => {
    const ch = supabase
      .channel("public-products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          qc.invalidateQueries({ queryKey: ["public-products"] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  // Local input state, debounced -> URL search param.
  const [inputValue, setInputValue] = useState(q ?? "");
  useEffect(() => {
    setInputValue(q ?? "");
  }, [q]);

  useEffect(() => {
    const current = q ?? "";
    if (inputValue === current) return;
    const t = setTimeout(() => {
      const next = inputValue.trim();
      navigate({ search: (prev: ProdSearch) => ({ ...prev, q: next || undefined }) });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [inputValue, q, navigate]);

  // Track search terms (debounced via URL sync above).
  useEffect(() => {
    if (q && q.trim()) track("search", { metadata: { q, cat: cat ?? null } });
  }, [q, cat]);

  // Track filter (category) changes.
  useEffect(() => {
    if (cat) track("filter", { metadata: { cat, q: q ?? null } });
  }, [cat, q]);

  const query = useInfiniteQuery({
    queryKey: ["public-products", q ?? "", cat ?? ""],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listPublicProducts({
        data: { q, category: cat, limit: PAGE_SIZE, offset: pageParam as number },
      }),
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    placeholderData: keepPreviousData,
    retry: 2,
  });

  const rows = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const items: Product[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? "",
    price: Number(r.price),
    image: r.image_url ?? PLACEHOLDER_IMAGE,
    category: r.category ?? "Geral",
    whatsapp: r.whatsapp ?? undefined,
    productType: r.product_type ?? undefined,
    externalUrl: r.external_url ?? undefined,
    ctaLabel: r.cta_label ?? undefined,
    softwareVersion: r.software_version ?? undefined,
    softwarePlatform: r.software_platform ?? undefined,
    licenseType: r.license_type ?? undefined,
    demoUrl: r.demo_url ?? undefined,
    downloadUrl: r.download_url ?? undefined,
    deliveryInstructions: r.delivery_instructions ?? undefined,
    systemRequirements: r.system_requirements ?? undefined,
  }));

  // Infinite scroll sentinel.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !query.hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !query.isFetchingNextPage) {
          track("load_more", {
            metadata: { source: "scroll", loaded: rows.length, total, q: q ?? null, cat: cat ?? null },
          });
          query.fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage, rows.length, total, q, cat]);

  // Scroll-depth analytics: fire once per bucket (25/50/75/100%) per query.
  const depthFired = useRef<Set<number>>(new Set());
  useEffect(() => {
    depthFired.current = new Set();
  }, [q, cat]);
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const scrolled = h.scrollTop + window.innerHeight;
      const pct = Math.min(100, Math.round((scrolled / h.scrollHeight) * 100));
      for (const bucket of [25, 50, 75, 100]) {
        if (pct >= bucket && !depthFired.current.has(bucket)) {
          depthFired.current.add(bucket);
          track("scroll_depth", { metadata: { bucket, q: q ?? null, cat: cat ?? null } });
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [q, cat]);

  const isInitialLoading = query.isLoading || (query.isFetching && rows.length === 0);
  const showEndMessage = !query.hasNextPage && items.length > 0 && !query.isFetching;
  const initialError = query.isError && rows.length === 0;
  const nextPageError = query.isError && rows.length > 0;

  // JSON-LD ItemList + BreadcrumbList for SEO.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Produtos NeonFlow",
    numberOfItems: items.length,
    itemListElement: items.slice(0, 30).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/v/${p.slug}`,
      name: p.title,
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Produtos", item: `${SITE}/produtos` },
      ...(cat
        ? [{ "@type": "ListItem", position: 3, name: cat, item: `${SITE}/produtos?cat=${encodeURIComponent(cat)}` }]
        : []),
    ],
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-black sm:text-4xl">
          <span className="text-holo">Produtos</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore o catálogo completo da vitrine.
        </p>
      </header>

      <form onSubmit={(e) => e.preventDefault()} className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Buscar produtos…"
          className="h-11 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-11 text-sm placeholder:text-muted-foreground focus:border-neon-cyan/60 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
        />
        {inputValue && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setInputValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => navigate({ search: (prev: ProdSearch) => ({ ...prev, cat: undefined }) })}
          className={`rounded-full px-4 py-2 text-xs transition ${!cat ? "border border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan" : "border border-white/10 bg-white/5 hover:border-neon-cyan/40 hover:text-neon-cyan"}`}
        >
          Todos
        </button>
        {categories.map((c) => {
          const active = cat === c.label;
          return (
            <button
              key={c.id}
              onClick={() => navigate({ search: (prev: ProdSearch) => ({ ...prev, cat: active ? undefined : c.label }) })}
              className={`rounded-full px-4 py-2 text-xs transition ${active ? "border border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan" : "border border-white/10 bg-white/5 hover:border-neon-cyan/40 hover:text-neon-cyan"}`}
            >
              {c.icon} {c.label}
            </button>
          );
        })}
        {(q || cat) && (
          <button
            onClick={() => { setInputValue(""); navigate({ search: {} }); }}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>

      {isInitialLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : initialError ? (
        <div className="mt-16 grid place-items-center gap-3 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="font-display text-lg font-bold">Não foi possível carregar</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Verifique sua conexão e tente novamente. Se o problema persistir, aguarde alguns instantes.
          </p>
          <button
            onClick={() => query.refetch()}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2 text-xs text-neon-cyan hover:border-neon-cyan/70"
          >
            <RefreshCw className="h-3 w-3" /> Tentar novamente
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 grid place-items-center gap-3 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-neon-cyan">
            <PackageSearch className="h-7 w-7" />
          </div>
          <h2 className="font-display text-lg font-bold">Nada encontrado</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {q || cat ? "Tente outra palavra-chave ou remova os filtros." : "Ainda não há produtos publicados na vitrine."}
          </p>
          {(q || cat) && (
            <button
              onClick={() => { setInputValue(""); navigate({ search: {} }); }}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2 text-xs text-neon-cyan hover:border-neon-cyan/70"
            >
              <X className="h-3 w-3" /> Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 text-xs text-muted-foreground">
            Mostrando {items.length} de {total}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {query.isFetchingNextPage &&
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={`sk-${i}`} />)}
          </div>

          <div ref={sentinelRef} aria-hidden className="h-1 w-full" />

          {nextPageError && (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-neon-magenta/30 bg-neon-magenta/5 p-4 text-center">
              <div className="flex items-center gap-2 text-sm text-neon-magenta">
                <AlertTriangle className="h-4 w-4" /> Falha ao carregar mais produtos
              </div>
              <button
                onClick={() => query.fetchNextPage()}
                className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2 text-xs text-neon-cyan hover:border-neon-cyan/70"
              >
                <RefreshCw className="h-3 w-3" /> Tentar novamente
              </button>
            </div>
          )}

          {query.hasNextPage && !query.isFetchingNextPage && !nextPageError && (
            <div className="mt-8 grid place-items-center">
              <button
                onClick={() => {
                  track("load_more", {
                    metadata: { source: "button", loaded: rows.length, total, q: q ?? null, cat: cat ?? null },
                  });
                  query.fetchNextPage();
                }}
                className="btn-ghost-neon"
              >
                Carregar mais
              </button>
            </div>
          )}
          {query.isFetchingNextPage && (
            <div className="mt-8 grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {showEndMessage && (
            <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-white/10" />
              <span>Você chegou ao fim — {total} {total === 1 ? "produto" : "produtos"}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
