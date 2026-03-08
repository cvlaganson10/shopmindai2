// Content moderator — client-side content checks
// Note: Full moderation (OpenAI Moderation API) should run server-side via n8n

const PROFANITY_PATTERNS = [
    // Basic profanity detection patterns — intentionally minimal on client-side
    // The real moderation happens server-side via OpenAI's Moderation API in n8n
];

/**
 * Check if a message should be flagged for moderation.
 * This is a lightweight client-side check. The n8n pipeline performs
 * full moderation via OpenAI's Moderation API before GPT processing.
 */
export function shouldFlagMessage(message: string): boolean {
    const lower = message.toLowerCase();

    // Check for excessive length (potential abuse)
    if (message.length > 2000) return true;

    // Check for suspicious patterns
    if (containsInjectionAttempt(lower)) return true;

    return false;
}

/**
 * Check for prompt injection attempts.
 * These are common patterns used to manipulate AI assistants.
 */
function containsInjectionAttempt(message: string): boolean {
    const injectionPatterns = [
        'ignore previous instructions',
        'ignore all instructions',
        'disregard your instructions',
        'forget your instructions',
        'you are now',
        'act as',
        'pretend to be',
        'system prompt',
        'ignore the above',
        'override your',
        'new instructions:',
        'jailbreak',
        'dan mode',
    ];

    return injectionPatterns.some((p) => message.includes(p));
}

/**
 * Get a safe default response for flagged messages.
 */
export function getFlaggedResponse(): string {
    return "I'm here to help you with shopping and product questions. How can I assist you today?";
}
