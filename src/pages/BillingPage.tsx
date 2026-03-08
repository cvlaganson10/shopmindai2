import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/hooks/useStore";
import { getSubscriptionPlans, getSubscription, getCurrentUsage, createPortalSession, createCheckoutSession, getStatusDisplay } from "@/services/billingService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
    CreditCard, ArrowUpRight, Check, Crown, Zap, Rocket, Loader2,
} from "lucide-react";
import type { BillingPeriod } from "@/types/billing";

const planIcons: Record<string, any> = { Starter: Zap, Growth: Crown, Pro: Rocket };

const BillingPage = () => {
    const { store } = useStore();
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
    const [loading, setLoading] = useState(false);

    const { data: plans } = useQuery({
        queryKey: ["subscription-plans"],
        queryFn: getSubscriptionPlans,
    });

    const { data: subscription } = useQuery({
        queryKey: ["subscription", store?.id],
        queryFn: () => getSubscription(store!.id),
        enabled: !!store?.id,
    });

    const { data: usage } = useQuery({
        queryKey: ["usage", store?.id],
        queryFn: () => getCurrentUsage(store!.id),
        enabled: !!store?.id,
    });

    const currentPlan = plans?.find((p) => p.id === subscription?.plan_id);
    const statusDisplay = subscription ? getStatusDisplay(subscription.status) : null;

    const handleManageBilling = async () => {
        if (!store) return;
        setLoading(true);
        try {
            const url = await createPortalSession(store.id);
            window.location.href = url;
        } catch {
            toast.error("Failed to open billing portal");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (planId: string) => {
        if (!store) return;
        setLoading(true);
        try {
            const url = await createCheckoutSession(store.id, planId, billingPeriod);
            window.location.href = url;
        } catch {
            toast.error("Failed to create checkout session");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-heading font-bold">Billing</h1>
                <p className="text-muted-foreground">Manage your subscription and usage</p>
            </div>

            {/* Current subscription */}
            {subscription && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-heading">Current Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-primary/10">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{currentPlan?.name || "Free"}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {statusDisplay && (
                                            <Badge className={statusDisplay.color}>{statusDisplay.label}</Badge>
                                        )}
                                        {subscription.current_period_end && (
                                            <span className="text-sm text-muted-foreground">
                                                Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleManageBilling} disabled={loading} variant="outline">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4 mr-1" />}
                                Manage Billing
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Usage */}
            {currentPlan && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-heading">Usage This Period</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <UsageBar
                            label="Conversations"
                            used={usage?.conversations_count || 0}
                            max={currentPlan.max_conversations_per_month}
                        />
                        <UsageBar
                            label="Files Processed"
                            used={usage?.files_processed || 0}
                            max={currentPlan.max_files}
                        />
                        <UsageBar
                            label="Products"
                            used={0}
                            max={currentPlan.max_products}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Plans */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-heading font-bold">Available Plans</h2>
                    <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                        <button
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${billingPeriod === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                }`}
                            onClick={() => setBillingPeriod("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${billingPeriod === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                }`}
                            onClick={() => setBillingPeriod("yearly")}
                        >
                            Yearly
                            <span className="ml-1 text-xs text-green-400">Save 17%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans?.map((plan) => {
                        const Icon = planIcons[plan.name] || Zap;
                        const price = billingPeriod === "monthly" ? plan.monthly_price : plan.yearly_price;
                        const isCurrentPlan = plan.id === subscription?.plan_id;

                        return (
                            <Card
                                key={plan.id}
                                className={`bg-card border-border relative ${plan.name === "Growth" ? "ring-2 ring-primary" : ""
                                    }`}
                            >
                                {plan.name === "Growth" && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                                    </div>
                                )}
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-bold">{plan.name}</h3>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold">${price}</span>
                                        <span className="text-muted-foreground">/{billingPeriod === "monthly" ? "mo" : "yr"}</span>
                                    </div>
                                    <ul className="space-y-2 mb-6">
                                        <PlanFeature text={`${plan.max_conversations_per_month.toLocaleString()} conversations/mo`} />
                                        <PlanFeature text={`${plan.max_products === -1 ? "Unlimited" : plan.max_products} products`} />
                                        <PlanFeature text={`${plan.max_files === -1 ? "Unlimited" : plan.max_files} files`} />
                                        <PlanFeature text={`${plan.max_file_size_mb}MB max file size`} />
                                        {plan.features?.voice && <PlanFeature text="Voice AI" />}
                                        {plan.features?.upselling && <PlanFeature text="Smart Upselling" />}
                                        {plan.features?.analytics_advanced && <PlanFeature text="Advanced Analytics" />}
                                    </ul>
                                    <Button
                                        className="w-full rounded-full"
                                        variant={isCurrentPlan ? "outline" : "default"}
                                        disabled={isCurrentPlan || loading}
                                        onClick={() => handleSelectPlan(plan.id)}
                                    >
                                        {isCurrentPlan ? "Current Plan" : "Get Started"}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const PlanFeature = ({ text }: { text: string }) => (
    <li className="flex items-center gap-2 text-sm">
        <Check className="h-4 w-4 text-green-400 shrink-0" />
        <span>{text}</span>
    </li>
);

const UsageBar = ({ label, used, max }: { label: string; used: number; max: number }) => {
    const isUnlimited = max === -1;
    const percentage = isUnlimited ? 0 : Math.min((used / max) * 100, 100);
    return (
        <div>
            <div className="flex items-center justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="text-muted-foreground">
                    {used.toLocaleString()} / {isUnlimited ? "∞" : max.toLocaleString()}
                </span>
            </div>
            {!isUnlimited && (
                <Progress value={percentage} className="h-2" />
            )}
        </div>
    );
};

export default BillingPage;
