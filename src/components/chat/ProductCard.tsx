import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingCart } from "lucide-react";
import type { ProductRecommendation } from "@/types/ai";

interface ProductCardProps {
    product: ProductRecommendation;
}

const ProductCard = ({ product }: ProductCardProps) => (
    <Card className="bg-muted/50 border-border overflow-hidden max-w-[280px]">
        {product.image_url && (
            <div className="h-32 w-full bg-muted flex items-center justify-center overflow-hidden">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            </div>
        )}
        <CardContent className="p-3">
            <h4 className="text-sm font-medium truncate">{product.name}</h4>
            {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
            )}
            <div className="flex items-center justify-between mt-2">
                {product.price != null && (
                    <span className="text-sm font-bold text-primary">
                        {product.currency === "USD" ? "$" : product.currency}{product.price.toFixed(2)}
                    </span>
                )}
                {product.product_url && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> View
                        </a>
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
);

export default ProductCard;
