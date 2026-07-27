/**
 * Offline-safe queue for favorite toggles.
 * When the network is unreachable or a mutation fails, the intent is
 * persisted to localStorage and later flushed (on 'online' or on mount).
 *
 * The queue collapses opposite operations for the same product so a
 * quick add+remove while offline nets to no-op.
 */

export type FavOp = "add" | "remove";
export type FavIntent = { product_id: string; op: FavOp; ts: number };

const KEY = "nf_fav_queue_v1";

function safeRead(): FavIntent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is FavIntent =>
        !!x &&
        typeof x.product_id === "string" &&
        (x.op === "add" || x.op === "remove") &&
        typeof x.ts === "number",
    );
  } catch {
    return [];
  }
}

function safeWrite(items: FavIntent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota / privacy — ignore */
  }
}

/** Reduce the queue: last op wins per product; opposite ops cancel. */
export function collapse(items: FavIntent[]): FavIntent[] {
  const last = new Map<string, FavIntent>();
  for (const it of items) last.set(it.product_id, it);
  return [...last.values()];
}

export function enqueue(intent: Omit<FavIntent, "ts">): FavIntent[] {
  const items = safeRead();
  items.push({ ...intent, ts: Date.now() });
  const collapsed = collapse(items);
  safeWrite(collapsed);
  return collapsed;
}

export function peek(): FavIntent[] {
  return safeRead();
}

export function clearAll(): void {
  safeWrite([]);
}

export function remove(product_ids: string[]): void {
  const set = new Set(product_ids);
  safeWrite(safeRead().filter((i) => !set.has(i.product_id)));
}
