import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, ShieldCheck, Save, Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BackButton } from "@/components/layout/BackButton";

export const Route = createFileRoute("/_authenticated/admin/pagamentos")({
  head: () => ({
    meta: [
      { title: "APIs de Pagamento — NeonFlow Admin" },
      { name: "description", content: "Configure e ative múltiplos provedores de pagamento da sua vitrine NeonFlow." },
      { property: "og:title", content: "APIs de Pagamento — NeonFlow Admin" },
      { property: "og:description", content: "Gerencie Stripe, Mercado Pago, PagBank, Asaas, PayPal e Pix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPayments,
});

type Provider = {
  id: string;
  name: string;
  hint: string;
  fields: Array<{ key: string; label: string; placeholder: string }>;
};

const PROVIDERS: Provider[] = [
  {
    id: "stripe",
    name: "Stripe",
    hint: "Cartão internacional, Apple/Google Pay.",
    fields: [
      { key: "publicKey", label: "Chave publicável", placeholder: "pk_live_…" },
      { key: "checkoutUrl", label: "Link de checkout (opcional)", placeholder: "https://buy.stripe.com/…" },
    ],
  },
  {
    id: "mercadopago",
    name: "Mercado Pago",
    hint: "Pix, boleto e cartão no Brasil.",
    fields: [
      { key: "publicKey", label: "Public key", placeholder: "APP_USR-…" },
      { key: "checkoutUrl", label: "Link de pagamento (opcional)", placeholder: "https://mpago.la/…" },
    ],
  },
  {
    id: "pagbank",
    name: "PagBank / PagSeguro",
    hint: "Maquininha e checkout web.",
    fields: [
      { key: "publicKey", label: "Public key / e-mail da conta", placeholder: "loja@email.com" },
      { key: "checkoutUrl", label: "Link de pagamento (opcional)", placeholder: "https://pag.ae/…" },
    ],
  },
  {
    id: "asaas",
    name: "Asaas",
    hint: "Cobranças recorrentes, Pix e boleto.",
    fields: [
      { key: "publicKey", label: "Identificador da conta", placeholder: "acc_…" },
      { key: "checkoutUrl", label: "Link de cobrança (opcional)", placeholder: "https://www.asaas.com/c/…" },
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    hint: "Pagamentos internacionais.",
    fields: [
      { key: "publicKey", label: "Client ID", placeholder: "AY…" },
      { key: "checkoutUrl", label: "PayPal.Me (opcional)", placeholder: "https://paypal.me/…" },
    ],
  },
  {
    id: "pix",
    name: "Pix direto",
    hint: "Chave Pix exibida na vitrine.",
    fields: [
      { key: "publicKey", label: "Chave Pix", placeholder: "CPF, e-mail ou aleatória" },
      { key: "checkoutUrl", label: "Nome do recebedor", placeholder: "NeonFlow Comércio" },
    ],
  },
];

type Config = Record<string, { enabled: boolean; primary?: boolean; values: Record<string, string> }>;

const STORAGE = "nf_payment_providers";

function emptyConfig(): Config {
  const c: Config = {};
  for (const p of PROVIDERS) c[p.id] = { enabled: false, values: {} };
  return c;
}

function AdminPayments() {
  const [config, setConfig] = useState<Config>(emptyConfig);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setConfig({ ...emptyConfig(), ...(JSON.parse(raw) as Config) });
    } catch {
      /* ignore */
    }
  }, []);

  function save() {
    localStorage.setItem(STORAGE, JSON.stringify(config));
    toast.success("Provedores de pagamento salvos");
  }

  const activeCount = Object.values(config).filter((c) => c.enabled).length;

  return (
    <AppShell>
      <header className="animate-fade-up">
        <BackButton fallback="/admin" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-neon-purple/30 bg-neon-purple/10 px-3 py-1 text-xs text-neon-purple">
              <CreditCard className="h-3.5 w-3.5" /> {activeCount} ativo(s)
            </span>
            <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">APIs de Pagamento</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ative quantos provedores quiser e marque um como principal do checkout.
            </p>
          </div>
          <button
            onClick={save}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta px-5 font-semibold text-background hover:opacity-90"
          >
            <Save className="h-4 w-4" /> Salvar
          </button>
        </div>
      </header>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-neon-green/20 bg-neon-green/5 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
        <p>
          Guarde aqui apenas dados públicos (chave publicável, client ID, links de pagamento). Chaves secretas
          nunca devem ficar no navegador — peça para adicioná-las como segredo do backend.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {PROVIDERS.map((p) => {
          const c = config[p.id] ?? { enabled: false, values: {} };
          return (
            <article
              key={p.id}
              className={`rounded-3xl border p-5 glass transition ${c.enabled ? "border-neon-cyan/40" : "border-white/10"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold">{p.name}</h2>
                  <p className="text-xs text-muted-foreground">{p.hint}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={c.enabled}
                  aria-label={`Ativar ${p.name}`}
                  onClick={() =>
                    setConfig((s) => ({ ...s, [p.id]: { ...c, enabled: !c.enabled } }))
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full border transition ${c.enabled ? "border-neon-cyan/60 bg-neon-cyan/30" : "border-white/10 bg-white/5"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full transition ${c.enabled ? "left-6 bg-neon-cyan shadow-[0_0_12px_var(--neon-cyan)]" : "left-0.5 bg-muted-foreground"}`}
                  />
                </button>
              </div>

              {c.enabled && (
                <div className="mt-4 space-y-3">
                  {p.fields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
                      <input
                        value={c.values[f.key] ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) =>
                          setConfig((s) => ({
                            ...s,
                            [p.id]: { ...c, values: { ...c.values, [f.key]: e.target.value } },
                          }))
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan/60 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
                      />
                    </label>
                  ))}
                  <button
                    onClick={() =>
                      setConfig((s) => {
                        const next: Config = {};
                        for (const [k, v] of Object.entries(s)) next[k] = { ...v, primary: k === p.id };
                        return next;
                      })
                    }
                    className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition ${c.primary ? "bg-neon-cyan text-background" : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"}`}
                  >
                    <Star className="h-3.5 w-3.5" /> {c.primary ? "Principal" : "Definir como principal"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
