import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Minha Vitrine" }] }),
  component: ConfiguracoesPage,
});

const toggles = [
  { key: "push", label: "Notificações push", hint: "Avisos de ofertas e novidades", default: false },
  { key: "dark", label: "Modo escuro", hint: "Tema noturno permanente", default: true },
  { key: "reduce", label: "Animações reduzidas", hint: "Acessibilidade e performance", default: false },
  { key: "usage", label: "Compartilhar dados de uso", hint: "Ajude a melhorar o app", default: false },
] as const;

const STORAGE = "nf_settings";

function loadSettings(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE) ?? "{}"); } catch { return {}; }
}

function ConfiguracoesPage() {
  const [state, setState] = useState<Record<string, boolean>>(() => {
    const stored = loadSettings();
    const init: Record<string, boolean> = {};
    for (const t of toggles) init[t.key] = stored[t.key] ?? t.default;
    return init;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(state));
    document.documentElement.classList.toggle("reduce-motion", !!state.reduce);
  }, [state]);

  return (
    <AppShell>
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-black sm:text-4xl">Configurações</h1>
        <p className="mt-2 text-muted-foreground">Personalize sua experiência na Minha Vitrine.</p>
      </header>

      <ul className="mt-8 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 glass">
        {toggles.map((t) => {
          const on = state[t.key];
          return (
            <li key={t.key} className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.label}</p>
                <p className="truncate text-xs text-muted-foreground">{t.hint}</p>
              </div>
              <button
                role="switch"
                aria-checked={on}
                aria-label={t.label}
                onClick={() => setState((s) => ({ ...s, [t.key]: !s[t.key] }))}
                className={`relative h-7 w-12 shrink-0 rounded-full border transition ${on ? "border-neon-cyan/60 bg-neon-cyan/30" : "border-white/10 bg-white/5"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full transition ${on ? "left-6 bg-neon-cyan shadow-[0_0_12px_var(--neon-cyan)]" : "left-0.5 bg-muted-foreground"}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
