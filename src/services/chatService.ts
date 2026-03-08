// Chat service — sends messages to n8n webhook and handles streaming responses
import type { ChatRequest, ChatResponse, ChatMessage, StreamChunk } from '@/types/ai';

const N8N_CHAT_WEBHOOK = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL || '';

/**
 * Send a chat message and receive a streaming AI response.
 * The n8n webhook handles: intent classification → RAG retrieval → GPT response.
 */
export async function sendChatMessage(
    request: ChatRequest,
    onChunk?: (chunk: StreamChunk) => void
): Promise<ChatResponse> {
    const response = await fetch(N8N_CHAT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            store_id: request.store_id,
            session_id: request.session_id,
            message: request.message,
            conversation_id: request.conversation_id,
            conversation_history: request.conversation_history || [],
        }),
    });

    if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
    }

    // If streaming is supported by the n8n endpoint
    if (response.headers.get('content-type')?.includes('text/event-stream') && onChunk) {
        return handleStreamingResponse(response, onChunk);
    }

    // Fallback: standard JSON response
    const data = await response.json();
    return {
        message: data.message || data.output || data.text || '',
        conversation_id: data.conversation_id || request.conversation_id || '',
        products: data.products || [],
        chunk_ids: data.chunk_ids || [],
        tokens_used: data.tokens_used,
        latency_ms: data.latency_ms,
    };
}

async function handleStreamingResponse(
    response: Response,
    onChunk: (chunk: StreamChunk) => void
): Promise<ChatResponse> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader');

    const decoder = new TextDecoder();
    let fullMessage = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                    onChunk({ content: '', done: true });
                    break;
                }
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.content || '';
                    fullMessage += content;
                    onChunk({ content, done: false });
                } catch {
                    // Non-JSON line, skip
                }
            }
        }
    }

    return {
        message: fullMessage,
        conversation_id: '',
    };
}

/**
 * Format conversation history for the AI prompt.
 * Trims to the last 10 turns to keep context manageable.
 */
export function formatConversationHistory(
    messages: ChatMessage[],
    maxTurns: number = 10
): ChatMessage[] {
    return messages.slice(-maxTurns * 2);
}

/**
 * Generate a unique session ID for shopper sessions.
 */
export function generateSessionId(): string {
    return crypto.randomUUID();
}

/**
 * Get or create a session ID from localStorage.
 */
export function getOrCreateSessionId(storeId: string): string {
    const key = `shopmind_session_${storeId}`;
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem(key, sessionId);
    }
    return sessionId;
}
