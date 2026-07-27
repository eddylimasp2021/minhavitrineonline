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
  | "favorite_remove"
  | "whatsapp_click"
  | "share_click"
  | "checkout_start"
  | "conversion"
  | "search"
  | "filter"
  | "load_more"
  | "scroll_depth";

// Client-side throttle: bloqueia flood do próprio device antes de bater no backend.
// Limites por sessão dentro de uma janela deslizante de 60s:
//   - hard cap global: 90 eventos/min (abaixo do teto server-side de 120)
//   - cap por tipo:    30 eventos/min por event_type
//   - dedupe:          ignora eventos idênticos (tipo+product_id+path) em <800ms
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 90;
const MAX_PER_TYPE = 30;
const DEDUPE_MS = 800;

type Stamp = { t: number; type: EventType; key: string };
const recent: Stamp[] = [];

export function _resetTrackThrottleForTests() {
  recent.length = 0;
}

function shouldSend(event_type: EventType, key: string, now: number): boolean {
  // Drop entries fora da janela.
  while (recent.length && now - recent[0].t > WINDOW_MS) recent.shift();
  if (recent.length >= MAX_PER_WINDOW) return false;
  let sameType = 0;
  for (const s of recent) {
    if (s.type === event_type) {
      sameType += 1;
      if (sameType >= MAX_PER_TYPE) return false;
    }
    if (s.key === key && now - s.t < DEDUPE_MS) return false;
  }
  recent.push({ t: now, type: event_type, key });
  return true;
}

export async function track(
  event_type: EventType,
  opts: { product_id?: string; path?: string; metadata?: Record<string, unknown> } = {},
) {
  if (typeof window === "undefined") return;
  const path = opts.path ?? window.location.pathname;
  const key = `${event_type}|${opts.product_id ?? ""}|${path}`;
  if (!shouldSend(event_type, key, Date.now())) return;
  try {
    await supabase.from("analytics_events").insert({
      event_type,
      product_id: opts.product_id ?? null,
      path,
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
