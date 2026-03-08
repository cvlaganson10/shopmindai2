-- ============================================================================
-- Migration: Add Technical Design Tables
-- Adds missing tables, columns, RLS policies, and seed data from the
-- AI eCommerce SaaS Technical Design specification.
-- ============================================================================

-- ============================================================================
-- 1. NEW TABLES
-- ============================================================================

-- SUBSCRIPTION PLANS (SaaS plan definitions)
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_files INTEGER NOT NULL DEFAULT 10,
  max_products INTEGER NOT NULL DEFAULT 50,
  max_conversations_per_month INTEGER NOT NULL DEFAULT 500,
  max_file_size_mb INTEGER NOT NULL DEFAULT 20,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS (per-store subscription tracking)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.store_profiles(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan_id UUID REFERENCES public.subscription_plans(id),
  status VARCHAR(50) DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING EVENTS (Stripe webhook audit log)
CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT VARIANTS (size, color, weight options)
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.store_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  sku_variant VARCHAR(100),
  price_override DECIMAL(10,2),
  stock_available BOOLEAN DEFAULT TRUE,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT RELATIONSHIPS (cross-sell, upsell, accessory, bundle)
CREATE TABLE public.product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.store_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL
    CHECK (relationship_type IN ('related', 'bundle', 'accessory', 'premium_version', 'replenishment')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI CONFIGURATIONS (per-store AI agent settings)
CREATE TABLE public.ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.store_profiles(id) ON DELETE CASCADE UNIQUE,
  agent_name VARCHAR(100) DEFAULT 'Alex',
  brand_voice VARCHAR(50) DEFAULT 'friendly'
    CHECK (brand_voice IN ('formal', 'friendly', 'enthusiastic', 'professional', 'casual', 'luxury')),
  custom_greeting TEXT DEFAULT 'Hi! How can I help you today?',
  fallback_message TEXT DEFAULT 'I don''t have that information available, but you can reach out to the store directly for help.',
  escalation_info TEXT,
  elevenlabs_voice_id VARCHAR(100) DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  language VARCHAR(10) DEFAULT 'en',
  system_prompt_override TEXT,
  upsell_enabled BOOLEAN DEFAULT TRUE,
  max_upsells_per_conversation INTEGER DEFAULT 2,
  top_k_retrieval INTEGER DEFAULT 6,
  similarity_threshold FLOAT DEFAULT 0.70,
  widget_position VARCHAR(20) DEFAULT 'bottom-right',
  widget_color VARCHAR(7) DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS (security audit trail — append-only)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id),
  actor_user_id UUID,
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USAGE METRICS (per-store billing period usage)
CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.store_profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  conversations_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  files_processed INTEGER DEFAULT 0,
  voice_seconds INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ALTER EXISTING TABLES — Add missing columns
-- ============================================================================

-- knowledge_documents: add doc_type for RAG filtering
ALTER TABLE public.knowledge_documents
  ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50) DEFAULT 'general'
    CHECK (doc_type IN ('catalog', 'policy', 'faq', 'general'));

-- knowledge_documents: add retry tracking
ALTER TABLE public.knowledge_documents
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- knowledge_chunks: add embedding status tracking
ALTER TABLE public.knowledge_chunks
  ADD COLUMN IF NOT EXISTS embedding_status VARCHAR(20) DEFAULT 'complete'
    CHECK (embedding_status IN ('pending', 'complete', 'failed'));

-- knowledge_chunks: add token count
ALTER TABLE public.knowledge_chunks
  ADD COLUMN IF NOT EXISTS token_count INTEGER;

-- products: add review status for AI extraction pipeline
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'auto_approved'
    CHECK (review_status IN ('auto_approved', 'needs_review', 'reviewed'));

-- products: add extraction confidence score
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS extraction_confidence FLOAT;

-- products: add benefits and features arrays
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS benefits TEXT[];

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS features TEXT[];

-- messages: track which RAG chunks were used
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS retrieved_chunk_ids UUID[];

-- conversations: add ai_resolved flag
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS ai_resolved BOOLEAN DEFAULT FALSE;

-- store_profiles: add slug for public URLs
ALTER TABLE public.store_profiles
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- store_profiles: add timezone and language
ALTER TABLE public.store_profiles
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC';

ALTER TABLE public.store_profiles
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- store_profiles: add onboarding tracking
ALTER TABLE public.store_profiles
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

ALTER TABLE public.store_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- store_profiles: add API key for widget authentication
ALTER TABLE public.store_profiles
  ADD COLUMN IF NOT EXISTS api_key_hash TEXT;

-- voice_logs: add STT confidence and error tracking
ALTER TABLE public.voice_logs
  ADD COLUMN IF NOT EXISTS stt_confidence FLOAT;

ALTER TABLE public.voice_logs
  ADD COLUMN IF NOT EXISTS error_type VARCHAR(100);

ALTER TABLE public.voice_logs
  ADD COLUMN IF NOT EXISTS stage VARCHAR(20)
    CHECK (stage IN ('stt', 'tts', 'processing'));

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_store ON public.subscriptions (store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions (stripe_customer_id);

-- Billing events (idempotency lookups)
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event ON public.billing_events (stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_store ON public.billing_events (store_id, created_at);

-- Product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id);

-- Product relationships
CREATE INDEX IF NOT EXISTS idx_product_relationships_product ON public.product_relationships (product_id, relationship_type);

-- AI configurations
CREATE INDEX IF NOT EXISTS idx_ai_configurations_store ON public.ai_configurations (store_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_store ON public.audit_logs (store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action, created_at);

-- Usage metrics
CREATE INDEX IF NOT EXISTS idx_usage_metrics_store_period ON public.usage_metrics (store_id, period_start, period_end);

-- Knowledge chunks: doc_type filtering for RAG
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc_type
  ON public.knowledge_chunks USING GIN ((metadata->'doc_type'));

-- Products: review queue filtering
CREATE INDEX IF NOT EXISTS idx_products_review_status ON public.products (store_id, review_status);

-- Store profiles: slug lookup
CREATE INDEX IF NOT EXISTS idx_store_profiles_slug ON public.store_profiles (slug);

-- ============================================================================
-- 4. UPDATED VECTOR SEARCH FUNCTION (with doc_type filtering)
-- ============================================================================

CREATE OR REPLACE FUNCTION match_knowledge_chunks_filtered(
  query_embedding VECTOR(1536),
  match_store_id UUID,
  match_doc_types TEXT[] DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.70,
  match_count INT DEFAULT 6
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT kc.id, kc.content, kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.store_id = match_store_id
    AND kc.is_active = TRUE
    AND kc.embedding_status = 'complete'
    AND (match_doc_types IS NULL OR kc.metadata->>'doc_type' = ANY(match_doc_types))
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY ON NEW TABLES
-- ============================================================================

-- Subscription plans: public read, admin-only write
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = TRUE);

-- Subscriptions: store owners only
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own subscriptions" ON public.subscriptions
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));

-- Billing events: store owners can read their own
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own billing events" ON public.billing_events
  FOR SELECT USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));

-- Product variants: store owners only
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own variants" ON public.product_variants
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can read active variants" ON public.product_variants
  FOR SELECT USING (TRUE);

-- Product relationships: store owners only
ALTER TABLE public.product_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own relationships" ON public.product_relationships
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can read relationships" ON public.product_relationships
  FOR SELECT USING (TRUE);

-- AI configurations: store owners only
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own ai config" ON public.ai_configurations
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can read ai config for widget" ON public.ai_configurations
  FOR SELECT USING (TRUE);

-- Audit logs: append-only for authenticated, read by owner
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners read own audit logs" ON public.audit_logs
  FOR SELECT USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));

-- Usage metrics: store owners read their own
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own usage" ON public.usage_metrics
  FOR SELECT USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));

-- ============================================================================
-- 6. TRIGGERS for updated_at on new tables
-- ============================================================================

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_configurations_updated_at
  BEFORE UPDATE ON public.ai_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at
  BEFORE UPDATE ON public.usage_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. AUTO-CREATE AI CONFIGURATION on store creation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ai_configurations (store_id, agent_name, brand_voice, elevenlabs_voice_id, widget_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.agent_name, 'Alex'),
    COALESCE(NEW.brand_tone, 'friendly'),
    COALESCE(NEW.agent_voice_id, 'EXAVITQu4vr4xnSDxMaL'),
    COALESCE(NEW.primary_color, '#6366F1')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_store_created
  AFTER INSERT ON public.store_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_store();

-- ============================================================================
-- 8. GENERATE SLUG from store name
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_store_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(trim(NEW.store_name), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;

    WHILE EXISTS (SELECT 1 FROM public.store_profiles WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_slug_on_insert
  BEFORE INSERT ON public.store_profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_store_slug();

-- ============================================================================
-- 9. SEED DATA — Subscription Plans
-- ============================================================================

INSERT INTO public.subscription_plans (name, monthly_price, yearly_price, max_files, max_products, max_conversations_per_month, max_file_size_mb, features) VALUES
  ('Starter', 29.00, 290.00, 10, 50, 500, 20, '{"voice": false, "upselling": false, "analytics_basic": true, "team_members": 1}'::jsonb),
  ('Growth', 79.00, 790.00, 50, 500, 2000, 50, '{"voice": true, "upselling": true, "analytics_basic": true, "analytics_advanced": false, "team_members": 3}'::jsonb),
  ('Pro', 179.00, 1790.00, -1, -1, 10000, 100, '{"voice": true, "upselling": true, "analytics_basic": true, "analytics_advanced": true, "team_members": -1, "custom_prompts": true}'::jsonb);

-- ============================================================================
-- 10. REALTIME subscriptions for new tables
-- ============================================================================

ALTER TABLE public.knowledge_documents REPLICA IDENTITY FULL;
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.ai_configurations REPLICA IDENTITY FULL;
