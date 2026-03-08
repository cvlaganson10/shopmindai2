import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Mic, Search, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const filters = ["All", "Active", "Resolved", "Escalated"];
const channels = ["All", "Chat", "Voice"];

const ConversationsPage = () => {
  const { store } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [channelFilter, setChannelFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", store?.id, statusFilter, channelFilter],
    queryFn: async () => {
      let q = supabase
        .from("conversations")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (statusFilter !== "All") q = q.eq("status", statusFilter.toLowerCase());
      if (channelFilter !== "All") q = q.eq("channel", channelFilter.toLowerCase());

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!store,
  });

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    return (
      c.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.topic?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["conversation-messages", selectedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedId,
  });

  const selected = conversations.find((c) => c.id === selectedId);

  const updateStatus = async (id: string, status: string) => {
    const updates: Record<string, any> = { status };
    if (status === "resolved") updates.resolved_at = new Date().toISOString();
    await supabase.from("conversations").update(updates).eq("id", id);
    toast.success(`Marked as ${status}`);
  };

  const sentimentDot = (s: string | null) => {
    if (s === "positive") return "bg-success";
    if (s === "negative") return "bg-destructive";
    return "bg-muted-foreground";
  };

  if (!store) {
    return <div className="text-center py-20 text-muted-foreground">Please create a store first.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left panel */}
      <div className="w-full md:w-80 flex flex-col shrink-0">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 mb-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                statusFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 mb-3">
          {channels.map((c) => (
            <button
              key={c}
              onClick={() => setChannelFilter(c)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                channelFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="glass-card rounded-lg p-3 animate-pulse">
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="h-2 bg-muted rounded w-1/2" />
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {conversations.length === 0 ? "No conversations yet. Share your chat link to get started." : "No matches found."}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "w-full text-left glass-card rounded-lg p-3 transition-colors",
                  selectedId === conv.id ? "border-primary/50 bg-primary/5" : "hover:bg-surface-hover"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {conv.channel === "voice" ? (
                    <Mic className="h-3 w-3 text-primary" />
                  ) : (
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs font-mono text-foreground truncate">
                    {conv.customer_id?.slice(0, 12) || "Unknown"}...
                  </span>
                  <div className={`h-2 w-2 rounded-full ml-auto shrink-0 ${sentimentDot(conv.sentiment)}`} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.topic || "No topic"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{conv.message_count} msgs</span>
                  <span className="text-xs text-muted-foreground">
                    {conv.created_at ? formatDistanceToNow(new Date(conv.created_at), { addSuffix: true }) : ""}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden md:flex flex-1 flex-col glass-card rounded-xl overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to view details
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-foreground">{selected.customer_id?.slice(0, 12)}...</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selected.channel === "voice" ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                  {selected.channel}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selected.status === "active" ? "bg-success/20 text-success" : 
                  selected.status === "resolved" ? "bg-muted text-muted-foreground" : 
                  "bg-warning/20 text-warning"
                }`}>
                  {selected.status}
                </span>
                <span className="text-xs text-muted-foreground">{selected.message_count} messages</span>
              </div>
              <div className="flex gap-2">
                {selected.status === "active" && (
                  <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => updateStatus(selected.id, "resolved")}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                  </Button>
                )}
                <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => updateStatus(selected.id, "escalated")}>
                  <AlertTriangle className="h-3 w-3 mr-1" /> Escalate
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "customer"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {msg.content}
                    <p className="text-[10px] opacity-60 mt-1">
                      {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
