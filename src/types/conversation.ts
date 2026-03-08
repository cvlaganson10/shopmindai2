// Types for conversations, messages, and voice logs

export type ConversationChannel = 'widget' | 'web' | 'voice' | 'telegram';
export type ConversationStatus = 'active' | 'closed' | 'archived';
export type MessageRole = 'customer' | 'assistant' | 'system';

export interface Conversation {
    id: string;
    store_id: string;
    customer_id: string | null;
    channel: ConversationChannel;
    status: ConversationStatus;
    topic: string | null;
    sentiment: string;
    message_count: number;
    first_message_at: string | null;
    last_message_at: string | null;
    resolved_at: string | null;
    ai_resolved: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    store_id: string;
    role: MessageRole;
    content: string;
    content_type: string;
    audio_url: string | null;
    products_referenced: string[] | null;
    retrieved_chunk_ids: string[] | null;
    tokens_used: number | null;
    latency_ms: number | null;
    created_at: string;
}

export type VoiceStage = 'stt' | 'tts' | 'processing';

export interface VoiceLog {
    id: string;
    conversation_id: string | null;
    message_id: string | null;
    store_id: string | null;
    transcript: string | null;
    output_text: string | null;
    output_audio_url: string | null;
    voice_id: string | null;
    stt_confidence: number | null;
    stt_latency_ms: number | null;
    tts_latency_ms: number | null;
    total_latency_ms: number | null;
    error_type: string | null;
    stage: VoiceStage | null;
    created_at: string;
}

export interface ConversationWithMessages extends Conversation {
    messages?: Message[];
    customer?: {
        id: string;
        email: string | null;
        full_name: string | null;
    };
}
