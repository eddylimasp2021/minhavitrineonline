import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { track } from "./use-track";

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["favorites", user?.id],
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
      if (ids.has(product_id)) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product_id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, product_id });
        track("favorite_add", { product_id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites", user?.id] }),
  });

  const has = useCallback((id: string) => ids.has(id), [q.data]);
  const toggle = useCallback((id: string) => mutation.mutate(id), [mutation]);

  return { favorites: q.data ?? [], ids, isLoading: q.isLoading, has, toggle, isAuthed: !!user };
}
