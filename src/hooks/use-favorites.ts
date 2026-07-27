import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { track } from "./use-track";

type FavRow = { product_id: string };

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
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product_id);
        if (error) throw error;
        track("favorite_remove", { product_id, metadata: { source: "remote" } });
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id });
        if (error) throw error;
        track("favorite_add", { product_id, metadata: { source: "remote" } });
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

  const has = useCallback((id: string) => ids.has(id), [q.data]);
  const toggle = useCallback((id: string) => mutation.mutate(id), [mutation]);

  return { favorites: q.data ?? [], ids, isLoading: q.isLoading, has, toggle, isAuthed: !!user };
}
