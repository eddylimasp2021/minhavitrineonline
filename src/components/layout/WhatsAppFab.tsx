import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/5500000000000?text=Ol%C3%A1%2C%20vim%20pela%20NeonFlow!"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-20 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-neon-green text-background shadow-[0_0_24px_var(--neon-green),0_0_60px_oklch(0.88_0.27_155/0.35)] transition hover:scale-110 md:bottom-6"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 h-3 w-3 animate-ping rounded-full bg-neon-green" />
    </a>
  );
}
