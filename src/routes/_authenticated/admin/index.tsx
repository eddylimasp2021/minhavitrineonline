import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, MousePointerClick, Heart, MessageCircle, TrendingUp, Users, Sparkles, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getAdminStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — NeonFlow Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminDash,
});

const RANGES = [
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "90d", label: "90 dias", days: 90 },
] as const;

function AdminDash() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[0]);
  const fetchStats = useServerFn(getAdminStats);
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - range.days);

  const q = useQuery({
    queryKey: ["admin-stats", range.id],
    queryFn: () => fetchStats({ data: { from: from.toISOString(), to: to.toISOString() } }),
  });

  const t = q.data?.totals ?? {};
  const days = q.data?.days ?? [];
  const max = Math.max(1, ...days.map((d) => d.views + d.clicks));

  const kpis = [
    { label: "Visitas", value: (t.page_view ?? 0) + (t.product_view ?? 0), icon: Eye, color: "text-neon-cyan" },
    { label: "Cliques", value: t.product_click ?? 0, icon: MousePointerClick, color: "text-neon-purple" },
    { label: "Favoritos", value: t.favorite_add ?? 0, icon: Heart, color: "text-neon-magenta" },
    { label: "WhatsApp", value: t.whatsapp_click ?? 0, icon: MessageCircle, color: "text-neon-green" },
    { label: "Compartilhamentos", value: t.share_click ?? 0, icon: Users, color: "text-neon-yellow" },
    { label: "Conversões", value: t.conversion ?? 0, icon: TrendingUp, color: "text-neon-cyan" },
  ];

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="animate-fade-up">
          <BackButton fallback="/" />
          <div className="mt-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs text-neon-cyan">
              <span className="pulse-dot" /> Dados reais
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Performance da vitrine em tempo real.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/admin/produtos"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta px-5 font-semibold text-background hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Cadastrar novo produto
            </Link>
            <Link
              to="/admin/pagamentos"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 font-semibold hover:border-neon-purple/50 hover:text-neon-purple"
            >
              <CreditCard className="h-4 w-4" /> APIs de pagamento
            </Link>
          </div>
        </div>

        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${range.id === r.id ? "bg-neon-cyan text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 glass p-4">
            <k.icon className={`h-4 w-4 ${k.color}`} />
            <div className="mt-3 font-display text-2xl font-black tabular-nums">
              {q.isLoading ? "…" : k.value.toLocaleString("pt-BR")}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 glass p-6">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Tráfego</h2>
            <span className="text-xs text-muted-foreground">{range.label}</span>
          </header>
          {days.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem eventos ainda. Compartilhe sua vitrine!</p>
          ) : (
            <div className="flex h-48 items-end gap-1">
              {days.map((d) => {
                const h = ((d.views + d.clicks) / max) * 100;
                return (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-neon-purple/40 via-neon-cyan/60 to-neon-cyan shadow-[0_0_18px_oklch(0.87_0.18_200/0.4)]"
                      style={{ height: `${Math.max(2, h)}%` }}
                      title={`${d.day}: ${d.views} views, ${d.clicks} clicks`}
                    />
                    <span className="text-[9px] text-muted-foreground">{d.day.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 glass p-6">
          <h2 className="font-display text-lg font-bold">Top produtos</h2>
          {q.data?.topProducts.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">Sem dados ainda.</p>
          )}
          <ul className="mt-4 space-y-3">
            {q.data?.topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs font-bold text-neon-cyan">{i + 1}</span>
                {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.views.toLocaleString("pt-BR")} views</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-white/10 glass p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-neon-purple" />
          <h2 className="font-display text-lg font-bold">Ferramentas IA</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Criação de produtos com IA está em <a href="/admin/produtos" className="text-neon-cyan hover:underline">Meus Produtos</a>.
        </p>
      </section>
    </AppShell>
  );
}
