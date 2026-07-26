import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Sparkles, TrendingUp, Zap } from "lucide-react";
import heroImg from "@/assets/hero-neon.jpg";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/product/ProductCard";
import {
  categories,
  dealOfTheDay,
  formatBRL,
  products,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeonFlow Commerce — Vitrine Futurista de Vendas" },
      {
        name: "description",
        content:
          "Plataforma neon para vendas online com vitrine virtual, IA para descrições e integração WhatsApp.",
      },
      { property: "og:title", content: "NeonFlow Commerce — Vitrine Futurista de Vendas" },
      {
        property: "og:description",
        content:
          "Plataforma neon para vendas online com vitrine virtual, IA para descrições e integração WhatsApp.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <Categories />
      <DealOfTheDay />
      <ProductSection
        title="Em destaque"
        subtitle="Selecionados pela curadoria"
        icon={Sparkles}
        accent="text-neon-cyan"
      />
      <ProductSection
        title="Tendências"
        subtitle="O que está bombando agora"
        icon={TrendingUp}
        accent="text-neon-magenta"
      />
      <ProductSection
        title="Lançamentos"
        subtitle="Recém-chegados na vitrine"
        icon={Zap}
        accent="text-neon-green"
      />
    </AppShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 glass animate-fade-up">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <img
        src={heroImg}
        alt=""
        aria-hidden
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/40 to-background/80" />

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-10 md:p-14">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs font-medium text-neon-cyan">
          <span className="pulse-dot" /> Vitrine ao vivo
        </span>
        <h1 className="max-w-2xl font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          Sua loja em uma{" "}
          <span className="text-holo">dimensão neon</span>.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Crie vitrines holográficas, divulgue produtos com IA e venda direto
          pelo WhatsApp — tudo em segundos.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/produtos" className="btn-neon">
            Explorar produtos <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/vitrine" className="btn-ghost-neon">
            Ver vitrine virtual
          </Link>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
          {[
            { k: "+12k", v: "Lojistas" },
            { k: "98%", v: "Satisfação" },
            { k: "24/7", v: "IA ativa" },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur"
            >
              <dt className="font-display text-lg font-bold text-neon-cyan">
                {s.k}
              </dt>
              <dd className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {s.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="mt-10">
      <SectionHeader
        title="Categorias"
        subtitle="Navegue por universos"
        icon={Sparkles}
      />
      <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {categories.map((c) => (
          <button
            key={c.id}
            className="group flex min-w-[110px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-neon-cyan/40 hover:bg-white/10"
          >
            <span className="text-2xl transition group-hover:scale-110">
              {c.icon}
            </span>
            <span className="text-xs font-medium">{c.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DealOfTheDay() {
  const p = dealOfTheDay;
  return (
    <section className="mt-10">
      <SectionHeader
        title="Oferta do dia"
        subtitle="Acaba em 24h"
        icon={Flame}
        accent="text-neon-magenta"
      />
      <div className="mt-4 grid gap-4 overflow-hidden rounded-3xl border border-neon-magenta/30 bg-gradient-to-br from-neon-magenta/10 via-neon-purple/10 to-transparent p-4 backdrop-blur sm:grid-cols-[1fr_auto] sm:p-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-32 sm:w-32">
            <img
              src={p.image}
              alt={p.title}
              className="h-full w-full object-cover"
              loading="lazy"
              width={768}
              height={768}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-neon-magenta">
              {p.category}
            </p>
            <h3 className="truncate font-display text-xl font-bold sm:text-2xl">
              {p.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {p.description}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              {p.oldPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatBRL(p.oldPrice)}
                </span>
              )}
              <span className="font-display text-2xl font-black text-neon-cyan">
                {formatBRL(p.price)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center sm:items-end">
          <button className="btn-neon w-full sm:w-auto">Aproveitar</button>
        </div>
      </div>
    </section>
  );
}

type IconType = typeof Sparkles;

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  accent = "text-neon-cyan",
}: {
  title: string;
  subtitle?: string;
  icon: IconType;
  accent?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 shrink-0 ${accent}`} />
          <h2 className="truncate font-display text-2xl font-bold sm:text-3xl">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <Link
        to="/produtos"
        className="shrink-0 text-xs font-medium text-neon-cyan transition hover:text-neon-magenta"
      >
        Ver tudo →
      </Link>
    </div>
  );
}

function ProductSection({
  title,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  subtitle: string;
  icon: IconType;
  accent: string;
}) {
  return (
    <section className="mt-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        accent={accent}
      />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id + title} product={p} />
        ))}
      </div>
    </section>
  );
}
