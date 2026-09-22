import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Search,
  User,
  LogOut,
  LayoutDashboard,
  Loader2,
  Package,
  CreditCard,
  Heart,
  Sparkles,
  Tag,
  Laptop,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";

export function TopBar() {
  const { user, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navLinks = [
    { to: "/", label: "Início", exact: true },
    { to: "/produtos", label: "Produtos" },
    { to: "/vitrine", label: "Vitrine 3D" },
    { to: "/promocoes", label: "Promoções" },
    { to: "/favoritos", label: "Favoritos" },
  ];

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-white/10 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        {/* Logo & Marca */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-magenta shadow-[0_0_15px_rgba(0,245,255,0.4)] transition group-hover:scale-105">
            <span className="font-display text-lg font-black text-background">MV</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-lg font-black tracking-tight text-holo block leading-none">
              Minha Vitrine
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              Online Commerce
            </span>
          </div>
        </Link>

        {/* Abas / Menus Desktop */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = link.exact
              ? pathname === link.to
              : pathname.startsWith(link.to) && (link.to !== "/" || pathname === "/");
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 text-neon-cyan shadow-[0_0_12px_rgba(0,245,255,0.25)] border border-neon-cyan/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
              <Link
                to="/admin/produtos"
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/admin/produtos")
                    ? "bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/40"
                    : "text-neon-cyan hover:bg-neon-cyan/10"
                }`}
              >
                <Package className="h-3.5 w-3.5" /> Softwares & Produtos
              </Link>
              <Link
                to="/admin"
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname === "/admin"
                    ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
            </div>
          )}
        </nav>

        {/* Barra de Busca */}
        <form
          className="relative min-w-0 flex-1 max-w-xs sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/produtos", search: { q: q.trim() || undefined } });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos, softwares, apps…"
            className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 text-xs sm:text-sm placeholder:text-muted-foreground focus:border-neon-cyan/60 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
          />
        </form>

        {/* Notificações & Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/notificacoes"
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-neon-cyan/50 hover:text-neon-cyan"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-neon-magenta shadow-[0_0_10px_var(--neon-magenta)]" />
          </Link>

          {loading ? (
            <div className="grid h-10 w-10 place-items-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : user ? (
            <div ref={ref} className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-3 text-xs font-semibold transition hover:border-neon-cyan/40 hover:bg-white/10"
                aria-label="Menu do Usuário"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta text-xs font-bold text-background shadow-[0_0_10px_rgba(0,245,255,0.3)]">
                  {initials}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate text-foreground">
                  {user?.user_metadata?.full_name ?? user?.email?.split("@")[0]}
                </span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 glass-strong shadow-2xl p-1.5 animate-in fade-in-50 zoom-in-95">
                  <div className="border-b border-white/10 p-3 mb-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-semibold">{user.user_metadata?.full_name ?? user.email}</p>
                      {isAdmin && (
                        <span className="shrink-0 rounded-md bg-neon-cyan/15 px-1.5 py-0.5 text-[10px] font-bold text-neon-cyan border border-neon-cyan/30">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  </div>

                  <Link
                    to="/perfil"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs font-medium hover:bg-white/5 transition-colors"
                  >
                    <User className="h-4 w-4 text-neon-cyan" /> Central do Perfil
                  </Link>
                  <Link
                    to="/favoritos"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs font-medium hover:bg-white/5 transition-colors"
                  >
                    <Heart className="h-4 w-4 text-neon-magenta" /> Meus Favoritos
                  </Link>

                  {isAdmin && (
                    <div className="border-t border-white/10 my-1 pt-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Gestão da Loja
                      </div>
                      <Link
                        to="/admin/produtos"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                      >
                        <Package className="h-4 w-4" /> Meus Produtos & Softwares
                      </Link>
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs font-medium hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-neon-purple" /> Dashboard & Métricas
                      </Link>
                      <Link
                        to="/admin/pagamentos"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs font-medium hover:bg-white/5 transition-colors"
                      >
                        <CreditCard className="h-4 w-4 text-neon-green" /> Configurar Pagamentos
                      </Link>
                      <Link
                        to="/admin/fiscal"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs font-medium hover:bg-white/5 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-neon-yellow" /> Configuração Fiscal & Notas
                      </Link>
                    </div>
                  )}

                  <div className="border-t border-white/10 my-1 pt-1">
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl p-2.5 text-xs font-medium text-neon-magenta hover:bg-neon-magenta/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sair da conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta px-5 text-xs font-semibold text-background hover:opacity-90 shadow-[0_0_12px_rgba(0,245,255,0.3)] transition-opacity"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
