// useTenant hook — provides current store context (profile, AI config, subscription)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/hooks/useStore';
import type { AIConfiguration } from '@/types/tenant';
import type { Subscription } from '@/types/billing';

export const useTenant = () => {
    const { user } = useAuth();
    const { store, isLoading: storeLoading } = useStore();

    const aiConfigQuery = useQuery({
        queryKey: ['ai-config', store?.id],
        queryFn: async () => {
            if (!store) return null;
            const { data, error } = await supabase
                .from('ai_configurations')
                .select('*')
                .eq('store_id', store.id)
                .maybeSingle();
            if (error) throw error;
            return data as unknown as AIConfiguration | null;
        },
        enabled: !!store?.id,
    });

    const subscriptionQuery = useQuery({
        queryKey: ['subscription', store?.id],
        queryFn: async () => {
            if (!store) return null;
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*, plan:subscription_plans(*)')
                .eq('store_id', store.id)
                .maybeSingle();
            if (error) throw error;
            return data as unknown as Subscription | null;
        },
        enabled: !!store?.id,
    });

    const isActive = subscriptionQuery.data
        ? ['active', 'trialing'].includes(subscriptionQuery.data.status)
        : true; // Default to active if no subscription record (free tier)

    return {
        store,
        storeId: store?.id || null,
        aiConfig: aiConfigQuery.data,
        subscription: subscriptionQuery.data,
        isActive,
        isLoading: storeLoading || aiConfigQuery.isLoading || subscriptionQuery.isLoading,
        userId: user?.id || null,
    };
};
