// Types for AI prompt config, RAG context, intent classification, and chat

export type IntentType = 'product_search' | 'policy_question' | 'faq_question' | 'order_question' | 'general' | 'greeting';

export type DocType = 'catalog' | 'policy' | 'faq' | 'general';

export interface IntentClassification {
    intent: IntentType;
    confidence: number;
    doc_types: DocType[];
    category?: string;
}

export interface RAGChunk {
    id: string;
    content: string;
    metadata: ChunkMetadata;
    similarity: number;
}

export interface ChunkMetadata {
    doc_type?: DocType;
    category?: string;
    source_file_name?: string;
    file_type?: string;
    page_number?: number;
    chunk_index?: number;
    [key: string]: unknown;
}

export interface ChatRequest {
    store_id: string;
    session_id: string;
    message: string;
    conversation_id?: string;
    conversation_history?: ChatMessage[];
}

export interface ChatMessage {
    role: 'customer' | 'assistant';
    content: string;
}

export interface ChatResponse {
    message: string;
    conversation_id: string;
    products?: ProductRecommendation[];
    chunk_ids?: string[];
    tokens_used?: number;
    latency_ms?: number;
}

export interface ProductRecommendation {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    currency: string;
    image_url: string | null;
    product_url: string | null;
}

export interface PromptContext {
    agent_name: string;
    store_name: string;
    store_url: string;
    brand_voice: string;
    fallback_message: string;
    escalation_info: string;
    rag_context: string;
    conversation_history: string;
    upsell_enabled: boolean;
}

export interface StreamChunk {
    content: string;
    done: boolean;
}

export interface VoiceRequest {
    store_id: string;
    session_id: string;
    audio_blob: Blob;
    conversation_id?: string;
}

export interface VoiceResponse {
    transcript: string;
    ai_response: string;
    audio_url: string | null;
    conversation_id: string;
    confidence: number;
}
