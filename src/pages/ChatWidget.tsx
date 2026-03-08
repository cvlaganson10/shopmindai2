import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Volume2 } from "lucide-react";
import { v4 as uuidv4 } from "crypto";

interface Message {
  id: string;
  role: "customer" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface StoreProfile {
  id: string;
  store_name: string;
  agent_name: string | null;
  primary_color: string | null;
  logo_url: string | null;
  welcome_message: string | null;
}

const ChatWidget = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem("shopmind_session");
    if (stored) return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem("shopmind_session", id);
    return id;
  });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load store profile
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from("store_profiles")
      .select("id, store_name, agent_name, primary_color, logo_url, welcome_message")
      .eq("id", storeId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStore(data);
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: data.welcome_message || "Hi! How can I help you today?",
              created_at: new Date().toISOString(),
            },
          ]);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [storeId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !store || sending) return;
    const userMessage = input.trim();
    setInput("");
    setSending(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "customer",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Create conversation if first message
      let convId = conversationId;
      if (!convId) {
        // Create customer
        const { data: customer } = await supabase
          .from("customers")
          .insert({ store_id: store.id, session_id: sessionId })
          .select("id")
          .single();

        // Create conversation
        const { data: conv } = await supabase
          .from("conversations")
          .insert({
            store_id: store.id,
            customer_id: customer?.id,
            channel: "chat",
            first_message_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        convId = conv?.id || null;
        setConversationId(convId);
      }

      if (convId) {
        // Save customer message
        await supabase.from("messages").insert({
          conversation_id: convId,
          store_id: store.id,
          role: "customer",
          content: userMessage,
        });

        // Update conversation
        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            message_count: messages.filter((m) => m.id !== "welcome").length + 1,
          })
          .eq("id", convId);
      }

      // Simulate AI response (will be replaced by n8n webhook later)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiResponse = `Thanks for your message! I'm ${store.agent_name || "your AI assistant"}. This is a demo response — connect your n8n webhook to enable real AI conversations.`;

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiResponse,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (convId) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          store_id: store.id,
          role: "assistant",
          content: aiResponse,
        });
      }
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="light-chat h-screen flex items-center justify-center bg-[hsl(0,0%,100%)]">
        <div className="animate-pulse text-[hsl(215,16%,47%)]">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="light-chat h-screen flex items-center justify-center bg-[hsl(0,0%,100%)]">
        <p className="text-[hsl(215,16%,47%)]">Store not found</p>
      </div>
    );
  }

  const primaryColor = store?.primary_color || "#6366F1";
  const agentInitial = (store?.agent_name || "A").charAt(0).toUpperCase();

  return (
    <div className="h-screen flex flex-col" style={{ background: "#FFFFFF" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: primaryColor }}>
        {store?.logo_url ? (
          <img src={store.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>
            {agentInitial}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-sm">{store?.agent_name || "AI Assistant"}</p>
          <p className="text-xs opacity-80">{store?.store_name}</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs opacity-80">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#FAFAFA" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1"
                style={{ background: primaryColor }}
              >
                {agentInitial}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "customer" ? "text-white" : "text-gray-800"
              }`}
              style={{
                background: msg.role === "customer" ? primaryColor : "#F3F4F6",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-2">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: primaryColor }}
            >
              {agentInitial}
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex gap-1">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 flex gap-2" style={{ background: "#FFFFFF" }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask me anything..."
          className="flex-1 border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 rounded-full"
          disabled={sending}
        />
        <Button
          size="icon"
          className="rounded-full shrink-0"
          style={{ background: primaryColor }}
          onClick={sendMessage}
          disabled={!input.trim() || sending}
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default ChatWidget;
