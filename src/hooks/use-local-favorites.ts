import { useCallback, useEffect, useState } from "react";
import { track } from "./use-track";

const KEY = "nf_local_favorites";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { return new Set(); }
}

export function useLocalFavorites() {
  const [ids, setIds] = useState<Set<string>>(() => read());

  useEffect(() => {
    function onStorage(e: StorageEvent) { if (e.key === KEY) setIds(read()); }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = (next: Set<string>) => {
    localStorage.setItem(KEY, JSON.stringify([...next]));
    setIds(new Set(next));
  };

  const toggle = useCallback((id: string) => {
    const next = new Set(read());
    const wasFav = next.has(id);
    if (wasFav) next.delete(id); else next.add(id);
    persist(next);
    track(wasFav ? "favorite_remove" : "favorite_add", { product_id: id, metadata: { source: "local" } });
  }, []);

  const has = useCallback((id: string) => ids.has(id), [ids]);

  return { ids, has, toggle };
}
