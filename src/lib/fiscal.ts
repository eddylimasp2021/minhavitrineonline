export type TaxRegime = "simples_nacional" | "mei" | "simples_excesso" | "lucro_presumido" | "lucro_real";

export type FiscalDocumentType = "nfe" | "nfce" | "nfse" | "sat";

export type FiscalEnvironment = "homologacao" | "producao";

export interface CompanyFiscalData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  cnaePrincipal: string;
  regimeTributario: TaxRegime;
  crt: string; // 1 = Simples, 2 = Simples excesso, 3 = Normal, 4 = MEI
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  codigoIbge: string;
  uf: string;
  emailFiscal: string;
  telefoneFiscal: string;
}

export interface StateTaxRule {
  uf: string;
  nome: string;
  regiao: "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";
  aliquotaInterna: number; // Alíquota interna de ICMS do estado (%)
  aliquotaInterestadual: number; // Alíquota interestadual saindo da UF de origem (normalmente 7% ou 12%)
  fcpAliquota: number; // Fundo de Combate à Pobreza (%)
  difalAtivo: boolean;
  observacoes?: string;
}

export interface DocumentSeriesConfig {
  serie: number;
  proximoNumero: number;
  ambiente: FiscalEnvironment;
  naturezaOperacao: string;
  ativo: boolean;
  // Específico para NFC-e
  cscId?: string;
  cscToken?: string;
  // Específico para NFS-e (Software)
  itemListaServico?: string; // Ex: 1.05 ou 1.07
  codigoTributacaoMunicipio?: string;
  aliquotaIss?: number;
  retencaoIss?: boolean;
}

export interface FiscalProviderConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  primary: boolean;
  environment: FiscalEnvironment;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    companyId?: string;
    clientId?: string;
    clientSecret?: string;
    certificatePassword?: string;
    certificateFileName?: string;
  };
}

export interface FiscalAutomationSettings {
  autoEmitOnPaymentApproved: boolean;
  autoSendEmailDanfe: boolean;
  autoSendWhatsAppDanfe: boolean;
  enableContingency: boolean;
  defaultDocumentForSoftware: "nfse" | "nfe";
  defaultDocumentForPhysical: "nfe" | "nfce";
  cfopInternoProduto: string;
  cfopInterestadualProduto: string;
  cfopInternoServico: string;
  cfopInterestadualServico: string;
}

export interface FullFiscalSettings {
  company: CompanyFiscalData;
  documents: Record<FiscalDocumentType, DocumentSeriesConfig>;
  providers: Record<string, FiscalProviderConfig>;
  stateRules: Record<string, StateTaxRule>;
  automation: FiscalAutomationSettings;
}

export const BRAZILIAN_STATES: StateTaxRule[] = [
  { uf: "AC", nome: "Acre", regiao: "Norte", aliquotaInterna: 19, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "AL", nome: "Alagoas", regiao: "Nordeste", aliquotaInterna: 19, aliquotaInterestadual: 7, fcpAliquota: 1, difalAtivo: true },
  { uf: "AP", nome: "Amapá", regiao: "Norte", aliquotaInterna: 18, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "AM", nome: "Amazonas", regiao: "Norte", aliquotaInterna: 20, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "BA", nome: "Bahia", regiao: "Nordeste", aliquotaInterna: 20.5, aliquotaInterestadual: 7, fcpAliquota: 2, difalAtivo: true },
  { uf: "CE", nome: "Ceará", regiao: "Nordeste", aliquotaInterna: 20, aliquotaInterestadual: 7, fcpAliquota: 2, difalAtivo: true },
  { uf: "DF", nome: "Distrito Federal", regiao: "Centro-Oeste", aliquotaInterna: 20, aliquotaInterestadual: 7, fcpAliquota: 2, difalAtivo: true },
  { uf: "ES", nome: "Espírito Santo", regiao: "Sudeste", aliquotaInterna: 17, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "GO", nome: "Goiás", regiao: "Centro-Oeste", aliquotaInterna: 19, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "MA", nome: "Maranhão", regiao: "Nordeste", aliquotaInterna: 22, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "MT", nome: "Mato Grosso", regiao: "Centro-Oeste", aliquotaInterna: 17, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "MS", nome: "Mato Grosso do Sul", regiao: "Centro-Oeste", aliquotaInterna: 17, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "MG", nome: "Minas Gerais", regiao: "Sudeste", aliquotaInterna: 18, aliquotaInterestadual: 12, fcpAliquota: 2, difalAtivo: true },
  { uf: "PA", nome: "Pará", regiao: "Norte", aliquotaInterna: 19, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "PB", nome: "Paraíba", regiao: "Nordeste", aliquotaInterna: 20, aliquotaInterestadual: 7, fcpAliquota: 2, difalAtivo: true },
  { uf: "PR", nome: "Paraná", regiao: "Sul", aliquotaInterna: 19.5, aliquotaInterestadual: 12, fcpAliquota: 0, difalAtivo: true },
  { uf: "PE", nome: "Pernambuco", regiao: "Nordeste", aliquotaInterna: 20.5, aliquotaInterestadual: 7, fcpAliquota: 2, difalAtivo: true },
  { uf: "PI", nome: "Piauí", regiao: "Nordeste", aliquotaInterna: 21, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "RJ", nome: "Rio de Janeiro", regiao: "Sudeste", aliquotaInterna: 20, aliquotaInterestadual: 12, fcpAliquota: 2, difalAtivo: true },
  { uf: "RN", nome: "Rio Grande do Norte", regiao: "Nordeste", aliquotaInterna: 18, aliquotaInterestadual: 7, fcpAliquota: 2, difalAtivo: true },
  { uf: "RS", nome: "Rio Grande do Sul", regiao: "Sul", aliquotaInterna: 17, aliquotaInterestadual: 12, fcpAliquota: 0, difalAtivo: true },
  { uf: "RO", nome: "Rondônia", regiao: "Norte", aliquotaInterna: 19.5, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "RR", nome: "Roraima", regiao: "Norte", aliquotaInterna: 20, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
  { uf: "SC", nome: "Santa Catarina", regiao: "Sul", aliquotaInterna: 17, aliquotaInterestadual: 12, fcpAliquota: 0, difalAtivo: true },
  { uf: "SP", nome: "São Paulo", regiao: "Sudeste", aliquotaInterna: 18, aliquotaInterestadual: 12, fcpAliquota: 0, difalAtivo: true },
  { uf: "SE", nome: "Sergipe", regiao: "Nordeste", aliquotaInterna: 19, aliquotaInterestadual: 7, fcpAliquota: 1, difalAtivo: true },
  { uf: "TO", nome: "Tocantins", regiao: "Norte", aliquotaInterna: 20, aliquotaInterestadual: 7, fcpAliquota: 0, difalAtivo: true },
];

export const SOFTWARE_SERVICE_CODES = [
  { code: "1.05", name: "Licenciamento ou cessão de direito de uso de programas de computação" },
  { code: "1.07", name: "Suporte técnico, manutenção e outros serviços em tecnologia da informação" },
  { code: "1.03", name: "Processamento, armazenamento ou hospedagem de dados, textos, imagens e aplicativos" },
  { code: "1.01", name: "Análise e desenvolvimento de sistemas" },
];

export const FISCAL_GATEWAYS = [
  {
    id: "focus_nfe",
    name: "Focus NFe",
    description: "API moderna para emissão de NF-e, NFC-e e NFS-e para mais de 1.500 municípios.",
    fields: [
      { key: "apiKey", label: "Token de Acesso (API Key)", placeholder: "live_xxxxxxxxxxxxxx" },
      { key: "companyId", label: "CNPJ da Empresa Emitente", placeholder: "00.000.000/0001-00" },
    ],
  },
  {
    id: "plugnotas",
    name: "PlugNotas (TecnoSpeed)",
    description: "Plataforma de alta escalabilidade para emissão de documentos fiscais e cupons.",
    fields: [
      { key: "apiKey", label: "API Key (x-api-key)", placeholder: "29384729384729384" },
      { key: "companyId", label: "CNPJ da Conta PlugNotas", placeholder: "00.000.000/0001-00" },
    ],
  },
  {
    id: "enotas",
    name: "eNotas Gateway",
    description: "Especialista em automação de notas fiscais para SaaS, Infoprodutos e E-commerce.",
    fields: [
      { key: "apiKey", label: "API Key eNotas", placeholder: "enotas_live_xxxxxx" },
      { key: "companyId", label: "Empresa ID (UUID)", placeholder: "8f5a2b1c-3d4e-..." },
    ],
  },
  {
    id: "nuvem_fiscal",
    name: "Nuvem Fiscal",
    description: "Infraestrutura em nuvem direta com a SEFAZ para NF-e, NFC-e e NFS-e nacional.",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "client_id_xxxxxx" },
      { key: "clientSecret", label: "Client Secret", placeholder: "secret_xxxxxxxxxx" },
    ],
  },
  {
    id: "webmania",
    name: "Webmania BR",
    description: "Emissão de notas fiscais e cálculo automático de impostos em tempo real.",
    fields: [
      { key: "apiKey", label: "Consumer Key", placeholder: "key_xxxxxx" },
      { key: "apiSecret", label: "Consumer Secret", placeholder: "secret_xxxxxx" },
    ],
  },
  {
    id: "sefaz_direta",
    name: "SEFAZ Direta / Certificado A1",
    description: "Comunicação direta com os servidores SEFAZ do seu estado via Certificado Digital A1.",
    fields: [
      { key: "certificateFileName", label: "Nome do Arquivo Certificado A1 (.pfx)", placeholder: "certificado_2026.pfx" },
      { key: "certificatePassword", label: "Senha do Certificado Digital A1", placeholder: "••••••••" },
    ],
  },
];

export const DEFAULT_FISCAL_SETTINGS: FullFiscalSettings = {
  company: {
    cnpj: "42.123.456/0001-99",
    razaoSocial: "Eddy Lima Informática & Tecnologia LTDA",
    nomeFantasia: "Minha Vitrine Online",
    inscricaoEstadual: "123.456.789.110",
    inscricaoMunicipal: "9876543-2",
    cnaePrincipal: "62.01-5-01 - Desenvolvimento de programas de computador sob encomenda",
    regimeTributario: "simples_nacional",
    crt: "1",
    logradouro: "Avenida Paulista",
    numero: "1000",
    complemento: "Sala 501",
    bairro: "Bela Vista",
    cep: "01310-100",
    cidade: "São Paulo",
    codigoIbge: "3550308",
    uf: "SP",
    emailFiscal: "fiscal@minhavitrineonline.com.br",
    telefoneFiscal: "(11) 99999-8888",
  },
  documents: {
    nfe: {
      serie: 1,
      proximoNumero: 101,
      ambiente: "homologacao",
      naturezaOperacao: "Venda de Mercadorias e Produtos Digitais",
      ativo: true,
    },
    nfce: {
      serie: 1,
      proximoNumero: 250,
      ambiente: "homologacao",
      naturezaOperacao: "Venda ao Consumidor Final",
      ativo: true,
      cscId: "000001",
      cscToken: "A1B2C3D4E5F6G7H8I9J0",
    },
    nfse: {
      serie: 1,
      proximoNumero: 84,
      ambiente: "homologacao",
      naturezaOperacao: "Prestação de Serviços de Software / Licença",
      ativo: true,
      itemListaServico: "1.05",
      codigoTributacaoMunicipio: "6201501",
      aliquotaIss: 2.0,
      retencaoIss: false,
    },
    sat: {
      serie: 1,
      proximoNumero: 1,
      ambiente: "homologacao",
      naturezaOperacao: "Cupom Fiscal Eletrônico SAT",
      ativo: false,
    },
  },
  providers: {
    focus_nfe: {
      id: "focus_nfe",
      name: "Focus NFe",
      description: "API moderna para emissão de NF-e, NFC-e e NFS-e.",
      enabled: true,
      primary: true,
      environment: "homologacao",
      credentials: {
        apiKey: "test_tok_focus_928374928173491823",
        companyId: "42.123.456/0001-99",
      },
    },
    plugnotas: {
      id: "plugnotas",
      name: "PlugNotas (TecnoSpeed)",
      description: "Plataforma de alta escalabilidade para emissão.",
      enabled: false,
      primary: false,
      environment: "homologacao",
      credentials: {},
    },
    enotas: {
      id: "enotas",
      name: "eNotas Gateway",
      description: "Automação para SaaS e infoprodutos.",
      enabled: false,
      primary: false,
      environment: "homologacao",
      credentials: {},
    },
    nuvem_fiscal: {
      id: "nuvem_fiscal",
      name: "Nuvem Fiscal",
      description: "Nuvem direta com SEFAZ nacional.",
      enabled: false,
      primary: false,
      environment: "homologacao",
      credentials: {},
    },
    webmania: {
      id: "webmania",
      name: "Webmania BR",
      description: "Emissão e cálculo automático.",
      enabled: false,
      primary: false,
      environment: "homologacao",
      credentials: {},
    },
    sefaz_direta: {
      id: "sefaz_direta",
      name: "SEFAZ Direta / Certificado A1",
      description: "Comunicação direta via Certificado Digital A1.",
      enabled: false,
      primary: false,
      environment: "homologacao",
      credentials: {},
    },
  },
  stateRules: BRAZILIAN_STATES.reduce((acc, state) => {
    acc[state.uf] = state;
    return acc;
  }, {} as Record<string, StateTaxRule>),
  automation: {
    autoEmitOnPaymentApproved: true,
    autoSendEmailDanfe: true,
    autoSendWhatsAppDanfe: true,
    enableContingency: true,
    defaultDocumentForSoftware: "nfse",
    defaultDocumentForPhysical: "nfe",
    cfopInternoProduto: "5102",
    cfopInterestadualProduto: "6102",
    cfopInternoServico: "5933",
    cfopInterestadualServico: "6933",
  },
};

const STORAGE_KEY = "mv_fiscal_settings_v1";

export function loadFiscalSettings(): FullFiscalSettings {
  if (typeof window === "undefined") return DEFAULT_FISCAL_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FISCAL_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FISCAL_SETTINGS,
      ...parsed,
      company: { ...DEFAULT_FISCAL_SETTINGS.company, ...(parsed.company || {}) },
      documents: { ...DEFAULT_FISCAL_SETTINGS.documents, ...(parsed.documents || {}) },
      providers: { ...DEFAULT_FISCAL_SETTINGS.providers, ...(parsed.providers || {}) },
      stateRules: { ...DEFAULT_FISCAL_SETTINGS.stateRules, ...(parsed.stateRules || {}) },
      automation: { ...DEFAULT_FISCAL_SETTINGS.automation, ...(parsed.automation || {}) },
    };
  } catch {
    return DEFAULT_FISCAL_SETTINGS;
  }
}

export function saveFiscalSettings(settings: FullFiscalSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Erro ao salvar configurações fiscais:", err);
  }
}

/**
 * Realiza o cálculo simulado de DIFAL e impostos para uma venda interestadual
 */
export function calculateDifalTax({
  valorTotal,
  ufOrigem,
  ufDestino,
  stateRules,
}: {
  valorTotal: number;
  ufOrigem: string;
  ufDestino: string;
  stateRules: Record<string, StateTaxRule>;
}) {
  const isInterestadual = ufOrigem.toUpperCase() !== ufDestino.toUpperCase();
  const ruleDestino = stateRules[ufDestino.toUpperCase()] || {
    aliquotaInterna: 18,
    aliquotaInterestadual: 12,
    fcpAliquota: 0,
  };

  if (!isInterestadual) {
    const icmsInterno = (valorTotal * ruleDestino.aliquotaInterna) / 100;
    return {
      isInterestadual: false,
      aliquotaInterna: ruleDestino.aliquotaInterna,
      aliquotaInterestadual: ruleDestino.aliquotaInterna,
      aliquotaDifal: 0,
      valorIcms: icmsInterno,
      valorDifal: 0,
      fcpAliquota: 0,
      valorFcp: 0,
      valorTotalComImpostos: valorTotal,
    };
  }

  // Interestadual: Alíquota Interestadual (7% ou 12%)
  const aliqInterestadual = ruleDestino.aliquotaInterestadual;
  const aliqInternaDestino = ruleDestino.aliquotaInterna;
  const difalPercent = Math.max(0, aliqInternaDestino - aliqInterestadual);

  const valorIcmsInterestadual = (valorTotal * aliqInterestadual) / 100;
  const valorDifal = (valorTotal * difalPercent) / 100;
  const valorFcp = (valorTotal * ruleDestino.fcpAliquota) / 100;

  return {
    isInterestadual: true,
    aliquotaInterna: aliqInternaDestino,
    aliquotaInterestadual: aliqInterestadual,
    aliquotaDifal: difalPercent,
    valorIcms: valorIcmsInterestadual,
    valorDifal,
    fcpAliquota: ruleDestino.fcpAliquota,
    valorFcp,
    valorTotalComImpostos: valorTotal,
  };
}
