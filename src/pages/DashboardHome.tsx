import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/hooks/useStore";
import StoreOnboardingModal from "@/components/StoreOnboardingModal";
import { MessageSquare, FileText, TrendingUp, BarChart3, Upload, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const DashboardHome = () => {
  const { user } = useAuth();
  const { store, isLoading: storeLoading } = useStore();
  const [copied, setCopied] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  // Stats queries
  const { data: conversationCount = 0 } = useQuery({
    queryKey: ["stats", "conversations", store?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id);
      return count || 0;
    },
    enabled: !!store,
  });

  const { data: messagesToday = 0 } = useQuery({
    queryKey: ["stats", "messages-today", store?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .gte("created_at", today.toISOString());
      return count || 0;
    },
    enabled: !!store,
  });

  const { data: docCount = 0 } = useQuery({
    queryKey: ["stats", "docs", store?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("knowledge_documents")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .eq("status", "complete");
      return count || 0;
    },
    enabled: !!store,
  });

  const { data: upsellCount = 0 } = useQuery({
    queryKey: ["stats", "upsells", store?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .eq("event_type", "upsell_shown");
      return count || 0;
    },
    enabled: !!store,
  });

  const { data: recentConversations = [] } = useQuery({
    queryKey: ["recent-conversations", store?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!store,
  });

  const embedCode = store ? `<script src="https://shopmind.ai/widget.js" data-store-id="${store.id}"></script>` : "";

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Embed code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: "Total Conversations", value: conversationCount, icon: MessageSquare },
    { label: "Messages Today", value: messagesToday, icon: BarChart3 },
    { label: "Documents Uploaded", value: docCount, icon: FileText },
    { label: "Upsell Events", value: upsellCount, icon: TrendingUp },
  ];

  const checklist = [
    { label: "Create your store", done: !!store },
    { label: "Upload a product catalog", done: docCount > 0 },
    { label: "Set your agent name", done: !!store && store.agent_name !== "Alex" },
    { label: "Copy your embed code", done: false },
    { label: "Test your chat agent", done: false },
  ];

  if (storeLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding modal */}
      <StoreOnboardingModal open={!store && !storeLoading} onClose={() => {}} />

      {/* Welcome */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Welcome back, {displayName}! 👋</h2>
        {store && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">Embed code:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${docCount > 0 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                {docCount > 0 ? "Go Live" : "Setup Needed"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background rounded-lg px-3 py-2 text-muted-foreground overflow-x-auto">
                {embedCode}
              </code>
              <Button variant="ghost" size="icon" onClick={copyEmbed} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {store && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {store && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild className="rounded-full">
            <Link to="/dashboard/upload"><Upload className="h-4 w-4 mr-2" /> Upload Documents</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <a href={`/chat/${store.id}`} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-2" /> View Live Chat</a>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <a href={`/voice/${store.id}`} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-2" /> Test Voice Agent</a>
          </Button>
        </div>
      )}

      {/* Recent Conversations */}
      {store && recentConversations.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Recent Conversations</h3>
            <Link to="/dashboard/conversations" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 font-medium">Channel</th>
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-left py-2 font-medium">Messages</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentConversations.map((conv) => (
                  <tr key={conv.id} className="border-b border-border/50">
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${conv.channel === "voice" ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                        {conv.channel}
                      </span>
                    </td>
                    <td className="py-2 text-foreground font-mono text-xs">{conv.customer_id?.slice(0, 8) || "—"}...</td>
                    <td className="py-2 text-foreground">{conv.message_count}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${conv.status === "active" ? "bg-success/20 text-success" : conv.status === "resolved" ? "bg-muted text-muted-foreground" : "bg-warning/20 text-warning"}`}>
                        {conv.status}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {conv.created_at ? formatDistanceToNow(new Date(conv.created_at), { addSuffix: true }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Setup Checklist */}
      {store && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Setup Checklist</h3>
          <div className="space-y-3">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${item.done ? "border-success bg-success" : "border-muted-foreground"}`}>
                  {item.done && <Check className="h-3 w-3 text-success-foreground" />}
                </div>
                <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
