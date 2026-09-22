import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  Globe2,
  Server,
  Calculator,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  QrCode,
  Laptop,
  Check,
  Download,
  Info,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BackButton } from "@/components/layout/BackButton";
import {
  loadFiscalSettings,
  saveFiscalSettings,
  FullFiscalSettings,
  DEFAULT_FISCAL_SETTINGS,
  BRAZILIAN_STATES,
  SOFTWARE_SERVICE_CODES,
  FISCAL_GATEWAYS,
  calculateDifalTax,
  StateTaxRule,
  FiscalDocumentType,
} from "@/lib/fiscal";
import { formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/fiscal")({
  head: () => ({
    meta: [
      { title: "Configuração Fiscal & Notas — Minha Vitrine Admin" },
      { name: "description", content: "Configurações de emissão de NF-e, NFC-e, Cupom Fiscal, NFS-e para Softwares e regras interestaduais de ICMS e DIFAL." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminFiscalPage,
});

type TabKey = "empresa" | "modelos" | "estados" | "provedores" | "simulador";

// Funções utilitárias de formatação
const formatCnpj = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

const formatCep = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

function AdminFiscalPage() {
  const [settings, setSettings] = useState<FullFiscalSettings>(DEFAULT_FISCAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabKey>("empresa");
  const [selectedRegion, setSelectedRegion] = useState<string>("todas");
  const [editingState, setEditingState] = useState<StateTaxRule | null>(null);

  // Estados de Busca Automática
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Estados do Simulador
  const [simValor, setSimValor] = useState<number>(199.90);
  const [simUfDestino, setSimUfDestino] = useState<string>("RJ");
  const [simTipoDoc, setSimTipoDoc] = useState<"produto" | "software">("software");

  useEffect(() => {
    setSettings(loadFiscalSettings());
  }, []);

  // Busca de CNPJ automática via Receita Federal (BrasilAPI + Fallback MinhaReceita)
  const fetchCnpjData = async (rawCnpj: string) => {
    const digits = rawCnpj.replace(/\D/g, "");
    if (digits.length !== 14) {
      toast.error("CNPJ incompleto", {
        description: "Digite os 14 números do CNPJ para buscar os dados na Receita Federal.",
      });
      return;
    }

    setIsSearchingCnpj(true);
    const toastId = toast.loading("Consultando dados na Receita Federal...", { id: "cnpj-search" });

    try {
      let data: any = null;

      // Tentativa 1: BrasilAPI
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn("BrasilAPI falhou, tentando fallback MinhaReceita...", err);
      }

      // Tentativa 2: Minha Receita
      if (!data) {
        const resFallback = await fetch(`https://minhareceita.org/${digits}`);
        if (resFallback.ok) {
          data = await resFallback.json();
        }
      }

      if (!data) {
        throw new Error("Não foi possível consultar os dados na base da Receita.");
      }

      // Detecção inteligente do Regime Tributário (CRT)
      let regime: "simples_nacional" | "mei" | "simples_excesso" | "lucro_presumido" | "lucro_real" = "simples_nacional";
      let crt = "1";
      if (data.opcao_pelo_mei === true || data.porte === "MEI") {
        regime = "mei";
        crt = "4";
      } else if (data.opcao_pelo_simples === true) {
        regime = "simples_nacional";
        crt = "1";
      } else {
        regime = "lucro_presumido";
        crt = "3";
      }

      const cnaeFormatted = data.cnae_fiscal
        ? `${data.cnae_fiscal} - ${data.cnae_fiscal_descricao || ""}`.trim()
        : "";

      const logradouroFormatted = data.descricao_tipo_de_logradouro
        ? `${data.descricao_tipo_de_logradouro} ${data.logradouro || ""}`.trim()
        : (data.logradouro || "");

      const cepFormatted = data.cep ? formatCep(data.cep) : "";

      setSettings((prev) => ({
        ...prev,
        company: {
          ...prev.company,
          cnpj: formatCnpj(digits),
          razaoSocial: data.razao_social || prev.company.razaoSocial,
          nomeFantasia: data.nome_fantasia || data.razao_social || prev.company.nomeFantasia,
          cnaePrincipal: cnaeFormatted || prev.company.cnaePrincipal,
          regimeTributario: regime,
          crt: crt,
          cep: cepFormatted || prev.company.cep,
          logradouro: logradouroFormatted || prev.company.logradouro,
          numero: data.numero || prev.company.numero,
          complemento: data.complemento || prev.company.complemento,
          bairro: data.bairro || prev.company.bairro,
          cidade: data.municipio || prev.company.cidade,
          uf: (data.uf || prev.company.uf).toUpperCase(),
          codigoIbge: data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : prev.company.codigoIbge,
          emailFiscal: data.email || prev.company.emailFiscal,
        },
      }));

      toast.success("Dados preenchidos automaticamente!", {
        id: "cnpj-search",
        description: `${data.razao_social || "Empresa"} localizada com sucesso.`,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível buscar os dados do CNPJ", {
        id: "cnpj-search",
        description: "Verifique o número digitado ou preencha as informações manualmente.",
      });
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  // Busca de Endereço automática via CEP
  const fetchCepData = async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setIsSearchingCep(true);
    try {
      let data: any = null;
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch {}

      if (!data) {
        const res2 = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        if (res2.ok) {
          const viaData = await res2.json();
          if (!viaData.erro) {
            data = {
              street: viaData.logradouro,
              neighborhood: viaData.bairro,
              city: viaData.localidade,
              state: viaData.uf,
              ibge: { city: viaData.ibge },
            };
          }
        }
      }

      if (data) {
        setSettings((prev) => ({
          ...prev,
          company: {
            ...prev.company,
            cep: formatCep(digits),
            logradouro: data.street || prev.company.logradouro,
            bairro: data.neighborhood || prev.company.bairro,
            cidade: data.city || prev.company.cidade,
            uf: (data.state || prev.company.uf).toUpperCase(),
            codigoIbge: data.ibge?.city ? String(data.ibge.city) : prev.company.codigoIbge,
          },
        }));
        toast.success("Endereço preenchido via CEP!", { duration: 2500 });
      }
    } catch (err) {
      console.warn("Erro ao buscar CEP:", err);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSave = () => {
    saveFiscalSettings(settings);
    toast.success("Configurações fiscais salvas com sucesso!", {
      description: "As regras de emissão e alíquotas interestaduais foram atualizadas.",
    });
  };

  const handleReset = () => {
    if (confirm("Deseja restaurar todas as configurações fiscais para o padrão?")) {
      setSettings(DEFAULT_FISCAL_SETTINGS);
      saveFiscalSettings(DEFAULT_FISCAL_SETTINGS);
      toast.info("Configurações restauradas para os padrões recomendados.");
    }
  };

  // Cálculo da simulação
  const simResultado = calculateDifalTax({
    valorTotal: simValor || 0,
    ufOrigem: settings.company.uf || "SP",
    ufDestino: simUfDestino,
    stateRules: settings.stateRules,
  });

  const filteredStates = BRAZILIAN_STATES.filter((s) => {
    if (selectedRegion === "todas") return true;
    return s.regiao.toLowerCase() === selectedRegion.toLowerCase();
  });

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <BackButton fallback="/admin" />
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-xs font-semibold text-neon-purple">
              <ShieldCheck className="h-3.5 w-3.5" /> Módulo Fiscal SEFAZ & Prefeituras
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 text-xs font-semibold text-neon-cyan">
              <Zap className="h-3.5 w-3.5" /> Suporte NF-e, NFC-e e NFS-e
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl text-foreground">
            Configuração Fiscal & Emissão de Notas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Gerencie dados do emitente, parâmetros de Cupom Fiscal (NFC-e), NF-e (produtos), NFS-e (Softwares/SaaS) e regras tributárias interestaduais (DIFAL e ICMS) para todos os estados.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Restaurar Padrões
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-green px-5 py-2.5 text-xs font-bold text-background hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(189,0,255,0.3)]"
          >
            <Save className="h-4 w-4" /> Salvar Configurações
          </button>
        </div>
      </header>

      {/* Navegação por Abas Fiscais */}
      <nav className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("empresa")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "empresa"
              ? "bg-neon-purple text-background shadow-[0_0_15px_rgba(189,0,255,0.4)]"
              : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" /> 1. Empresa & Emitente
        </button>

        <button
          onClick={() => setActiveTab("modelos")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "modelos"
              ? "bg-neon-cyan text-background shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" /> 2. Modelos de Notas & Cupons
        </button>

        <button
          onClick={() => setActiveTab("estados")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "estados"
              ? "bg-neon-green text-background shadow-[0_0_15px_rgba(0,255,102,0.4)]"
              : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          }`}
        >
          <Globe2 className="h-4 w-4" /> 3. Regras Interestaduais (27 UFs)
        </button>

        <button
          onClick={() => setActiveTab("provedores")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "provedores"
              ? "bg-neon-magenta text-background shadow-[0_0_15px_rgba(255,0,128,0.4)]"
              : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          }`}
        >
          <Server className="h-4 w-4" /> 4. Gateways & Provedores Fiscais
        </button>

        <button
          onClick={() => setActiveTab("simulador")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "simulador"
              ? "bg-neon-yellow text-background shadow-[0_0_15px_rgba(255,230,0,0.4)]"
              : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          }`}
        >
          <Calculator className="h-4 w-4" /> 5. Simulador & Calculadora DIFAL
        </button>
      </nav>

      {/* ABA 1: EMPRESA & EMITENTE */}
      {activeTab === "empresa" && (
        <section className="mt-6 space-y-6 animate-fade-up">
          {/* Card de Destaque para Auto-Preenchimento via CNPJ */}
          <div className="rounded-3xl border border-neon-purple/40 bg-gradient-to-r from-neon-purple/10 via-neon-cyan/5 to-transparent p-6 shadow-[0_0_25px_rgba(189,0,255,0.1)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neon-purple/20 text-neon-purple shadow-[0_0_15px_rgba(189,0,255,0.3)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                      Preenchimento Automático via Receita Federal
                    </h2>
                    <span className="rounded-full bg-neon-green/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon-green">
                      Ativo
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xl">
                    Digite os 14 dígitos do seu CNPJ abaixo e clique em <strong>Buscar</strong> (ou pressione Enter) para preencher automaticamente Razão Social, Fantasia, CNAE, Regime CRT, Endereço e Código IBGE.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchCnpjData(settings.company.cnpj)}
                  disabled={isSearchingCnpj}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-neon-purple px-4 py-2.5 text-xs font-bold text-background shadow-[0_0_15px_rgba(189,0,255,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSearchingCnpj ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Buscando na Receita...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" /> Buscar CNPJ na Receita
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 glass p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-purple/15 text-neon-purple">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Identificação da Empresa Emitente</h2>
                <p className="text-xs text-muted-foreground">
                  Estes dados serão transmitidos à SEFAZ e prefeituras em todas as notas e cupons emitidos.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">CNPJ / CPF</label>
                  {isSearchingCnpj && (
                    <span className="flex items-center gap-1 text-[10px] text-neon-purple font-medium">
                      <Loader2 className="h-3 w-3 animate-spin" /> Consultando...
                    </span>
                  )}
                </div>
                <div className="relative mt-1.5 flex items-center">
                  <input
                    type="text"
                    value={settings.company.cnpj}
                    onChange={(e) => {
                      const formatted = formatCnpj(e.target.value);
                      setSettings({
                        ...settings,
                        company: { ...settings.company, cnpj: formatted },
                      });
                      const cleanDigits = e.target.value.replace(/\D/g, "");
                      if (cleanDigits.length === 14) {
                        fetchCnpjData(cleanDigits);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        fetchCnpjData(settings.company.cnpj);
                      }
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                    placeholder="00.000.000/0001-00"
                  />
                  <button
                    type="button"
                    title="Consultar CNPJ na Receita Federal"
                    onClick={() => fetchCnpjData(settings.company.cnpj)}
                    disabled={isSearchingCnpj}
                    className="absolute right-2 text-muted-foreground hover:text-neon-purple transition-colors p-1"
                  >
                    {isSearchingCnpj ? (
                      <Loader2 className="h-4 w-4 animate-spin text-neon-purple" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Razão Social</label>
                <input
                  type="text"
                  value={settings.company.razaoSocial}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, razaoSocial: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="Nome empresarial completo"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nome Fantasia</label>
                <input
                  type="text"
                  value={settings.company.nomeFantasia}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, nomeFantasia: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="Minha Vitrine Online"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Inscrição Estadual (IE)</label>
                <input
                  type="text"
                  value={settings.company.inscricaoEstadual}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, inscricaoEstadual: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="123.456.789.000 ou ISENTO"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Inscrição Municipal (IM)</label>
                <input
                  type="text"
                  value={settings.company.inscricaoMunicipal}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, inscricaoMunicipal: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="Número de cadastro na prefeitura"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Regime Tributário (CRT)</label>
                <select
                  value={settings.company.regimeTributario}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    const crtCode = val === "simples_nacional" ? "1" : val === "simples_excesso" ? "2" : val === "mei" ? "4" : "3";
                    setSettings({
                      ...settings,
                      company: { ...settings.company, regimeTributario: val, crt: crtCode },
                    });
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                >
                  <option value="simples_nacional">Simples Nacional (ME / EPP - CRT 1)</option>
                  <option value="mei">MEI - Microempreendedor Individual (CRT 4)</option>
                  <option value="simples_excesso">Simples Nacional - Excesso de Sublimite (CRT 2)</option>
                  <option value="lucro_presumido">Regime Normal - Lucro Presumido (CRT 3)</option>
                  <option value="lucro_real">Regime Normal - Lucro Real (CRT 3)</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-muted-foreground">CNAE Principal</label>
                <input
                  type="text"
                  value={settings.company.cnaePrincipal}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, cnaePrincipal: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="62.01-5-01 - Desenvolvimento de programas de computador"
                />
              </div>
            </div>
          </div>

          {/* Endereço Fiscal */}
          <div className="rounded-3xl border border-white/10 glass p-6">
            <h2 className="font-display text-lg font-bold text-foreground">Endereço Fiscal do Estabelecimento</h2>
            <p className="text-xs text-muted-foreground">
              Obrigatório para o cálculo da UF de origem do ICMS, DIFAL e alíquota de ISS.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">CEP</label>
                  {isSearchingCep && (
                    <span className="flex items-center gap-1 text-[10px] text-neon-cyan font-medium">
                      <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                    </span>
                  )}
                </div>
                <div className="relative mt-1.5 flex items-center">
                  <input
                    type="text"
                    value={settings.company.cep}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      setSettings({
                        ...settings,
                        company: { ...settings.company, cep: formatted },
                      });
                      const cleanDigits = e.target.value.replace(/\D/g, "");
                      if (cleanDigits.length === 8) {
                        fetchCepData(cleanDigits);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        fetchCepData(settings.company.cep);
                      }
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                    placeholder="00000-000"
                  />
                  <button
                    type="button"
                    title="Consultar CEP"
                    onClick={() => fetchCepData(settings.company.cep)}
                    disabled={isSearchingCep}
                    className="absolute right-2 text-muted-foreground hover:text-neon-cyan transition-colors p-1"
                  >
                    {isSearchingCep ? (
                      <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Logradouro / Rua</label>
                <input
                  type="text"
                  value={settings.company.logradouro}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, logradouro: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="Avenida / Rua / Alameda"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Número</label>
                <input
                  type="text"
                  value={settings.company.numero}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, numero: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Complemento</label>
                <input
                  type="text"
                  value={settings.company.complemento}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, complemento: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="Sala, Andar, Bloco"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Bairro</label>
                <input
                  type="text"
                  value={settings.company.bairro}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, bairro: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="Centro"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Cidade / Município</label>
                <input
                  type="text"
                  value={settings.company.cidade}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, cidade: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Estado (UF Origem)</label>
                <select
                  value={settings.company.uf}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, uf: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                >
                  {BRAZILIAN_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>
                      {s.uf} — {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Código IBGE do Município</label>
                <input
                  type="text"
                  value={settings.company.codigoIbge}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, codigoIbge: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="Ex: 3550308 (SP)"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">E-mail para Alertas Fiscais</label>
                <input
                  type="email"
                  value={settings.company.emailFiscal}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, emailFiscal: e.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  placeholder="fiscal@empresa.com"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ABA 2: MODELOS DE NOTAS & CUPONS */}
      {activeTab === "modelos" && (
        <section className="mt-6 grid gap-6 md:grid-cols-2 animate-fade-up">
          {/* Card NF-e (Modelo 55 - Produtos Físicos / Mercadorias) */}
          <div className="rounded-3xl border border-neon-cyan/30 bg-neon-cyan/5 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-cyan/20 text-neon-cyan">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">NF-e — Modelo 55</h3>
                    <p className="text-xs text-muted-foreground">Nota Fiscal Eletrônica de Produtos</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.documents.nfe.ativo}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfe: { ...settings.documents.nfe, ativo: e.target.checked },
                        },
                      })
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-white/10 peer-checked:bg-neon-cyan peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:bg-background"></div>
                </label>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Utilizada para vendas de mercadorias para pessoas físicas e jurídicas em todo o território nacional e exportação.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Série da NF-e</label>
                  <input
                    type="number"
                    value={settings.documents.nfe.serie}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfe: { ...settings.documents.nfe, serie: parseInt(e.target.value) || 1 },
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Próximo Número</label>
                  <input
                    type="number"
                    value={settings.documents.nfe.proximoNumero}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfe: { ...settings.documents.nfe, proximoNumero: parseInt(e.target.value) || 1 },
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-[11px] font-semibold text-muted-foreground">Ambiente de Emissão</label>
                <select
                  value={settings.documents.nfe.ambiente}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      documents: {
                        ...settings.documents,
                        nfe: { ...settings.documents.nfe, ambiente: e.target.value as any },
                      },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                >
                  <option value="homologacao">Homologação (Ambiente de Testes SEFAZ)</option>
                  <option value="producao">Produção (Validade Jurídica Real)</option>
                </select>
              </div>

              <div className="mt-3">
                <label className="text-[11px] font-semibold text-muted-foreground">Natureza da Operação Padrão</label>
                <input
                  type="text"
                  value={settings.documents.nfe.naturezaOperacao}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      documents: {
                        ...settings.documents,
                        nfe: { ...settings.documents.nfe, naturezaOperacao: e.target.value },
                      },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card NFC-e (Modelo 65 - Cupom Fiscal Eletrônico) */}
          <div className="rounded-3xl border border-neon-purple/30 bg-neon-purple/5 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-purple/20 text-neon-purple">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">NFC-e — Modelo 65 (Cupom Fiscal)</h3>
                    <p className="text-xs text-muted-foreground">Cupom de Consumidor com QR Code</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.documents.nfce.ativo}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfce: { ...settings.documents.nfce, ativo: e.target.checked },
                        },
                      })
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-white/10 peer-checked:bg-neon-purple peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:bg-background"></div>
                </label>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Emissão instantânea para vendas no balcão/varejo ao consumidor final, gerando QR Code de consulta SEFAZ.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Série do Cupom</label>
                  <input
                    type="number"
                    value={settings.documents.nfce.serie}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfce: { ...settings.documents.nfce, serie: parseInt(e.target.value) || 1 },
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Próximo Número</label>
                  <input
                    type="number"
                    value={settings.documents.nfce.proximoNumero}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfce: { ...settings.documents.nfce, proximoNumero: parseInt(e.target.value) || 1 },
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-purple focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">ID do Token (CSC ID)</label>
                  <input
                    type="text"
                    value={settings.documents.nfce.cscId || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfce: { ...settings.documents.nfce, cscId: e.target.value },
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-purple focus:outline-none"
                    placeholder="000001"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Código CSC / Token SEFAZ</label>
                  <input
                    type="text"
                    value={settings.documents.nfce.cscToken || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfce: { ...settings.documents.nfce, cscToken: e.target.value },
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-purple focus:outline-none"
                    placeholder="Chave de segurança CSC"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card NFS-e (Software, SaaS, Licenças e Serviços) */}
          <div className="rounded-3xl border border-neon-green/30 bg-neon-green/5 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-green/20 text-neon-green">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">NFS-e — Nota de Software & SaaS</h3>
                    <p className="text-xs text-muted-foreground">Nota Fiscal de Serviços Eletrônica</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.documents.nfse.ativo}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfse: { ...settings.documents.nfse, ativo: e.target.checked },
                        },
                      })
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-white/10 peer-checked:bg-neon-green peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:bg-background"></div>
                </label>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Modelo fiscal específico e ideal para vendas de licenças de software, código-fonte, planos de assinatura SaaS e suporte em TI.
              </p>

              <div className="mt-4">
                <label className="text-[11px] font-semibold text-muted-foreground">Código de Serviço (Lei Complementar 116/03)</label>
                <select
                  value={settings.documents.nfse.itemListaServico}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      documents: {
                        ...settings.documents,
                        nfse: { ...settings.documents.nfse, itemListaServico: e.target.value },
                      },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-foreground focus:border-neon-green focus:outline-none"
                >
                  {SOFTWARE_SERVICE_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      Item {item.code} — {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Alíquota de ISS (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.documents.nfse.aliquotaIss}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfse: { ...settings.documents.nfse, aliquotaIss: parseFloat(e.target.value) || 2.0 },
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Cód. Tributação Municipal</label>
                  <input
                    type="text"
                    value={settings.documents.nfse.codigoTributacaoMunicipio || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          nfse: { ...settings.documents.nfse, codigoTributacaoMunicipio: e.target.value },
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-green focus:outline-none"
                    placeholder="6201501"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card CF-e SAT (Cupom Fiscal SAT) */}
          <div className="rounded-3xl border border-white/10 glass p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-muted-foreground">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">CF-e-SAT (São Paulo & Ceará)</h3>
                    <p className="text-xs text-muted-foreground">Emissão via hardware SAT físico</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.documents.sat.ativo}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: {
                          ...settings.documents,
                          sat: { ...settings.documents.sat, ativo: e.target.checked },
                        },
                      })
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-white/10 peer-checked:bg-neon-yellow peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:bg-background"></div>
                </label>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Suporte a equipamentos SAT homologados para estabelecimentos do estado de SP ou MFE no CE.
              </p>

              <div className="mt-4">
                <label className="text-[11px] font-semibold text-muted-foreground">Status do SAT</label>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-white/20" /> Desativado (Utilize NFC-e como padrão nuvem)
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ABA 3: REGRAS INTERESTADUAIS (27 UFS & DIFAL) */}
      {activeTab === "estados" && (
        <section className="mt-6 space-y-6 animate-fade-up">
          {/* CFOPs Padrão */}
          <div className="rounded-3xl border border-white/10 glass p-6">
            <h2 className="font-display text-lg font-bold text-foreground">CFOPs Padrão da Loja</h2>
            <p className="text-xs text-muted-foreground">
              Códigos Fiscais de Operações e Prestações para operações internas (mesmo estado) e interestaduais (outros estados).
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">CFOP Interno (Mercadorias)</label>
                <input
                  type="text"
                  value={settings.automation.cfopInternoProduto}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      automation: { ...settings.automation, cfopInternoProduto: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-foreground focus:border-neon-green focus:outline-none"
                  placeholder="5102 (Revenda)"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">CFOP Interestadual (Mercadorias)</label>
                <input
                  type="text"
                  value={settings.automation.cfopInterestadualProduto}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      automation: { ...settings.automation, cfopInterestadualProduto: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-foreground focus:border-neon-green focus:outline-none"
                  placeholder="6102 (Venda fora do estado)"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">CFOP Interno (Software / Serviços)</label>
                <input
                  type="text"
                  value={settings.automation.cfopInternoServico}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      automation: { ...settings.automation, cfopInternoServico: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-foreground focus:border-neon-green focus:outline-none"
                  placeholder="5933 (Prestação Serviço)"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">CFOP Interestadual (Software / Serviços)</label>
                <input
                  type="text"
                  value={settings.automation.cfopInterestadualServico}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      automation: { ...settings.automation, cfopInterestadualServico: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-foreground focus:border-neon-green focus:outline-none"
                  placeholder="6933"
                />
              </div>
            </div>
          </div>

          {/* Matriz das 27 UFs */}
          <div className="rounded-3xl border border-white/10 glass p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Matriz Tributária das 27 Unidades Federativas</h2>
                <p className="text-xs text-muted-foreground">
                  Alíquotas internas de ICMS, alíquotas interestaduais de saída (7% ou 12%) e Fundo de Combate à Pobreza (FCP) de cada estado brasileiro.
                </p>
              </div>

              {/* Filtro por Região */}
              <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1">
                {["todas", "Sudeste", "Sul", "Nordeste", "Centro-Oeste", "Norte"].map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setSelectedRegion(reg)}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold capitalize transition ${
                      selectedRegion === reg ? "bg-neon-green text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela de Estados */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pl-2">UF / Estado</th>
                    <th className="pb-3">Região</th>
                    <th className="pb-3 text-center">ICMS Interno (%)</th>
                    <th className="pb-3 text-center">ICMS Interestadual (%)</th>
                    <th className="pb-3 text-center">FCP Adicional (%)</th>
                    <th className="pb-3 text-center">DIFAL Ativo</th>
                    <th className="pb-3 pr-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStates.map((st) => {
                    const current = settings.stateRules[st.uf] || st;
                    const isOrigem = current.uf === settings.company.uf;

                    return (
                      <tr key={st.uf} className={`hover:bg-white/5 transition-colors ${isOrigem ? "bg-neon-purple/10" : ""}`}>
                        <td className="py-3.5 pl-2 font-bold text-foreground flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-[11px] font-black text-neon-cyan">
                            {current.uf}
                          </span>
                          <span>{current.nome}</span>
                          {isOrigem && (
                            <span className="rounded-md border border-neon-purple/40 bg-neon-purple/20 px-1.5 py-0.5 text-[10px] font-bold text-neon-purple">
                              UF Emitente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-muted-foreground">{current.regiao}</td>
                        <td className="py-3.5 text-center font-semibold text-foreground">
                          {current.aliquotaInterna}%
                        </td>
                        <td className="py-3.5 text-center font-semibold text-foreground">
                          {isOrigem ? "—" : `${current.aliquotaInterestadual}%`}
                        </td>
                        <td className="py-3.5 text-center font-semibold text-foreground">
                          {current.fcpAliquota > 0 ? (
                            <span className="text-neon-yellow">+{current.fcpAliquota}% FCP</span>
                          ) : (
                            <span className="text-muted-foreground">0%</span>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {current.difalAtivo ? (
                            <span className="inline-flex items-center gap-1 text-neon-green font-semibold text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Inativo</span>
                          )}
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            onClick={() => setEditingState(current)}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors"
                          >
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal / Card de Edição de Alíquota de Estado */}
          {editingState && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-up">
              <div className="w-full max-w-md rounded-3xl border border-white/15 bg-card p-6 shadow-2xl">
                <h3 className="font-display text-lg font-bold text-foreground">
                  Editar Alíquotas: {editingState.nome} ({editingState.uf})
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Altere as alíquotas aplicadas nas vendas destinadas a este estado.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Alíquota Interna de ICMS (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingState.aliquotaInterna}
                      onChange={(e) =>
                        setEditingState({
                          ...editingState,
                          aliquotaInterna: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Alíquota Interestadual de Origem (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingState.aliquotaInterestadual}
                      onChange={(e) =>
                        setEditingState({
                          ...editingState,
                          aliquotaInterestadual: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Fundo de Combate à Pobreza - FCP (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingState.fcpAliquota}
                      onChange={(e) =>
                        setEditingState({
                          ...editingState,
                          fcpAliquota: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="difalToggle"
                      checked={editingState.difalAtivo}
                      onChange={(e) =>
                        setEditingState({
                          ...editingState,
                          difalAtivo: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded accent-neon-green"
                    />
                    <label htmlFor="difalToggle" className="text-xs font-semibold text-foreground cursor-pointer">
                      Aplicar cálculo de DIFAL nas vendas interestaduais a consumidor final
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingState(null)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const updated = {
                        ...settings.stateRules,
                        [editingState.uf]: editingState,
                      };
                      setSettings({ ...settings, stateRules: updated });
                      setEditingState(null);
                      toast.success(`Alíquotas de ${editingState.uf} atualizadas!`);
                    }}
                    className="rounded-xl bg-neon-cyan px-4 py-2 text-xs font-bold text-background hover:opacity-90 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ABA 4: PROVEDORES & GATEWAYS FISCAIS */}
      {activeTab === "provedores" && (
        <section className="mt-6 space-y-6 animate-fade-up">
          {/* Automações Globais */}
          <div className="rounded-3xl border border-white/10 glass p-6">
            <h2 className="font-display text-lg font-bold text-foreground">Regras de Automação de Emissão</h2>
            <p className="text-xs text-muted-foreground">
              Comportamento automático do sistema ao receber confirmação de pagamento de produtos ou softwares.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer hover:border-neon-cyan/40 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.automation.autoEmitOnPaymentApproved}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      automation: { ...settings.automation, autoEmitOnPaymentApproved: e.target.checked },
                    })
                  }
                  className="mt-0.5 h-4 w-4 rounded accent-neon-cyan"
                />
                <div>
                  <span className="text-xs font-bold text-foreground">Emissão Instantânea</span>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Transmitir e emitir a nota fiscal ou cupom imediatamente após aprovação do PIX ou cartão.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer hover:border-neon-green/40 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.automation.autoSendWhatsAppDanfe}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      automation: { ...settings.automation, autoSendWhatsAppDanfe: e.target.checked },
                    })
                  }
                  className="mt-0.5 h-4 w-4 rounded accent-neon-green"
                />
                <div>
                  <span className="text-xs font-bold text-foreground">Enviar DANFE por WhatsApp</span>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Incluir link do PDF da nota fiscal na mensagem automática do kit de entrega no WhatsApp.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer hover:border-neon-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.automation.autoSendEmailDanfe}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      automation: { ...settings.automation, autoSendEmailDanfe: e.target.checked },
                    })
                  }
                  className="mt-0.5 h-4 w-4 rounded accent-neon-purple"
                />
                <div>
                  <span className="text-xs font-bold text-foreground">Envio de XML e DANFE por E-mail</span>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Disparar e-mail com anexo XML e DANFE para o cliente final.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Grid de Gateways Fiscais */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FISCAL_GATEWAYS.map((gw) => {
              const prov = settings.providers[gw.id] || {
                id: gw.id,
                name: gw.name,
                description: gw.description,
                enabled: false,
                primary: false,
                environment: "homologacao",
                credentials: {},
              };

              return (
                <div
                  key={gw.id}
                  className={`rounded-3xl border p-6 flex flex-col justify-between transition-all ${
                    prov.enabled
                      ? "border-neon-cyan/50 bg-neon-cyan/5 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                      : "border-white/10 glass opacity-80 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-bold text-foreground text-base">{gw.name}</h3>
                        {prov.primary && (
                          <span className="inline-block mt-0.5 text-[10px] font-extrabold text-neon-yellow uppercase tracking-wider">
                            ★ Provedor Principal
                          </span>
                        )}
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={prov.enabled}
                          onChange={(e) => {
                            const updated = {
                              ...settings.providers,
                              [gw.id]: {
                                ...prov,
                                enabled: e.target.checked,
                              },
                            };
                            setSettings({ ...settings, providers: updated });
                          }}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-white/10 peer-checked:bg-neon-cyan peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:bg-background"></div>
                      </label>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {gw.description}
                    </p>

                    {prov.enabled && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
                        {gw.fields.map((f) => (
                          <div key={f.key}>
                            <label className="text-[11px] font-semibold text-muted-foreground">{f.label}</label>
                            <input
                              type="text"
                              value={prov.credentials[f.key as keyof typeof prov.credentials] || ""}
                              onChange={(e) => {
                                const creds = {
                                  ...prov.credentials,
                                  [f.key]: e.target.value,
                                };
                                const updated = {
                                  ...settings.providers,
                                  [gw.id]: {
                                    ...prov,
                                    credentials: creds,
                                  },
                                };
                                setSettings({ ...settings, providers: updated });
                              }}
                              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-neon-cyan focus:outline-none font-mono"
                              placeholder={f.placeholder}
                            />
                          </div>
                        ))}

                        <div className="pt-2">
                          <label className="text-[11px] font-semibold text-muted-foreground">Ambiente de Operação</label>
                          <select
                            value={prov.environment}
                            onChange={(e) => {
                              const updated = {
                                ...settings.providers,
                                [gw.id]: {
                                  ...prov,
                                  environment: e.target.value as any,
                                },
                              };
                              setSettings({ ...settings, providers: updated });
                            }}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                          >
                            <option value="homologacao">Homologação / Testes</option>
                            <option value="producao">Produção SEFAZ Real</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {prov.enabled && !prov.primary && (
                    <button
                      onClick={() => {
                        const newProviders = { ...settings.providers };
                        Object.keys(newProviders).forEach((k) => {
                          newProviders[k] = { ...newProviders[k], primary: k === gw.id };
                        });
                        setSettings({ ...settings, providers: newProviders });
                        toast.success(`${gw.name} definido como provedor fiscal principal!`);
                      }}
                      className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-foreground hover:border-neon-yellow/50 hover:text-neon-yellow transition-colors"
                    >
                      Definir como Provedor Padrão
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ABA 5: SIMULADOR FISCAL & CALCULADORA DIFAL */}
      {activeTab === "simulador" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-2 animate-fade-up">
          {/* Formulário de Simulação */}
          <div className="rounded-3xl border border-neon-yellow/30 bg-neon-yellow/5 p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-yellow/20 text-neon-yellow">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Simulador de Emissão & Cálculo DIFAL</h2>
                <p className="text-xs text-muted-foreground">
                  Calcule instantaneamente os impostos para vendas no seu estado e interestaduais (EC 87/2015).
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Tipo de Produto da Venda</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimTipoDoc("software")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      simTipoDoc === "software"
                        ? "border-neon-green bg-neon-green/10 text-neon-green font-bold"
                        : "border-white/10 bg-white/5 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4" /> Software / SaaS / Licença
                    </div>
                    <span className="mt-1 block text-[11px] font-normal opacity-80">
                      NFS-e (ISS municipal)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimTipoDoc("produto")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      simTipoDoc === "produto"
                        ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan font-bold"
                        : "border-white/10 bg-white/5 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Mercadoria / Físico
                    </div>
                    <span className="mt-1 block text-[11px] font-normal opacity-80">
                      NF-e / NFC-e (ICMS + DIFAL)
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Valor Bruto da Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={simValor}
                  onChange={(e) => setSimValor(parseFloat(e.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-foreground focus:border-neon-yellow focus:outline-none"
                  placeholder="199.90"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">UF de Origem (Sua Empresa)</label>
                  <div className="mt-1.5 flex h-10 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-neon-purple">
                    {settings.company.uf} — {settings.company.cidade}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">UF de Destino do Comprador</label>
                  <select
                    value={simUfDestino}
                    onChange={(e) => setSimUfDestino(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-foreground focus:border-neon-yellow focus:outline-none"
                  >
                    {BRAZILIAN_STATES.map((s) => (
                      <option key={s.uf} value={s.uf}>
                        {s.uf} — {s.nome} ({s.regiao})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Resultado do Cálculo */}
          <div className="rounded-3xl border border-white/10 glass p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neon-yellow">
                    Demonstrativo Fiscal Simulado
                  </span>
                  <h3 className="mt-1 font-display text-xl font-black text-foreground">
                    {simTipoDoc === "software" ? "NFS-e de Software / Licença" : "NF-e / Cupom Fiscal Interestadual"}
                  </h3>
                </div>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono font-bold text-foreground">
                  {settings.company.uf} ➔ {simUfDestino}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Valor do Produto / Licença:</span>
                  <span className="font-bold text-foreground">{formatBRL(simValor)}</span>
                </div>

                {simTipoDoc === "software" ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Código de Serviço:</span>
                      <span className="font-mono text-foreground">{settings.documents.nfse.itemListaServico || "1.05"} (Software)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Alíquota ISS do Município ({settings.company.cidade}):</span>
                      <span className="font-bold text-neon-green">{settings.documents.nfse.aliquotaIss}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Valor Estimado do ISS:</span>
                      <span className="font-bold text-neon-green">
                        {formatBRL((simValor * (settings.documents.nfse.aliquotaIss || 2.0)) / 100)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Operação:</span>
                      <span className="font-semibold text-foreground">
                        {simResultado.isInterestadual ? "Venda Interestadual (Consumidor Final)" : "Venda Interna (Mesmo Estado)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Alíquota Interestadual de Saída:</span>
                      <span className="font-bold text-neon-cyan">{simResultado.aliquotaInterestadual}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Alíquota Interna no Destino ({simUfDestino}):</span>
                      <span className="font-bold text-foreground">{simResultado.aliquotaInterna}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Diferencial de Alíquota (DIFAL):</span>
                      <span className="font-bold text-neon-purple">{simResultado.aliquotaDifal}% ({formatBRL(simResultado.valorDifal)})</span>
                    </div>
                    {simResultado.fcpAliquota > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Fundo Combate à Pobreza (FCP {simUfDestino}):</span>
                        <span className="font-bold text-neon-yellow">{simResultado.fcpAliquota}% ({formatBRL(simResultado.valorFcp)})</span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-foreground">Total Líquido da Operação:</span>
                  <span className="font-display text-xl font-black text-neon-green">{formatBRL(simValor)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3.5 flex items-center gap-3 text-xs text-muted-foreground">
              <Info className="h-5 w-5 text-neon-cyan shrink-0" />
              <span>
                Simulação calculada com base na Emenda Constitucional 87/2015 e Lei Complementar 116/03.
              </span>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
