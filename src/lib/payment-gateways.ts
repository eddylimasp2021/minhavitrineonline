import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentProviderConfig = {
  enabled: boolean;
  primary?: boolean;
  values: Record<string, string>;
};

export type StorePaymentGateways = Record<string, PaymentProviderConfig>;

export const DEFAULT_PAYMENT_CONFIG: StorePaymentGateways = {
  stripe: { enabled: false, values: {} },
  mercadopago: { enabled: false, values: {} },
  pagbank: { enabled: false, values: {} },
  asaas: { enabled: false, values: {} },
  paypal: { enabled: false, values: {} },
  pix: {
    enabled: true,
    values: {
      publicKey: "11965244479",
      checkoutUrl: "Minha Vitrine Online",
    },
  },
};

const STORAGE_KEY = "nf_payment_providers";
export const CONFIG_PRODUCT_SLUG = "__store_payment_gateways__";

/**
 * Le as configuracoes de gateways salvas (tenta primeiro Supabase, com fallback para localStorage).
 */
export async function fetchStorePaymentGateways(): Promise<StorePaymentGateways> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("system_requirements")
      .eq("slug", CONFIG_PRODUCT_SLUG)
      .maybeSingle();

    if (!error && data?.system_requirements) {
      const parsed = JSON.parse(data.system_requirements) as StorePaymentGateways;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return { ...DEFAULT_PAYMENT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn("Falha ao buscar configuracoes remotas de pagamento:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_PAYMENT_CONFIG, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
  }

  return DEFAULT_PAYMENT_CONFIG;
}

/**
 * Salva as configuracoes de gateways tanto no Supabase quanto no LocalStorage.
 */
export async function saveStorePaymentGateways(config: StorePaymentGateways, ownerId?: string): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  try {
    const json = JSON.stringify(config);
    const { data: user } = await supabase.auth.getUser();
    const effectiveOwnerId = ownerId || user.user?.id;

    if (effectiveOwnerId) {
      await supabase.from("products").upsert(
        {
          owner_id: effectiveOwnerId,
          slug: CONFIG_PRODUCT_SLUG,
          title: "[SISTEMA] Configuracoes de Pagamentos e Gateways",
          description: "Configuracoes gerais de gateways de pagamento e checkout.",
          price: 0,
          category: "[CONFIG]",
          published: true,
          system_requirements: json,
        },
        { onConflict: "slug" }
      );
    }
  } catch (err) {
    console.warn("Aviso ao persistir configuracoes de pagamento no Supabase:", err);
  }
}

/**
 * Hook para obter os gateways de pagamento ativos no cliente.
 */
export function useStorePaymentGateways() {
  const [config, setConfig] = useState<StorePaymentGateways>(DEFAULT_PAYMENT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchStorePaymentGateways().then((data) => {
      if (mounted) {
        setConfig(data);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { config, isLoading };
}
