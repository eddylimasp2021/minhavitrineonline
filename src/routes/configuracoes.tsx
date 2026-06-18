import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — NeonFlow Commerce" }] }),
  component: ConfiguracoesPage,
});

const toggles = [
  { label: "Notificações push", hint: "Avisos de ofertas e novidades" },
  { label: "Modo escuro", hint: "Tema noturno permanente", on: true },
  { label: "Animações reduzidas", hint: "Acessibilidade e performance" },
  { label: "Compartilhar dados de uso", hint: "Ajude a melhorar o app" },
];

function ConfiguracoesPage() {
  return (
    <AppShell>
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-black sm:text-4xl">
          Configurações
        </h1>
        <p className="mt-2 text-muted-foreground">
          Personalize a experiência NeonFlow.
        </p>
      </header>

      <ul className="mt-8 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 glass">
        {toggles.map((t) => (
          <li key={t.label} className="flex items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{t.label}</p>
              <p className="truncate text-xs text-muted-foreground">{t.hint}</p>
            </div>
            <button
              aria-label={t.label}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                t.on
                  ? "border-neon-cyan/60 bg-neon-cyan/30"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full transition ${
                  t.on
                    ? "left-6 bg-neon-cyan shadow-[0_0_12px_var(--neon-cyan)]"
                    : "left-0.5 bg-muted-foreground"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
