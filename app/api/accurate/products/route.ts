// app/api/accurate/products/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const rawBranchNo = searchParams.get('branchNo');
    const normalizedBranchNoRaw =
      typeof rawBranchNo === 'string' ? rawBranchNo.trim() : '';
    const branchNo =
      !normalizedBranchNoRaw ||
      normalizedBranchNoRaw.toLowerCase() === 'all' ||
      (normalizedBranchNoRaw.toLowerCase().includes('all') &&
        normalizedBranchNoRaw.toLowerCase().includes('branch')) ||
      normalizedBranchNoRaw.toLowerCase().includes('semua cabang')
        ? null
        : normalizedBranchNoRaw;
    const isAllBranches = branchNo === null;

    // Category filter — accepts a single category ID
    const categoryId = searchParams.get('categoryId') || null;

    const rawSearch = searchParams.get('search') || '';
    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';

    let branch: { name: string; defaultBranch: boolean } | null = null;
    let selectedBranchId: number | null = null;
    let branches: Array<{
      id: number;
      name: string;
      defaultBranch: boolean;
    }> = [];

    if (!isAllBranches) {
      const branchId = parseInt(branchNo);
      selectedBranchId = branchId;

      // If branchNo is not a valid number — return no products
      if (isNaN(branchId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid branch ID',
            count: 0,
            totalCount: 0,
            products: [],
          },
          { status: 400 }
        );
      }

      const branchesRes = await accurateFetch(
        '/accurate/api/branch/list.do?fields=id,name,defaultBranch&sp.pageSize=100'
      );
      branches = (branchesRes.d || []) as Array<{
        id: number;
        name: string;
        defaultBranch: boolean;
      }>;
      const foundBranch = branches.find((b) => Number(b.id) === branchId) || null;

      if (!foundBranch) {
        return NextResponse.json(
          {
            success: false,
            error: `Branch with ID ${branchId} does not exist`,
            count: 0,
            totalCount: 0,
            products: [],
          },
          { status: 404 }
        );
      }

      branch = { name: foundBranch.name, defaultBranch: foundBranch.defaultBranch };
    }

    // Build product list URL
    let url = `/accurate/api/item/list.do?fields=id,name,no,itemType,unitPrice,minimumSellingQuantity,unit1Name,balance,availableToSell,itemTypeName,balanceInUnit,availableToSellInAllUnit,onSales,controlQuantity,itemBranchName&sp.page=${page}&sp.pageSize=${pageSize}`;

    // ✅ Category filter — passed server-side to Accurate
    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId);
      if (!isNaN(parsedCategoryId)) {
        url += `&filter.itemCategoryId.op=EQUAL&filter.itemCategoryId.val=${parsedCategoryId}`;
      }
    }

    // ✅ Keyword search filter
    if (search) {
      url += `&filter.keywords.op=CONTAIN&filter.keywords.val=${encodeURIComponent(search)}`;
    }

    const listResponse = await accurateFetch(url);
    let products = listResponse.d || [];

    // Filter by branch only when a specific branch is selected.
    // When "All branches" is active, we return the full list (no filtering).
    if (!isAllBranches && branch && selectedBranchId !== null) {
      products = products.filter((product: any) => {
        const productBranch = product.itemBranchName;
        const productBranchName =
          typeof productBranch === 'string' ? productBranch.trim() : productBranch;

        // No branch assigned → show everywhere
        if (!productBranchName) return true;

        // Some Accurate tenants store "visible for all branches" as a literal label.
        // Example from your output: "[Semua Cabang]".
        if (typeof productBranchName === 'string') {
          const pb = productBranchName.toLowerCase();
          if (
            pb === '[semua cabang]' ||
            pb === 'semua cabang' ||
            pb.includes('semua cabang') ||
            pb === 'all branches' ||
            pb === 'all branch' ||
            (pb.includes('all') && pb.includes('branch'))
          ) {
            return true;
          }
        }

        // Map the product's branch name -> branch id (from /branch/list.do).
        // Then compare branch id with selected branch id.
        const matchedBranch = branches.find((b) => {
          const name = b?.name;
          if (
            typeof name !== 'string' ||
            typeof productBranchName !== 'string'
          )
            return false;
          return name.trim().toLowerCase() === productBranchName.toLowerCase();
        });

        if (!matchedBranch) return false;
        return Number(matchedBranch.id) === selectedBranchId;
      });
    }

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      search,
      branchNo,
      categoryId: categoryId || null,
      count: products.length,
      totalCount: products.length,
      products,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error', details: err.toString() },
      { status: 500 }
    );
  }
}
