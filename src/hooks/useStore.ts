import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useStore = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const storeQuery = useQuery({
    queryKey: ["store", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("store_profiles")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createStore = useMutation({
    mutationFn: async (values: { store_name: string; industry: string; agent_name: string; brand_tone: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("store_profiles")
        .insert({ ...values, owner_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] });
    },
  });

  return { store: storeQuery.data, isLoading: storeQuery.isLoading, createStore };
};
