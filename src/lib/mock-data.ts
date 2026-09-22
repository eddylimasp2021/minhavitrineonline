import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

export type Product = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryId?: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  tag?: "novo" | "oferta" | "tendencia";
  rating?: number;
  whatsapp?: string;
  /** fisico | digital | software | app */
  productType?: string;
  /** Link externo (site, loja de apps, download) para software/app. */
  externalUrl?: string;
  /** Texto customizado do botão (ex.: "Baixar app"). */
  ctaLabel?: string;
  /** Versão do software (ex.: v2.5.0) */
  softwareVersion?: string;
  /** Plataforma compatível (ex.: Windows 10/11, Web SaaS, Android) */
  softwarePlatform?: string;
  /** Tipo de licença (ex.: vitalicia, mensal, anual, demo) */
  licenseType?: string;
  /** Link de demonstração ou teste grátis */
  demoUrl?: string;
  /** Link direto de download / entrega do instalador */
  downloadUrl?: string;
  /** Instruções de instalação / ativação */
  deliveryInstructions?: string;
  /** Requisitos de sistema (ex.: 4GB RAM, Windows 64 bits) */
  systemRequirements?: string;
};

export const PRODUCT_TYPES = [
  { id: "fisico", label: "Produto físico" },
  { id: "digital", label: "Produto digital" },
  { id: "software", label: "Software / SaaS" },
  { id: "app", label: "Aplicativo (App)" },
] as const;

export const SOFTWARE_PLATFORMS = [
  "Windows (10/11)",
  "Web / SaaS (Nuvem)",
  "Android (APK / Play Store)",
  "iOS (App Store)",
  "macOS",
  "Linux",
  "Multiplataforma",
] as const;

export const LICENSE_TYPES = [
  { id: "vitalicia", label: "Licença Vitalícia (Pagamento Único)" },
  { id: "mensal", label: "Assinatura Mensal" },
  { id: "anual", label: "Assinatura Anual" },
  { id: "demo", label: "Demonstração / Teste Grátis" },
  { id: "open_source", label: "Código Aberto / Open Source" },
] as const;

export const isDigitalType = (t?: string | null) =>
  t === "software" || t === "app" || t === "digital";

/** Rótulo padrão do botão de acesso conforme o tipo. */
export function defaultCtaLabel(type?: string | null) {
  if (type === "app") return "Baixar o app";
  if (type === "software") return "Adquirir Licença";
  if (type === "digital") return "Acessar agora";
  return "Abrir link";
}

/** Link de acesso externo, quando o produto for software/app/digital. */
export function accessLink(p: Pick<Product, "productType" | "externalUrl" | "ctaLabel">) {
  const url = (p.externalUrl ?? "").trim();
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return { href: url, label: (p.ctaLabel ?? "").trim() || defaultCtaLabel(p.productType) };
}

/**
 * Gera mensagem estruturada e profissional de entrega de software
 * para envio via WhatsApp ou E-mail após a compra.
 */
export function generateSoftwareDeliveryMessage(
  p: {
    title: string;
    slug?: string;
    softwareVersion?: string | null;
    softwarePlatform?: string | null;
    licenseType?: string | null;
    downloadUrl?: string | null;
    demoUrl?: string | null;
    externalUrl?: string | null;
    deliveryInstructions?: string | null;
    systemRequirements?: string | null;
    whatsapp?: string | null;
  },
  clientName?: string
) {
  const downloadLink = p.downloadUrl?.trim() || p.externalUrl?.trim() || "Link enviado em anexo";
  const licenseLabel =
    LICENSE_TYPES.find((l) => l.id === p.licenseType)?.label ?? p.licenseType ?? "Vitalícia";
  
  const greeting = clientName ? `Olá, *${clientName}*!` : "Olá!";
  
  return [
    `🎉 ${greeting} Obrigado por adquirir o *${p.title}*!`,
    ``,
    `🚀 *DADOS DE ACESSO E DOWNLOAD:*`,
    `📥 *Link de Download / Acesso:* ${downloadLink}`,
    p.softwareVersion ? `🏷️ *Versão:* ${p.softwareVersion}` : null,
    p.softwarePlatform ? `💻 *Compatibilidade:* ${p.softwarePlatform}` : null,
    `🔑 *Tipo de Licença:* ${licenseLabel}`,
    p.systemRequirements ? `⚙️ *Requisitos:* ${p.systemRequirements}` : null,
    ``,
    p.deliveryInstructions ? `📖 *Instruções de Instalação:* \n${p.deliveryInstructions}\n` : null,
    `💬 Precisa de suporte? Estamos à disposição!`,
    `Eddy Lima Informática — Suporte Técnico`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export const products: Product[] = [
  {
    id: "neon-runner-x9",
    slug: "neon-runner-x9",
    title: "Neon Runner X9",
    category: "Calçados",
    categoryId: "calcados",
    description: "Tênis de performance com sola LED reativa e malha respirável.",
    price: 899,
    oldPrice: 1299,
    image: product1,
    tag: "oferta",
    rating: 4.9,
  },
  {
    id: "aura-wave-pro",
    slug: "aura-wave-pro",
    title: "Aura Wave Pro",
    category: "Áudio",
    categoryId: "audio",
    description: "Headphone sem fio com cancelamento ativo e iluminação RGB.",
    price: 1499,
    image: product2,
    tag: "tendencia",
    rating: 4.8,
  },
  {
    id: "pulse-watch-30",
    slug: "pulse-watch-30",
    title: "Pulse Watch 30",
    category: "Wearables",
    categoryId: "wearables",
    description: "Smartwatch com tela AMOLED 1.9'' e monitoramento avançado.",
    price: 2199,
    oldPrice: 2599,
    image: product3,
    tag: "novo",
    rating: 4.7,
  },
  {
    id: "holo-shades-v2",
    slug: "holo-shades-v2",
    title: "Holo Shades V2",
    category: "Acessórios",
    categoryId: "acessorios",
    description: "Óculos com lentes holográficas e armação de titânio.",
    price: 649,
    image: product4,
    tag: "tendencia",
    rating: 4.6,
  },
];

export const categories = [
  { id: "calcados", label: "Calçados", icon: "👟", color: "neon-cyan" },
  { id: "audio", label: "Áudio", icon: "🎧", color: "neon-purple" },
  { id: "wearables", label: "Wearables", icon: "⌚", color: "neon-green" },
  { id: "acessorios", label: "Acessórios", icon: "🕶️", color: "neon-magenta" },
  { id: "gamer", label: "Gamer", icon: "🎮", color: "neon-yellow" },
  { id: "casa", label: "Casa", icon: "🏠", color: "neon-cyan" },
];

export const dealOfTheDay = products[0];

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const WHATSAPP_NUMBER = "5511999999999";

/** Normaliza para o formato internacional (Brasil por padrão). */
export function normalizeWhatsAppNumber(raw?: string | null) {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return WHATSAPP_NUMBER;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/**
 * Monta o link do WhatsApp. Em desktop usamos web.whatsapp.com porque
 * wa.me/api.whatsapp.com costuma ser bloqueado por redes corporativas
 * (ERR_BLOCKED_BY_RESPONSE).
 */
export function buildWhatsAppUrl(rawNumber: string | null | undefined, message: string) {
  const number = normalizeWhatsAppNumber(rawNumber);
  const text = encodeURIComponent(message);
  const isMobile =
    typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  return isMobile
    ? `https://wa.me/${number}?text=${text}`
    : `https://web.whatsapp.com/send?phone=${number}&text=${text}`;
}

export function whatsappLink(product: Pick<Product, "title" | "price" | "slug" | "whatsapp">) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/v/${product.slug}` : "";
  const msg = `Olá! Tenho interesse no *${product.title}* (${formatBRL(product.price)}). ${url}`;
  return buildWhatsAppUrl(product.whatsapp, msg);
}


// Placeholder used when a DB product has no image_url yet.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><defs><linearGradient id='g' x1='0' x2='1' y2='1'><stop offset='0' stop-color='%23050816'/><stop offset='1' stop-color='%238A2EFF'/></linearGradient></defs><rect width='400' height='400' fill='url(%23g)'/><text x='50%' y='50%' fill='%2300F5FF' font-family='sans-serif' font-size='22' text-anchor='middle' dominant-baseline='middle'>NeonFlow</text></svg>`,
  );
