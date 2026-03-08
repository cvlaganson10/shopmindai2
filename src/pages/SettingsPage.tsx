import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Copy, AlertTriangle, Trash2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const sections = ["General", "AI Agent", "Voice", "Appearance", "Integrations", "Danger Zone"];
const industries = ["General", "Fashion", "Electronics", "Food & Beverage", "Beauty", "Sports", "Home & Garden", "Other"];
const tones = ["Friendly", "Professional", "Casual", "Luxury"];
const voices = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Rachel", desc: "Professional Female" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", desc: "Professional Male" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", desc: "Casual Male" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", desc: "Friendly Female" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", desc: "Deep Male" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", desc: "Energetic Female" },
];

const SettingsPage = () => {
  const { store, isLoading } = useStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [active, setActive] = useState("General");
  const [saving, setSaving] = useState(false);

  // Form state
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [industry, setIndustry] = useState("general");
  const [escalationEmail, setEscalationEmail] = useState("");
  const [agentName, setAgentName] = useState("Alex");
  const [brandTone, setBrandTone] = useState("friendly");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [voiceId, setVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! How can I help you today?");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (store) {
      setStoreName(store.store_name || "");
      setStoreUrl(store.store_url || "");
      setIndustry(store.industry || "general");
      setEscalationEmail(store.escalation_email || "");
      setAgentName(store.agent_name || "Alex");
      setBrandTone(store.brand_tone || "friendly");
      setSystemPrompt(store.system_prompt_override || "");
      setVoiceId(store.agent_voice_id || "EXAVITQu4vr4xnSDxMaL");
      setPrimaryColor(store.primary_color || "#6366F1");
      setWelcomeMessage(store.welcome_message || "Hi! How can I help you today?");
    }
  }, [store]);

  const save = async (updates: Record<string, any>) => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from("store_profiles").update(updates).eq("id", store.id);
    setSaving(false);
    if (error) toast.error("Failed to save");
    else {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["store"] });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const resetKnowledge = async () => {
    if (!store) return;
    await supabase.from("knowledge_chunks").delete().eq("store_id", store.id);
    await supabase.from("knowledge_documents").delete().eq("store_id", store.id);
    toast.success("Knowledge base reset");
  };

  const deleteConversations = async () => {
    if (!store) return;
    await supabase.from("messages").delete().eq("store_id", store.id);
    await supabase.from("conversations").delete().eq("store_id", store.id);
    toast.success("All conversations deleted");
  };

  const deleteStore = async () => {
    if (!store || deleteConfirm !== store.store_name) return;
    await supabase.from("store_profiles").delete().eq("id", store.id);
    queryClient.invalidateQueries({ queryKey: ["store"] });
    toast.success("Store deleted");
    navigate("/dashboard");
  };

  if (!store) return <div className="text-center py-20 text-muted-foreground">Please create a store first.</div>;

  return (
    <div className="flex gap-6 max-w-5xl">
      {/* Nav */}
      <nav className="hidden md:block w-48 shrink-0 space-y-1">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className={cn(
              "w-full text-left text-sm px-3 py-2 rounded-lg transition-colors font-medium",
              active === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {s}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {/* General */}
        {active === "General" && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">General</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Store URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">https://</span>
                  <Input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="mystore.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => <SelectItem key={i} value={i.toLowerCase()}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Escalation Email</Label>
                <Input type="email" value={escalationEmail} onChange={(e) => setEscalationEmail(e.target.value)} placeholder="support@store.com" />
              </div>
              <Button className="w-fit rounded-full" disabled={saving}
                onClick={() => save({ store_name: storeName, store_url: storeUrl, industry, escalation_email: escalationEmail })}>
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* AI Agent */}
        {active === "AI Agent" && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">AI Agent</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Agent Name</Label>
                <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Brand Tone</Label>
                <Select value={brandTone} onValueChange={setBrandTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                <Label>Advanced: Custom System Prompt</Label>
              </div>
              {showAdvanced && (
                <div className="space-y-2">
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={6}
                    placeholder="Override the default system prompt for your AI agent..."
                  />
                  <p className="text-xs text-muted-foreground text-right">{systemPrompt.length} characters</p>
                </div>
              )}
              <Button className="w-fit rounded-full" disabled={saving}
                onClick={() => save({ agent_name: agentName, brand_tone: brandTone, system_prompt_override: systemPrompt || null })}>
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Voice */}
        {active === "Voice" && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Voice Selection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setVoiceId(v.id); save({ agent_voice_id: v.id }); }}
                  className={cn(
                    "glass-card rounded-xl p-4 text-left transition-all",
                    voiceId === v.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/30"
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Appearance */}
        {active === "Appearance" && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Appearance</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border-0" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-32 font-mono text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} />
              </div>
              {/* Mini preview */}
              <div className="rounded-xl overflow-hidden border border-border max-w-xs">
                <div className="px-3 py-2 text-sm font-semibold" style={{ background: primaryColor, color: "white" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>
                      {agentName.charAt(0)}
                    </div>
                    {agentName}
                  </div>
                </div>
                <div className="bg-muted p-3">
                  <div className="bg-secondary rounded-2xl px-3 py-2 text-xs text-secondary-foreground max-w-[80%]">
                    {welcomeMessage}
                  </div>
                </div>
              </div>
              <Button className="w-fit rounded-full" disabled={saving}
                onClick={() => save({ primary_color: primaryColor, welcome_message: welcomeMessage })}>
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Integrations */}
        {active === "Integrations" && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Integrations</h3>
            <p className="text-sm text-muted-foreground">n8n Webhook URLs — configure these in your Cloud secrets.</p>
            {["Chat Webhook", "Voice Webhook", "Document Upload Webhook"].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <code className="text-xs bg-background rounded px-2 py-1 text-muted-foreground block">
                    Configure via Cloud secrets
                  </code>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(label)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Danger Zone */}
        {active === "Danger Zone" && (
          <div className="border border-destructive/30 rounded-xl p-6 space-y-4">
            <h3 className="font-heading text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </h3>

            <div className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-full">
                    Reset Knowledge Base
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Knowledge Base</AlertDialogTitle>
                    <AlertDialogDescription>This deletes all documents and chunks. Your AI agent will lose all product knowledge.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetKnowledge} className="bg-destructive text-destructive-foreground">Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-full">
                    Delete All Conversations
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Conversations</AlertDialogTitle>
                    <AlertDialogDescription>All conversations and messages will be permanently deleted.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteConversations} className="bg-destructive text-destructive-foreground">Delete All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Separator className="my-4" />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-full">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Store
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Store</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes your store and all data. Type <strong>{store.store_name}</strong> to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type store name to confirm" className="mt-2" />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteStore} disabled={deleteConfirm !== store.store_name} className="bg-destructive text-destructive-foreground">
                      Delete Forever
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
