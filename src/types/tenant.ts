// Types for store profiles, AI configurations, and tenant-related data

export interface StoreProfile {
  id: string;
  owner_id: string;
  store_name: string;
  store_url: string | null;
  industry: string;
  brand_tone: string;
  agent_name: string;
  agent_voice_id: string;
  system_prompt_override: string | null;
  primary_color: string;
  logo_url: string | null;
  welcome_message: string;
  escalation_email: string | null;
  plan: string;
  is_active: boolean;
  slug: string | null;
  timezone: string;
  language: string;
  onboarding_step: number;
  onboarding_completed: boolean;
  api_key_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIConfiguration {
  id: string;
  store_id: string;
  agent_name: string;
  brand_voice: BrandVoice;
  custom_greeting: string;
  fallback_message: string;
  escalation_info: string | null;
  elevenlabs_voice_id: string;
  language: string;
  system_prompt_override: string | null;
  upsell_enabled: boolean;
  max_upsells_per_conversation: number;
  top_k_retrieval: number;
  similarity_threshold: number;
  widget_position: WidgetPosition;
  widget_color: string;
  created_at: string;
  updated_at: string;
}

export type BrandVoice = 'formal' | 'friendly' | 'enthusiastic' | 'professional' | 'casual' | 'luxury';
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type UserRole = 'owner' | 'staff' | 'platform_admin';

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Rachel', description: 'Professional Female' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Professional Male' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Casual Male' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: 'Friendly Female' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: 'Deep Male' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Energetic Female' },
];

export const INDUSTRIES = [
  'General', 'Fashion', 'Electronics', 'Food & Beverage',
  'Beauty', 'Sports', 'Home & Garden', 'Health', 'Automotive', 'Other',
] as const;

export const BRAND_VOICE_OPTIONS: { value: BrandVoice; label: string; description: string }[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm, conversational, and approachable' },
  { value: 'professional', label: 'Professional', description: 'Clear, direct, and efficient' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and positive' },
  { value: 'formal', label: 'Formal', description: 'Courteous and polished' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and easygoing' },
  { value: 'luxury', label: 'Luxury', description: 'Refined and exclusive' },
];
