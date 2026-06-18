import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, Settings, ShoppingBag, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — NeonFlow Commerce" }] }),
  component: PerfilPage,
});

const items = [
  { to: "/favoritos" as const, icon: ShoppingBag, label: "Meus pedidos" },
  { to: "/notificacoes" as const, icon: Bell, label: "Notificações" },
  { to: "/configuracoes" as const, icon: Settings, label: "Configurações" },
];

function PerfilPage() {
  return (
    <AppShell>
      <section className="overflow-hidden rounded-3xl border border-white/10 glass p-6 sm:p-8 animate-fade-up">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-magenta text-background glow-cyan">
              <User className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">
                Visitante
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                Entre para personalizar sua vitrine
              </p>
            </div>
          </div>
          <button className="btn-neon shrink-0 !px-4 text-sm">Entrar</button>
        </div>
      </section>

      <ul className="mt-6 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 glass">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/5"
            >
              <Icon className="h-5 w-5 text-neon-cyan" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        <li>
          <button className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/5">
            <LogOut className="h-5 w-5 text-neon-magenta" />
            <span className="flex-1 text-sm font-medium">Sair</span>
          </button>
        </li>
      </ul>
    </AppShell>
  );
}
