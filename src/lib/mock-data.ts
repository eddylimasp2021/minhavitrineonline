import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

export type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  tag?: "novo" | "oferta" | "tendencia";
  rating: number;
};

export const products: Product[] = [
  {
    id: "neon-runner-x9",
    title: "Neon Runner X9",
    category: "Calçados",
    description: "Tênis de performance com sola LED reativa e malha respirável.",
    price: 899,
    oldPrice: 1299,
    image: product1,
    tag: "oferta",
    rating: 4.9,
  },
  {
    id: "aura-wave-pro",
    title: "Aura Wave Pro",
    category: "Áudio",
    description: "Headphone sem fio com cancelamento ativo e iluminação RGB.",
    price: 1499,
    image: product2,
    tag: "tendencia",
    rating: 4.8,
  },
  {
    id: "pulse-watch-30",
    title: "Pulse Watch 30",
    category: "Wearables",
    description: "Smartwatch com tela AMOLED 1.9'' e monitoramento avançado.",
    price: 2199,
    oldPrice: 2599,
    image: product3,
    tag: "novo",
    rating: 4.7,
  },
  {
    id: "holo-shades-v2",
    title: "Holo Shades V2",
    category: "Acessórios",
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
