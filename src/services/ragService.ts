// RAG service — tenant-scoped knowledge retrieval via Supabase pgvector
import { supabase } from '@/integrations/supabase/client';
import type { RAGChunk, DocType, IntentClassification } from '@/types/ai';

/**
 * Retrieve relevant knowledge chunks using vector similarity search.
 * Uses the match_knowledge_chunks_filtered Supabase function.
 */
export async function retrieveContext(
    storeId: string,
    queryEmbedding: number[],
    options: {
        docTypes?: DocType[];
        threshold?: number;
        topK?: number;
    } = {}
): Promise<RAGChunk[]> {
    const { docTypes, threshold = 0.70, topK = 6 } = options;

    const { data, error } = await supabase.rpc('match_knowledge_chunks_filtered', {
        query_embedding: queryEmbedding as any,
        match_store_id: storeId,
        match_doc_types: docTypes || null,
        match_threshold: threshold,
        match_count: topK,
    });

    if (error) {
        console.error('RAG retrieval error:', error);
        return [];
    }

    return (data || []).map((chunk: any) => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata || {},
        similarity: chunk.similarity,
    }));
}

/**
 * Package retrieved chunks into a formatted context string for the AI prompt.
 * Includes source attribution and similarity scores.
 */
export function packageContext(chunks: RAGChunk[]): string {
    if (chunks.length === 0) {
        return '[NO RELEVANT CONTEXT FOUND]';
    }

    const formatted = chunks
        .map(
            (chunk, i) =>
                `Source ${i + 1} (similarity: ${chunk.similarity.toFixed(2)}): ${chunk.content}`
        )
        .join('\n\n');

    return `[RETRIEVED CONTEXT]\n${formatted}\n[END CONTEXT]`;
}

/**
 * Map intent classification to doc_type filters for RAG.
 */
export function getDocTypeFilters(intent: IntentClassification): DocType[] {
    return intent.doc_types;
}

/**
 * Get knowledge base stats for a store.
 */
export async function getKnowledgeStats(storeId: string) {
    const [docsResult, chunksResult] = await Promise.all([
        supabase
            .from('knowledge_documents')
            .select('id, status, chunk_count')
            .eq('store_id', storeId)
            .eq('is_active', true),
        supabase
            .from('knowledge_chunks')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('is_active', true),
    ]);

    const docs = docsResult.data || [];
    return {
        totalDocuments: docs.length,
        processedDocuments: docs.filter((d) => d.status === 'complete').length,
        processingDocuments: docs.filter((d) =>
            ['pending', 'extracting', 'chunking', 'embedding'].includes(d.status || '')
        ).length,
        failedDocuments: docs.filter((d) => d.status === 'failed').length,
        totalChunks: chunksResult.count || 0,
    };
}
