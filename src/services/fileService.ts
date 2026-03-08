// File service — upload validation, Supabase Storage upload, and ingestion triggering
import { supabase } from '@/integrations/supabase/client';
import type { DocType } from '@/types/ai';

const N8N_FILE_INGESTION_WEBHOOK = import.meta.env.VITE_N8N_FILE_INGESTION_WEBHOOK_URL || '';

export const ALLOWED_TYPES: Record<string, string[]> = {
    pdf: ['application/pdf'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    doc: ['application/msword'],
    txt: ['text/plain'],
    csv: ['text/csv', 'application/csv'],
    xlsx: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ],
    xls: ['application/vnd.ms-excel'],
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_TYPES);
export const MAX_FILE_SIZE_DEFAULT = 25 * 1024 * 1024; // 25MB

export interface FileUploadOptions {
    storeId: string;
    file: File;
    docType?: DocType;
    maxSize?: number;
}

export interface FileUploadResult {
    documentId: string;
    storagePath: string;
    fileName: string;
}

/**
 * Validate file type, extension, and size before upload.
 */
export function validateFile(
    file: File,
    maxSize: number = MAX_FILE_SIZE_DEFAULT
): string | null {
    // Check file size
    if (file.size > maxSize) {
        const sizeMB = Math.round(maxSize / (1024 * 1024));
        return `File size exceeds ${sizeMB}MB limit`;
    }

    if (file.size === 0) {
        return 'File is empty';
    }

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return `File type .${ext} is not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    // Check MIME type against extension
    const allowedMimes = ALLOWED_TYPES[ext];
    if (allowedMimes && !allowedMimes.includes(file.type)) {
        // Some browsers report empty MIME types, allow those through
        if (file.type !== '' && file.type !== 'application/octet-stream') {
            return `File type mismatch: expected ${allowedMimes.join(' or ')} for .${ext}`;
        }
    }

    return null;
}

/**
 * Upload a file to Supabase Storage and create a knowledge_documents record.
 * Then trigger the n8n ingestion workflow.
 */
export async function uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
    const { storeId, file, docType = 'general', maxSize } = options;

    // Validate
    const validationError = validateFile(file, maxSize);
    if (validationError) {
        throw new Error(validationError);
    }

    // Generate UUID-based filename (security: prevent path traversal)
    const ext = file.name.split('.').pop()?.toLowerCase();
    const uuid = crypto.randomUUID();
    const storedFilename = `${uuid}.${ext}`;
    const storagePath = `${storeId}/${storedFilename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
        });

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Create knowledge_documents record
    const { data: doc, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
            store_id: storeId,
            file_name: file.name,
            file_type: ext,
            file_size_bytes: file.size,
            storage_path: storagePath,
            status: 'pending',
            doc_type: docType,
        })
        .select()
        .single();

    if (docError) {
        // Clean up uploaded file on DB error
        await supabase.storage.from('documents').remove([storagePath]);
        throw new Error(`Failed to create document record: ${docError.message}`);
    }

    // Trigger n8n ingestion workflow (fire-and-forget)
    triggerIngestion(doc.id, storeId).catch((err) => {
        console.error('Failed to trigger ingestion workflow:', err);
    });

    return {
        documentId: doc.id,
        storagePath,
        fileName: file.name,
    };
}

/**
 * Trigger the n8n file ingestion workflow.
 */
async function triggerIngestion(documentId: string, storeId: string): Promise<void> {
    if (!N8N_FILE_INGESTION_WEBHOOK) {
        console.warn('N8N_FILE_INGESTION_WEBHOOK_URL not configured, skipping ingestion trigger');
        return;
    }

    await fetch(N8N_FILE_INGESTION_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            document_id: documentId,
            store_id: storeId,
        }),
    });
}

/**
 * Delete a document and its associated chunks and storage file.
 */
export async function deleteDocument(documentId: string, storeId: string): Promise<void> {
    // Get the document to find storage path
    const { data: doc } = await supabase
        .from('knowledge_documents')
        .select('storage_path')
        .eq('id', documentId)
        .eq('store_id', storeId)
        .single();

    if (!doc) throw new Error('Document not found');

    // Delete chunks first
    await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('document_id', documentId)
        .eq('store_id', storeId);

    // Delete document record
    await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', documentId)
        .eq('store_id', storeId);

    // Delete from storage
    if (doc.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path]);
    }
}
