-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STORE PROFILES
CREATE TABLE public.store_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store_name TEXT NOT NULL,
  store_url TEXT,
  industry TEXT DEFAULT 'general',
  brand_tone TEXT DEFAULT 'friendly',
  agent_name TEXT DEFAULT 'Alex',
  agent_voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  system_prompt_override TEXT,
  primary_color TEXT DEFAULT '#6366F1',
  logo_url TEXT,
  welcome_message TEXT DEFAULT 'Hi! How can I help you today?',
  escalation_email TEXT,
  plan TEXT DEFAULT 'free',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KNOWLEDGE DOCUMENTS
CREATE TABLE public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  error_message TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KNOWLEDGE CHUNKS (with vector embeddings)
CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  content_hash TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  sku TEXT,
  category TEXT,
  tags TEXT[],
  image_urls TEXT[],
  product_url TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER,
  variants JSONB DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  related_product_ids UUID[],
  source_document_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT,
  email TEXT,
  full_name TEXT,
  metadata JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_conversations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONVERSATIONS
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  channel TEXT DEFAULT 'chat',
  status TEXT DEFAULT 'active',
  topic TEXT,
  sentiment TEXT DEFAULT 'neutral',
  message_count INTEGER DEFAULT 0,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.store_profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'assistant', 'system')),
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  audio_url TEXT,
  products_referenced UUID[],
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  external_order_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  items JSONB DEFAULT '[]',
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB DEFAULT '{}',
  tracking_number TEXT,
  carrier TEXT,
  estimated_delivery_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOICE LOGS
CREATE TABLE public.voice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id),
  message_id UUID REFERENCES public.messages(id),
  store_id UUID REFERENCES public.store_profiles(id),
  transcript TEXT,
  output_text TEXT,
  output_audio_url TEXT,
  voice_id TEXT,
  stt_latency_ms INTEGER,
  tts_latency_ms INTEGER,
  total_latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANALYTICS EVENTS
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.store_profiles(id),
  conversation_id UUID REFERENCES public.conversations(id),
  customer_id UUID REFERENCES public.customers(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  product_id UUID REFERENCES public.products(id),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_knowledge_chunks_store ON public.knowledge_chunks (store_id, is_active);
CREATE INDEX idx_messages_conversation ON public.messages (conversation_id, created_at);
CREATE INDEX idx_conversations_store ON public.conversations (store_id, status, created_at);
CREATE INDEX idx_analytics_events_store ON public.analytics_events (store_id, event_type, created_at);

-- VECTOR SEARCH FUNCTION
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding VECTOR(1536),
  match_store_id UUID,
  match_threshold FLOAT DEFAULT 0.70,
  match_count INT DEFAULT 8
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
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners manage own stores" ON public.store_profiles FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Public read store profiles for chat" ON public.store_profiles FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Owners manage own documents" ON public.knowledge_documents
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));

CREATE POLICY "Owners manage own chunks" ON public.knowledge_chunks
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can read chunks for chat" ON public.knowledge_chunks
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Owners manage own products" ON public.products
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can read active products" ON public.products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Owners manage own conversations" ON public.conversations
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Owners manage own messages" ON public.messages
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can insert and read messages" ON public.messages
  FOR SELECT USING (TRUE);
CREATE POLICY "Public can insert messages" ON public.messages
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Owners manage own customers" ON public.customers
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can insert customers" ON public.customers
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Owners manage own orders" ON public.orders
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));

CREATE POLICY "Owners manage own voice logs" ON public.voice_logs
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));

CREATE POLICY "Owners manage own analytics" ON public.analytics_events
  FOR ALL USING (store_id IN (SELECT id FROM public.store_profiles WHERE owner_id = auth.uid()));
CREATE POLICY "Public can insert analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (TRUE);

-- REALTIME
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- UPDATE TIMESTAMP FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_profiles_updated_at BEFORE UPDATE ON public.store_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON public.knowledge_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-responses', 'voice-responses', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

-- Storage policies
CREATE POLICY "Owners can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.store_profiles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can read own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.store_profiles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can read voice responses" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-responses');

CREATE POLICY "Public can read store assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

CREATE POLICY "Owners can upload store assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.store_profiles WHERE owner_id = auth.uid()
    )
  );