// Types for products, variants, relationships, and review queue

export interface Product {
    id: string;
    store_id: string;
    name: string;
    description: string | null;
    price: number | null;
    compare_at_price: number | null;
    currency: string;
    sku: string | null;
    category: string | null;
    tags: string[];
    image_urls: string[];
    product_url: string | null;
    in_stock: boolean;
    stock_quantity: number | null;
    variants: Record<string, unknown>;
    specifications: Record<string, unknown>;
    related_product_ids: string[];
    source_document_id: string | null;
    is_active: boolean;
    review_status: ReviewStatus;
    extraction_confidence: number | null;
    benefits: string[] | null;
    features: string[] | null;
    created_at: string;
    updated_at: string;
}

export type ReviewStatus = 'auto_approved' | 'needs_review' | 'reviewed';

export interface ProductVariant {
    id: string;
    store_id: string;
    product_id: string;
    variant_name: string;
    sku_variant: string | null;
    price_override: number | null;
    stock_available: boolean;
    attributes: Record<string, string>;
    created_at: string;
}

export type RelationshipType = 'related' | 'bundle' | 'accessory' | 'premium_version' | 'replenishment';

export interface ProductRelationship {
    id: string;
    store_id: string;
    product_id: string;
    related_product_id: string;
    relationship_type: RelationshipType;
    display_order: number;
    created_at: string;
}

export interface ProductWithRelations extends Product {
    product_variants?: ProductVariant[];
    product_relationships?: (ProductRelationship & { related_product?: Product })[];
}
