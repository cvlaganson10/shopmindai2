// Analytics service — dashboard data queries
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsOverview {
    totalConversations: number;
    totalMessages: number;
    activeConversations: number;
    aiResolvedRate: number;
    averageResponseLatency: number;
}

export interface ConversationVolume {
    date: string;
    count: number;
}

export interface TopQuestion {
    content: string;
    count: number;
    lastAsked: string;
}

export interface ProductMention {
    productName: string;
    mentionCount: number;
}

/**
 * Get analytics overview for a store.
 */
export async function getAnalyticsOverview(storeId: string): Promise<AnalyticsOverview> {
    const [convResult, msgResult, activeResult] = await Promise.all([
        supabase
            .from('conversations')
            .select('id, ai_resolved', { count: 'exact' })
            .eq('store_id', storeId),
        supabase
            .from('messages')
            .select('id, latency_ms', { count: 'exact' })
            .eq('store_id', storeId)
            .eq('role', 'assistant'),
        supabase
            .from('conversations')
            .select('id', { count: 'exact' })
            .eq('store_id', storeId)
            .eq('status', 'active'),
    ]);

    const conversations = convResult.data || [];
    const messages = msgResult.data || [];
    const totalConv = convResult.count || 0;
    const resolved = conversations.filter((c) => c.ai_resolved).length;

    const latencies = messages
        .map((m) => m.latency_ms)
        .filter((l): l is number => l !== null && l > 0);
    const avgLatency = latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

    return {
        totalConversations: totalConv,
        totalMessages: msgResult.count || 0,
        activeConversations: activeResult.count || 0,
        aiResolvedRate: totalConv > 0 ? (resolved / totalConv) * 100 : 0,
        averageResponseLatency: Math.round(avgLatency),
    };
}

/**
 * Get conversation volume over time (daily counts).
 */
export async function getConversationVolume(
    storeId: string,
    days: number = 30
): Promise<ConversationVolume[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('conversations')
        .select('created_at')
        .eq('store_id', storeId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch conversation volume: ${error.message}`);

    // Group by date
    const volumeMap = new Map<string, number>();
    for (const conv of data || []) {
        const date = new Date(conv.created_at).toISOString().split('T')[0];
        volumeMap.set(date, (volumeMap.get(date) || 0) + 1);
    }

    // Fill in missing dates
    const result: ConversationVolume[] = [];
    const current = new Date(startDate);
    const today = new Date();
    while (current <= today) {
        const dateStr = current.toISOString().split('T')[0];
        result.push({ date: dateStr, count: volumeMap.get(dateStr) || 0 });
        current.setDate(current.getDate() + 1);
    }

    return result;
}

/**
 * Get top shopper questions (most frequently asked).
 */
export async function getTopQuestions(
    storeId: string,
    limit: number = 10
): Promise<TopQuestion[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('store_id', storeId)
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
        .limit(500); // Sample the last 500 customer messages

    if (error) throw new Error(`Failed to fetch messages: ${error.message}`);

    // Simple frequency counting (a proper implementation would use server-side aggregation)
    const questionMap = new Map<string, { count: number; lastAsked: string }>();
    for (const msg of data || []) {
        const normalized = msg.content.toLowerCase().trim().slice(0, 100);
        const existing = questionMap.get(normalized);
        if (existing) {
            existing.count++;
            if (msg.created_at > existing.lastAsked) {
                existing.lastAsked = msg.created_at;
            }
        } else {
            questionMap.set(normalized, { count: 1, lastAsked: msg.created_at });
        }
    }

    return Array.from(questionMap.entries())
        .map(([content, { count, lastAsked }]) => ({ content, count, lastAsked }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}
