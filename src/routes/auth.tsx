import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — NeonFlow Commerce" },
      { name: "description", content: "Acesse sua conta NeonFlow para gerenciar vitrine, favoritos e produtos." },
      { property: "og:title", content: "Entrar — NeonFlow Commerce" },
      { property: "og:description", content: "Acesse sua conta NeonFlow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: redirect ?? "/", replace: true });
    });
  }, [nav, redirect]);

  async function google() {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (r.error) {
      toast.error("Falha no login com Google");
      setBusy(false);
    } else if (!r.redirected) {
      nav({ to: redirect ?? "/", replace: true });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail se necessário.");
        nav({ to: redirect ?? "/", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: redirect ?? "/", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 glass-strong p-8">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-magenta glow-cyan">
            <Sparkles className="h-5 w-5 text-background" />
          </div>
          <span className="font-display text-xl font-bold text-holo">NeonFlow</span>
        </Link>

        <h1 className="font-display text-2xl font-black">
          {mode === "in" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse sua vitrine, favoritos e painel administrativo.
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white text-sm font-semibold text-background transition hover:bg-white/90 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continuar com Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-white/10" />
          ou com e-mail
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha (mín. 6 caracteres)"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "in" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-neon-cyan"
        >
          {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
