// app/api/accurate/products/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

const g = globalThis as any;
if (!g.__branchCache) {
  g.__branchCache = { data: null, expiry: 0 };
}

// Returns { name, isDefault } for a given branch ID, or null if not found
async function getBranch(
  branchId: number
): Promise<{ name: string; isDefault: boolean } | null> {
  const now = Date.now();
  const cache = g.__branchCache;

  if (!cache.data || now > cache.expiry) {
    const res = await accurateFetch(
      `/accurate/api/branch/list.do?fields=id,name,defaultBranch&sp.pageSize=100`
    );
    cache.data = res.d || [];
    cache.expiry = now + 10 * 60 * 1000;
  }

  const branch = cache.data.find((b: any) => b.id === branchId);
  if (!branch) return null;
  return { name: branch.name, isDefault: branch.defaultBranch === true };
}

// Returns the default branch name (e.g. "Kantor Pusat")
async function getDefaultBranchName(): Promise<string | null> {
  const now = Date.now();
  const cache = g.__branchCache;

  if (!cache.data || now > cache.expiry) {
    const res = await accurateFetch(
      `/accurate/api/branch/list.do?fields=id,name,defaultBranch&sp.pageSize=100`
    );
    cache.data = res.d || [];
    cache.expiry = now + 10 * 60 * 1000;
  }

  const defaultBranch = cache.data.find((b: any) => b.defaultBranch === true);
  return defaultBranch?.name || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const branchNo = searchParams.get('branchNo') || null;

    const rawSearch = searchParams.get('search') || '';
    const search =
      typeof rawSearch === 'string' && !rawSearch.includes('[native code]')
        ? rawSearch.trim()
        : '';

    let url = `/accurate/api/item/list.do?fields=id,name,no,itemType,unitPrice,minimumSellingQuantity,unit1Name,balance,availableToSell,itemTypeName,balanceInUnit,availableToSellInAllUnit,onSales,controlQuantity,itemBranchName&sp.page=${page}&sp.pageSize=${pageSize}`;

    if (search) {
      url += `&filter.keywords.op=CONTAIN&filter.keywords.val=${encodeURIComponent(
        search
      )}`;
    }

    const listResponse = await accurateFetch(url);
    let products = listResponse.d || [];

    if (branchNo && products.length > 0) {
      const branchId = parseInt(branchNo);

      if (!isNaN(branchId)) {
        const branch = await getBranch(branchId);

        if (branch?.name === '[Semua Cabang]') {
          return NextResponse.json(
            {
              success: false,
              error: `Branch with ID ${branchId} does not exist`,
            },
            { status: 404 }
          );
        }

        // Get default branch name so we can treat it as "no restriction"
        const defaultBranchName = await getDefaultBranchName();
        products = products.filter((product: any) => {
          const productBranch = product.itemBranchName;

          // ✅ No branch assigned → show everywhere
          if (!productBranch) return true;

          // ✅ Assigned to default branch (e.g. "Kantor Pusat") → show everywhere
          if (productBranch === defaultBranchName) return true;

          // ✅ Explicitly assigned to this branch → show
          if (productBranch === branch?.name) return true;

          // ❌ Assigned to a different specific branch → hide
          return false;
        });
      }
    }

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      search,
      branchNo,
      count: products.length,
      totalCount: branchNo ? products.length : listResponse.sp?.rowCount || 0,
      products,
    });
  } catch (err: any) {
    console.error('❌ Error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Internal server error',
        details: err.toString(),
      },
      { status: 500 }
    );
  }
}
