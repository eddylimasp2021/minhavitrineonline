// src/lib/shipping.ts
// Módulo de cálculo de frete e consulta de CEP para produtos físicos

export interface CepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export interface ShippingOption {
  id: "pac" | "sedex" | "transportadora" | "retirada";
  name: string;
  carrier: string;
  price: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  description: string;
  badge?: string;
}

export interface CustomerShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Formata CEP para 00000-000 */
export function formatCep(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Consulta dados de endereço via CEP com fallback resiliente */
export async function lookupCep(rawCep: string): Promise<CepAddress | null> {
  const digits = rawCep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  // 1ª tentativa: ViaCEP
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data.erro && data.uf) {
        return {
          cep: formatCep(digits),
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          localidade: data.localidade || "",
          uf: (data.uf || "").toUpperCase(),
        };
      }
    }
  } catch (err) {
    console.warn("ViaCEP indisponível, tentando BrasilAPI...", err);
  }

  // 2ª tentativa: BrasilAPI (fallback)
  try {
    const res2 = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.state) {
        return {
          cep: formatCep(digits),
          logradouro: data2.street || "",
          bairro: data2.neighborhood || "",
          localidade: data2.city || "",
          uf: (data2.state || "").toUpperCase(),
        };
      }
    }
  } catch (err2) {
    console.warn("Erro ao consultar BrasilAPI:", err2);
  }

  return null;
}

/**
 * Calcula opções de frete (Correios PAC, SEDEX, Transportadora) baseando-se
 * na UF de destino com tabelas de referência realistas.
 */
export function calculateShippingOptions(
  uf: string,
  subtotal: number = 0
): ShippingOption[] {
  const state = (uf || "SP").toUpperCase().trim();

  // Multiplicadores e prazos base por macrorregião (Origem estimada: SP/Sudeste)
  let basePac = 21.9;
  let baseSedex = 37.5;
  let baseTransportadora = 25.9;
  let daysPacMin = 4;
  let daysPacMax = 7;
  let daysSedexMin = 1;
  let daysSedexMax = 2;
  let daysTranspMin = 3;
  let daysTranspMax = 5;

  if (state === "SP") {
    basePac = 17.5;
    baseSedex = 24.9;
    baseTransportadora = 19.9;
    daysPacMin = 2;
    daysPacMax = 4;
    daysSedexMin = 1;
    daysSedexMax = 2;
    daysTranspMin = 1;
    daysTranspMax = 3;
  } else if (["RJ", "MG", "ES"].includes(state)) {
    basePac = 22.9;
    baseSedex = 38.9;
    baseTransportadora = 26.5;
    daysPacMin = 4;
    daysPacMax = 6;
    daysSedexMin = 2;
    daysSedexMax = 3;
    daysTranspMin = 3;
    daysTranspMax = 5;
  } else if (["PR", "SC", "RS"].includes(state)) {
    basePac = 24.9;
    baseSedex = 44.5;
    baseTransportadora = 29.9;
    daysPacMin = 5;
    daysPacMax = 8;
    daysSedexMin = 2;
    daysSedexMax = 4;
    daysTranspMin = 4;
    daysTranspMax = 6;
  } else if (["DF", "GO", "MS", "MT"].includes(state)) {
    basePac = 28.5;
    baseSedex = 52.0;
    baseTransportadora = 34.0;
    daysPacMin = 6;
    daysPacMax = 10;
    daysSedexMin = 3;
    daysSedexMax = 5;
    daysTranspMin = 5;
    daysTranspMax = 7;
  } else if (["BA", "PE", "CE", "MA", "PB", "RN", "AL", "SE", "PI"].includes(state)) {
    basePac = 34.9;
    baseSedex = 64.9;
    baseTransportadora = 39.9;
    daysPacMin = 7;
    daysPacMax = 12;
    daysSedexMin = 3;
    daysSedexMax = 6;
    daysTranspMin = 5;
    daysTranspMax = 9;
  } else {
    // Norte (AM, PA, RO, AC, RR, AP, TO)
    basePac = 46.9;
    baseSedex = 89.0;
    baseTransportadora = 54.0;
    daysPacMin = 9;
    daysPacMax = 16;
    daysSedexMin = 4;
    daysSedexMax = 7;
    daysTranspMin = 7;
    daysTranspMax = 12;
  }

  // Frete grátis para compras acima de R$ 350 no PAC
  const isFreePac = subtotal >= 350;

  return [
    {
      id: "pac",
      name: "Correios PAC",
      carrier: "Correios",
      price: isFreePac ? 0 : basePac,
      deliveryDaysMin: daysPacMin,
      deliveryDaysMax: daysPacMax,
      description: "Econômico com código de rastreamento oficial dos Correios",
      badge: isFreePac ? "FRETE GRÁTIS" : "Mais Econômico",
    },
    {
      id: "sedex",
      name: "Correios SEDEX",
      carrier: "Correios",
      price: baseSedex,
      deliveryDaysMin: daysSedexMin,
      deliveryDaysMax: daysSedexMax,
      description: "Entrega expressa prioritária em domicílio",
      badge: "Mais Rápido ⚡",
    },
    {
      id: "transportadora",
      name: "Transportadora Expressa",
      carrier: "Jadlog / Loggi",
      price: baseTransportadora,
      deliveryDaysMin: daysTranspMin,
      deliveryDaysMax: daysTranspMax,
      description: "Coleta e entrega segura via malha privada com seguro",
      badge: "Recomendado",
    },
    {
      id: "retirada",
      name: "Retirada na Loja / Balcão",
      carrier: "Retirada Local",
      price: 0,
      deliveryDaysMin: 0,
      deliveryDaysMax: 1,
      description: "Retire sem custo no ponto de distribuição",
      badge: "Grátis",
    },
  ];
}
