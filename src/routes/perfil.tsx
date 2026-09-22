import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Heart,
  User,
  ShieldCheck,
  Package,
  LayoutDashboard,
  CreditCard,
  Laptop,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Zap,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useState } from "react";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil & Gestão — Minha Vitrine" }] }),
  component: PerfilPage,
});

export function PerfilPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"gestao" | "conta" | "suporte">(isAdmin ? "gestao" : "conta");

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Visitante";

  const initials = name
    .toString()
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppShell>
      {/* Banner Principal do Perfil */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 glass-strong p-6 sm:p-8 animate-fade-up">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-neon-purple/5 to-neon-magenta/10 opacity-60" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-magenta text-2xl font-black text-background shadow-[0_0_25px_rgba(0,245,255,0.4)]">
                {initials || <User className="h-9 w-9" />}
              </div>
              {isAdmin && (
                <div className="absolute -bottom-2 -right-2 rounded-full border border-neon-cyan bg-background p-1 text-neon-cyan shadow-md" title="Administrador Master">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">{name}</h1>
                {isAdmin ? (
                  <span className="rounded-full border border-neon-cyan/50 bg-neon-cyan/15 px-2.5 py-0.5 text-xs font-bold text-neon-cyan flex items-center gap-1 shadow-[0_0_10px_rgba(0,245,255,0.2)]">
                    <Zap className="h-3 w-3" /> Dono / Admin
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-muted-foreground">
                    Cliente
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email ?? "Não conectado"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!loading && !user ? (
              <Link to="/auth" className="btn-neon !px-6 text-sm">
                Entrar / Cadastrar
              </Link>
            ) : (
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-neon-magenta/40 bg-neon-magenta/10 px-4 py-2 text-xs font-semibold text-neon-magenta hover:bg-neon-magenta/20 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sair da conta
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Abas de Navegação */}
      <div className="mt-8 flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {isAdmin && (
          <button
            onClick={() => setActiveTab("gestao")}
            className={`rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "gestao"
                ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-background shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
            }`}
          >
            <Laptop className="h-4 w-4" /> Gestão da Loja & Softwares
          </button>
        )}
        <button
          onClick={() => setActiveTab("conta")}
          className={`rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "conta"
              ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-background shadow-[0_0_15px_rgba(0,245,255,0.3)]"
              : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
          }`}
        >
          <User className="h-4 w-4" /> Minha Conta & Preferências
        </button>
        <button
          onClick={() => setActiveTab("suporte")}
          className={`rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "suporte"
              ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-background shadow-[0_0_15px_rgba(0,245,255,0.3)]"
              : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
          }`}
        >
          <MessageCircle className="h-4 w-4" /> Suporte Técnico & Contato
        </button>
      </div>

      {/* Conteúdo da Aba: Gestão da Loja (Admin) */}
      {isAdmin && activeTab === "gestao" && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          <Link
            to="/admin/produtos"
            className="group rounded-3xl border border-neon-cyan/30 bg-neon-cyan/5 p-6 hover:border-neon-cyan/60 hover:bg-neon-cyan/10 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-cyan/20 text-neon-cyan mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Meus Produtos & Softwares</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Cadastre novos softwares, edite descrições, altere preços, gerencie links de download e envie kits de entrega.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-neon-cyan">
              Acessar gestão de produtos <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin"
            className="group rounded-3xl border border-neon-purple/30 bg-neon-purple/5 p-6 hover:border-neon-purple/60 hover:bg-neon-purple/10 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-purple/20 text-neon-purple mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Dashboard & Métricas</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Veja o número de visitas, cliques de compra no WhatsApp, produtos favoritos e relatórios analíticos em tempo real.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-neon-purple">
              Visualizar métricas <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/pagamentos"
            className="group rounded-3xl border border-neon-green/30 bg-neon-green/5 p-6 hover:border-neon-green/60 hover:bg-neon-green/10 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-green/20 text-neon-green mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Configurar Pagamentos</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Configure suas chaves de API e métodos de checkout (PIX automático, Mercado Pago, Stripe).
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-neon-green">
              Configurar APIs <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/fiscal"
            className="group rounded-3xl border border-neon-yellow/30 bg-neon-yellow/5 p-6 hover:border-neon-yellow/60 hover:bg-neon-yellow/10 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-yellow/20 text-neon-yellow mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Configuração Fiscal & Notas</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Emissão de NF-e, NFC-e (Cupom), NFS-e para Softwares, regras interestaduais (DIFAL/ICMS) e gateways fiscais.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-neon-yellow">
              Acessar fiscal & notas <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </section>
      )}

      {/* Conteúdo da Aba: Minha Conta */}
      {activeTab === "conta" && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          <Link
            to="/favoritos"
            className="group rounded-3xl border border-white/10 glass p-6 hover:border-neon-magenta/50 hover:bg-white/10 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-magenta/15 text-neon-magenta mb-4 group-hover:scale-110 transition-transform">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Meus Favoritos</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Veja a lista de produtos, softwares e itens que você salvou como favoritos.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-neon-magenta">
              Abrir favoritos <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/notificacoes"
            className="group rounded-3xl border border-white/10 glass p-6 hover:border-neon-cyan/50 hover:bg-white/10 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-cyan/15 text-neon-cyan mb-4 group-hover:scale-110 transition-transform">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Central de Notificações</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Acompanhe avisos de novos lançamentos, promoções relâmpago e comunicados.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-neon-cyan">
              Ver notificações <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/configuracoes"
            className="group rounded-3xl border border-white/10 glass p-6 hover:border-neon-purple/50 hover:bg-white/10 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-purple/15 text-neon-purple mb-4 group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Configurações</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Ajuste opções de privacidade, preferências de navegação e tema.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-neon-purple">
              Ajustar preferências <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </section>
      )}

      {/* Conteúdo da Aba: Suporte Técnico */}
      {activeTab === "suporte" && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 animate-fade-up">
          <div className="rounded-3xl border border-neon-green/30 bg-neon-green/5 p-6 flex flex-col justify-between">
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-green/20 text-neon-green mb-4">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Suporte Direto no WhatsApp</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Tire dúvidas sobre instalação de softwares, pagamentos ou suporte técnico com o desenvolvedor responsável.
              </p>
            </div>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-neon-green px-5 py-3 text-xs font-bold text-background hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,255,102,0.3)]"
            >
              <MessageCircle className="h-4 w-4" /> Conversar no WhatsApp
            </a>
          </div>

          <div className="rounded-3xl border border-white/10 glass p-6 flex flex-col justify-between">
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-neon-cyan mb-4">
                <ExternalLink className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Vitrine Virtual & Catálogo</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Explore a experiência imersiva 3D com todos os produtos disponíveis no catálogo.
              </p>
            </div>
            <Link
              to="/vitrine"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold text-foreground hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors"
            >
              <Sparkles className="h-4 w-4" /> Acessar Vitrine 3D
            </Link>
          </div>
        </section>
      )}
    </AppShell>
  );
}
