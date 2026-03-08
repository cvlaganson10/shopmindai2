// Billing service — Stripe integration via n8n (no server-side routes in Vite SPA)
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionPlan, Subscription, UsageMetrics, BillingPeriod } from '@/types/billing';

const N8N_BILLING_WEBHOOK = import.meta.env.VITE_N8N_BILLING_WEBHOOK_URL || '';

/**
 * Fetch all available subscription plans.
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

    if (error) throw new Error(`Failed to fetch plans: ${error.message}`);
    return (data || []) as unknown as SubscriptionPlan[];
}

/**
 * Get the current subscription for a store.
 */
export async function getSubscription(storeId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('store_id', storeId)
        .maybeSingle();

    if (error) throw new Error(`Failed to fetch subscription: ${error.message}`);
    return data as unknown as Subscription | null;
}

/**
 * Create a Stripe checkout session via n8n webhook.
 * Returns the checkout URL to redirect to.
 */
export async function createCheckoutSession(
    storeId: string,
    planId: string,
    period: BillingPeriod = 'monthly'
): Promise<string> {
    const response = await fetch(N8N_BILLING_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'create_checkout',
            store_id: storeId,
            plan_id: planId,
            period,
            success_url: `${window.location.origin}/dashboard?checkout=success`,
            cancel_url: `${window.location.origin}/dashboard/billing?checkout=canceled`,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return data.checkout_url;
}

/**
 * Create a Stripe Customer Portal session via n8n webhook.
 * Returns the portal URL to redirect to.
 */
export async function createPortalSession(storeId: string): Promise<string> {
    const response = await fetch(N8N_BILLING_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'create_portal',
            store_id: storeId,
            return_url: `${window.location.origin}/dashboard/billing`,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create portal session');
    }

    const data = await response.json();
    return data.portal_url;
}

/**
 * Get usage metrics for the current billing period.
 */
export async function getCurrentUsage(storeId: string): Promise<UsageMetrics | null> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('store_id', storeId)
        .lte('period_start', now)
        .gte('period_end', now)
        .maybeSingle();

    if (error) throw new Error(`Failed to fetch usage: ${error.message}`);
    return data as unknown as UsageMetrics | null;
}

/**
 * Check if a store has an active subscription.
 */
export async function isSubscriptionActive(storeId: string): Promise<boolean> {
    const sub = await getSubscription(storeId);
    if (!sub) return false;
    return ['active', 'trialing'].includes(sub.status);
}

/**
 * Get subscription status display info.
 */
export function getStatusDisplay(status: string): { label: string; color: string } {
    const statusMap: Record<string, { label: string; color: string }> = {
        active: { label: 'Active', color: 'bg-green-500/20 text-green-400' },
        trialing: { label: 'Trial', color: 'bg-blue-500/20 text-blue-400' },
        past_due: { label: 'Past Due', color: 'bg-yellow-500/20 text-yellow-400' },
        canceled: { label: 'Canceled', color: 'bg-red-500/20 text-red-400' },
        unpaid: { label: 'Unpaid', color: 'bg-red-500/20 text-red-400' },
        incomplete: { label: 'Incomplete', color: 'bg-gray-500/20 text-gray-400' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
}
