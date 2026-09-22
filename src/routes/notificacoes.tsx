import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Minha Vitrine" }] }),
  component: NotificacoesPage,
});

const items = [
  {
    title: "Oferta relâmpago no Neon Runner X9",
    desc: "30% off por mais 2h. Não perca.",
    time: "agora",
    dot: "bg-neon-magenta shadow-[0_0_10px_var(--neon-magenta)]",
  },
  {
    title: "Sua vitrine recebeu 124 visitas hoje",
    desc: "Crescimento de +18% em relação a ontem.",
    time: "2h",
    dot: "bg-neon-cyan shadow-[0_0_10px_var(--neon-cyan)]",
  },
  {
    title: "Novo lead via WhatsApp",
    desc: "Cliente perguntou sobre Aura Wave Pro.",
    time: "ontem",
    dot: "bg-neon-green shadow-[0_0_10px_var(--neon-green)]",
  },
];

function NotificacoesPage() {
  return (
    <AppShell>
      <header className="flex items-center gap-3 animate-fade-up">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-cyan/15 text-neon-cyan glow-cyan">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            Notificações
          </h1>
          <p className="text-sm text-muted-foreground">
            Eventos recentes da sua vitrine.
          </p>
        </div>
      </header>

      <ul className="mt-8 space-y-3">
        {items.map((n) => (
          <li
            key={n.title}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 rounded-2xl border border-white/10 glass p-4"
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.dot}`} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {n.time}
            </span>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
