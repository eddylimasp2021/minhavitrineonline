import { Link } from "@tanstack/react-router";
import { Home, Layers, Heart, Sparkles, User } from "lucide-react";

const items = [
  { to: "/" as const, label: "Início", icon: Home, exact: true },
  { to: "/produtos" as const, label: "Produtos", icon: Layers },
  { to: "/vitrine" as const, label: "Vitrine", icon: Sparkles },
  { to: "/favoritos" as const, label: "Favoritos", icon: Heart },
  { to: "/perfil" as const, label: "Perfil", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 glass-strong pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              activeProps={{ className: "text-neon-cyan" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="group flex flex-col items-center gap-1 px-2 py-3 text-xs transition"
            >
              <Icon className="h-5 w-5 transition group-hover:scale-110" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
