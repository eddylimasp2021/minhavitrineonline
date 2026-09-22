import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Radio,
  Eye,
  Heart,
  Flame,
  Send,
  ShoppingBag,
  Zap,
  Sparkles,
  Share2,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  CreditCard,
  QrCode,
  Laptop,
  Check,
  Clock,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  LiveSession,
  LiveChatMessage,
  LiveProductItem,
  loadLiveSession,
  INITIAL_LIVE_SESSIONS,
  INITIAL_CHAT_MESSAGES,
} from "@/lib/live-commerce";
import { formatBRL, normalizeWhatsAppNumber, WHATSAPP_NUMBER } from "@/lib/mock-data";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Vitrine Ao Vivo & Live Shopping — Minha Vitrine" },
      { name: "description", content: "Assista a transmissões ao vivo, tire dúvidas em tempo real e compre softwares e produtos com descontos exclusivos de live." },
      { property: "og:title", content: "Vitrine Ao Vivo — Minha Vitrine" },
      { property: "og:description", content: "Live shopping de softwares e produtos com checkout instantâneo." },
    ],
  }),
  component: LiveShoppingPage,
});

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
}

function LiveShoppingPage() {
  const [session, setSession] = useState<LiveSession>(loadLiveSession);
  const [messages, setMessages] = useState<LiveChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const [userName, setUserName] = useState("");
  const [likes, setLikes] = useState(session.likesCount || 1840);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<LiveProductItem | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("05:00");

  // Timer da oferta relâmpago
  useEffect(() => {
    const interval = setInterval(() => {
      if (session.flashOffer?.active && session.flashOffer.endsAt) {
        const diff = Math.max(0, session.flashOffer.endsAt - Date.now());
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session.flashOffer]);

  // Sincronização em tempo real com eventos locais
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setSession(e.detail);
    };
    window.addEventListener("mv_live_update", handleUpdate);
    return () => window.removeEventListener("mv_live_update", handleUpdate);
  }, []);

  const handleSendReaction = (emoji: string) => {
    setLikes((l) => l + 1);
    const newReaction: FloatingReaction = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.floor(Math.random() * 60) + 20, // 20% a 80% da largura
    };
    setReactions((prev) => [...prev.slice(-15), newReaction]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const name = userName.trim() || "Espectador " + Math.floor(Math.random() * 900 + 100);

    const newMsg: LiveChatMessage = {
      id: `msg-${Date.now()}`,
      sender: name,
      message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    handleSendReaction("❤️");
  };

  const handleDirectBuy = (product: LiveProductItem) => {
    setCheckoutProduct(product);
  };

  const handleWhatsAppBuy = (product: LiveProductItem) => {
    const text = encodeURIComponent(
      `👋 Olá! Estou assistindo à *Vitrine Ao Vivo* e quero garantir o *${product.title}* no valor promocional de *${formatBRL(
        product.price
      )}* (Cupom da Live)!`
    );
    const url = `https://wa.me/${normalizeWhatsAppNumber(WHATSAPP_NUMBER)}?text=${text}`;
    window.open(url, "_blank");
  };

  return (
    <AppShell>
      {/* Cabeçalho da Página Live */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-[0_0_15px_rgba(255,0,0,0.6)]">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" /> AO VIVO
            </span>
            <span className="text-xs text-muted-foreground">
              {session.viewersCount} pessoas assistindo agora
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-black sm:text-3xl text-foreground">
            {session.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{session.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: session.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link da live copiado!");
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors"
          >
            <Share2 className="h-4 w-4" /> Compartilhar Live
          </button>

          <Link
            to="/admin/live"
            className="inline-flex items-center gap-2 rounded-xl border border-neon-purple/40 bg-neon-purple/10 px-4 py-2.5 text-xs font-bold text-neon-purple hover:bg-neon-purple/20 transition-colors"
          >
            <Radio className="h-4 w-4" /> Abrir Estúdio (Apresentador)
          </Link>
        </div>
      </header>

      {/* Grid Principal do Live Shopping */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* PLAYER DE VÍDEO IMERSIVO (8 Colunas) */}
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl lg:col-span-8 flex flex-col justify-between">
          {/* Fundo do Vídeo / Stream Animado */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-950 to-neutral-900 flex items-center justify-center">
            {/* Visualizador de Demonstração / Stream Ativo */}
            <div className="relative text-center p-6 animate-pulse">
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-tr from-neon-cyan/20 to-neon-purple/20 border border-white/10 text-neon-cyan">
                <Laptop className="h-10 w-10" />
              </div>
              <h3 className="font-display text-xl font-black text-white">Transmissão em Alta Definição</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                Apresentação ao vivo de softwares, ferramentas com IA e catálogo completo da Minha Vitrine.
              </p>
            </div>
          </div>

          {/* Reações Flutuantes (Partículas Subindo na Tela) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                style={{ left: `${r.left}%` }}
                className="absolute bottom-10 text-3xl animate-bounce transition-all duration-1000 opacity-90"
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Top Overlay no Player */}
          <div className="relative z-10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 backdrop-blur px-3 py-1 text-xs font-black text-white shadow-lg">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" /> AO VIVO
              </span>
              <span className="rounded-full bg-black/60 backdrop-blur px-3 py-1 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-neon-cyan" /> {session.viewersCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBagOpen(true)}
                className="relative flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-xs font-bold text-neon-yellow border border-neon-yellow/40 hover:bg-black/80 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" /> Sacola ({session.products.length})
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-neon-magenta animate-ping" />
              </button>
            </div>
          </div>

          {/* Bottom Overlay: Produto Fixado na Tela & Barra de Reações */}
          <div className="relative z-10 p-4 flex flex-wrap items-end justify-between gap-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12">
            {/* CARD DE PRODUTO FIXADO COM 1 CLIQUE */}
            {session.pinnedProduct && (
              <div className="w-full max-w-md rounded-2xl border border-neon-cyan/50 bg-black/90 p-3.5 backdrop-blur-md shadow-2xl animate-fade-up">
                {session.flashOffer?.active && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-neon-magenta/20 border border-neon-magenta/40 px-2.5 py-1 text-[11px] font-bold text-neon-magenta">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 animate-bounce" /> OFERTA RELÂMPAGO
                    </span>
                    <span className="font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Termina em {timeLeft}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <img
                    src={session.pinnedProduct.image}
                    alt={session.pinnedProduct.title}
                    className="h-16 w-16 rounded-xl object-cover shrink-0 border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-neon-cyan/20 px-1.5 py-0.5 text-[9px] font-extrabold text-neon-cyan">
                        DESTAQUE DA LIVE
                      </span>
                      {session.pinnedProduct.discountPercentage && (
                        <span className="rounded bg-neon-green/20 px-1.5 py-0.5 text-[9px] font-extrabold text-neon-green">
                          -{session.pinnedProduct.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                    <h4 className="truncate text-xs sm:text-sm font-bold text-white mt-0.5">
                      {session.pinnedProduct.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm sm:text-base font-black text-neon-green">
                        {formatBRL(session.pinnedProduct.price)}
                      </span>
                      {session.pinnedProduct.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatBRL(session.pinnedProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDirectBuy(session.pinnedProduct!)}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple px-4 py-2.5 text-xs font-black text-background hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,255,102,0.4)] flex items-center gap-1"
                  >
                    <Zap className="h-4 w-4" /> Comprar
                  </button>
                </div>
              </div>
            )}

            {/* Barra de Reações Interativas */}
            <div className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur border border-white/15 p-1.5">
              {["❤️", "🔥", "👏", "🚀", "💎"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="grid h-8 w-8 place-items-center rounded-full hover:scale-125 transition-transform text-lg"
                >
                  {emoji}
                </button>
              ))}
              <div className="border-l border-white/15 pl-2 pr-2 text-xs font-bold text-neon-magenta flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 fill-neon-magenta" /> {likes}
              </div>
            </div>
          </div>
        </div>

        {/* CHAT AO VIVO INTERATIVO (4 Colunas) */}
        <div className="rounded-3xl border border-white/10 glass p-5 flex flex-col justify-between h-[520px] lg:col-span-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-neon-green animate-ping" />
              <h3 className="font-display font-bold text-foreground text-sm">Chat da Transmissão</h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">{messages.length} mensagens</span>
          </div>

          {/* Mensagens do Chat */}
          <div className="my-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl p-2.5 text-xs transition-all ${
                  m.isHost
                    ? "border border-neon-purple/50 bg-neon-purple/15 text-foreground"
                    : m.isBuyer
                    ? "border border-neon-green/50 bg-neon-green/15 text-foreground"
                    : "border border-white/5 bg-white/5 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    {m.sender}
                    {m.badge && (
                      <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-extrabold text-neon-cyan">
                        {m.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] opacity-60">{m.timestamp}</span>
                </div>
                <p className="mt-1 text-xs text-foreground/90 leading-relaxed">{m.message}</p>
              </div>
            ))}
          </div>

          {/* Formulário de Envio no Chat */}
          <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Seu nome (opcional)"
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-foreground focus:border-neon-cyan focus:outline-none"
              />
              <span className="text-[10px] text-muted-foreground flex items-center justify-end">
                Tire dúvidas com o apresentador
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escreva sua pergunta na live..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-neon-cyan px-4 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL / DRAWER: SACOLA DA LIVE */}
      {isBagOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-4 animate-fade-up">
          <div className="h-full max-h-[90vh] w-full max-w-md rounded-3xl border border-white/15 bg-card p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-yellow/20 text-neon-yellow">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">Sacola de Ofertas da Live</h3>
                    <p className="text-xs text-muted-foreground">Produtos apresentados nesta transmissão</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBagOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                {session.products.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex items-center justify-between gap-3 hover:border-neon-cyan/40 transition-colors"
                  >
                    <img src={p.image} alt={p.title} className="h-14 w-14 rounded-xl object-cover shrink-0 border border-white/10" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-neon-cyan uppercase">{p.category}</span>
                      <h4 className="truncate text-xs font-bold text-foreground">{p.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-black text-neon-green text-sm">{formatBRL(p.price)}</span>
                        {p.originalPrice && (
                          <span className="text-[11px] text-muted-foreground line-through">
                            {formatBRL(p.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsBagOpen(false);
                        handleDirectBuy(p);
                      }}
                      className="shrink-0 rounded-xl bg-neon-green px-3.5 py-2 text-xs font-bold text-background hover:opacity-90 shadow-[0_0_10px_rgba(0,255,102,0.3)]"
                    >
                      Comprar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-center">
              <span className="text-xs text-muted-foreground">
                ⚡ Todos os pedidos da live têm entrega prioritária e suporte via WhatsApp!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT RÁPIDO EM 1 CLIQUE */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-up">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-green/20 text-neon-green">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">Comprar Agora na Live</h3>
                  <p className="text-xs text-muted-foreground">Checkout rápido com desconto ao vivo garantido</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutProduct(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
              <img
                src={checkoutProduct.image}
                alt={checkoutProduct.title}
                className="h-16 w-16 rounded-xl object-cover shrink-0 border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-neon-cyan uppercase">
                  {checkoutProduct.productType === "software" ? "Software / Licença Digital" : "Produto"}
                </span>
                <h4 className="text-sm font-bold text-foreground">{checkoutProduct.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-black text-neon-green">{formatBRL(checkoutProduct.price)}</span>
                  {checkoutProduct.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatBRL(checkoutProduct.originalPrice)}
                    </span>
                  )}
                  <span className="rounded bg-neon-magenta/20 px-1.5 py-0.5 text-[10px] font-bold text-neon-magenta">
                    CUPOM LIVE ATIVO
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleWhatsAppBuy(checkoutProduct)}
                className="w-full rounded-2xl bg-neon-green p-4 text-xs sm:text-sm font-bold text-background hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,255,102,0.3)] flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" /> Finalizar Pedido no WhatsApp do Apresentador
              </button>

              <button
                onClick={() => {
                  toast.success("Código PIX Copia e Cola gerado com sucesso!", {
                    description: `Valor: ${formatBRL(checkoutProduct.price)}. Chave copiada!`,
                  });
                  setCheckoutProduct(null);
                }}
                className="w-full rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 p-4 text-xs sm:text-sm font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-colors flex items-center justify-center gap-2"
              >
                <QrCode className="h-5 w-5" /> Pagar com PIX Instantâneo
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-neon-green" /> Pagamento 100% Seguro & Emissão de Nota Fiscal
            </div>
          </div>
        </div>
      )}

      {/* Grade de Próximas Transmissões */}
      <section className="mt-12 border-t border-white/10 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Próximas Lives Agendadas</h2>
            <p className="text-xs text-muted-foreground">Fique por dentro das demonstrações e lançamentos</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INITIAL_LIVE_SESSIONS.filter((s) => s.status === "upcoming").map((up) => (
            <div key={up.id} className="rounded-3xl border border-white/10 glass p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-[11px] font-bold text-neon-purple">
                    {up.scheduledFor}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-neon-magenta" /> {up.likesCount}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-foreground">{up.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{up.subtitle}</p>
              </div>

              <button
                onClick={() => toast.success(`Lembrete ativado para ${up.title}!`)}
                className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-foreground hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors flex items-center justify-center gap-1.5"
              >
                <Clock className="h-4 w-4" /> Definir Lembrete
              </button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
