// view/products/product-detail.tsx
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { useProductDetail } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Minus,
  Plus,
  ShoppingCart,
  Check,
  Truck,
  Shield,
  RotateCcw,
  ImageOff,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Maxwidth from '@/components/Maxwidth';

export default function ProductDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') as string;
  const { data, isLoading, error } = useProductDetail(id);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);

  const product = data?.data;

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error) {
    return (
      <Maxwidth className="py-16 text-center max-w-5xl">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <p className="mt-2 text-muted-foreground">
          The product you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Button className="mt-8" asChild>
          <a href="/">Continue Shopping</a>
        </Button>
      </Maxwidth>
    );
  }

  const images = product?.images || [];
  const mainImage =
    images[selectedImage]?.fileName ||
    images[0]?.fileName ||
    product.thumbnail;


  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        no: product.no,
        name: product.name,
        unitPrice: product.unitPrice,
        imageUrlThumb: mainImage,
        availableToSell: product.availableToSell,
      } as any,
      quantity
    );
  };

  return (
    <Maxwidth className="py-8 space-y-8 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex text-sm text-muted-foreground">
        <a href="/" className="hover:text-primary">
          Menu
        </a>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            {mainImage && !imageError ? (
              <img
                src={mainImage}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <ImageOff className="h-16 w-16 text-muted-foreground/40" />
                <span className="mt-2 text-sm text-muted-foreground">
                  No image available
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((image: any, index: number) => (
                <button
                  key={image.id}
                  className={`relative aspect-square overflow-hidden rounded-lg border transition-all ${
                    selectedImage === index
                      ? 'ring-2 ring-primary'
                      : 'hover:opacity-75'
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  {image.thumbnailPath ? (
                    <img
                      src={image.thumbnailPath}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-muted-foreground">SKU: {product.no}</p>
          </div>

          {/* Price & Stock */}
          <div className="flex items-baseline gap-4">
            <div className="space-y-1">
              <div className="text-4xl font-extrabold tracking-tight">
                Rp{product.unitPrice.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {product.availableToSell && product.availableToSell > 0 ? (
              <>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  In Stock
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {product.availableToSell} available
                </span>
              </>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          <Separator />

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={product.availableToSell}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="h-10 w-20 rounded-none text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() =>
                    setQuantity(
                      Math.min(
                        product.availableToSell || quantity,
                        quantity + 1
                      )
                    )
                  }
                  disabled={quantity >= (product.availableToSell || Infinity)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full shadow-sm"
              onClick={handleAddToCart}
              // disabled={
              //   !product.availableToSell || product.availableToSell === 0
              // }
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>

          <Separator />

          {/* Warehouse Stock */}
          {product.warehouses && product.warehouses.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 font-semibold">Available in Warehouses</h3>
                <div className="space-y-2">
                  {product.warehouses.map((warehouse: any) => (
                    <div
                      key={warehouse.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {warehouse.name}
                      </span>
                      <span className="font-medium">
                        {warehouse.balance} units
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Maxwidth>
  );
}

function ProductDetailSkeleton() {
  return (
    <Maxwidth className="py-8 space-y-8 max-w-5xl">
      {/* Breadcrumb Skeleton */}
      <Skeleton className="h-5 w-64" />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Section */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="space-y-6">
          {/* Title & SKU */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-32" />
          </div>

          {/* Price */}
          <Skeleton className="h-12 w-40" />

          {/* Stock Badge */}
          <Skeleton className="h-6 w-32" />

          {/* Separator */}
          <Skeleton className="h-px w-full" />

          {/* Quantity Controls */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-xs" />
            <Skeleton className="h-12 w-full" />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>

          {/* Separator */}
          <Skeleton className="h-px w-full" />

          {/* Warehouse Card */}
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </Maxwidth>
  );
}