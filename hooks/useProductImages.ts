// hooks/useProductImages.ts
import { useQuery } from '@tanstack/react-query';

// API 1: POST /api/accurate/products/images
async function fetchProductImages(productIds: (string | number)[]) {
  if (!productIds || productIds.length === 0) {
    return [];
  }

  const res = await fetch('/api/accurate/products/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productIds }),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch product images');
  }

  const data = await res.json();

  // Transform URLs to use our proxy API (API 2)
  const transformedData = (data.data || []).map((item: any) => ({
    productId: item.productId,
    image: item.images?.[0]?.fileName ? item.images[0].fileName : null,
    // images: (item.images || []).map((img: any) => ({
    //   ...img,
    //   // Convert full URLs to proxy URLs
    //   fileName: img.fileName ? transformToProxyUrl(img.fileName) : null,
    //   thumbnailPath: img.thumbnailPath ? transformToProxyUrl(img.thumbnailPath) : null,
    // })),
    // First image thumbnail for product card
    // thumbnail: item.images?.[0]?.thumbnailPath
    //   ? transformToProxyUrl(item.images[0].thumbnailPath)
    //   : null,
  }));
  return transformedData;
}

// API 2: GET /api/accurate/images/[...path]
// Helper to convert full URL to proxy URL
function transformToProxyUrl(fullUrl: string): string {
  if (!fullUrl) return fullUrl;

  // Extract path after /accurate/files/
  // https://zeus.accurate.id/accurate/files/data_2484809/item-image/item_253/file.jpg
  // -> /api/accurate/images/data_2484809/item-image/item_253/file.jpg
  const match = fullUrl.match(/\/accurate\/files\/(.+)/);
  if (match && match[1]) {
    return `${match[1]}`;
  }
  return fullUrl;
}

export function useProductImages(productIds: (string | number)[]) {
  return useQuery({
    queryKey: ['productImages', productIds],
    queryFn: () => fetchProductImages(productIds),
    enabled: productIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
  });
}
