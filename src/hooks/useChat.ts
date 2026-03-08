// useChat hook — manages chat interactions with streaming support
import { useState, useCallback, useRef } from 'react';
import { sendChatMessage, getOrCreateSessionId, formatConversationHistory } from '@/services/chatService';
import { shouldFlagMessage, getFlaggedResponse } from '@/security/contentModerator';
import { sanitizeInput } from '@/security/inputValidation';
import type { ChatMessage, ChatResponse, StreamChunk } from '@/types/ai';

interface UseChatOptions {
    storeId: string;
    onError?: (error: Error) => void;
}

export const useChat = ({ storeId, onError }: UseChatOptions) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentStreamContent, setCurrentStreamContent] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const sessionIdRef = useRef(getOrCreateSessionId(storeId));

    const sendMessage = useCallback(
        async (rawMessage: string) => {
            const message = sanitizeInput(rawMessage);
            if (!message.trim()) return;

            // Client-side content check
            if (shouldFlagMessage(message)) {
                const flagResponse: ChatMessage = {
                    role: 'assistant',
                    content: getFlaggedResponse(),
                };
                setMessages((prev) => [
                    ...prev,
                    { role: 'customer', content: message },
                    flagResponse,
                ]);
                return;
            }

            // Add user message to state
            setMessages((prev) => [...prev, { role: 'customer', content: message }]);
            setIsLoading(true);
            setIsStreaming(false);
            setCurrentStreamContent('');

            try {
                const response = await sendChatMessage(
                    {
                        store_id: storeId,
                        session_id: sessionIdRef.current,
                        message,
                        conversation_id: conversationId || undefined,
                        conversation_history: formatConversationHistory(messages),
                    },
                    (chunk: StreamChunk) => {
                        if (!chunk.done) {
                            setIsStreaming(true);
                            setCurrentStreamContent((prev) => prev + chunk.content);
                        }
                    }
                );

                // Add AI response to messages
                const aiMessage: ChatMessage = {
                    role: 'assistant',
                    content: response.message || currentStreamContent,
                };
                setMessages((prev) => [...prev, aiMessage]);

                if (response.conversation_id) {
                    setConversationId(response.conversation_id);
                }
            } catch (error) {
                const err = error instanceof Error ? error : new Error('Chat failed');
                onError?.(err);

                // Add error fallback message
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: 'Sorry, I had trouble responding. Please try again in a moment.',
                    },
                ]);
            } finally {
                setIsLoading(false);
                setIsStreaming(false);
                setCurrentStreamContent('');
            }
        },
        [storeId, conversationId, messages, onError, currentStreamContent]
    );

    const clearChat = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setCurrentStreamContent('');
    }, []);

    return {
        messages,
        isLoading,
        isStreaming,
        currentStreamContent,
        conversationId,
        sessionId: sessionIdRef.current,
        sendMessage,
        clearChat,
    };
};
