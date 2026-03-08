// Types for subscriptions, plans, billing events, and usage metrics

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

export interface SubscriptionPlan {
    id: string;
    name: string;
    stripe_price_id_monthly: string | null;
    stripe_price_id_yearly: string | null;
    monthly_price: number;
    yearly_price: number;
    max_files: number;
    max_products: number;
    max_conversations_per_month: number;
    max_file_size_mb: number;
    features: PlanFeatures;
    is_active: boolean;
    created_at: string;
}

export interface PlanFeatures {
    voice: boolean;
    upselling: boolean;
    analytics_basic: boolean;
    analytics_advanced?: boolean;
    team_members: number; // -1 = unlimited
    custom_prompts?: boolean;
}

export interface Subscription {
    id: string;
    store_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    plan_id: string | null;
    status: SubscriptionStatus;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    trial_end: string | null;
    created_at: string;
    updated_at: string;
    plan?: SubscriptionPlan;
}

export interface BillingEvent {
    id: string;
    store_id: string | null;
    stripe_event_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    processed: boolean;
    processed_at: string | null;
    created_at: string;
}

export interface UsageMetrics {
    id: string;
    store_id: string;
    period_start: string;
    period_end: string;
    conversations_count: number;
    messages_count: number;
    tokens_used: number;
    files_processed: number;
    voice_seconds: number;
    updated_at: string;
}

export type BillingPeriod = 'monthly' | 'yearly';
