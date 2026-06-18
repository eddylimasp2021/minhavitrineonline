import { createFileRoute } from "@tanstack/react-router";
import {
  Eye,
  MousePointerClick,
  Share2,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Dashboard — NeonFlow Admin" }] }),
  component: AdminPage,
});

const kpis = [
  { label: "Visitas", value: "12.4k", delta: "+18%", icon: Eye, color: "neon-cyan" },
  { label: "Cliques", value: "4.8k", delta: "+12%", icon: MousePointerClick, color: "neon-purple" },
  { label: "Conversões", value: "684", delta: "+9%", icon: ShoppingCart, color: "neon-green" },
  { label: "Leads", value: "312", delta: "+24%", icon: Users, color: "neon-magenta" },
  { label: "Compartilhamentos", value: "1.2k", delta: "+5%", icon: Share2, color: "neon-yellow" },
  { label: "Campanhas ativas", value: "7", delta: "+2", icon: TrendingUp, color: "neon-cyan" },
];

function AdminPage() {
  return (
    <AppShell>
      <header className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs text-neon-cyan">
          <span className="pulse-dot" /> Tempo real
        </span>
        <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Visão geral da performance da sua vitrine.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-white/10 glass p-4"
          >
            <div className="flex items-center justify-between">
              <k.icon className={`h-4 w-4 text-${k.color}`} />
              <span className="text-[10px] font-semibold text-neon-green">
                {k.delta}
              </span>
            </div>
            <div className="mt-3 font-display text-2xl font-black">
              {k.value}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 glass p-6">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Tráfego (7 dias)</h2>
            <span className="text-xs text-muted-foreground">Ao vivo</span>
          </header>
          <FakeChart />
        </div>

        <div className="rounded-3xl border border-white/10 glass p-6">
          <h2 className="font-display text-lg font-bold">Produtos mais vistos</h2>
          <ul className="mt-4 space-y-3">
            {products.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs font-bold text-neon-cyan">
                  {i + 1}
                </span>
                <img
                  src={p.image}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(2400 - i * 380).toLocaleString("pt-BR")} views
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-white/10 glass p-6">
        <h2 className="font-display text-lg font-bold">Campanhas com IA</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gere títulos, descrições, hashtags e textos promocionais automaticamente.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Título", "Descrição", "Hashtags", "Campanha"].map((c) => (
            <button
              key={c}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-neon-purple/50 hover:bg-white/10"
            >
              <div className="font-display text-sm font-bold text-neon-purple">
                Gerar {c}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                IA cria conteúdo em segundos.
              </p>
            </button>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function FakeChart() {
  const bars = [40, 65, 50, 78, 60, 92, 85];
  const days = ["S", "T", "Q", "Q", "S", "S", "D"];
  return (
    <div>
      <div className="flex h-40 items-end gap-3">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-neon-purple/40 via-neon-cyan/60 to-neon-cyan shadow-[0_0_18px_oklch(0.87_0.18_200/0.4)]"
              style={{ height: `${b}%` }}
            />
            <span className="text-[10px] text-muted-foreground">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
