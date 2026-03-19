'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductGrid } from '@/view/products/productGrid';
import { ProductSearch } from '@/view/products/product-search';
import { Pagination } from '@/components/ui/pagination';
import Maxwidth from '@/components/Maxwidth';
import { usePagination } from '@/hooks/usePagination';
import { useProductImages } from '@/hooks/useProductImages';
import { Skeleton } from '@/components/ui/skeleton';

function SearchWrapper() {
  return (
    <Suspense
      fallback={
        <div className="relative">
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <ProductSearch />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const [productsWithImages, setProductsWithImages] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  const { page, pageSize, setPage, setPageSize, totalPages, paginationParams } =
    usePagination({
      initialPageSize: 12,
      totalItems: totalItems,
    });

  const { data, isLoading: productsLoading } = useProducts(
    search,
    paginationParams
  );

  useEffect(() => {
    const totalItems = data?.totalCount || 0;
    setTotalItems(totalItems);
  }, [data?.totalCount]);

  const products = data?.products || [];
 

  const productIds = useMemo(
    () => products.map((p: any) => p.id).filter(Boolean),
    [products]
  );

  const { data: imagesData, isLoading: imagesLoading } =
    useProductImages(productIds);

  useEffect(() => {
    if (!products.length) {
      setProductsWithImages([]);
      return;
    }

    if (imagesData?.length) {
      const imageMap: any = {};
      imagesData.forEach((item: any) => {
        imageMap[item.productId] = item.image;
      });

      const updated = products.map((product: any) => ({
        ...product,
        image: imageMap[product.id] || null,
      }));

      setProductsWithImages(updated);
    } else {
      setProductsWithImages(products);
    }
  }, [products, imagesData]);

  const isLoading = productsLoading || imagesLoading;

  return (
    <>
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-extrabold tracking-tight">Our Menu</h2>
        <p className="text-muted-foreground">
          {search ? (
            <>
              Found {totalItems} item{totalItems !== 1 ? 's' : ''} matching
              &quot;{search}&quot;
            </>
          ) : (
            <>Fresh sandwiches and tasty bites — {totalItems} items available</>
          )}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-96" id="menu-search">
          <SearchWrapper />
        </div>
        {/* Add more filters here if needed */}
      </div>

      {/* Products Grid */}
      <ProductGrid products={productsWithImages} isLoading={isLoading} />

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={totalItems}
          showPageSize={true}
          showPageInfo={true}
          showFirstLast={true}
          pageSizeOptions={[12, 24, 48, 96]}
          className="mt-8"
          activeButtonClassName="bg-primary text-primary-foreground"
        />
      )}
    </>
  );
}

// ✅ Main export with Suspense boundary
export function ProductsPage() {
  return (
    <Maxwidth className="py-8 space-y-8">
      <Suspense
        fallback={
          <div className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
            <Skeleton className="h-10 w-full sm:w-96" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </Maxwidth>
  );
}