import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/** Botão de voltar reutilizável (histórico do router, com fallback). */
export function BackButton({ fallback = "/", label = "Voltar" }: { fallback?: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
        else router.navigate({ to: fallback });
      }}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-muted-foreground transition hover:border-neon-cyan/50 hover:text-neon-cyan"
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
