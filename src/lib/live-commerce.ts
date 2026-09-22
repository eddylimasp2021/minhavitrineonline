export interface LiveProductItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  image: string;
  category: string;
  productType?: string;
  softwareVersion?: string;
  softwarePlatform?: string;
  demoUrl?: string;
  stock?: number;
}

export interface LiveChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  message: string;
  timestamp: string;
  isHost?: boolean;
  isBuyer?: boolean;
  badge?: string;
}

export interface LiveFlashOffer {
  active: boolean;
  productId: string;
  productTitle: string;
  discountPrice: number;
  originalPrice: number;
  endsAt: number; // timestamp
  couponCode: string;
}

export interface LiveSession {
  id: string;
  title: string;
  subtitle: string;
  hostName: string;
  hostAvatar?: string;
  status: "live" | "upcoming" | "ended";
  startedAt?: string;
  scheduledFor?: string;
  viewersCount: number;
  peakViewers: number;
  likesCount: number;
  pinnedProduct?: LiveProductItem;
  flashOffer?: LiveFlashOffer;
  products: LiveProductItem[];
  bannerUrl?: string;
  videoPreviewUrl?: string;
  tags: string[];
}

export const INITIAL_LIVE_SESSIONS: LiveSession[] = [
  {
    id: "live-apostlo-ai",
    title: "🚀 Lançamento Oficial: Apostlo AI & Softwares para Gestão 2026",
    subtitle: "Demonstração prática ao vivo com descontos exclusivos e licença vitalícia!",
    hostName: "Eddy Lima",
    status: "live",
    startedAt: "Há 18 minutos",
    viewersCount: 248,
    peakViewers: 312,
    likesCount: 1840,
    tags: ["Software", "IA", "Ao Vivo", "Desconto"],
    pinnedProduct: {
      id: "apostlo-ai",
      slug: "apostlo-ai",
      title: "Apostlo AI: Inteligência Artificial Completa para Igrejas",
      description: "Plataforma avançada com ERP completo, reconhecimento facial e automação via WhatsApp.",
      price: 150.0,
      originalPrice: 299.9,
      discountPercentage: 50,
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      category: "Software",
      productType: "software",
      softwareVersion: "v3.5.0 Pro",
      softwarePlatform: "Windows / Web Cloud / Android",
      demoUrl: "https://apostlo.ai/demo",
      stock: 14,
    },
    flashOffer: {
      active: true,
      productId: "apostlo-ai",
      productTitle: "Apostlo AI — Licença Vitalícia Pro",
      discountPrice: 150.0,
      originalPrice: 299.9,
      endsAt: Date.now() + 1000 * 60 * 8, // 8 minutos restantes
      couponCode: "LIVE50OFF",
    },
    products: [
      {
        id: "apostlo-ai",
        slug: "apostlo-ai",
        title: "Apostlo AI: Inteligência Artificial Completa para Igrejas",
        description: "ERP ministerial inteligente com IA generativa e assistente.",
        price: 150.0,
        originalPrice: 299.9,
        discountPercentage: 50,
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        category: "Software",
        productType: "software",
        softwareVersion: "v3.5.0 Pro",
        softwarePlatform: "Windows / Web Cloud / Android",
        demoUrl: "https://apostlo.ai/demo",
        stock: 14,
      },
      {
        id: "neon-runner-x9",
        slug: "neon-runner-x9",
        title: "Neon Runner X9",
        description: "Tênis de alta performance com sola LED reativa e acabamento premium.",
        price: 899.0,
        originalPrice: 1299.0,
        discountPercentage: 30,
        image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80",
        category: "Calçados",
        productType: "physical",
        stock: 8,
      },
      {
        id: "aura-wave-pro",
        slug: "aura-wave-pro",
        title: "Aura Wave Pro — Headphone RGB",
        description: "Cancelamento de ruído espacial e autonomia de 48h.",
        price: 1499.0,
        originalPrice: 1899.0,
        discountPercentage: 21,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        category: "Áudio",
        productType: "physical",
        stock: 5,
      },
      {
        id: "pulse-watch-30",
        slug: "pulse-watch-30",
        title: "Pulse Watch 30 AMOLED",
        description: "Smartwatch com sensores biométricos de última geração.",
        price: 2199.0,
        originalPrice: 2599.0,
        discountPercentage: 15,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
        category: "Wearables",
        productType: "physical",
        stock: 12,
      },
    ],
  },
  {
    id: "live-gamer-setup",
    title: "🎮 Especial Setup Gamer & Periféricos com Desconto",
    subtitle: "Testando teclados, headsets e óculos holográficos com preços de atacado.",
    hostName: "Vitrine Gamer Team",
    status: "upcoming",
    scheduledFor: "Hoje às 19:30",
    viewersCount: 0,
    peakViewers: 0,
    likesCount: 342,
    tags: ["Gamer", "Tech", "Promoção"],
    products: [],
  },
];

export const INITIAL_CHAT_MESSAGES: LiveChatMessage[] = [
  {
    id: "m1",
    sender: "Carlos Tech",
    message: "O Apostlo AI funciona tanto no Windows quanto no celular Android?",
    timestamp: "15:40",
  },
  {
    id: "m2",
    sender: "Eddy Lima",
    message: "Sim Carlos! Funciona 100% na nuvem, no celular e no Windows Desktop com sincronização automática.",
    timestamp: "15:41",
    isHost: true,
    badge: "Apresentador",
  },
  {
    id: "m3",
    sender: "Pastor Marcos",
    message: "Acabei de garantir minha licença com a promoção de 50%! Chegou na hora no WhatsApp!",
    timestamp: "15:42",
    isBuyer: true,
    badge: "Comprador VIP 🎉",
  },
  {
    id: "m4",
    sender: "Juliana Santos",
    message: "Qual o cupom da live? Ainda tem vagas no valor promocional?",
    timestamp: "15:43",
  },
  {
    id: "m5",
    sender: "Suporte Minha Vitrine",
    message: "Cupom LIVE50OFF ativo no card fixado na tela! Restam poucas unidades com esse valor!",
    timestamp: "15:43",
    isHost: true,
    badge: "Moderação",
  },
];

const STORAGE_KEY_LIVE = "mv_live_session_current";

export function loadLiveSession(): LiveSession {
  if (typeof window === "undefined") return INITIAL_LIVE_SESSIONS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIVE);
    if (!raw) return INITIAL_LIVE_SESSIONS[0];
    return JSON.parse(raw);
  } catch {
    return INITIAL_LIVE_SESSIONS[0];
  }
}

export function saveLiveSession(session: LiveSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_LIVE, JSON.stringify(session));
    // Notifica outras abas/janelas
    window.dispatchEvent(new CustomEvent("mv_live_update", { detail: session }));
  } catch (e) {
    console.error("Erro ao salvar live:", e);
  }
}

/**
 * Solicita acesso à câmera e microfone ou tela para transmissão
 */
export async function startUserMediaStream(
  videoDeviceId?: string,
  audioDeviceId?: string,
  facingMode: "user" | "environment" = "user"
): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: videoDeviceId
      ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Solicita compartilhamento de tela do computador para demonstrações de software
 */
export async function startScreenShareStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Compartilhamento de tela não suportado neste navegador.");
  }
  return await navigator.mediaDevices.getDisplayMedia({
    video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: true,
  });
}
