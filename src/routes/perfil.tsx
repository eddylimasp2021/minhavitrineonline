import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, Settings, Heart, User, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, signOut } from "@/hooks/use-auth";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — NeonFlow Commerce" }] }),
  component: PerfilPage,
});

const items = [
  { to: "/favoritos" as const, icon: Heart, label: "Favoritos" },
  { to: "/notificacoes" as const, icon: Bell, label: "Notificações" },
  { to: "/configuracoes" as const, icon: Settings, label: "Configurações" },
];

function PerfilPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "Visitante";

  return (
    <AppShell>
      <section className="overflow-hidden rounded-3xl border border-white/10 glass p-6 sm:p-8 animate-fade-up">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-magenta text-background glow-cyan">
              <User className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{name}</h1>
              <p className="truncate text-sm text-muted-foreground">
                {user?.email ?? "Entre para personalizar sua vitrine"}
              </p>
            </div>
          </div>
          {!loading && !user && (
            <Link to="/auth" className="btn-neon shrink-0 !px-4 text-sm">Entrar</Link>
          )}
        </div>
      </section>

      <ul className="mt-6 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 glass">
        {isAdmin && (
          <li>
            <Link to="/admin" className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/5">
              <Shield className="h-5 w-5 text-neon-cyan" />
              <span className="flex-1 text-sm font-medium">Painel administrativo</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        )}
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <Link to={to} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/5">
              <Icon className="h-5 w-5 text-neon-cyan" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        {user && (
          <li>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/5"
            >
              <LogOut className="h-5 w-5 text-neon-magenta" />
              <span className="flex-1 text-sm font-medium">Sair</span>
            </button>
          </li>
        )}
      </ul>
    </AppShell>
  );
}
