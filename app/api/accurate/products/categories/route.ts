// app/api/accurate/products/categories/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const search = searchParams.get('search')?.trim() || '';
    const leafOnly = searchParams.get('leafOnly') === 'true';

    // Use cache for full unfiltered category list
    const useCache = !search && leafOnly === false && page === 1;

    let url = `/accurate/api/item-category/list.do?fields=id,name,no&sp.page=${page}&sp.pageSize=${pageSize}`;

    if (search) {
      url += `&filter.keywords.op=CONTAIN&filter.keywords.val=${encodeURIComponent(search)}`;
    }

    if (leafOnly) {
      url += `&filter.leafOnly=true`;
    }

    const res = await accurateFetch(url, {
      accurateCache: useCache,
      cacheTtlMs: 10 * 60 * 1000, // 10 minutes
    });
    const categories: { id: number; name: string; no: string }[] = res.d || [];

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      count: categories.length,
      categories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error', details: err.toString() },
      { status: 500 }
    );
  }
}
