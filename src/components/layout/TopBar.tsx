import { Link } from "@tanstack/react-router";
import { Bell, Search, User } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-magenta glow-cyan">
            <span className="font-display text-lg font-black text-background">N</span>
          </div>
          <span className="hidden font-display text-lg font-bold tracking-tight sm:inline">
            <span className="text-holo">NeonFlow</span>
          </span>
        </Link>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar produtos, marcas, categorias…"
            className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-neon-cyan/60 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
          />
        </div>

        <Link
          to="/notificacoes"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-cyan/50 hover:text-neon-cyan"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neon-magenta shadow-[0_0_10px_var(--neon-magenta)]" />
        </Link>
        <Link
          to="/perfil"
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-cyan/50 hover:text-neon-cyan sm:grid"
          aria-label="Perfil"
        >
          <User className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
