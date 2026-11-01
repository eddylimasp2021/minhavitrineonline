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
  Video,
  VideoOff,
  Mic,
  MicOff,
  RotateCw,
  Pin,
  Settings,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  TrendingUp,
  DollarSign,
  CheckCircle,
  UserCheck,
  Bell,
  Package,
  GripHorizontal,
  ShieldAlert,
  Lock,
  EyeOff,
  User,
  Truck,
  MapPin,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import {
  LiveSession,
  LiveChatMessage,
  LiveProductItem,
  LiveCartItem,
  LiveOrder,
  loadLiveSession,
  saveLiveSession,
  loadLiveOrders,
  saveLiveOrders,
  loadLiveCart,
  saveLiveCart,
  startUserMediaStream,
  startScreenShareStream,
  INITIAL_LIVE_SESSIONS,
  INITIAL_CHAT_MESSAGES,
} from "@/lib/live-commerce";
import { formatBRL, normalizeWhatsAppNumber, WHATSAPP_NUMBER, isDigitalType } from "@/lib/mock-data";
import { formatCep, lookupCep, calculateShippingOptions, ShippingOption, CepAddress } from "@/lib/shipping";

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

  // Autenticação e Permissões de Apresentador (Admin / Vendedor da Loja)
  const { user, isAdmin, loading: authLoading } = useAuth();
  const isSeller = Boolean(user?.user_metadata?.role === "seller" || user?.user_metadata?.role === "vendedor");
  const isStoreStaff = !authLoading && Boolean(isAdmin || isSeller);
  const [viewAsSpectator, setViewAsSpectator] = useState(false);
  const isPresenter = isStoreStaff && !viewAsSpectator;

  // Estados de Carrinho da Live & Controle de Vendas em Tempo Real
  const [cart, setCart] = useState<LiveCartItem[]>(loadLiveCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<LiveOrder[]>(loadLiveOrders);
  const [studioTab, setStudioTab] = useState<"stream" | "sales" | "products">("sales");
  const [customerCheckoutName, setCustomerCheckoutName] = useState("");
  const [customerCheckoutPhone, setCustomerCheckoutPhone] = useState("");
  const [cartPaymentStep, setCartPaymentStep] = useState<"review" | "pix">("review");

  // Estados de Frete & Entrega no Carrinho da Live
  const [cartCep, setCartCep] = useState("");
  const [isSearchingCartCep, setIsSearchingCartCep] = useState(false);
  const [cartAddress, setCartAddress] = useState<CepAddress | null>(null);
  const [cartShippingOptions, setCartShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedLiveShipping, setSelectedLiveShipping] = useState<ShippingOption | null>(null);
  const [customerStreetNumber, setCustomerStreetNumber] = useState("");
  const [customerStreetComplement, setCustomerStreetComplement] = useState("");

  const [latestPurchase, setLatestPurchase] = useState<{
    id: string;
    buyerName: string;
    productTitle: string;
    amount: number;
  } | null>(null);

  // Estados e Refs de Mídia (Câmera, Microfone e Transmissão)
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estados e controle de arrasto (drag) do Banner de Oferta Relâmpago
  const [isOfferVisible, setIsOfferVisible] = useState(true);
  const [offerPos, setOfferPos] = useState<{ x: number; y: number } | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    elemX: number;
    elemY: number;
  }>({ startX: 0, startY: 0, elemX: 0, elemY: 0 });

  const startDrag = (clientX: number, clientY: number) => {
    if (!bannerRef.current || !playerContainerRef.current) return;
    const playerRect = playerContainerRef.current.getBoundingClientRect();
    const bannerRect = bannerRef.current.getBoundingClientRect();

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      elemX: bannerRect.left - playerRect.left,
      elemY: bannerRect.top - playerRect.top,
    };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const curX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const dx = curX - dragRef.current.startX;
      const dy = curY - dragRef.current.startY;

      const pRect = playerContainerRef.current?.getBoundingClientRect();
      const bRect = bannerRef.current?.getBoundingClientRect();
      if (!pRect || !bRect) return;

      const maxX = pRect.width - bRect.width;
      const maxY = pRect.height - bRect.height;

      const nextX = Math.max(8, Math.min(maxX - 8, dragRef.current.elemX + dx));
      const nextY = Math.max(8, Math.min(maxY - 8, dragRef.current.elemY + dy));

      setOfferPos({ x: nextX, y: nextY });
    };

    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove as any);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove as any);
      window.removeEventListener("touchend", handleEnd);
    };

    window.addEventListener("mousemove", handleMove as any);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove as any, { passive: true });
    window.addEventListener("touchend", handleEnd);
  };

  // Limpeza de mídia ao desmontar o componente
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopAllTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (facing: "user" | "environment" = facingMode) => {
    if (!isPresenter) {
      toast.error("A transmissão de câmera é permitida apenas para administradores e vendedores da loja.");
      return;
    }
    stopAllTracks();
    try {
      const stream = await startUserMediaStream(undefined, undefined, facing);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      stream.getAudioTracks().forEach((track) => (track.enabled = isMicActive));
      setIsCameraActive(true);
      setIsScreenSharing(false);
      toast.success(
        facing === "user"
          ? "Câmera frontal conectada com sucesso!"
          : "Câmera traseira conectada com sucesso!"
      );
    } catch (err: any) {
      console.error(err);
      toast.error("Permissão de câmera negada ou dispositivo não encontrado.");
    }
  };

  const toggleCamera = () => {
    if (!isPresenter) {
      toast.error("Recurso exclusivo para administradores e vendedores da loja.");
      return;
    }
    if (isCameraActive) {
      stopAllTracks();
      setIsCameraActive(false);
      toast.info("Câmera desativada");
    } else {
      startCamera(facingMode);
    }
  };

  const toggleMic = () => {
    if (!isPresenter) {
      toast.error("Recurso exclusivo para o apresentador da live.");
      return;
    }
    const nextState = !isMicActive;
    setIsMicActive(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
      toast.success(nextState ? "Microfone ativado" : "Microfone silenciado (mudo)");
    } else {
      toast.info(nextState ? "Microfone pronto (será ativado ao ligar a câmera)" : "Microfone silenciado");
    }
  };

  const toggleFlipCamera = () => {
    if (!isPresenter) return;
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    } else {
      toast.info(`Câmera configurada para modo ${nextFacing === "user" ? "Frontal" : "Traseiro"}`);
    }
  };

  const toggleScreenShare = async () => {
    if (!isPresenter) {
      toast.error("O compartilhamento de tela é exclusivo para apresentadores da loja.");
      return;
    }
    if (isScreenSharing) {
      stopAllTracks();
      setIsScreenSharing(false);
      toast.info("Compartilhamento de tela finalizado");
    } else {
      stopAllTracks();
      try {
        const stream = await startScreenShareStream();
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsScreenSharing(true);
        setIsCameraActive(false);

        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          setIsScreenSharing(false);
          if (videoRef.current) videoRef.current.srcObject = null;
          toast.info("Compartilhamento de tela encerrado");
        });

        toast.success("Transmitindo tela do computador ao vivo!");
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível iniciar o compartilhamento de tela.");
      }
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    } else {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
  };

  const handlePinProduct = (product: LiveProductItem) => {
    const updated: LiveSession = {
      ...session,
      pinnedProduct: product,
    };
    setSession(updated);
    saveLiveSession(updated);
    toast.success(`"${product.title}" fixado na tela da live!`);
  };

  const handleToggleFlashOffer = () => {
    if (session.flashOffer?.active) {
      const updated: LiveSession = {
        ...session,
        flashOffer: { ...session.flashOffer, active: false },
      };
      setSession(updated);
      saveLiveSession(updated);
      toast.info("Oferta relâmpago pausada");
    } else {
      const updated: LiveSession = {
        ...session,
        flashOffer: {
          active: true,
          productId: session.pinnedProduct?.id || session.products[0]?.id || "live-offer",
          productTitle: session.pinnedProduct?.title || session.products[0]?.title || "Super Desconto de Live",
          discountPrice: Math.round((session.pinnedProduct?.price || 150) * 0.7),
          originalPrice: session.pinnedProduct?.price || 150,
          endsAt: Date.now() + 1000 * 60 * 10, // 10 minutos
          couponCode: "LIVE30OFF",
        },
      };
      setSession(updated);
      saveLiveSession(updated);
      toast.success("🔥 Oferta Relâmpago iniciada com cronômetro de 10 min!");
    }
  };

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
    const handleOrders = (e: any) => {
      if (e.detail) setOrders(e.detail);
    };
    const handleCart = (e: any) => {
      if (e.detail) setCart(e.detail);
    };
    window.addEventListener("mv_live_update", handleUpdate);
    window.addEventListener("mv_live_orders_update", handleOrders);
    window.addEventListener("mv_live_cart_update", handleCart);
    return () => {
      window.removeEventListener("mv_live_update", handleUpdate);
      window.removeEventListener("mv_live_orders_update", handleOrders);
      window.removeEventListener("mv_live_cart_update", handleCart);
    };
  }, []);

  const handleAddToCart = (product: LiveProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let updated: LiveCartItem[];
      const itemPrice =
        session.flashOffer?.active && session.flashOffer.productId === product.id
          ? session.flashOffer.discountPrice
          : product.price;

      if (existing) {
        updated = prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [...prev, { id: product.id, product, quantity: 1, unitPrice: itemPrice }];
      }
      saveLiveCart(updated);
      return updated;
    });
    toast.success(`"${product.title}" adicionado ao carrinho da live!`);
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as LiveCartItem[];
      saveLiveCart(updated);
      return updated;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      saveLiveCart(updated);
      return updated;
    });
    toast.info("Item removido do carrinho");
  };

  const hasPhysicalProducts = cart.some(
    (item) => item.product.productType === "physical" || item.product.productType === "fisico" || !isDigitalType(item.product.productType)
  );

  const cartSubtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const cartShippingFee = selectedLiveShipping ? selectedLiveShipping.price : 0;
  const cartTotal = cartSubtotal + cartShippingFee;
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCalculateCartShipping = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = cartCep.replace(/\D/g, "");
    if (clean.length !== 8) {
      toast.error("Digite um CEP válido com 8 números.");
      return;
    }
    setIsSearchingCartCep(true);
    try {
      const addr = await lookupCep(clean);
      if (addr) {
        setCartAddress(addr);
        const options = calculateShippingOptions(addr.uf, cartSubtotal);
        setCartShippingOptions(options);
        setSelectedLiveShipping(options[0]);
        toast.success(`Frete calculado para ${addr.localidade} - ${addr.uf}!`);
      } else {
        toast.error("CEP não localizado. Verifique os números digitados.");
      }
    } catch {
      toast.error("Erro ao calcular frete. Tente novamente.");
    } finally {
      setIsSearchingCartCep(false);
    }
  };

  const handleFinishCartOrder = (method: "pix" | "card" | "whatsapp") => {
    if (cart.length === 0) return;
    const name = customerCheckoutName.trim() || userName.trim() || "Cliente Ao Vivo";
    const phone = customerCheckoutPhone.trim() || "(11) 99999-9999";
    const orderId = `PED-${Math.floor(Math.random() * 9000 + 1000)}`;

    const shippingData = selectedLiveShipping && cartAddress
      ? {
          shippingOption: {
            id: selectedLiveShipping.id,
            name: selectedLiveShipping.name,
            carrier: selectedLiveShipping.carrier,
            price: selectedLiveShipping.price,
            deliveryDaysMin: selectedLiveShipping.deliveryDaysMin,
            deliveryDaysMax: selectedLiveShipping.deliveryDaysMax,
          },
          shippingFee: selectedLiveShipping.price,
          shippingAddress: {
            cep: cartAddress.cep,
            street: cartAddress.logradouro,
            number: customerStreetNumber.trim() || "S/N",
            complement: customerStreetComplement.trim() || undefined,
            neighborhood: cartAddress.bairro,
            city: cartAddress.localidade,
            state: cartAddress.uf,
          },
        }
      : {};

    const newOrder: LiveOrder = {
      id: orderId,
      customerName: name,
      customerPhone: phone,
      items: [...cart],
      totalAmount: cartTotal,
      paymentMethod: method,
      status: "paid",
      createdAt: Date.now(),
      formattedTime: "Agora",
      ...shippingData,
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveLiveOrders(updatedOrders);

    // Efeito manada: notificação flutuante no vídeo para toda a audiência
    const summaryProduct = cart[0]?.product.title + (cart.length > 1 ? ` (+${cart.length - 1} itens)` : "");
    setLatestPurchase({
      id: orderId,
      buyerName: name,
      productTitle: summaryProduct,
      amount: cartTotal,
    });
    setTimeout(() => {
      setLatestPurchase(null);
    }, 6000);

    // Mensagem automática no chat ao vivo com badge VIP
    const chatMsg: LiveChatMessage = {
      id: `sale-${Date.now()}`,
      sender: "🛍️ Nova Compra na Live",
      message: `🎉 ${name} acabou de garantir ${summaryProduct} por ${formatBRL(cartTotal)}!`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      isBuyer: true,
      badge: "Compra Aprovada ⚡",
    };
    setMessages((prev) => [...prev, chatMsg]);

    const itemsSummary = cart.map((i) => `• ${i.quantity}x ${i.product.title} (${formatBRL(i.unitPrice)})`).join("\n");
    const orderTotal = cartTotal;

    const shippingInfoMsg = selectedLiveShipping && cartAddress
      ? `\n\n*Envio / Frete:*\n• Modalidade: ${selectedLiveShipping.name} (${formatBRL(selectedLiveShipping.price)})\n• Prazo Estimado: ${selectedLiveShipping.deliveryDaysMin} a ${selectedLiveShipping.deliveryDaysMax} dias úteis\n• Endereço: ${cartAddress.logradouro}, ${customerStreetNumber || "S/N"}${customerStreetComplement ? ` (${customerStreetComplement})` : ""} - ${cartAddress.bairro}, ${cartAddress.localidade}/${cartAddress.uf} - CEP: ${cartAddress.cep}`
      : "";

    // Limpa carrinho
    setCart([]);
    saveLiveCart([]);

    if (method === "whatsapp") {
      const text = encodeURIComponent(
        `🛍️ *NOVO PEDIDO DA LIVE SHOPPING*\n\n*Cliente:* ${name}\n*Telefone:* ${phone}\n*Pedido:* #${orderId}\n\n*Itens Comprados:*\n${itemsSummary}\n\n*Subtotal:* ${formatBRL(cartSubtotal)}${selectedLiveShipping ? `\n*Frete (${selectedLiveShipping.name}):* ${formatBRL(selectedLiveShipping.price)}` : ""}\n*Total Final:* ${formatBRL(orderTotal)}${shippingInfoMsg}\n*Forma:* WhatsApp / PIX Instantâneo\n\nOlá, acabei de fechar esse pedido na Live e quero confirmar o pagamento e envio!`
      );
      const url = `https://wa.me/${normalizeWhatsAppNumber(WHATSAPP_NUMBER)}?text=${text}`;
      window.open(url, "_blank");
      setIsCartOpen(false);
      toast.success("Pedido gerado com sucesso! Abrindo WhatsApp...");
    } else if (method === "card") {
      setIsCartOpen(false);
      toast.success("Redirecionando para o pagamento seguro no Cartão...");
      const cardMsg = `Olá! Acabei de fechar o pedido #${orderId} na live (${formatBRL(orderTotal)}) e quero efetuar o pagamento via Cartão de Crédito.${shippingInfoMsg}\n\nPode me enviar o link de pagamento?`;
      const url = `https://wa.me/${normalizeWhatsAppNumber(WHATSAPP_NUMBER)}?text=${encodeURIComponent(cardMsg)}`;
      window.open(url, "_blank");
    } else if (method === "pix") {
      setCartPaymentStep("pix");
      toast.success("QR Code PIX gerado com sucesso!");
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: "paid" | "pending" | "processing") => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    setOrders(updated);
    saveLiveOrders(updated);
    toast.success(`Pedido #${orderId} atualizado para "${newStatus === "paid" ? "Pago" : "Pendente"}"`);
  };

  // Métricas do Apresentador
  const totalSalesRevenue = orders.filter((o) => o.status === "paid").reduce((acc, o) => acc + o.totalAmount, 0);
  const totalPaidOrdersCount = orders.filter((o) => o.status === "paid").length;
  const activeCartsCount = cart.length > 0 ? 1 : 0;

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
      {/* Barra de Status e Permissão do Apresentador da Loja (Visível apenas para Admin e Vendedor) */}
      {isStoreStaff && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 p-3 shadow-sm backdrop-blur-sm animate-fade-up">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-neon-cyan/20 text-neon-cyan text-sm">
              🎙️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-foreground">
                  {viewAsSpectator
                    ? "Modo Simulação: Visão do Cliente / Espectador"
                    : "Acesso Autorizado: Apresentador / Lojista"}
                </p>
                <span className="rounded-full bg-neon-cyan/20 border border-neon-cyan/40 px-2 py-0.5 text-[10px] font-bold text-neon-cyan">
                  {isAdmin ? "Admin da Loja" : "Vendedor Autorizado"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {viewAsSpectator
                  ? "Você está testando a live como um comprador comum (sem ferramentas de emissão de vídeo ou estúdio de vendas visíveis)."
                  : "Você tem acesso total para transmitir via câmera/tela, fixar ofertas e gerenciar pedidos ao vivo."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextState = !viewAsSpectator;
                setViewAsSpectator(nextState);
                toast.info(
                  nextState
                    ? "Modo cliente ativado: ferramentas de transmissão ocultadas para teste."
                    : "Modo apresentador ativado: controles da live restaurados."
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-white/20 transition-colors"
              title={viewAsSpectator ? "Voltar a ver os controles do apresentador" : "Simular como os clientes veem a live"}
            >
              {viewAsSpectator ? (
                <>
                  <Radio className="h-3.5 w-3.5 text-neon-cyan animate-pulse" />
                  <span>Ativar Modo Apresentador</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-neon-yellow" />
                  <span>Simular Visão do Cliente</span>
                </>
              )}
            </button>
            <Link
              to="/admin/live"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neon-purple/40 bg-neon-purple/20 px-3 py-1.5 text-xs font-bold text-neon-purple hover:bg-neon-purple/30 transition-colors"
              title="Abrir o Estúdio de Transmissão Dedicado"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Estúdio Master</span>
            </Link>
          </div>
        </div>
      )}

      {/* Cabeçalho da Página Live */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-[0_0_15px_rgba(255,0,0,0.6)]">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" /> AO VIVO
            </span>
            <span className="text-xs text-muted-foreground">
              {session.viewersCount} pessoas assistindo agora
            </span>
            {isPresenter ? (
              <span className="flex items-center gap-1 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 px-2.5 py-0.5 text-[11px] font-bold text-neon-cyan">
                <Radio className="h-3 w-3 text-neon-cyan animate-pulse" />
                Apresentador da Loja
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                <Eye className="h-3 w-3 text-neon-cyan" />
                Espectador
              </span>
            )}
            {(isCameraActive || isScreenSharing) && (
              <span className="flex items-center gap-1 rounded-full bg-neon-green/20 border border-neon-green/40 px-2.5 py-0.5 text-[11px] font-bold text-neon-green">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                {isScreenSharing ? "Transmitindo Tela" : "Câmera Ao Vivo"}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-black sm:text-3xl text-foreground">
            {session.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{session.subtitle}</p>
        </div>

        {/* MENU DE AÇÕES: CONTROLES DE TRANSMISSÃO (APENAS APRESENTADOR) & COMPRA (TODOS) */}
        <div className="flex flex-wrap items-center gap-2">
          {isPresenter && (
            <>
              {/* Botão Câmera (Lojista / Apresentador) */}
              <button
                onClick={toggleCamera}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-sm ${
                  isCameraActive
                    ? "border-neon-green/50 bg-neon-green/20 text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.25)] hover:bg-neon-green/30"
                    : "border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/20"
                }`}
                title="Ligar ou desligar câmera"
              >
                {isCameraActive ? (
                  <>
                    <Video className="h-4 w-4 text-neon-green animate-pulse" />
                    <span className="hidden sm:inline">Câmera Ligada</span>
                  </>
                ) : (
                  <>
                    <VideoOff className="h-4 w-4 text-muted-foreground" />
                    <span className="hidden sm:inline">Ligar Câmera</span>
                  </>
                )}
              </button>

              {/* Botão Microfone (Lojista / Apresentador) */}
              <button
                onClick={toggleMic}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-sm ${
                  isMicActive
                    ? "border-neon-cyan/50 bg-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:bg-neon-cyan/30"
                    : "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                }`}
                title="Ativar ou silenciar microfone"
              >
                {isMicActive ? (
                  <>
                    <Mic className="h-4 w-4 text-neon-cyan" />
                    <span className="hidden sm:inline">Mic Ativo</span>
                  </>
                ) : (
                  <>
                    <MicOff className="h-4 w-4 text-red-400" />
                    <span className="hidden sm:inline">Mic Mudo</span>
                  </>
                )}
              </button>

              {/* Botão Girar Câmera */}
              <button
                onClick={toggleFlipCamera}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors"
                title="Girar câmera (Frontal / Traseira)"
              >
                <RotateCw className="h-4 w-4 text-muted-foreground" />
                <span className="hidden md:inline">Girar</span>
              </button>

              {/* Botão Transmitir Tela */}
              <button
                onClick={toggleScreenShare}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                  isScreenSharing
                    ? "border-neon-yellow/50 bg-neon-yellow/20 text-neon-yellow shadow-[0_0_15px_rgba(255,230,0,0.25)]"
                    : "border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                }`}
                title="Transmitir tela do computador"
              >
                <Laptop className="h-4 w-4" />
                <span className="hidden sm:inline">{isScreenSharing ? "Parar Tela" : "Tela"}</span>
              </button>

              {/* Botão Abrir Painel / Estúdio do Apresentador */}
              <button
                onClick={() => setIsStudioOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-neon-purple/40 bg-neon-purple/10 px-3.5 py-2 text-xs font-bold text-neon-purple hover:bg-neon-purple/20 transition-colors shadow-sm"
                title="Abrir ferramentas de apresentação e controle de vendas"
              >
                <Radio className="h-4 w-4" />
                <span>Estúdio da Live</span>
              </button>
            </>
          )}

          {/* Botão Carrinho da Live (Visível para Todos) */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-1.5 rounded-xl border border-neon-green/50 bg-neon-green/10 px-3.5 py-2 text-xs font-bold text-neon-green hover:bg-neon-green/20 transition-colors shadow-[0_0_15px_rgba(0,255,102,0.2)]"
            title="Abrir carrinho de compras da live"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Carrinho</span>
            {cartItemsCount > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-neon-green text-[10px] font-black text-background animate-pulse">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Botão Sacola de Produtos (Para Espectadores) */}
          {!isPresenter && (
            <button
              onClick={() => setIsBagOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors"
              title="Ver lista de produtos apresentados"
            >
              <ShoppingBag className="h-4 w-4 text-neon-cyan" />
              <span>Sacola ({session.products.length})</span>
            </button>
          )}

          {/* Botão Compartilhar (Para Todos) */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: session.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link da live copiado!");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors"
            title="Compartilhar link da transmissão"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden md:inline">Compartilhar</span>
          </button>

          {/* Link Discreto para Login de Lojistas quando deslogado */}
          {!isStoreStaff && (
            <Link
              to="/auth"
              search={{ redirect: "/live" }}
              className="hidden lg:inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-white px-2 py-1 transition-colors"
              title="Acesso exclusivo para administradores e vendedores da vitrine"
            >
              <Lock className="h-3 w-3" />
              <span>Sou Lojista</span>
            </Link>
          )}
        </div>
      </header>

      {/* Grid Principal do Live Shopping */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* ÁREA DE VÍDEO E CONTROLES RÁPIDOS (8 Colunas) */}
        <div className="space-y-3 lg:col-span-8">
          {/* PLAYER DE VÍDEO IMERSIVO */}
          <div
            ref={playerContainerRef}
            className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl flex flex-col justify-between"
          >
          {/* Tag de Vídeo Real da Câmera / Tela */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className={`absolute inset-0 h-full w-full object-cover z-0 ${
              isCameraActive || isScreenSharing ? "block" : "hidden"
            } ${facingMode === "user" && !isScreenSharing ? "-scale-x-100" : ""}`}
          />

          {/* Standby / Card de Demonstração quando câmera e tela estão desligadas */}
          {!(isCameraActive || isScreenSharing) && (
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-950 to-neutral-900 flex items-center justify-center p-6">
              <div className="relative text-center max-w-md mx-auto animate-fade-up">
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-tr from-neon-cyan/20 to-neon-purple/20 border border-white/10 text-neon-cyan shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                  {isPresenter ? (
                    <Video className="h-8 w-8 text-neon-green animate-pulse" />
                  ) : (
                    <Radio className="h-8 w-8 text-red-500 animate-pulse" />
                  )}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-foreground mb-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  {isPresenter
                    ? "ESTÚDIO DE TRANSMISSÃO PRONTO"
                    : "SALA AO VIVO ABERTA • AGUARDANDO APRESENTADOR"}
                </div>

                <h3 className="font-display text-lg font-black text-white sm:text-xl">
                  {isPresenter ? "Iniciar Sua Transmissão Ao Vivo" : "Vitrine Ao Vivo — Demonstrações & Ofertas"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {isPresenter
                    ? "Você está logado como lojista/apresentador. Ligue sua webcam ou transmita sua tela para começar a apresentar aos espectadores."
                    : "O apresentador entrará ao vivo em instantes. Aproveite para conferir as ofertas relâmpago, a sacola de produtos e participar do chat!"}
                </p>

                {/* Botões rápidos: Início para Apresentador vs Exploração para Espectador */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {isPresenter ? (
                    <>
                      <button
                        onClick={() => startCamera(facingMode)}
                        className="inline-flex items-center gap-2 rounded-xl bg-neon-green px-4 py-2.5 text-xs font-black text-background hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                      >
                        <Video className="h-4 w-4" /> Ligar Câmera & Transmitir
                      </button>
                      <button
                        onClick={toggleScreenShare}
                        className="inline-flex items-center gap-2 rounded-xl border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2.5 text-xs font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
                      >
                        <Laptop className="h-4 w-4" /> Transmitir Tela do PC
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsBagOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-neon-cyan px-4 py-2.5 text-xs font-black text-background hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                      >
                        <ShoppingBag className="h-4 w-4" /> Ver Sacola de Ofertas
                      </button>
                      <button
                        onClick={() => handleReaction("❤️")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neon-magenta/50 bg-neon-magenta/15 px-3.5 py-2.5 text-xs font-bold text-neon-magenta hover:bg-neon-magenta/25 transition-colors shadow-sm"
                      >
                        <Heart className="h-4 w-4 fill-neon-magenta" /> Enviar Curtida
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reações Flutuantes (Partículas Subindo na Tela) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
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
          <div className="relative z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 backdrop-blur px-3 py-1 text-xs font-black text-white shadow-lg">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" /> AO VIVO
              </span>
              <span className="rounded-full bg-black/60 backdrop-blur px-3 py-1 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-neon-cyan" /> {session.viewersCount}
              </span>
              {isCameraActive && (
                <span className="rounded-full bg-neon-green/20 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-neon-green border border-neon-green/30 flex items-center gap-1">
                  <Video className="h-3 w-3" /> Câmera ON
                </span>
              )}
              {isScreenSharing && (
                <span className="rounded-full bg-neon-yellow/20 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-neon-yellow border border-neon-yellow/30 flex items-center gap-1">
                  <Laptop className="h-3 w-3" /> Tela ON
                </span>
              )}
            </div>

            {/* Controles de visualização no canto superior direito do player */}
            <div className="flex items-center gap-1.5">
              {/* Botão de Câmera Rápido no Player */}
              <button
                onClick={toggleCamera}
                className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur border transition-colors ${
                  isCameraActive
                    ? "bg-neon-green/20 text-neon-green border-neon-green/40 hover:bg-neon-green/30"
                    : "bg-black/60 text-white/80 border-white/15 hover:bg-black/80"
                }`}
                title={isCameraActive ? "Desligar câmera" : "Ligar câmera"}
              >
                {isCameraActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>

              {/* Botão de Mic Rápido no Player */}
              <button
                onClick={toggleMic}
                className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur border transition-colors ${
                  isMicActive
                    ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40 hover:bg-neon-cyan/30"
                    : "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
                }`}
                title={isMicActive ? "Silenciar microfone" : "Ativar microfone"}
              >
                {isMicActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>

              {/* Botão Girar Câmera */}
              <button
                onClick={toggleFlipCamera}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur border border-white/15 text-white/80 hover:bg-black/80 transition-colors"
                title="Girar câmera"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              {/* Mudo / Volume */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur border border-white/15 text-white/80 hover:bg-black/80 transition-colors"
                title={isMuted ? "Desmutar som" : "Mutar som"}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-neon-cyan" />}
              </button>

              {/* Tela cheia */}
              <button
                onClick={toggleFullscreen}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur border border-white/15 text-white/80 hover:bg-black/80 transition-colors"
                title="Tela Cheia"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* Sacola */}
              <button
                onClick={() => setIsBagOpen(true)}
                className="relative flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-xs font-bold text-neon-yellow border border-neon-yellow/40 hover:bg-black/80 transition-colors ml-1"
              >
                <ShoppingBag className="h-4 w-4" /> Sacola ({session.products.length})
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-neon-magenta animate-ping" />
              </button>

              {/* Carrinho da Live */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1.5 rounded-full bg-neon-green/20 backdrop-blur px-3 py-1.5 text-xs font-bold text-neon-green border border-neon-green/50 hover:bg-neon-green/30 transition-colors shadow-[0_0_15px_rgba(0,255,102,0.3)] ml-1"
              >
                <ShoppingCart className="h-4 w-4" /> Carrinho ({cartItemsCount})
                {cartItemsCount > 0 && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-neon-green text-[10px] font-black text-background animate-pulse">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Banner de Prova Social Flutuante (Efeito Manada) */}
          {latestPurchase && (
            <div className="absolute top-16 left-4 right-4 z-30 flex items-center justify-center animate-fade-down pointer-events-none">
              <div className="flex items-center gap-2.5 rounded-2xl bg-black/90 border border-neon-green/60 px-4 py-2.5 backdrop-blur-md shadow-[0_0_25px_rgba(0,255,102,0.5)]">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-neon-green/20 text-neon-green">
                  <CheckCircle className="h-4 w-4 text-neon-green animate-bounce" />
                </span>
                <div>
                  <p className="text-xs font-extrabold text-white">
                    🎉 <span className="text-neon-cyan">{latestPurchase.buyerName}</span> acabou de comprar!
                  </p>
                  <p className="text-[11px] text-neon-green font-semibold">
                    {latestPurchase.productTitle} • {formatBRL(latestPurchase.amount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CARD DE PRODUTO & OFERTA RELÂMPAGO FLUTUANTE E ARRASTÁVEL (DRAGGABLE) */}
          {session.pinnedProduct && isOfferVisible && (
            <div
              ref={bannerRef}
              style={
                offerPos
                  ? {
                      position: "absolute",
                      left: `${offerPos.x}px`,
                      top: `${offerPos.y}px`,
                      zIndex: 35,
                      maxWidth: "min(390px, 92vw)",
                    }
                  : {
                      position: "absolute",
                      bottom: "16px",
                      left: "16px",
                      zIndex: 35,
                      maxWidth: "min(390px, 92vw)",
                    }
              }
              className="w-full rounded-2xl border border-neon-cyan/50 bg-black/95 p-3.5 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.85)] animate-fade-up select-none transition-shadow hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] touch-none"
            >
              {/* Barra de Arrasto Superior com Grip e Botão de Fechar */}
              <div
                onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
                onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
                className="mb-2 flex items-center justify-between pb-1.5 border-b border-white/10 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white transition-colors"
                title="Clique e arraste para posicionar a oferta onde preferir na tela"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase text-neon-cyan/90">
                  <GripHorizontal className="h-4 w-4 text-neon-cyan animate-pulse" />
                  <span>Segure para mover na tela</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOfferVisible(false);
                    toast.info("Oferta fechada. Clique em 'Ver Oferta' para reabrir.");
                  }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                  title="Fechar banner da oferta"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

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

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAddToCart(session.pinnedProduct!)}
                    className="rounded-xl bg-neon-cyan px-3 py-1.5 text-xs font-black text-background hover:opacity-90 transition-opacity shadow-[0_0_12px_rgba(0,240,255,0.3)] flex items-center justify-center gap-1"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> + Carrinho
                  </button>
                  <button
                    onClick={() => handleDirectBuy(session.pinnedProduct!)}
                    className="rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan px-3 py-1.5 text-xs font-black text-background hover:opacity-90 transition-opacity shadow-[0_0_12px_rgba(0,255,102,0.3)] flex items-center justify-center gap-1"
                  >
                    <Zap className="h-3.5 w-3.5" /> Comprar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botão Miniatura Flutuante para Reabrir a Oferta se tiver sido fechada */}
          {session.pinnedProduct && !isOfferVisible && (
            <button
              onClick={() => setIsOfferVisible(true)}
              className="absolute bottom-4 left-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/50 bg-black/85 backdrop-blur px-3.5 py-1.5 text-xs font-bold text-neon-cyan hover:bg-black hover:border-neon-cyan transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-pulse"
              title="Reabrir oferta relâmpago fixada"
            >
              <Flame className="h-3.5 w-3.5 text-neon-magenta animate-bounce" />
              <span>Ver Oferta ({formatBRL(session.pinnedProduct.price)})</span>
            </button>
          )}

          {/* Bottom Overlay: Barra de Reações Interativas */}
          <div className="relative z-10 p-4 flex items-end justify-end pointer-events-none bg-gradient-to-t from-black/80 via-black/20 to-transparent pt-12">
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur border border-white/15 p-1.5">
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

        {/* Barra Rápida Abaixo do Player: Controles do Transmissor (Apresentador) vs Engajamento & Compra (Espectador) */}
        {isPresenter ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neon-purple/30 bg-neon-purple/5 p-3.5 backdrop-blur-sm animate-fade-up">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                <Radio className="h-4 w-4 text-neon-purple animate-pulse" />
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">Controles do Transmissor (Lojista)</p>
                <p className="text-[11px] text-muted-foreground">
                  {isCameraActive
                    ? "Câmera transmitindo em tempo real"
                    : isScreenSharing
                    ? "Compartilhamento de tela em andamento"
                    : "Câmera e tela pausadas — clique para ligar"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={toggleCamera}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors ${
                  isCameraActive
                    ? "bg-neon-green/20 text-neon-green border-neon-green/40 hover:bg-neon-green/30"
                    : "bg-white/5 text-foreground border-white/10 hover:bg-white/10"
                }`}
              >
                {isCameraActive ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                {isCameraActive ? "Desligar Câmera" : "Ligar Câmera"}
              </button>

              <button
                onClick={toggleMic}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors ${
                  isMicActive
                    ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40 hover:bg-neon-cyan/30"
                    : "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
                }`}
              >
                {isMicActive ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                {isMicActive ? "Mic Ativo" : "Mic Mudo"}
              </button>

              <button
                onClick={toggleFlipCamera}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/5 text-foreground border border-white/10 hover:bg-white/10 transition-colors"
                title="Girar câmera"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Girar</span>
              </button>

              <button
                onClick={toggleScreenShare}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors ${
                  isScreenSharing
                    ? "bg-neon-yellow/20 text-neon-yellow border-neon-yellow/40 hover:bg-neon-yellow/30"
                    : "bg-white/5 text-foreground border-white/10 hover:bg-white/10"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>{isScreenSharing ? "Parar Tela" : "Tela"}</span>
              </button>

              <button
                onClick={() => {
                  setStudioTab("sales");
                  setIsStudioOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-neon-green/20 text-neon-green border border-neon-green/40 hover:bg-neon-green/30 transition-colors shadow-[0_0_12px_rgba(0,255,102,0.2)]"
                title="Abrir painel de vendas e pedidos ao vivo"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Vendas ({formatBRL(totalSalesRevenue)})</span>
              </button>

              <button
                onClick={() => {
                  setStudioTab("products");
                  setIsStudioOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-neon-purple/20 text-neon-purple border border-neon-purple/40 hover:bg-neon-purple/30 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Fixar Ofertas</span>
              </button>

              <Link
                to="/admin/live"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-white border border-white/10 hover:bg-white/5 transition-colors"
                title="Ir para o Estúdio Master Completo"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Estúdio Master</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm animate-fade-up">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">Interação & Compras na Live</p>
                <p className="text-[11px] text-muted-foreground">
                  Aproveite descontos exclusivos durante a transmissão e tire dúvidas pelo chat
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleReaction("❤️")}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-neon-magenta/15 text-neon-magenta border border-neon-magenta/30 hover:bg-neon-magenta/25 transition-all shadow-sm"
              >
                <Heart className="h-3.5 w-3.5 fill-neon-magenta" />
                <span>Curtir</span>
              </button>

              <button
                onClick={() => handleReaction("🔥")}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-all shadow-sm"
              >
                <Flame className="h-3.5 w-3.5 fill-orange-400" />
                <span>Fogo</span>
              </button>

              <button
                onClick={() => setIsBagOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-white/5 text-foreground border border-white/10 hover:bg-white/10 transition-colors"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-neon-cyan" />
                <span>Sacola ({session.products.length})</span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-neon-green/20 text-neon-green border border-neon-green/40 hover:bg-neon-green/30 transition-colors shadow-[0_0_12px_rgba(0,255,102,0.2)]"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Meu Carrinho {cartItemsCount > 0 && `(${cartItemsCount})`}</span>
              </button>
            </div>
          </div>
        )}
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

      {/* MODAL / DRAWER: ESTÚDIO DO APRESENTADOR & PAINEL DE VENDAS AO VIVO */}
      {isStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-up">
          {!isStoreStaff ? (
            <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-card p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Área Restrita aos Lojistas</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                O Estúdio de Transmissão e o Painel de Vendas em tempo real são exclusivos para administradores e vendedores da loja.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to="/auth"
                  search={{ redirect: "/live" }}
                  className="btn-neon w-full !py-2.5 text-xs font-bold"
                >
                  Entrar como Administrador / Vendedor
                </Link>
                <button
                  onClick={() => setIsStudioOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/10"
                >
                  Voltar para a Live
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full max-h-[92vh] w-full max-w-2xl rounded-3xl border border-white/15 bg-card p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col min-h-0 flex-1">
              {/* Header do Estúdio */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-purple/20 text-neon-purple">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">Estúdio do Transmissor</h3>
                    <p className="text-xs text-muted-foreground">Controle de Mídia, Vendas e Pedidos em Tempo Real</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsStudioOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navegação por Abas no Estúdio */}
              <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-3 shrink-0">
                <button
                  onClick={() => setStudioTab("sales")}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    studioTab === "sales"
                      ? "bg-neon-green/20 text-neon-green border border-neon-green/40 shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Vendas ao Vivo</span>
                  <span className="rounded-full bg-neon-green/30 px-1.5 py-0.2 text-[10px] font-black text-neon-green">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setStudioTab("stream")}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    studioTab === "stream"
                      ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Video className="h-4 w-4" />
                  <span>Câmera & Mídia</span>
                </button>

                <button
                  onClick={() => setStudioTab("products")}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    studioTab === "products"
                      ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/40 shadow-[0_0_15px_rgba(180,0,255,0.2)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Pin className="h-4 w-4" />
                  <span>Fixar Ofertas</span>
                </button>
              </div>

              {/* CONTEÚDO DA ABA 1: VENDAS & PEDIDOS AO VIVO */}
              {studioTab === "sales" && (
                <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
                  {/* Resumo de Métricas em Tempo Real */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-neon-green/40 bg-neon-green/10 p-3 text-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Faturamento</span>
                      <span className="mt-1 font-display text-base sm:text-lg font-black text-neon-green block">
                        {formatBRL(totalSalesRevenue)}
                      </span>
                      <span className="text-[10px] text-neon-green/80 flex items-center justify-center gap-1 mt-0.5">
                        <TrendingUp className="h-3 w-3" /> Ao vivo
                      </span>
                    </div>

                    <div className="rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 p-3 text-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pedidos Pagos</span>
                      <span className="mt-1 font-display text-base sm:text-lg font-black text-neon-cyan block">
                        {totalPaidOrdersCount}
                      </span>
                      <span className="text-[10px] text-neon-cyan/80 flex items-center justify-center gap-1 mt-0.5">
                        <CheckCircle className="h-3 w-3" /> Confirmados
                      </span>
                    </div>

                    <div className="rounded-2xl border border-neon-yellow/40 bg-neon-yellow/10 p-3 text-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Carrinho Ativo</span>
                      <span className="mt-1 font-display text-base sm:text-lg font-black text-neon-yellow block">
                        {activeCartsCount}
                      </span>
                      <span className="text-[10px] text-neon-yellow/80 flex items-center justify-center gap-1 mt-0.5">
                        <ShoppingCart className="h-3 w-3" /> Em compra
                      </span>
                    </div>
                  </div>

                  {/* Lista de Pedidos em Tempo Real */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Feed de Pedidos da Transmissão
                      </h4>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Atualizado automaticamente
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-neon-cyan">{order.id}</span>
                              <span className="text-[11px] text-muted-foreground">• {order.formattedTime}</span>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                                order.status === "paid"
                                  ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                                  : "bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30"
                              }`}
                            >
                              <CheckCircle className="h-3 w-3" />
                              {order.status === "paid" ? "Pagamento Confirmado" : "Aguardando Pagamento"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-foreground">{order.customerName}</p>
                              {order.customerPhone && (
                                <p className="text-[11px] text-muted-foreground">{order.customerPhone}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-neon-green">{formatBRL(order.totalAmount)}</span>
                              <span className="block text-[10px] uppercase font-bold text-muted-foreground">
                                Via {order.paymentMethod.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Itens do Pedido */}
                          <div className="rounded-xl bg-black/40 p-2 text-[11px] space-y-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-muted-foreground">
                                <span>{it.quantity}x {it.product.title}</span>
                                <span className="font-mono font-semibold text-foreground/90">{formatBRL(it.unitPrice * it.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Detalhes de Envio / Frete para Produtos Físicos */}
                          {order.shippingOption && (
                            <div className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-2 text-[11px] space-y-1">
                              <div className="flex items-center justify-between text-neon-cyan font-bold">
                                <span className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" /> {order.shippingOption.name}
                                </span>
                                <span>{order.shippingFee === 0 ? "Grátis" : formatBRL(order.shippingFee ?? 0)}</span>
                              </div>
                              {order.shippingAddress && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0 text-neon-cyan" />
                                  <span>
                                    {order.shippingAddress.street}, {order.shippingAddress.number}
                                    {order.shippingAddress.complement ? ` (${order.shippingAddress.complement})` : ""} - {order.shippingAddress.neighborhood}, {order.shippingAddress.city}/{order.shippingAddress.state} • CEP {order.shippingAddress.cep}
                                  </span>
                                </p>
                              )}
                            </div>
                          )}

                          {/* Ações do Apresentador */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, order.status === "paid" ? "pending" : "paid")}
                              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {order.status === "paid" ? "Marcar Pendente" : "Confirmar Baixa"}
                            </button>
                            <a
                              href={`https://wa.me/${normalizeWhatsAppNumber(order.customerPhone || WHATSAPP_NUMBER)}?text=${encodeURIComponent(
                                `Olá ${order.customerName}! Vi seu pedido #${order.id} na live shopping. Muito obrigado! Como posso te ajudar com o acesso?`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-neon-green/20 border border-neon-green/40 px-2.5 py-1 text-[11px] font-bold text-neon-green hover:bg-neon-green/30 transition-colors flex items-center gap-1"
                            >
                              <MessageCircle className="h-3 w-3" /> Falar no WhatsApp
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA 2: CÂMERA & MÍDIA */}
              {studioTab === "stream" && (
                <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Dispositivos de Transmissão</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={toggleCamera}
                        className={`rounded-xl p-3 text-xs font-bold border flex flex-col items-center gap-1.5 transition-colors ${
                          isCameraActive
                            ? "bg-neon-green/20 text-neon-green border-neon-green/40"
                            : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {isCameraActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        <span>{isCameraActive ? "Câmera Ligada" : "Ligar Câmera"}</span>
                      </button>

                      <button
                        onClick={toggleMic}
                        className={`rounded-xl p-3 text-xs font-bold border flex flex-col items-center gap-1.5 transition-colors ${
                          isMicActive
                            ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40"
                            : "bg-red-500/20 text-red-400 border-red-500/40"
                        }`}
                      >
                        {isMicActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                        <span>{isMicActive ? "Mic Ativo" : "Mic Mudo"}</span>
                      </button>

                      <button
                        onClick={toggleFlipCamera}
                        className="rounded-xl p-3 text-xs font-bold border bg-white/5 text-foreground border-white/10 hover:bg-white/10 flex flex-col items-center gap-1.5 transition-colors"
                      >
                        <RotateCw className="h-5 w-5" />
                        <span>Girar Câmera</span>
                      </button>

                      <button
                        onClick={toggleScreenShare}
                        className={`rounded-xl p-3 text-xs font-bold border flex flex-col items-center gap-1.5 transition-colors ${
                          isScreenSharing
                            ? "bg-neon-yellow/20 text-neon-yellow border-neon-yellow/40"
                            : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <Laptop className="h-5 w-5" />
                        <span>{isScreenSharing ? "Parar Tela" : "Transmitir Tela"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA 3: FIXAR PRODUTOS & OFERTA RELÂMPAGO */}
              {studioTab === "products" && (
                <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
                  {/* Botão de Disparo da Oferta Relâmpago */}
                  <div className="rounded-2xl border border-neon-magenta/30 bg-neon-magenta/10 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neon-magenta flex items-center gap-1.5">
                        <Flame className="h-4 w-4 animate-bounce" /> Oferta Relâmpago (Cronômetro)
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {session.flashOffer?.active
                          ? `Ativa agora! Encerra em ${timeLeft}`
                          : "Destaque um cronômetro de 10 min com cupom exclusivo"}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleFlashOffer}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                        session.flashOffer?.active
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-neon-magenta text-white hover:opacity-90 shadow-[0_0_15px_rgba(255,0,128,0.4)]"
                      }`}
                    >
                      {session.flashOffer?.active ? "Pausar Oferta" : "Iniciar Oferta"}
                    </button>
                  </div>

                  {/* Produtos para Fixar na Tela */}
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Escolha o Produto para Fixar no Vídeo:
                    </h4>
                    <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
                      {session.products.map((prod) => {
                        const isPinned = session.pinnedProduct?.id === prod.id;
                        return (
                          <div
                            key={prod.id}
                            className={`rounded-2xl border p-3 flex items-center justify-between gap-3 transition-colors ${
                              isPinned
                                ? "border-neon-cyan bg-neon-cyan/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <img src={prod.image} alt={prod.title} className="h-12 w-12 rounded-xl object-cover border border-white/10" />
                            <div className="min-w-0 flex-1">
                              <h5 className="truncate text-xs font-bold text-foreground">{prod.title}</h5>
                              <span className="text-xs font-black text-neon-green">{formatBRL(prod.price)}</span>
                            </div>
                            <button
                              onClick={() => handlePinProduct(prod)}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${
                                isPinned
                                  ? "bg-neon-cyan text-background font-black"
                                  : "border border-white/15 bg-white/5 text-foreground hover:bg-white/10"
                              }`}
                            >
                              <Pin className="h-3.5 w-3.5" /> {isPinned ? "Fixado na Tela" : "Fixar no Vídeo"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
              <Link
                to="/admin/live"
                className="text-xs text-neon-purple hover:underline flex items-center gap-1"
              >
                Abrir Painel Admin Completo <ChevronRight className="h-3 w-3" />
              </Link>
              <button
                onClick={() => setIsStudioOpen(false)}
                className="rounded-xl bg-neon-cyan px-4 py-2 text-xs font-bold text-background hover:opacity-90"
              >
                Concluir
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* MODAL / DRAWER: CARRINHO DA LIVE SHOPPING */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-4 animate-fade-up">
          <div className="h-full max-h-[92vh] w-full max-w-md rounded-3xl border border-white/15 bg-card p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-green/20 text-neon-green">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">Carrinho da Live</h3>
                    <p className="text-xs text-muted-foreground">Finalize suas compras com desconto de live</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setCartPaymentStep("review");
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Se o Carrinho estiver Vazio */}
              {cart.length === 0 ? (
                <div className="my-auto py-12 text-center">
                  <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-white/5 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">Seu carrinho está vazio</h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                    Adicione produtos apresentados nesta live para garantir os preços promocionais!
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsBagOpen(true);
                    }}
                    className="mt-4 rounded-xl bg-neon-cyan px-4 py-2 text-xs font-bold text-background hover:opacity-90"
                  >
                    Ver Produtos da Live
                  </button>
                </div>
              ) : cartPaymentStep === "pix" ? (
                /* Etapa de Pagamento PIX Instantâneo */
                <div className="my-auto space-y-4 py-4 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-neon-green/20 px-3 py-1 text-xs font-bold text-neon-green">
                    <QrCode className="h-4 w-4" /> Pagamento Instantâneo via PIX
                  </div>

                  <div className="mx-auto flex justify-center p-3 rounded-2xl bg-white w-48 h-48 items-center shadow-2xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `00020126580014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${cartTotal.toFixed(2)}5802BR5919MinhaVitrineOnline6009SaoPaulo62070503***6304`
                      )}`}
                      alt="QR Code PIX"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground">Valor total a pagar:</span>
                    <h3 className="font-display text-2xl font-black text-neon-green">{formatBRL(cartTotal)}</h3>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `00020126580014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${cartTotal.toFixed(2)}5802BR5919MinhaVitrineOnline6009SaoPaulo62070503***6304`
                        );
                        toast.success("Código PIX Copia e Cola copiado!");
                      }}
                      className="w-full rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 py-2.5 text-xs font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="h-4 w-4" /> Copiar Código PIX
                    </button>

                    <button
                      onClick={() => {
                        setCartPaymentStep("review");
                        setIsCartOpen(false);
                        toast.success("Pagamento confirmado! O apresentador já foi notificado na live!");
                      }}
                      className="w-full rounded-xl bg-neon-green py-3 text-xs font-black text-background hover:opacity-90 shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                    >
                      Já Realizei o Pagamento
                    </button>
                  </div>
                </div>
              ) : (
                /* Etapa de Revisão dos Itens e Checkout */
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Lista de Itens no Carrinho */}
                  <div className="mt-3 space-y-2.5 overflow-y-auto flex-1 pr-1 max-h-[38vh]">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center gap-3"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="h-12 w-12 rounded-xl object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-bold text-foreground">{item.product.title}</h4>
                          <span className="text-xs font-black text-neon-green">{formatBRL(item.unitPrice)}</span>
                        </div>

                        {/* Controles de Quantidade */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleUpdateCartQty(item.id, -1)}
                            className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-foreground hover:bg-white/20"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQty(item.id, 1)}
                            className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-foreground hover:bg-white/20"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="ml-1 p-1 text-muted-foreground hover:text-red-400"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bloco de Cálculo de Frete para Produtos Físicos */}
                  {hasPhysicalProducts && (
                    <div className="mt-3 rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-3 space-y-2 shrink-0 animate-fade-up">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-neon-cyan flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5" /> Frete & Entrega (Correios / Transportadora):
                        </span>
                        <a
                          href="https://buscacepinter.correios.com.br/app/cep/index.php"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-muted-foreground hover:text-white underline"
                        >
                          Não sei meu CEP
                        </a>
                      </div>

                      <form onSubmit={handleCalculateCartShipping} className="flex gap-1.5">
                        <input
                          type="text"
                          value={cartCep}
                          onChange={(e) => setCartCep(formatCep(e.target.value))}
                          placeholder="CEP de entrega (00000-000)"
                          maxLength={9}
                          className="h-8 flex-1 rounded-xl border border-white/10 bg-black/40 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-neon-cyan focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isSearchingCartCep}
                          className="h-8 rounded-xl bg-neon-cyan px-3 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          {isSearchingCartCep ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <span>Calcular</span>
                          )}
                        </button>
                      </form>

                      {/* Endereço & Opções de Envio */}
                      {cartAddress && cartShippingOptions.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-white/10">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-neon-cyan shrink-0" />
                            <span>
                              {cartAddress.logradouro ? `${cartAddress.logradouro}, ` : ""}
                              {cartAddress.bairro ? `${cartAddress.bairro} - ` : ""}
                              <strong>{cartAddress.localidade}/{cartAddress.uf}</strong>
                            </span>
                          </p>

                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={customerStreetNumber}
                              onChange={(e) => setCustomerStreetNumber(e.target.value)}
                              placeholder="Número da residência"
                              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-foreground focus:border-neon-cyan focus:outline-none"
                            />
                            <input
                              type="text"
                              value={customerStreetComplement}
                              onChange={(e) => setCustomerStreetComplement(e.target.value)}
                              placeholder="Complemento / Apto"
                              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-foreground focus:border-neon-cyan focus:outline-none"
                            />
                          </div>

                          <div className="grid gap-1.5 pt-1">
                            {cartShippingOptions.map((opt) => {
                              const isSel = selectedLiveShipping?.id === opt.id;
                              return (
                                <div
                                  key={opt.id}
                                  onClick={() => setSelectedLiveShipping(opt)}
                                  className={`cursor-pointer rounded-xl border p-2 flex items-center justify-between transition-all ${
                                    isSel
                                      ? "border-neon-cyan bg-neon-cyan/15 shadow-sm"
                                      : "border-white/10 bg-black/30 hover:border-white/20"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="live_cart_shipping"
                                      checked={isSel}
                                      onChange={() => setSelectedLiveShipping(opt)}
                                      className="h-3.5 w-3.5 accent-neon-cyan"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-foreground">{opt.name}</span>
                                        {opt.badge && (
                                          <span className="rounded bg-white/10 px-1 py-0.2 text-[8px] font-bold text-neon-yellow">
                                            {opt.badge}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-muted-foreground block">
                                        {opt.deliveryDaysMin === 0
                                          ? "Retirada imediata"
                                          : `${opt.deliveryDaysMin} a ${opt.deliveryDaysMax} dias úteis`}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`text-[11px] font-black ${opt.price === 0 ? "text-neon-green" : "text-foreground"}`}>
                                    {opt.price === 0 ? "GRÁTIS" : formatBRL(opt.price)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dados do Comprador */}
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2 shrink-0">
                    <span className="text-[11px] font-bold text-foreground block">Identificação para Entrega/Licença:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customerCheckoutName}
                        onChange={(e) => setCustomerCheckoutName(e.target.value)}
                        placeholder="Seu Nome Completo"
                        className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                      />
                      <input
                        type="tel"
                        value={customerCheckoutPhone}
                        onChange={(e) => setCustomerCheckoutPhone(e.target.value)}
                        placeholder="WhatsApp (com DDD)"
                        className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Resumo de Valores */}
                  <div className="mt-3 border-t border-white/10 pt-3 space-y-1 shrink-0">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal dos Produtos:</span>
                      <span>{formatBRL(cartSubtotal)}</span>
                    </div>
                    {hasPhysicalProducts && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Frete de Entrega:</span>
                        {selectedLiveShipping ? (
                          <span className={selectedLiveShipping.price === 0 ? "text-neon-green font-bold" : "text-foreground font-semibold"}>
                            {selectedLiveShipping.price === 0 ? "GRÁTIS" : formatBRL(selectedLiveShipping.price)}
                          </span>
                        ) : (
                          <span className="text-neon-yellow text-[11px]">Calcular acima</span>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-foreground pt-1 border-t border-white/5">
                      <span>Total do Pedido:</span>
                      <span className="text-neon-green text-base">{formatBRL(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Botões de Pagamento */}
                  <div className="mt-3 space-y-2 shrink-0">
                    <button
                      onClick={() => handleFinishCartOrder("pix")}
                      className="w-full rounded-xl bg-neon-green py-2.5 text-xs font-black text-background hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,255,102,0.3)] flex items-center justify-center gap-2"
                    >
                      <QrCode className="h-4 w-4" /> Pagar com PIX Instantâneo
                    </button>

                    <button
                      onClick={() => handleFinishCartOrder("card")}
                      className="w-full rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 py-2.5 text-xs font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" /> Pagar com Cartão de Crédito
                    </button>

                    <button
                      onClick={() => handleFinishCartOrder("whatsapp")}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-neon-green" /> Concluir no WhatsApp do Apresentador
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 text-center shrink-0">
              <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-neon-green" /> Transação Segura com Suporte Oficial ao Vivo
              </span>
            </div>
          </div>
        </div>
      )}

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

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="rounded-xl bg-neon-cyan px-2.5 py-1.5 text-[11px] font-black text-background hover:opacity-90 flex items-center justify-center gap-1 shadow-sm"
                      >
                        <ShoppingCart className="h-3 w-3" /> + Carrinho
                      </button>
                      <button
                        onClick={() => {
                          setIsBagOpen(false);
                          handleDirectBuy(p);
                        }}
                        className="rounded-xl bg-neon-green px-2.5 py-1.5 text-[11px] font-black text-background hover:opacity-90 shadow-[0_0_10px_rgba(0,255,102,0.3)] flex items-center justify-center gap-1"
                      >
                        <Zap className="h-3 w-3" /> Comprar
                      </button>
                    </div>
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
