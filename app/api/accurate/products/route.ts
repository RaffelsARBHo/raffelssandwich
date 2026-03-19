// app/api/accurate/products/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

// Cache branch list to avoid fetching on every request
const g = globalThis as any;
if (!g.__branchCache) {
  g.__branchCache = { data: null, expiry: 0 };
}

async function getBranchName(branchId: number): Promise<string | null> {
  const now = Date.now();
  const cache = g.__branchCache;

  // Refresh branch cache every 10 minutes
  if (!cache.data || now > cache.expiry) {
    const res = await accurateFetch(`/accurate/api/branch/list.do?fields=id,name&sp.pageSize=100`);
    cache.data = res.d || [];
    cache.expiry = now + 10 * 60 * 1000;
    console.log('🏢 Branch list cached:', cache.data.map((b: any) => `${b.id}=${b.name}`));
  }

  const branch = cache.data.find((b: any) => b.id === branchId);
  return branch?.name || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const branchNo = searchParams.get('branchNo') || null;

    const rawSearch = searchParams.get('search') || '';
    const search = typeof rawSearch === 'string' && !rawSearch.includes('[native code]')
      ? rawSearch.trim()
      : '';

    let url = `/accurate/api/item/list.do?fields=id,name,no,itemType,unitPrice,minimumSellingQuantity,unit1Name,balance,availableToSell,itemTypeName,balanceInUnit,availableToSellInAllUnit,onSales,controlQuantity,itemBranchName&sp.page=${page}&sp.pageSize=${pageSize}`;

    if (search) {
      url += `&filter.keywords.op=CONTAIN&filter.keywords.val=${encodeURIComponent(search)}`;
    }

    const listResponse = await accurateFetch(url);
    let products = listResponse.d || [];

    console.log(`📦 Got ${products.length} products, branchNo: ${branchNo}`);

    // Filter by itemBranchName
    if (branchNo && products.length > 0) {
      const branchId = parseInt(branchNo);

      if (!isNaN(branchId)) {
        // Get the branch name for this branchId
        const branchName = await getBranchName(branchId);
        console.log(`🔍 Branch ${branchId} = "${branchName}"`);

        if (branchName) {
          products = products.filter((product: any) => {
            const productBranch = product.itemBranchName;

            // No branch assigned = available on all branches
            if (!productBranch) return true;

            // Show if product belongs to this branch OR to head office
            return productBranch === branchName;
          });

          console.log(`✅ After branch "${branchName}" filter: ${products.length} products`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      search,
      branchNo,
      count: products.length,
      totalCount: branchNo ? products.length : (listResponse.sp?.rowCount || 0),
      products,
    });
  } catch (err: any) {
    console.error('❌ Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error', details: err.toString() },
      { status: 500 }
    );
  }
}