import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Printer,
  Copy,
  Share2,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Building2,
  DollarSign,
  RefreshCw,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export type PixReceiptData = {
  id: string;
  amount: string;
  paymentDate: string;
  paymentTime: string;
  description: string;
  pixKey: string;
  e2eId: string;
  payerName: string;
  payerDocument: string;
  payerBank: string;
  payerPhone?: string;
  receiverName: string;
  receiverDocument: string;
  receiverBank: string;
  createdAt: string;
};

const POPULAR_BANKS = [
  'Nu Pagamentos S.A. (Nubank)',
  'Banco do Brasil S.A.',
  'Caixa Econômica Federal',
  'Banco Bradesco S.A.',
  'Itaú Unibanco S.A.',
  'Banco Santander (Brasil) S.A.',
  'Banco Inter S.A.',
  'Mercado Pago IP Ltda',
  'PicPay Instituição de Pagamento',
  'C6 Bank S.A.',
  'PagBank (PagSeguro)',
  'Neon Pagamentos',
  'Stone Pagamentos',
  'Outro Banco / Instituição',
];

function generateRandomE2E(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const randomBankCode = '00416968';
  const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
  return `E${randomBankCode}${year}${month}${day}${hours}${minutes}${randomHex}`;
}

const STORAGE_RECEIPTS = 'nf_pix_receipts_history';
const STORAGE_RECEIVER_DEFAULTS = 'nf_pix_receiver_defaults';

export function PixReceiptGenerator() {
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);
  const currentTime = now.toTimeString().slice(0, 5);

  const [products, setProducts] = useState<Array<{ id: string; title: string; price: number }>>([]);
  const [formData, setFormData] = useState<PixReceiptData>(() => {
    let defaults = {
      receiverName: 'Eddy Lima / Minha Vitrine',
      receiverDocument: '11965244479 (Chave Pix)',
      receiverBank: 'Mercado Pago IP Ltda',
    };
    try {
      const saved = localStorage.getItem(STORAGE_RECEIVER_DEFAULTS);
      if (saved) defaults = { ...defaults, ...JSON.parse(saved) };
    } catch { /* ignore */ }

    return {
      id: 'REC-' + Date.now().toString(36).toUpperCase(),
      amount: '150,00',
      paymentDate: currentDate,
      paymentTime: currentTime,
      description: 'ERP CONTROLE DE VENDAS — Licença Vitalícia',
      pixKey: '11965244479',
      e2eId: generateRandomE2E(),
      payerName: 'Cliente Exemplo da Silva',
      payerDocument: '***.456.789-**',
      payerBank: 'Nu Pagamentos S.A. (Nubank)',
      payerPhone: '',
      receiverName: defaults.receiverName,
      receiverDocument: defaults.receiverDocument,
      receiverBank: defaults.receiverBank,
      createdAt: new Date().toISOString(),
    };
  });

  const [history, setHistory] = useState<PixReceiptData[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, title, price')
          .order('title');
        if (data && data.length > 0) setProducts(data);
      } catch { /* ignore */ }
    }

    try {
      const savedHistory = localStorage.getItem(STORAGE_RECEIPTS);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch { /* ignore */ }

    loadProducts();
  }, []);

  function handleChange(field: keyof PixReceiptData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSelectProduct(productId: string) {
    const found = products.find((p) => p.id === productId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        description: found.title,
        amount: Number(found.price).toFixed(2).replace('.', ','),
      }));
      toast.success(`Dados do produto "${found.title}" preenchidos!`);
    }
  }

  function handleRegenerateE2E() {
    const newId = generateRandomE2E();
    setFormData((prev) => ({ ...prev, e2eId: newId }));
    toast.info('Novo ID de transação gerado');
  }

  function handleReset() {
    const now = new Date();
    setFormData((prev) => ({
      ...prev,
      id: 'REC-' + Date.now().toString(36).toUpperCase(),
      paymentDate: now.toISOString().slice(0, 10),
      paymentTime: now.toTimeString().slice(0, 5),
      e2eId: generateRandomE2E(),
      amount: '150,00',
      description: '',
      payerName: '',
      payerDocument: '',
      payerPhone: '',
      createdAt: new Date().toISOString(),
    }));
    toast.info('Formulário pronto para novo comprovante');
  }

  function handleSaveReceiverDefaults() {
    const defaults = {
      receiverName: formData.receiverName,
      receiverDocument: formData.receiverDocument,
      receiverBank: formData.receiverBank,
    };
    localStorage.setItem(STORAGE_RECEIVER_DEFAULTS, JSON.stringify(defaults));
    toast.success('Dados do recebedor salvos como padrão!');
  }

  function handleSaveToHistory() {
    const updated = [formData, ...history.filter((h) => h.id !== formData.id)].slice(0, 30);
    setHistory(updated);
    localStorage.setItem(STORAGE_RECEIPTS, JSON.stringify(updated));
    toast.success('Comprovante gravado no histórico!');
  }

  function handleDeleteFromHistory(id: string) {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_RECEIPTS, JSON.stringify(updated));
    toast.success('Item removido do histórico');
  }

  function handleLoadFromHistory(item: PixReceiptData) {
    setFormData(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Comprovante carregado no formulário');
  }

  function formatDateBR(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  function formatReceiptText(): string {
    return `*COMPROVANTE DE PAGAMENTO PIX* ✅
-------------------------------------
*Valor:* R$ ${formData.amount}
*Status:* Concluído com Sucesso
*Data/Hora:* ${formatDateBR(formData.paymentDate)} às ${formData.paymentTime}
*Identificação:* ${formData.description || 'Pagamento de Produto / Serviço'}

*DADOS DO PAGADOR*
• *Nome:* ${formData.payerName || 'Não informado'}
• *CPF/CNPJ:* ${formData.payerDocument || 'Não informado'}
• *Instituição:* ${formData.payerBank}

*DADOS DO BENEFICIÁRIO*
• *Nome:* ${formData.receiverName}
• *Chave/Doc:* ${formData.receiverDocument}
• *Instituição:* ${formData.receiverBank}

*AUTENTICAÇÃO / ID PIX:*
${formData.e2eId}
-------------------------------------
_Comprovante emitido via Minha Vitrine Online_`;
  }

  function handleCopyText() {
    navigator.clipboard.writeText(formatReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Texto do comprovante copiado com sucesso!');
  }

  function handleSendWhatsApp() {
    handleSaveToHistory();
    const phone = (formData.payerPhone || '').replace(/\D/g, '');
    const text = encodeURIComponent(formatReceiptText());
    const url = phone ? `https://wa.me/55${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  }

  function handlePrint() {
    handleSaveToHistory();
    window.print();
  }

  return (
    <div className="mt-6 space-y-8 animate-fade-up">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #pix-receipt-print-area, #pix-receipt-print-area * {
            visibility: visible !important;
          }
          #pix-receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 650px !important;
            margin: 0 auto !important;
            padding: 30px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Barra de Ações Rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground">Gerador de Comprovante de Pagamento PIX</h2>
            <p className="text-xs text-muted-foreground">
              Emita comprovantes manuais personalizados para compras pagas via PIX
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Comprovante
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta px-4 py-2 text-xs font-semibold text-background hover:opacity-90 shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Formulário (7 Colunas) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Seletor rápido de produto cadastrado */}
          {products.length > 0 && (
            <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
              <label className="flex items-center justify-between text-xs font-semibold text-neon-cyan mb-2">
                <span>⚡ Preenchimento Rápido com Produto da Loja:</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  ({products.length} produtos disponíveis)
                </span>
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectProduct(e.target.value);
                }}
                defaultValue=""
                className="h-10 w-full rounded-xl border border-white/15 bg-background px-3 text-xs focus:border-neon-cyan focus:outline-none"
              >
                <option value="">-- Selecione um produto para preencher valor e descrição --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (R$ {Number(p.price).toFixed(2).replace('.', ',')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bloco 1: Dados da Transação */}
          <div className="rounded-3xl border border-white/10 glass p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neon-cyan border-b border-white/5 pb-2">
              <DollarSign className="h-4 w-4" /> 1. Valores e Dados da Transação
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Valor Pago (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neon-cyan">
                    R$
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="150,00"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 font-display text-base font-bold text-foreground focus:border-neon-cyan focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Descrição / Produto / Serviço
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Ex.: Licença Vitalícia ERP Vendas"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleChange('paymentDate', e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Horário do Pagamento
                </label>
                <input
                  type="time"
                  value={formData.paymentTime}
                  onChange={(e) => handleChange('paymentTime', e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  ID da Transação / End-to-End (E2E)
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateE2E}
                  className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline"
                  title="Gerar outro código oficial aleatório"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> Gerar Novo ID
                </button>
              </div>
              <input
                type="text"
                value={formData.e2eId}
                onChange={(e) => handleChange('e2eId', e.target.value)}
                placeholder="E00416968..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 font-mono text-xs text-muted-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
          </div>

          {/* Bloco 2: Dados do Pagador (Cliente) */}
          <div className="rounded-3xl border border-white/10 glass p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neon-magenta border-b border-white/5 pb-2">
              <User className="h-4 w-4" /> 2. Dados do Pagador (Cliente que fez o PIX)
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Nome do Pagador / Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.payerName}
                  onChange={(e) => handleChange('payerName', e.target.value)}
                  placeholder="Nome Completo do Cliente"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  CPF / CNPJ do Pagador (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.payerDocument}
                  onChange={(e) => handleChange('payerDocument', e.target.value)}
                  placeholder="Ex.: ***.456.789-** ou 123.456.789-00"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Banco / Instituição do Pagador
                </label>
                <input
                  type="text"
                  list="banks-list"
                  value={formData.payerBank}
                  onChange={(e) => handleChange('payerBank', e.target.value)}
                  placeholder="Ex.: Nubank, Itaú, Banco do Brasil"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
                <datalist id="banks-list">
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  WhatsApp do Cliente (Para envio direto)
                </label>
                <input
                  type="tel"
                  value={formData.payerPhone || ''}
                  onChange={(e) => handleChange('payerPhone', e.target.value)}
                  placeholder="DDD + Número (ex.: 11987654321)"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bloco 3: Dados do Beneficiário (Recebedor) */}
          <div className="rounded-3xl border border-white/10 glass p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-neon-green">
                <Building2 className="h-4 w-4" /> 3. Dados do Beneficiário (Quem Recebeu)
              </div>
              <button
                type="button"
                onClick={handleSaveReceiverDefaults}
                className="text-[11px] text-neon-green hover:underline flex items-center gap-1 font-medium"
              >
                <Check className="h-3 w-3" /> Salvar como Padrão
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Nome do Beneficiário / Empresa
                </label>
                <input
                  type="text"
                  value={formData.receiverName}
                  onChange={(e) => handleChange('receiverName', e.target.value)}
                  placeholder="Eddy Lima / Minha Vitrine"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Chave Pix ou Documento
                </label>
                <input
                  type="text"
                  value={formData.receiverDocument}
                  onChange={(e) => handleChange('receiverDocument', e.target.value)}
                  placeholder="Ex.: Chave Pix / E-mail / CNPJ"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
                Banco / Instituição do Recebedor
              </label>
              <input
                type="text"
                list="banks-list"
                value={formData.receiverBank}
                onChange={(e) => handleChange('receiverBank', e.target.value)}
                placeholder="Ex.: Mercado Pago IP Ltda ou Nubank"
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm focus:border-neon-cyan focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Coluna Direita: Visualização em Tempo Real (5 Colunas) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Visualização do Comprovante (Ao Vivo)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
              <span className="pulse-dot" /> Pronto para envio
            </span>
          </div>

          {/* O Card do Comprovante (Área de Impressão) */}
          <div
            id="pix-receipt-print-area"
            className="rounded-3xl border border-white/15 bg-slate-950/90 text-slate-100 p-6 shadow-2xl backdrop-blur relative overflow-hidden"
          >
            {/* Faixa Superior Estilo PIX */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-sm">
                  ❖
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm tracking-tight text-white">
                    Comprovante de Transferência PIX
                  </h3>
                  <p className="text-[10px] text-slate-400">Banco Central do Brasil — Sistema Pix</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Concluído
                </span>
              </div>
            </div>

            {/* Valor em Destaque */}
            <div className="my-5 text-center py-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Valor Recebido</p>
              <div className="mt-1 font-display text-3xl font-black text-emerald-400 tracking-tight">
                R$ {formData.amount || '0,00'}
              </div>
              <p className="mt-1 text-xs text-slate-300 font-medium">
                {formData.description || 'Pagamento PIX'}
              </p>
            </div>

            {/* Informações Detalhadas */}
            <div className="space-y-4 text-xs">
              {/* Data e Hora */}
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Data e Hora:</span>
                <span className="font-medium text-slate-200">
                  {formatDateBR(formData.paymentDate)} às {formData.paymentTime}
                </span>
              </div>

              {/* Pagador */}
              <div className="space-y-1 py-1.5 border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Origem (Pagador)</span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nome:</span>
                  <span className="font-semibold text-slate-100 text-right">{formData.payerName || '—'}</span>
                </div>
                {formData.payerDocument && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">CPF/CNPJ:</span>
                    <span className="font-mono text-slate-300">{formData.payerDocument}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Instituição:</span>
                  <span className="text-slate-300 text-right">{formData.payerBank}</span>
                </div>
              </div>

              {/* Beneficiário */}
              <div className="space-y-1 py-1.5 border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destino (Beneficiário)</span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nome:</span>
                  <span className="font-semibold text-slate-100 text-right">{formData.receiverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chave / Doc:</span>
                  <span className="font-mono text-slate-300 text-right">{formData.receiverDocument}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Instituição:</span>
                  <span className="text-slate-300 text-right">{formData.receiverBank}</span>
                </div>
              </div>

              {/* Autenticação & E2E */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Identificador / Autenticação End-to-End
                </span>
                <p className="font-mono text-[10px] text-slate-400 bg-white/5 p-2 rounded-lg break-all select-all border border-white/5">
                  {formData.e2eId}
                </p>
              </div>
            </div>

            {/* Rodapé do comprovante */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center text-[10px] text-slate-500">
              Autenticação eletrônica gerada via Minha Vitrine Online • Suporte direto no WhatsApp
            </div>
          </div>

          {/* Botões de Ação na Coluna do Preview */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-neon-green" /> : <Copy className="h-4 w-4 text-neon-cyan" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Share2 className="h-4 w-4" /> Enviar no WhatsApp
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta px-4 text-xs font-bold text-background hover:opacity-90 shadow-[0_0_15px_rgba(0,245,255,0.25)] transition-all"
            >
              <Printer className="h-4 w-4" /> Imprimir ou Salvar em PDF
            </button>
          </div>
        </div>
      </div>

      {/* Histórico de Comprovantes Emitidos */}
      {history.length > 0 && (
        <div className="rounded-3xl border border-white/10 glass p-6 mt-8 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-neon-cyan" />
              <h3 className="font-display font-bold text-sm">Histórico de Comprovantes Emitidos ({history.length})</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja limpar todo o histórico de comprovantes?')) {
                  setHistory([]);
                  localStorage.removeItem(STORAGE_RECEIPTS);
                  toast.success('Histórico limpo!');
                }
              }}
              className="text-[11px] text-muted-foreground hover:text-neon-magenta transition-colors"
            >
              Limpar histórico
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between hover:border-neon-cyan/40 transition-colors group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-display font-bold text-neon-green text-base">
                      R$ {item.amount}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateBR(item.paymentDate)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs mt-1 text-foreground truncate">
                    {item.payerName || 'Cliente'}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.description || 'Comprovante PIX'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadFromHistory(item)}
                    className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline font-medium"
                  >
                    Ver / Carregar <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFromHistory(item.id)}
                    className="text-muted-foreground hover:text-neon-magenta p-1 transition-colors"
                    title="Excluir do histórico"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
