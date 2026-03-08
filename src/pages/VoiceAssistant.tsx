import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MessageSquare, Phone, PhoneOff } from "lucide-react";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface Exchange {
  customer: string;
  assistant: string;
}

const VoiceAssistant = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<{ store_name: string; agent_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!storeId) return;
    supabase
      .from("store_profiles")
      .select("store_name, agent_name")
      .eq("id", storeId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStore(data);
        else setNotFound(true);
        setLoading(false);
      });
  }, [storeId]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(final || interim);

      // Reset silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (final.trim()) {
          recognition.stop();
          processVoice(final.trim());
        }
      }, 1500);
    };

    recognition.onerror = () => {
      setVoiceState("idle");
    };

    recognition.onend = () => {
      if (voiceState === "listening") {
        // Auto-stopped
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState("listening");
    setTranscript("");
    setAiResponse("");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setVoiceState("idle");
    setTranscript("");
  };

  const processVoice = async (text: string) => {
    setVoiceState("processing");
    // Simulate AI response
    await new Promise((r) => setTimeout(r, 2000));
    const response = `Thanks for saying "${text}". I'm ${store?.agent_name || "your AI assistant"}. Connect your n8n voice webhook for real AI responses with voice output.`;
    setAiResponse(response);
    setExchanges((prev) => [...prev.slice(-5), { customer: text, assistant: response }]);
    setVoiceState("speaking");

    // Simulate speaking duration
    await new Promise((r) => setTimeout(r, 3000));
    setVoiceState("idle");
  };

  const endCall = () => {
    recognitionRef.current?.stop();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setVoiceState("idle");
    setTranscript("");
    setAiResponse("");
    setExchanges([]);
  };

  const orbStyles: Record<VoiceState, string> = {
    idle: "bg-gradient-to-br from-primary to-purple-600 animate-pulse-glow",
    listening: "bg-gradient-to-br from-success to-emerald-500 scale-110",
    processing: "bg-gradient-to-br from-primary to-violet-600 animate-spin-slow",
    speaking: "bg-gradient-to-br from-blue-500 to-primary",
  };

  const statusText: Record<VoiceState, string> = {
    idle: "Tap to speak",
    listening: "Listening...",
    processing: "Thinking...",
    speaking: "Speaking...",
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Store not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Store info */}
        <div className="text-center">
          <h1 className="font-heading text-xl font-bold text-foreground">{store?.agent_name || "AI Assistant"}</h1>
          <p className="text-sm text-muted-foreground">{store?.store_name}</p>
        </div>

        {/* Voice Orb */}
        <button
          onClick={voiceState === "idle" ? startListening : voiceState === "listening" ? stopListening : undefined}
          disabled={voiceState === "processing" || voiceState === "speaking"}
          className={`h-48 w-48 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer ${orbStyles[voiceState]} ${
            voiceState === "listening" ? "ring-4 ring-success/30" : ""
          }`}
        >
          {voiceState === "listening" ? (
            <MicOff className="h-12 w-12 text-white" />
          ) : (
            <Mic className="h-12 w-12 text-white" />
          )}
        </button>

        {/* Status */}
        <p className="text-muted-foreground text-sm font-medium">{statusText[voiceState]}</p>

        {/* Transcript */}
        {transcript && voiceState === "listening" && (
          <p className="text-muted-foreground text-sm text-center italic">"{transcript}"</p>
        )}

        {/* AI Response */}
        {aiResponse && (voiceState === "speaking" || voiceState === "idle") && (
          <div className="glass-card rounded-xl p-4 w-full text-center">
            <p className="text-sm text-foreground">{aiResponse}</p>
          </div>
        )}

        {/* Sound wave animation when speaking */}
        {voiceState === "speaking" && (
          <div className="flex gap-1 items-end h-8">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-bounce"
                style={{
                  height: `${12 + Math.random() * 20}px`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: `${400 + Math.random() * 300}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Conversation log */}
        {exchanges.length > 0 && (
          <div className="w-full space-y-2 max-h-32 overflow-y-auto">
            {exchanges.map((ex, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-muted-foreground text-right">You: {ex.customer}</p>
                <p className="text-xs text-foreground text-left">{store?.agent_name}: {ex.assistant.slice(0, 80)}...</p>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" asChild className="rounded-full">
            <Link to={`/chat/${storeId}`}>
              <MessageSquare className="h-4 w-4 mr-2" /> Switch to Text
            </Link>
          </Button>
          <Button variant="outline" onClick={endCall} className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10">
            <PhoneOff className="h-4 w-4 mr-2" /> End Call
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
