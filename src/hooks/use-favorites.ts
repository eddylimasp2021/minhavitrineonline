import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { track } from "./use-track";
import { enqueue, peek, remove, type FavIntent } from "@/lib/favorites-queue";

type FavRow = { product_id: string };

function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = (err as { message?: string })?.message?.toLowerCase() ?? "";
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed")
  );
}

async function applyIntent(userId: string, intent: FavIntent): Promise<void> {
  if (intent.op === "remove") {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", intent.product_id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, product_id: intent.product_id });
    // 23505 unique_violation = already exists; treat as success.
    if (error && (error as { code?: string }).code !== "23505") throw error;
  }
}

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["favorites", user?.id] as const;

  const q = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id, products(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const ids = new Set((q.data ?? []).map((r) => r.product_id));

  const mutation = useMutation({
    mutationFn: async (product_id: string) => {
      if (!user) throw new Error("not_authed");
      const isFav = ids.has(product_id);
      const op = isFav ? "remove" : "add";
      try {
        await applyIntent(user.id, { product_id, op, ts: Date.now() });
        track(op === "add" ? "favorite_add" : "favorite_remove", {
          product_id,
          metadata: { source: "remote" },
        });
      } catch (err) {
        if (isNetworkError(err)) {
          // Persist intent — will flush on 'online' / mount.
          enqueue({ product_id, op });
          track(op === "add" ? "favorite_add" : "favorite_remove", {
            product_id,
            metadata: { source: "queued" },
          });
          return; // treat as success for optimistic UI
        }
        throw err;
      }
    },
    onMutate: async (product_id: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<FavRow[]>(key) ?? [];
      const exists = prev.some((r) => r.product_id === product_id);
      const next = exists
        ? prev.filter((r) => r.product_id !== product_id)
        : [{ product_id, products: null } as unknown as FavRow, ...prev];
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  // Background sync of the offline queue.
  const flushing = useRef(false);
  const flush = useCallback(async () => {
    if (!user || flushing.current) return;
    const items = peek();
    if (items.length === 0) return;
    flushing.current = true;
    const done: string[] = [];
    try {
      for (const it of items) {
        try {
          await applyIntent(user.id, it);
          done.push(it.product_id);
          track(it.op === "add" ? "favorite_add" : "favorite_remove", {
            product_id: it.product_id,
            metadata: { source: "sync" },
          });
        } catch (err) {
          if (isNetworkError(err)) break; // stop, retry later
          done.push(it.product_id); // permanent error — drop
        }
      }
    } finally {
      if (done.length) {
        remove(done);
        qc.invalidateQueries({ queryKey: key });
      }
      flushing.current = false;
    }
  }, [user, qc, key]);

  useEffect(() => {
    if (!user) return;
    void flush();
    // Background Sync API — best-effort trigger.
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      "SyncManager" in window
    ) {
      navigator.serviceWorker.ready
        .then((reg) =>
          (reg as ServiceWorkerRegistration & { sync?: { register: (t: string) => Promise<void> } })
            .sync?.register("favorites-sync")
            .catch(() => undefined),
        )
        .catch(() => undefined);
    }
    const onOnline = () => void flush();
    const onFocus = () => void flush();
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, flush]);

  const has = useCallback((id: string) => ids.has(id), [q.data]);
  const toggle = useCallback((id: string) => mutation.mutate(id), [mutation]);

  return { favorites: q.data ?? [], ids, isLoading: q.isLoading, has, toggle, isAuthed: !!user };
}
