import { useState } from "react";
import { 
  X, 
  CreditCard, 
  QrCode, 
  MessageCircle, 
  ExternalLink, 
  Check, 
  Copy, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Lock
} from "lucide-react";
import { formatBRL, buildWhatsAppUrl, WHATSAPP_NUMBER } from "@/lib/mock-data";
import { track } from "@/hooks/use-track";
import { useStorePaymentGateways } from "@/lib/payment-gateways";
import { toast } from "sonner";

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    slug: string;
    title: string;
    price: number | string;
    image_url?: string | null;
    whatsapp?: string | null;
    external_url?: string | null;
    cta_label?: string | null;
    product_type?: string | null;
    software_version?: string | null;
  };
}

export function CheckoutModal({ isOpen, onClose, product }: CheckoutModalProps) {
  const { config, isLoading } = useStorePaymentGateways();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  if (!isOpen) return null;

  const priceNum = Number(product.price) || 0;
  const targetWhatsApp = product.whatsapp || WHATSAPP_NUMBER;

  // Gateways habilitados
  const mp = config.mercadopago?.enabled ? config.mercadopago : null;
  const stripe = config.stripe?.enabled ? config.stripe : null;
  const pagbank = config.pagbank?.enabled ? config.pagbank : null;
  const asaas = config.asaas?.enabled ? config.asaas : null;
  const paypal = config.paypal?.enabled ? config.paypal : null;
  const pix = config.pix?.enabled ? config.pix : null;

  const pixKey = pix?.values?.publicKey || "11965244479";
  const pixReceiver = pix?.values?.checkoutUrl || "Minha Vitrine Online";

  // Link de checkout externo do produto especifico se tiver
  const productCustomCheckout = product.external_url && /^https?:\/\//i.test(product.external_url)
    ? {
        url: product.external_url,
        label: product.cta_label || "Checkout Oficial do Produto",
      }
    : null;

  function handleCopyPix() {
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    toast.success("Chave Pix copiada para a área de transferência!");
    setTimeout(() => setPixCopied(false), 3000);
  }

  function handleOpenWhatsAppPixNotice() {
    const msg = `Olá! Realizei o pagamento via PIX no valor de ${formatBRL(priceNum)} para o produto *${product.title}*. Segue o comprovante:`;
    const url = buildWhatsAppUrl(targetWhatsApp, msg);
    track("whatsapp_click", { product_id: product.id, metadata: { source: "checkout_pix_confirmation" } });
    window.open(url, "_blank");
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 glass-strong p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-cyan/20 text-neon-cyan">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">Finalizar Compra</h3>
              <p className="text-xs text-muted-foreground">Escolha sua forma de pagamento preferida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumo do Pedido */}
        <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.title} 
              className="h-16 w-16 rounded-xl object-cover shrink-0 border border-white/10"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan shrink-0 font-bold">
              MV
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-wider">
              {product.product_type === "software" ? "Software / Licença Digital" : "Produto"}
            </span>
            <h4 className="truncate font-semibold text-sm">{product.title}</h4>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-xl font-black text-neon-cyan">
                {formatBRL(priceNum)}
              </span>
              <span className="text-[11px] text-muted-foreground">À vista ou no cartão</span>
            </div>
          </div>
        </div>

        {/* Opcoes de Pagamento */}
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Selecione como deseja pagar:
          </p>

          {/* Checkout Direto do Produto (se configurado na edição do produto) */}
          {productCustomCheckout && (
            <a
              href={productCustomCheckout.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("checkout_start", { product_id: product.id, metadata: { source: "custom_checkout_link" } })}
              className="group flex items-center justify-between rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 p-4 transition-all hover:bg-neon-cyan/20 hover:border-neon-cyan shadow-[0_0_15px_rgba(0,245,255,0.15)]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-cyan text-background font-black">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-sm text-neon-cyan">{productCustomCheckout.label}</h5>
                    <span className="rounded bg-neon-cyan/20 px-1.5 py-0.5 text-[9px] font-bold text-neon-cyan">
                      RECOMENDADO
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cartão de Crédito em até 12x, Pix ou Boleto</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-neon-cyan opacity-80 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}

          {/* Mercado Pago */}
          {mp && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-sky-400/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/20 text-sky-400 font-bold text-xs">
                    MP
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">Mercado Pago</h5>
                    <p className="text-xs text-muted-foreground">Cartão em até 12x, Pix e Saldo Mercado Pago</p>
                  </div>
                </div>
                {mp.values.checkoutUrl ? (
                  <a
                    href={mp.values.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("checkout_start", { product_id: product.id, metadata: { gateway: "mercadopago" } })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 transition-colors"
                  >
                    Pagar no Mercado Pago <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      const msg = `Olá! Gostaria de pagar o produto *${product.title}* (${formatBRL(priceNum)}) pelo Mercado Pago. Pode me enviar o link de pagamento?`;
                      window.open(buildWhatsAppUrl(targetWhatsApp, msg), "_blank");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-400/10 px-3 text-xs font-semibold text-sky-400 hover:bg-sky-400/20"
                  >
                    Solicitar Link MP <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stripe */}
          {stripe && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-400/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/20 text-purple-400 font-bold text-xs">
                    ST
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">Cartão Internacional / Stripe</h5>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex, Apple Pay e Google Pay</p>
                  </div>
                </div>
                {stripe.values.checkoutUrl ? (
                  <a
                    href={stripe.values.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("checkout_start", { product_id: product.id, metadata: { gateway: "stripe" } })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                  >
                    Pagar no Cartão <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      const msg = `Olá! Quero pagar o produto *${product.title}* (${formatBRL(priceNum)}) via Cartão/Stripe. Pode me enviar o link de pagamento?`;
                      window.open(buildWhatsAppUrl(targetWhatsApp, msg), "_blank");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-purple-400/40 bg-purple-400/10 px-3 text-xs font-semibold text-purple-400 hover:bg-purple-400/20"
                  >
                    Solicitar Link Cartão <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PagBank */}
          {pagbank && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-400/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    PB
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">PagBank / PagSeguro</h5>
                    <p className="text-xs text-muted-foreground">Cartão de Crédito e Débito Online</p>
                  </div>
                </div>
                {pagbank.values.checkoutUrl ? (
                  <a
                    href={pagbank.values.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Pagar com PagBank <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      const msg = `Olá! Quero pagar o produto *${product.title}* via PagBank. Pode me enviar o link?`;
                      window.open(buildWhatsAppUrl(targetWhatsApp, msg), "_blank");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-400"
                  >
                    Solicitar Link <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Asaas */}
          {asaas && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-blue-400/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 text-blue-400 font-bold text-xs">
                    AS
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">Asaas Pagamentos</h5>
                    <p className="text-xs text-muted-foreground">Cartão de Crédito e Boleto Bancário</p>
                  </div>
                </div>
                {asaas.values.checkoutUrl ? (
                  <a
                    href={asaas.values.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Pagar com Asaas <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      const msg = `Olá! Quero pagar o produto *${product.title}* via Asaas. Pode me enviar a cobrança?`;
                      window.open(buildWhatsAppUrl(targetWhatsApp, msg), "_blank");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-blue-400/40 bg-blue-400/10 px-3 text-xs font-semibold text-blue-400"
                  >
                    Solicitar Cobrança <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PayPal */}
          {paypal && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-yellow-400/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-500/20 text-yellow-400 font-bold text-xs">
                    PP
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">PayPal</h5>
                    <p className="text-xs text-muted-foreground">Pagamento Internacional e Saldo PayPal</p>
                  </div>
                </div>
                {paypal.values.checkoutUrl ? (
                  <a
                    href={paypal.values.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-yellow-500 px-4 text-xs font-semibold text-slate-900 hover:bg-yellow-600"
                  >
                    Pagar com PayPal <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>
          )}

          {/* PIX Instantaneo */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-background font-black">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-sm text-emerald-400">PIX Instantâneo</h5>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                      APROVAÇÃO NA HORA
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sem taxas • Chave Pix Oficial</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMethod(selectedMethod === "pix" ? null : "pix")}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                {selectedMethod === "pix" ? "Ocultar Chave" : "Ver Chave Pix"}
              </button>
            </div>

            {/* Caixa de detalhes do PIX */}
            {selectedMethod === "pix" && (
              <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-3 animate-fade-in">
                <div className="rounded-xl border border-white/10 bg-background/60 p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                    Chave Pix ({pixReceiver})
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <code className="font-mono text-sm font-semibold text-emerald-400 break-all select-all">
                      {pixKey}
                    </code>
                    <button
                      onClick={handleCopyPix}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30"
                    >
                      {pixCopied ? <Check className="h-3.5 w-3.5 text-neon-green" /> : <Copy className="h-3.5 w-3.5" />}
                      {pixCopied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleOpenWhatsAppPixNotice}
                  className="w-full h-10 rounded-xl bg-neon-green text-background text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                >
                  <MessageCircle className="h-4 w-4" /> Já fiz o Pix, enviar comprovante no WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Negociação e Pagamento no WhatsApp */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-semibold text-sm">Falar com o Vendedor</h5>
                  <p className="text-xs text-muted-foreground">Tirar dúvidas, negociar ou pedir fatura personalizada</p>
                </div>
              </div>
              <a
                href={buildWhatsAppUrl(
                  targetWhatsApp,
                  `Olá! Quero comprar o produto *${product.title}* (${formatBRL(priceNum)}). Quais as opções de pagamento disponíveis?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", { product_id: product.id, metadata: { source: "checkout_modal_chat" } })}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
              >
                Conversar <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Rodapé de Segurança */}
        <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 text-neon-green" />
          <span>Ambiente Criptografado & Transação 100% Segura</span>
        </div>
      </div>
    </div>
  );
}
