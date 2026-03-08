-- Fix function search path warnings
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION match_knowledge_chunks(VECTOR(1536), UUID, FLOAT, INT) SET search_path = public;