import { Link } from "@tanstack/react-router";
import { Bell, Search, User, LogOut, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";

export function TopBar() {
  const { user, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "?")
    .toString()
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

        {loading ? (
          <div className="grid h-10 w-10 place-items-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta text-xs font-bold text-background transition hover:opacity-90"
              aria-label="Menu"
            >
              {initials}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 glass-strong shadow-xl">
                <div className="border-b border-white/10 p-3">
                  <p className="truncate text-sm font-semibold">{user.user_metadata?.full_name ?? user.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Link to="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-2 p-3 text-sm hover:bg-white/5">
                  <User className="h-4 w-4" /> Meu perfil
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 p-3 text-sm text-neon-cyan hover:bg-white/5">
                    <LayoutDashboard className="h-4 w-4" /> Admin
                  </Link>
                )}
                <button onClick={() => { setOpen(false); signOut(); }} className="flex w-full items-center gap-2 p-3 text-sm text-neon-magenta hover:bg-white/5">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/auth"
            className="inline-flex h-10 shrink-0 items-center rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta px-4 text-xs font-semibold text-background hover:opacity-90"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
