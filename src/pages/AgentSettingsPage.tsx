import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bot, Volume2, Palette, Key, Copy, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { BRAND_VOICE_OPTIONS, ELEVENLABS_VOICES } from "@/types/tenant";
import type { AIConfiguration } from "@/types/tenant";

const AgentSettingsPage = () => {
    const { store } = useStore();
    const queryClient = useQueryClient();
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch AI config
    const { data: config, isLoading } = useQuery({
        queryKey: ["ai-config", store?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("ai_configurations")
                .select("*")
                .eq("store_id", store!.id)
                .maybeSingle();
            if (error) throw error;
            return data as unknown as AIConfiguration | null;
        },
        enabled: !!store?.id,
    });

    // Local state for form
    const [form, setForm] = useState({
        agent_name: "Alex",
        brand_voice: "friendly",
        custom_greeting: "Hi! How can I help you today?",
        fallback_message: "I don't have that information available, but you can reach out to the store directly for help.",
        escalation_info: "",
        elevenlabs_voice_id: "EXAVITQu4vr4xnSDxMaL",
        upsell_enabled: true,
        max_upsells_per_conversation: 2,
        top_k_retrieval: 6,
        similarity_threshold: 0.7,
        widget_position: "bottom-right",
        widget_color: "#6366F1",
    });

    useEffect(() => {
        if (config) {
            setForm({
                agent_name: config.agent_name || "Alex",
                brand_voice: config.brand_voice || "friendly",
                custom_greeting: config.custom_greeting || "",
                fallback_message: config.fallback_message || "",
                escalation_info: config.escalation_info || "",
                elevenlabs_voice_id: config.elevenlabs_voice_id || "EXAVITQu4vr4xnSDxMaL",
                upsell_enabled: config.upsell_enabled ?? true,
                max_upsells_per_conversation: config.max_upsells_per_conversation || 2,
                top_k_retrieval: config.top_k_retrieval || 6,
                similarity_threshold: config.similarity_threshold || 0.7,
                widget_position: config.widget_position || "bottom-right",
                widget_color: config.widget_color || "#6366F1",
            });
        }
    }, [config]);

    const updateField = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!store) throw new Error("No store");
            const { error } = await supabase
                .from("ai_configurations")
                .upsert({ store_id: store.id, ...form }, { onConflict: "store_id" });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-config"] });
            setHasChanges(false);
            toast.success("AI agent settings saved!");
        },
        onError: (err: any) => toast.error(err.message || "Failed to save"),
    });

    const copyApiKey = () => {
        // In a real implementation, this would fetch/generate a real API key
        const mockKey = `shopai_${store?.id?.slice(0, 8)}_live`;
        navigator.clipboard.writeText(mockKey);
        toast.success("API key copied!");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold">AI Agent Settings</h1>
                    <p className="text-muted-foreground">Configure your AI shopping assistant's behavior</p>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending} className="rounded-full">
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Identity */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" /> Agent Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Agent Name</Label>
                            <Input value={form.agent_name} onChange={(e) => updateField("agent_name", e.target.value)} placeholder="Alex" />
                        </div>
                        <div className="space-y-2">
                            <Label>Brand Voice</Label>
                            <RadioGroup value={form.brand_voice} onValueChange={(v) => updateField("brand_voice", v)} className="grid grid-cols-2 gap-2">
                                {BRAND_VOICE_OPTIONS.map((opt) => (
                                    <div
                                        key={opt.value}
                                        className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${form.brand_voice === opt.value ? "border-primary bg-primary/5" : "border-border"
                                            }`}
                                    >
                                        <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
                                        <label htmlFor={opt.value} className="cursor-pointer">
                                            <p className="text-sm font-medium">{opt.label}</p>
                                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                                        </label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                        <div className="space-y-2">
                            <Label>Greeting Message</Label>
                            <Textarea value={form.custom_greeting} onChange={(e) => updateField("custom_greeting", e.target.value)} rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fallback Message</Label>
                            <Textarea value={form.fallback_message} onChange={(e) => updateField("fallback_message", e.target.value)} rows={2} placeholder="When AI can't answer..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Escalation Info</Label>
                            <Input value={form.escalation_info} onChange={(e) => updateField("escalation_info", e.target.value)} placeholder="Email or URL for human handoff" />
                        </div>
                    </CardContent>
                </Card>

                {/* Voice & Appearance */}
                <div className="space-y-6">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <Volume2 className="h-5 w-5 text-primary" /> Voice Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {ELEVENLABS_VOICES.map((voice) => (
                                <div
                                    key={voice.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${form.elevenlabs_voice_id === voice.id ? "border-primary bg-primary/5" : "border-border"
                                        }`}
                                    onClick={() => updateField("elevenlabs_voice_id", voice.id)}
                                >
                                    <div>
                                        <p className="text-sm font-medium">{voice.name}</p>
                                        <p className="text-xs text-muted-foreground">{voice.description}</p>
                                    </div>
                                    {form.elevenlabs_voice_id === voice.id && <Badge className="bg-primary/20 text-primary">Selected</Badge>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <Palette className="h-5 w-5 text-primary" /> Widget Appearance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Widget Color</Label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={form.widget_color}
                                        onChange={(e) => updateField("widget_color", e.target.value)}
                                        className="h-10 w-10 rounded cursor-pointer border-0"
                                    />
                                    <Input value={form.widget_color} onChange={(e) => updateField("widget_color", e.target.value)} className="w-28" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Widget Position</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["bottom-right", "bottom-left", "top-right", "top-left"].map((pos) => (
                                        <Button
                                            key={pos}
                                            variant={form.widget_position === pos ? "default" : "outline"}
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => updateField("widget_position", pos)}
                                        >
                                            {pos.replace("-", " ")}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upselling & RAG */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg font-heading">AI Behavior</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Smart Upselling</p>
                                    <p className="text-xs text-muted-foreground">AI suggests related products naturally</p>
                                </div>
                                <Switch checked={form.upsell_enabled} onCheckedChange={(v) => updateField("upsell_enabled", v)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Retrieval Chunks (top-K): {form.top_k_retrieval}</Label>
                                <Slider value={[form.top_k_retrieval]} min={1} max={20} step={1} onValueChange={([v]) => updateField("top_k_retrieval", v)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Similarity Threshold: {form.similarity_threshold.toFixed(2)}</Label>
                                <Slider value={[form.similarity_threshold * 100]} min={50} max={95} step={5} onValueChange={([v]) => updateField("similarity_threshold", v / 100)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Key */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary" /> API Key
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Input value={`shopai_${store?.id?.slice(0, 8) || "****"}...`} readOnly className="font-mono text-sm" />
                                <Button variant="outline" size="icon" onClick={copyApiKey}><Copy className="h-4 w-4" /></Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Use this key in your widget embed code.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AgentSettingsPage;
