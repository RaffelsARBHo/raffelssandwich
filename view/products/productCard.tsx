// view/products/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
}

export function ProductCard({
  product,
  variant = 'default',
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const isOutOfStock = product.availableToSell === 0;
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-lg',
        variant === 'compact' && 'flex flex-col'
      )}
      onClick={() => router.push(`/product-detail?id=${product.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}

        {isOutOfStock && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            Out of Stock
          </Badge>
        )}

        {product.unitPrice > 100 && (
          <Badge variant="secondary" className="absolute right-2 top-2">
            Premium
          </Badge>
        )}
      </div>

      <CardContent className="p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base sm:text-lg font-bold">
            Rp{product.unitPrice.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-muted-foreground bg-gray-800 rounded-full px-2 py-1">
            Available {product.availableToSell}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
        <div className="flex w-full gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(
                {
                  id: product.id,
                  no: product.no,
                  name: product.name,
                  unitPrice: product.unitPrice,
                  imageUrlThumb: product.image,
                  availableToSell: product.availableToSell,
                } as any,
                1
              );
            }}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        
        </div>
      </CardFooter>
    </Card>
  );
}
