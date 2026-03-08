import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MessageSquare, PhoneOff } from "lucide-react";

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
  // Tracks whether the voice call session is active (single-tap continuous mode)
  const callActiveRef = useRef(false);
  const storeRef = useRef(store);

  // Keep storeRef in sync so processVoice can access latest store
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

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

  const beginRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice not supported in this browser. Please use Chrome.");
      return;
    }

    // Cleanup any previous instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
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

      // Reset silence timer — when the user pauses for 1.5s after final text, process it
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (final.trim()) {
          recognition.stop();
          processVoice(final.trim());
        }
      }, 1500);
    };

    recognition.onerror = (event: any) => {
      // "aborted" errors happen when we manually stop — ignore them
      if (event.error === "aborted") return;
      // For other errors, if call is still active, try to restart
      if (callActiveRef.current) {
        setTimeout(() => {
          if (callActiveRef.current) beginRecognition();
        }, 500);
      }
    };

    recognition.onend = () => {
      // If the recognition ended unexpectedly while we're in "listening" state
      // and the call is still active, restart it
      if (callActiveRef.current) {
        // Only restart if we're still meant to be listening (not processing/speaking)
        // processVoice will handle restarting after it's done
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState("listening");
    setTranscript("");
  }, []);

  /** Start the continuous voice session — single tap activates ongoing listening */
  const startCall = useCallback(() => {
    callActiveRef.current = true;
    setAiResponse("");
    beginRecognition();
  }, [beginRecognition]);

  /** Stop the entire voice session */
  const endCall = useCallback(() => {
    callActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setVoiceState("idle");
    setTranscript("");
    setAiResponse("");
    setExchanges([]);
  }, []);

  /** Toggle the mic — tap once to start, tap again to stop */
  const toggleMic = useCallback(() => {
    if (callActiveRef.current) {
      endCall();
    } else {
      startCall();
    }
  }, [startCall, endCall]);

  const processVoice = async (text: string) => {
    setVoiceState("processing");
    setTranscript("");

    const N8N_VOICE_WEBHOOK = import.meta.env.VITE_N8N_VOICE_WEBHOOK_URL || '';
    const currentStore = storeRef.current;
    let aiText = '';
    let audioBase64: string | null = null;

    try {
      if (!N8N_VOICE_WEBHOOK) {
        // Fallback: if webhook not configured, use simulated response
        await new Promise((r) => setTimeout(r, 1500));
        aiText = `Thanks for saying "${text}". I'm ${currentStore?.agent_name || "your AI assistant"}. Connect your n8n voice webhook for real AI responses.`;
      } else {
        // ── REAL n8n Voice Pipeline Call ──
        const response = await fetch(N8N_VOICE_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: storeId,
            session_id: `voice-${storeId}-${Date.now()}`,
            message: text,
            conversation_history: exchanges.map(ex => [
              { role: 'customer', content: ex.customer },
              { role: 'assistant', content: ex.assistant }
            ]).flat(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Voice webhook failed: ${response.status}`);
        }

        const data = await response.json();
        aiText = data.ai_response || data.message || data.output || data.text || '';
        audioBase64 = data.audio_base64 || null;
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      aiText = `Sorry, I had trouble processing that. Please try again.`;
    }

    setAiResponse(aiText);
    setExchanges((prev) => [...prev.slice(-5), { customer: text, assistant: aiText }]);
    setVoiceState("speaking");

    // ── Play audio: ElevenLabs (if available) → fallback to browser Speech Synthesis ──
    try {
      if (audioBase64) {
        await playElevenLabsAudio(audioBase64);
      } else {
        await speakText(aiText);
      }
    } catch {
      // If all TTS fails, wait a fallback duration
      await new Promise((r) => setTimeout(r, 2000));
    }

    // CONTINUOUS MODE: Automatically resume listening if call is still active
    if (callActiveRef.current) {
      beginRecognition();
    } else {
      setVoiceState("idle");
    }
  };

  /** Play ElevenLabs audio from base64 data */
  const playElevenLabsAudio = (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const byteString = atob(base64Audio);
        const byteArray = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('ElevenLabs audio playback failed'));
        };
        audio.play().catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  };

  /** Speak text using the browser's native Speech Synthesis API */
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // Try to pick a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('Speech synthesis error'));

      window.speechSynthesis.speak(utterance);
    });
  };

  const orbStyles: Record<VoiceState, string> = {
    idle: "bg-gradient-to-br from-primary to-purple-600 animate-pulse-glow",
    listening: "bg-gradient-to-br from-success to-emerald-500 scale-110",
    processing: "bg-gradient-to-br from-primary to-violet-600 animate-spin-slow",
    speaking: "bg-gradient-to-br from-blue-500 to-primary",
  };

  const statusText: Record<VoiceState, string> = {
    idle: "Tap to start",
    listening: "Listening — speak anytime...",
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

        {/* Voice Orb — single tap toggles the entire session */}
        <button
          onClick={toggleMic}
          disabled={voiceState === "processing" || voiceState === "speaking"}
          className={`h-48 w-48 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer ${orbStyles[voiceState]} ${voiceState === "listening" ? "ring-4 ring-success/30" : ""
            }`}
        >
          {callActiveRef.current ? (
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
        {aiResponse && (voiceState === "speaking" || voiceState === "listening" || voiceState === "idle") && (
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
