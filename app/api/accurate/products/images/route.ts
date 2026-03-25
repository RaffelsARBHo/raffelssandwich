// app/api/accurate/products/images/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

async function fetchImagesInBatches(
  productIds: (string | number)[],
  batchSize = 6
) {
  const results = [];

  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const detailRes = await accurateFetch(
            `/accurate/api/item/detail.do?id=${id}`
          );

          return {
            productId: id,
            images:
              detailRes.d?.detailItemImage?.map((img: any) => ({
                id: img.id,
                // Use proxy URL for authenticated access
                fileName: img.fileName
                  ? `/api/accurate/image?path=${encodeURIComponent(
                      img.fileName
                    )}`
                  : null,
                thumbnailPath: img.thumbnailPath
                  ? `/api/accurate/image?path=${encodeURIComponent(
                      img.thumbnailPath
                    )}`
                  : null,
                originalName: img.originalName,
                seq: img.seq,
              })) || [],
            thumbnail: detailRes.d?.detailItemImage?.[0]?.thumbnailPath
              ? `/api/accurate/image?path=${encodeURIComponent(
                  detailRes.d.detailItemImage[0].thumbnailPath
                )}`
              : null,
          };
        } catch (err: any) {
          return {
            productId: id,
            images: [],
            thumbnail: null,
            error: err.message,
          };
        }
      })
    );

    results.push(...batchResults);

    // Wait 1 second between batches
    if (i + batchSize < productIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export async function POST(request: Request) {
  try {
    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      );
    }

    const imagesData = await fetchImagesInBatches(productIds);

    return NextResponse.json({
      success: true,
      data: imagesData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
