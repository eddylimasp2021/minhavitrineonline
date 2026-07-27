import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "nf_session_id";

function sid(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export type EventType =
  | "page_view"
  | "product_view"
  | "product_click"
  | "favorite_add"
  | "whatsapp_click"
  | "share_click"
  | "checkout_start"
  | "conversion"
  | "search"
  | "filter"
  | "load_more"
  | "scroll_depth";

export async function track(
  event_type: EventType,
  opts: { product_id?: string; path?: string; metadata?: Record<string, unknown> } = {},
) {
  if (typeof window === "undefined") return;
  try {
    await supabase.from("analytics_events").insert({
      event_type,
      product_id: opts.product_id ?? null,
      path: opts.path ?? window.location.pathname,
      session_id: sid(),
      metadata: (opts.metadata ?? null) as never,
    });
  } catch {
    /* silent */
  }
}

export function usePageView(path?: string) {
  useEffect(() => {
    track("page_view", { path });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
}
