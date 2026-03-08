// Intent classifier — keyword-based classification for MVP
import type { IntentClassification, IntentType, DocType } from '@/types/ai';

/**
 * Classify the shopper's message intent using keyword matching.
 * This is the MVP implementation — can be upgraded to embedding-based classification.
 */
export function classifyIntent(message: string): IntentClassification {
    const lower = message.toLowerCase().trim();

    // Greeting detection
    if (isGreeting(lower)) {
        return { intent: 'greeting', confidence: 0.9, doc_types: [] };
    }

    // Policy / FAQ detection
    if (isPolicyQuestion(lower)) {
        return { intent: 'policy_question', confidence: 0.85, doc_types: ['policy', 'faq'] };
    }

    // FAQ detection
    if (isFAQQuestion(lower)) {
        return { intent: 'faq_question', confidence: 0.80, doc_types: ['faq', 'policy'] };
    }

    // Order / tracking detection
    if (isOrderQuestion(lower)) {
        return { intent: 'order_question', confidence: 0.85, doc_types: ['policy', 'faq'] };
    }

    // Product search detection
    if (isProductSearch(lower)) {
        const category = detectCategory(lower);
        return {
            intent: 'product_search',
            confidence: 0.80,
            doc_types: ['catalog'],
            category: category || undefined,
        };
    }

    // Default: general (search all doc types)
    return { intent: 'general', confidence: 0.50, doc_types: ['catalog', 'policy', 'faq', 'general'] };
}

function isGreeting(msg: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'howdy', 'good morning', 'good afternoon', 'good evening', 'what\'s up', 'sup'];
    return greetings.some((g) => msg === g || msg.startsWith(g + ' ') || msg.startsWith(g + '!') || msg.startsWith(g + ','));
}

function isPolicyQuestion(msg: string): boolean {
    const policyKeywords = [
        'return policy', 'refund', 'exchange', 'warranty', 'shipping policy',
        'privacy policy', 'terms', 'conditions', 'cancellation', 'guarantee',
    ];
    return policyKeywords.some((k) => msg.includes(k));
}

function isFAQQuestion(msg: string): boolean {
    const faqKeywords = [
        'how do i', 'how to', 'can i', 'do you', 'what is your', 'where can',
        'how long', 'how much does', 'what are the', 'is there a',
    ];
    return faqKeywords.some((k) => msg.includes(k));
}

function isOrderQuestion(msg: string): boolean {
    const orderKeywords = [
        'order', 'tracking', 'shipment', 'delivery', 'where is my', 'order status',
        'package', 'shipped', 'deliver',
    ];
    return orderKeywords.some((k) => msg.includes(k));
}

function isProductSearch(msg: string): boolean {
    const productKeywords = [
        'looking for', 'i need', 'i want', 'show me', 'recommend', 'suggest',
        'best', 'top', 'compare', 'price', 'buy', 'purchase', 'shop',
        'what do you have', 'do you sell', 'any', 'cheapest', 'most expensive',
    ];
    return productKeywords.some((k) => msg.includes(k));
}

function detectCategory(msg: string): string | null {
    const categories: Record<string, string[]> = {
        skincare: ['skincare', 'skin care', 'moisturizer', 'cleanser', 'serum', 'cream', 'spf', 'sunscreen'],
        electronics: ['phone', 'laptop', 'tablet', 'headphone', 'speaker', 'camera', 'charger'],
        fashion: ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'coat', 'hat'],
        food: ['snack', 'coffee', 'tea', 'chocolate', 'protein', 'supplement'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some((k) => msg.includes(k))) {
            return category;
        }
    }
    return null;
}
