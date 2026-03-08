// Input validation — Zod schemas for request validation
import { z } from 'zod';

/**
 * Chat message validation schema.
 */
export const chatMessageSchema = z.object({
    message: z.string().min(1, 'Message is required').max(2000, 'Message too long').trim(),
    session_id: z.string().uuid('Invalid session ID'),
    conversation_id: z.string().uuid('Invalid conversation ID').optional(),
    store_id: z.string().uuid('Invalid store ID'),
});

/**
 * File upload metadata validation schema.
 */
export const fileUploadSchema = z.object({
    store_id: z.string().uuid('Invalid store ID'),
    doc_type: z.enum(['catalog', 'policy', 'faq', 'general']).default('general'),
    file_name: z.string().min(1).max(255),
    file_type: z.enum(['pdf', 'docx', 'doc', 'txt', 'csv', 'xlsx', 'xls']),
    file_size: z.number().positive().max(100 * 1024 * 1024), // 100MB absolute max
});

/**
 * Store profile update validation schema.
 */
export const storeProfileSchema = z.object({
    store_name: z.string().min(1).max(255).optional(),
    store_url: z.string().url().optional().or(z.literal('')),
    industry: z.string().max(100).optional(),
    brand_tone: z.enum(['friendly', 'professional', 'enthusiastic', 'formal', 'casual', 'luxury']).optional(),
    agent_name: z.string().min(1).max(100).optional(),
    escalation_email: z.string().email().optional().or(z.literal('')),
    primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
    timezone: z.string().max(100).optional(),
    language: z.string().max(10).optional(),
});

/**
 * AI configuration update validation schema.
 */
export const aiConfigSchema = z.object({
    agent_name: z.string().min(1).max(100).optional(),
    brand_voice: z.enum(['formal', 'friendly', 'enthusiastic', 'professional', 'casual', 'luxury']).optional(),
    custom_greeting: z.string().max(500).optional(),
    fallback_message: z.string().max(500).optional(),
    escalation_info: z.string().max(500).optional(),
    elevenlabs_voice_id: z.string().max(100).optional(),
    upsell_enabled: z.boolean().optional(),
    max_upsells_per_conversation: z.number().int().min(0).max(10).optional(),
    top_k_retrieval: z.number().int().min(1).max(20).optional(),
    similarity_threshold: z.number().min(0).max(1).optional(),
    widget_position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
    widget_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

/**
 * Sanitize user input by stripping potentially dangerous content.
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Validate and sanitize a chat message.
 */
export function validateChatMessage(data: unknown) {
    const result = chatMessageSchema.safeParse(data);
    if (!result.success) {
        throw new Error(result.error.issues.map((i) => i.message).join(', '));
    }
    return {
        ...result.data,
        message: sanitizeInput(result.data.message),
    };
}
