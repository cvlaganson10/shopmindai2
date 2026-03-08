// useRealtime hook — Supabase Realtime subscriptions for live updates
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type TableName = 'conversations' | 'messages' | 'knowledge_documents' | 'subscriptions' | 'ai_configurations';

interface UseRealtimeOptions {
    table: TableName;
    storeId: string;
    enabled?: boolean;
    onInsert?: (record: any) => void;
    onUpdate?: (record: any) => void;
    onDelete?: (record: any) => void;
}

/**
 * Subscribe to Supabase Realtime changes for a store's data.
 * Automatically invalidates related React Query caches.
 */
export const useRealtime = ({
    table,
    storeId,
    enabled = true,
    onInsert,
    onUpdate,
    onDelete,
}: UseRealtimeOptions) => {
    const queryClient = useQueryClient();

    const invalidateQueries = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: [table, storeId] });
        queryClient.invalidateQueries({ queryKey: [table] });
    }, [queryClient, table, storeId]);

    useEffect(() => {
        if (!enabled || !storeId) return;

        const channel = supabase
            .channel(`${table}-${storeId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table,
                    filter: `store_id=eq.${storeId}`,
                },
                (payload) => {
                    switch (payload.eventType) {
                        case 'INSERT':
                            onInsert?.(payload.new);
                            break;
                        case 'UPDATE':
                            onUpdate?.(payload.new);
                            break;
                        case 'DELETE':
                            onDelete?.(payload.old);
                            break;
                    }
                    invalidateQueries();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, storeId, enabled, onInsert, onUpdate, onDelete, invalidateQueries]);
};
