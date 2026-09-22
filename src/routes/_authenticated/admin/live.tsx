import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  Share2,
  Pin,
  Flame,
  MessageSquare,
  Users,
  Eye,
  Heart,
  TrendingUp,
  Sparkles,
  Laptop,
  Smartphone,
  Layers,
  Send,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  RotateCw,
  ShoppingBag,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BackButton } from "@/components/layout/BackButton";
import {
  LiveSession,
  LiveChatMessage,
  LiveProductItem,
  loadLiveSession,
  saveLiveSession,
  startUserMediaStream,
  startScreenShareStream,
  INITIAL_CHAT_MESSAGES,
} from "@/lib/live-commerce";
import { formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/live")({
  head: () => ({
    meta: [
      { title: "Estúdio de Transmissão Ao Vivo — Minha Vitrine Admin" },
      { name: "description", content: "Estúdio para vendas ao vivo usando webcam, celulares ou tablets com produtos fixados e ofertas relâmpago." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLiveStudio,
});

function AdminLiveStudio() {
  const [session, setSession] = useState<LiveSession>(loadLiveSession);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [messages, setMessages] = useState<LiveChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const [flashMinutes, setFlashMinutes] = useState(5);
  const [flashDiscount, setFlashDiscount] = useState(50);
  const [salesCount, setSalesCount] = useState(12);
  const [revenue, setRevenue] = useState(1800.0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Inicializa câmera ao montar
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await startUserMediaStream(undefined, undefined, facingMode);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScreenSharing(false);
      setIsVideoOff(false);
    } catch (err) {
      console.warn("Permissão de câmera/áudio não concedida ou dispositivo indisponível:", err);
    }
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await startCamera();
        return;
      }
      const screenStream = await startScreenShareStream();
      mediaStreamRef.current = screenStream;
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
      toast.success("Compartilhando tela do computador ao vivo!");
    } catch (err) {
      toast.error("Compartilhamento de tela cancelado ou indisponível.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleFlipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    toast.info(facingMode === "user" ? "Alternando para câmera traseira" : "Alternando para câmera frontal");
  };

  const toggleLiveStatus = () => {
    const nextStatus = isStreaming ? "ended" : "live";
    setIsStreaming(!isStreaming);
    const updated = {
      ...session,
      status: nextStatus as any,
      startedAt: nextStatus === "live" ? "Agora" : session.startedAt,
    };
    setSession(updated);
    saveLiveSession(updated);

    if (!isStreaming) {
      toast.success("🔴 TRANSMISSÃO INICIADA!", {
        description: "Sua live está pública e recebendo espectadores na Vitrine Ao Vivo.",
      });
    } else {
      toast.info("Transmissão encerrada.");
    }
  };

  const handlePinProduct = (prod: LiveProductItem) => {
    const updated: LiveSession = {
      ...session,
      pinnedProduct: prod,
    };
    setSession(updated);
    saveLiveSession(updated);
    toast.success(`📌 Produto fixado na live: ${prod.title}`, {
      description: "O card com botão de compra rápida foi atualizado para todos os espectadores.",
    });
  };

  const handleTriggerFlashOffer = () => {
    if (!session.pinnedProduct) {
      toast.error("Fixe um produto antes de disparar uma oferta relâmpago!");
      return;
    }

    const discountPrice = session.pinnedProduct.price * (1 - flashDiscount / 100);
    const offer = {
      active: true,
      productId: session.pinnedProduct.id,
      productTitle: session.pinnedProduct.title,
      discountPrice,
      originalPrice: session.pinnedProduct.price,
      endsAt: Date.now() + 1000 * 60 * flashMinutes,
      couponCode: `LIVE${flashDiscount}OFF`,
    };

    const updated: LiveSession = {
      ...session,
      flashOffer: offer,
    };
    setSession(updated);
    saveLiveSession(updated);

    // Mensagem no chat
    const alertMsg: LiveChatMessage = {
      id: `flash-${Date.now()}`,
      sender: "🔥 OFERTA RELÂMPAGO",
      message: `Desconto de ${flashDiscount}% ATIVADO por ${flashMinutes} minutos! Use o cupom LIVE${flashDiscount}OFF!`,
      timestamp: "Agora",
      isHost: true,
      badge: "Promoção",
    };
    setMessages((prev) => [...prev, alertMsg]);

    toast.success(`🔥 Oferta Relâmpago ativada por ${flashMinutes} minutos!`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: LiveChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "Eddy Lima (Apresentador)",
      message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      isHost: true,
      badge: "Apresentador",
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  const shareLiveUrl = typeof window !== "undefined" ? `${window.location.origin}/live` : "https://minhavitrineonline.com.br/live";

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <BackButton fallback="/admin" />
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
              <Radio className="h-3.5 w-3.5 animate-pulse text-red-500" /> Estúdio de Live Shopping & Vendas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 text-xs font-semibold text-neon-cyan">
              <Zap className="h-3.5 w-3.5" /> Compatível com Webcams, Celulares e Tablets
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl text-foreground">
            Estúdio de Transmissão Ao Vivo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Apresente seus softwares e produtos ao vivo com câmera ou tela do PC, fixe itens com 1 clique, lance ofertas relâmpago e venda em tempo real para múltiplos clientes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/live"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-foreground hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Ver Como Espectador
          </Link>

          <button
            onClick={toggleLiveStatus}
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition-all shadow-lg ${
              isStreaming
                ? "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(255,0,0,0.5)] animate-pulse"
                : "bg-gradient-to-r from-red-500 via-neon-magenta to-neon-purple text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,0,128,0.4)]"
            }`}
          >
            <Radio className="h-4 w-4" /> {isStreaming ? "Encerrar Transmissão" : "🔴 INICIAR TRANSMISSÃO AO VIVO"}
          </button>
        </div>
      </header>

      {/* Métricas ao vivo no topo */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/20 text-red-400">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-black text-foreground">{isStreaming ? session.viewersCount : 0}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Espectadores</div>
          </div>
        </div>

        <div className="rounded-2xl border border-neon-magenta/30 bg-neon-magenta/5 p-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-magenta/20 text-neon-magenta">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-black text-foreground">{session.likesCount}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Curtidas</div>
          </div>
        </div>

        <div className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-cyan/20 text-neon-cyan">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-black text-foreground">{salesCount}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Vendas na Live</div>
          </div>
        </div>

        <div className="rounded-2xl border border-neon-green/30 bg-neon-green/5 p-4 flex items-center gap-3 sm:col-span-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-green/20 text-neon-green">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-black text-neon-green">{formatBRL(revenue)}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Faturamento Gerado</div>
          </div>
        </div>
      </div>

      {/* Grid Principal do Estúdio */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Coluna Esquerda / Central: Feed de Vídeo e Controles de Câmera (7 Colunas) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Feed de Vídeo Ao Vivo */}
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Overlay com Status da Live */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {isStreaming ? (
                <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,0,0,0.8)] backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" /> AO VIVO
                </span>
              ) : (
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur border border-white/10">
                  Pronto para Transmitir
                </span>
              )}
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-mono text-white backdrop-blur border border-white/10 flex items-center gap-1">
                <Users className="h-3 w-3 text-neon-cyan" /> {isStreaming ? session.viewersCount : 0} online
              </span>
            </div>

            {/* Badge de Dispositivo Atual */}
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur border border-white/10 flex items-center gap-1.5">
                {isScreenSharing ? (
                  <>
                    <Laptop className="h-3.5 w-3.5 text-neon-purple" /> Compartilhando Tela
                  </>
                ) : (
                  <>
                    <Smartphone className="h-3.5 w-3.5 text-neon-green" /> Câmera: {facingMode === "user" ? "Frontal" : "Traseira"}
                  </>
                )}
              </span>
            </div>

            {/* Preview do Produto Fixado no Vídeo (Canto Inferior Esquerdo) */}
            {session.pinnedProduct && (
              <div className="absolute bottom-4 left-4 max-w-[280px] rounded-2xl border border-neon-cyan/50 bg-black/80 p-3 backdrop-blur shadow-xl animate-fade-up">
                <div className="flex items-center gap-2.5">
                  <img
                    src={session.pinnedProduct.image}
                    alt={session.pinnedProduct.title}
                    className="h-12 w-12 rounded-xl object-cover shrink-0 border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-bold text-neon-cyan uppercase">
                      📌 Produto na Tela
                    </span>
                    <h4 className="truncate text-xs font-bold text-white">{session.pinnedProduct.title}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-extrabold text-neon-green">
                        {formatBRL(session.pinnedProduct.price)}
                      </span>
                      {session.pinnedProduct.originalPrice && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatBRL(session.pinnedProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Barra de Controles de Mídia do Vendedor */}
          <div className="rounded-3xl border border-white/10 glass p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={toggleMute}
                className={`rounded-2xl p-3 text-xs font-semibold transition-all flex items-center gap-2 ${
                  isMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 text-foreground hover:bg-white/15"
                }`}
                title={isMuted ? "Desmutar Microfone" : "Mutar Microfone"}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-neon-green" />}
                <span>{isMuted ? "Mutado" : "Microfone"}</span>
              </button>

              <button
                onClick={toggleVideo}
                className={`rounded-2xl p-3 text-xs font-semibold transition-all flex items-center gap-2 ${
                  isVideoOff ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 text-foreground hover:bg-white/15"
                }`}
                title={isVideoOff ? "Ligar Câmera" : "Desligar Câmera"}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4 text-neon-cyan" />}
                <span>{isVideoOff ? "Sem Vídeo" : "Câmera"}</span>
              </button>

              <button
                onClick={toggleFlipCamera}
                className="rounded-2xl bg-white/10 p-3 text-xs font-semibold text-foreground hover:bg-white/15 transition-all flex items-center gap-2"
                title="Girar Câmera (Frontal/Traseira para Celular ou Tablet)"
              >
                <RotateCw className="h-4 w-4 text-neon-yellow" />
                <span>Girar Câmera</span>
              </button>

              <button
                onClick={handleScreenShare}
                className={`rounded-2xl p-3 text-xs font-semibold transition-all flex items-center gap-2 ${
                  isScreenSharing
                    ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/50"
                    : "bg-white/10 text-foreground hover:bg-white/15"
                }`}
                title="Compartilhar Tela do PC para Softwares"
              >
                <Laptop className="h-4 w-4 text-neon-purple" />
                <span>{isScreenSharing ? "Parar Tela" : "Tela de Software"}</span>
              </button>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLiveUrl);
                toast.success("Link da live copiado para a área de transferência!");
              }}
              className="rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2.5 text-xs font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-all flex items-center gap-1.5"
            >
              <Copy className="h-4 w-4" /> Copiar Link da Live
            </button>
          </div>

          {/* Central de Ofertas Relâmpago */}
          <div className="rounded-3xl border border-neon-magenta/30 bg-neon-magenta/5 p-6">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-magenta/20 text-neon-magenta">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Disparar Oferta Relâmpago com Cronômetro</h3>
                <p className="text-xs text-muted-foreground">
                  Gere urgência ativando um desconto especial com contagem regressiva na tela de todos os espectadores.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Desconto (%)</label>
                <input
                  type="number"
                  value={flashDiscount}
                  onChange={(e) => setFlashDiscount(parseInt(e.target.value) || 10)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-neon-magenta focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Duração (Minutos)</label>
                <select
                  value={flashMinutes}
                  onChange={(e) => setFlashMinutes(parseInt(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground focus:border-neon-magenta focus:outline-none"
                >
                  <option value={2}>2 Minutos (Super Rápido)</option>
                  <option value={5}>5 Minutos (Recomendado)</option>
                  <option value={10}>10 Minutos</option>
                  <option value={15}>15 Minutos</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleTriggerFlashOffer}
                  className="w-full rounded-xl bg-neon-magenta px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(255,0,128,0.4)] flex items-center justify-center gap-1.5"
                >
                  <Flame className="h-4 w-4" /> Ativar Oferta na Tela
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Produtos para Fixar & Chat ao Vivo (5 Colunas) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Sacola / Produtos para Fixar com 1 Clique */}
          <div className="rounded-3xl border border-white/10 glass p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Pin className="h-5 w-5 text-neon-cyan" />
                <h3 className="font-display font-bold text-foreground">Produtos da Live (Fixar na Tela)</h3>
              </div>
              <span className="text-xs text-muted-foreground">{session.products.length} itens</span>
            </div>

            <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {session.products.map((prod) => {
                const isPinned = session.pinnedProduct?.id === prod.id;
                return (
                  <div
                    key={prod.id}
                    className={`rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all ${
                      isPinned
                        ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={prod.image} alt={prod.title} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-foreground">{prod.title}</h4>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-extrabold text-neon-green">{formatBRL(prod.price)}</span>
                          {prod.productType === "software" && (
                            <span className="rounded bg-neon-cyan/20 px-1 py-0.5 text-[9px] font-bold text-neon-cyan">
                              SOFTWARE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePinProduct(prod)}
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
                        isPinned
                          ? "bg-neon-cyan text-background shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                          : "border border-white/10 bg-white/10 text-foreground hover:bg-white/20"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                      {isPinned ? "Fixado" : "Fixar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Interativo ao Vivo */}
          <div className="rounded-3xl border border-white/10 glass p-6 flex flex-col justify-between h-[380px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-neon-purple" />
                <h3 className="font-display font-bold text-foreground">Chat da Live em Tempo Real</h3>
              </div>
              <span className="text-[10px] font-bold text-neon-green uppercase flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-neon-green animate-ping" /> Ao Vivo
              </span>
            </div>

            {/* Mensagens */}
            <div className="my-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-2xl p-2.5 text-xs ${
                    m.isHost
                      ? "border border-neon-purple/40 bg-neon-purple/10 text-foreground"
                      : m.isBuyer
                      ? "border border-neon-green/40 bg-neon-green/10 text-foreground"
                      : "border border-white/10 bg-white/5 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      {m.sender}
                      {m.badge && (
                        <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-extrabold text-neon-cyan">
                          {m.badge}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] opacity-70">{m.timestamp}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/90">{m.message}</p>
                </div>
              ))}
            </div>

            {/* Input de Mensagem */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Responder como apresentador..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-purple focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-neon-purple px-4 py-2 text-xs font-bold text-background hover:opacity-90"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
