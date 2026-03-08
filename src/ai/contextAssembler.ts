// Context assembler — builds the full prompt from components
import { buildSystemPrompt } from './prompts/systemPrompt';
import { RECOMMENDATION_PROMPT } from './prompts/recommendationPrompt';
import { UPSELL_PROMPT } from './prompts/upsellPrompt';
import { FAQ_PROMPT, POLICY_PROMPT } from './prompts/faqPrompt';
import { FALLBACK_PROMPT } from './prompts/fallbackPrompt';
import { packageContext } from '@/services/ragService';
import type { RAGChunk, IntentType, ChatMessage, PromptContext } from '@/types/ai';
import type { AIConfiguration, StoreProfile } from '@/types/tenant';

/**
 * Assemble the full prompt context for a chat interaction.
 */
export function assemblePromptContext(
    store: StoreProfile,
    aiConfig: AIConfiguration,
    chunks: RAGChunk[],
    conversationHistory: ChatMessage[],
    intent: IntentType
): PromptContext {
    const ragContext = packageContext(chunks);
    const historyText = formatHistory(conversationHistory);

    return {
        agent_name: aiConfig.agent_name || store.agent_name || 'Alex',
        store_name: store.store_name,
        store_url: store.store_url || '',
        brand_voice: aiConfig.brand_voice || store.brand_tone || 'friendly',
        fallback_message:
            aiConfig.fallback_message ||
            'reach out to the store directly for help',
        escalation_info: aiConfig.escalation_info || store.escalation_email || '',
        rag_context: ragContext,
        conversation_history: historyText,
        upsell_enabled: aiConfig.upsell_enabled,
    };
}

/**
 * Build the complete messages array for the AI call.
 */
export function buildMessages(
    ctx: PromptContext,
    userMessage: string,
    intent: IntentType,
    hasLowSimilarity: boolean
): { role: string; content: string }[] {
    const messages: { role: string; content: string }[] = [];

    // System prompt
    let systemContent = buildSystemPrompt(ctx);

    // Add intent-specific instructions
    const intentPrompt = getIntentPrompt(intent);
    if (intentPrompt) {
        systemContent += `\n\n${intentPrompt}`;
    }

    // Add upsell instructions if enabled
    if (ctx.upsell_enabled && intent === 'product_search') {
        systemContent += `\n\n${UPSELL_PROMPT}`;
    }

    // Add fallback instructions if low similarity
    if (hasLowSimilarity) {
        systemContent += `\n\n${FALLBACK_PROMPT}`;
    }

    messages.push({ role: 'system', content: systemContent });
    messages.push({ role: 'user', content: userMessage });

    return messages;
}

function getIntentPrompt(intent: IntentType): string | null {
    switch (intent) {
        case 'product_search':
            return RECOMMENDATION_PROMPT;
        case 'policy_question':
            return POLICY_PROMPT;
        case 'faq_question':
            return FAQ_PROMPT;
        default:
            return null;
    }
}

function formatHistory(messages: ChatMessage[]): string {
    if (!messages.length) return 'No previous messages.';
    return messages
        .map((m) => `${m.role === 'customer' ? 'Shopper' : 'AI'}: ${m.content}`)
        .join('\n');
}
