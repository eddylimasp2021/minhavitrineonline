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
};

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

export function whatsappLink(product: Pick<Product, "title" | "price" | "slug" | "whatsapp">) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/v/${product.slug}` : "";
  const msg = `Olá! Tenho interesse no *${product.title}* (${formatBRL(product.price)}). ${url}`;
  const number = (product.whatsapp ?? WHATSAPP_NUMBER).replace(/\D/g, "") || WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

// Placeholder used when a DB product has no image_url yet.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><defs><linearGradient id='g' x1='0' x2='1' y2='1'><stop offset='0' stop-color='%23050816'/><stop offset='1' stop-color='%238A2EFF'/></linearGradient></defs><rect width='400' height='400' fill='url(%23g)'/><text x='50%' y='50%' fill='%2300F5FF' font-family='sans-serif' font-size='22' text-anchor='middle' dominant-baseline='middle'>NeonFlow</text></svg>`,
  );
