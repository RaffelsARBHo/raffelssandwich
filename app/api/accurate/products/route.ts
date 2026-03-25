// app/api/accurate/products/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const branchNo = searchParams.get('branchNo') || null;

    // Category filter — accepts a single category ID
    const categoryId = searchParams.get('categoryId') || null;

    const rawSearch = searchParams.get('search') || '';
    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';

    // ✅ If no branchNo provided — return no products
    if (!branchNo) {
      return NextResponse.json({
        success: false,
        error: 'Branch ID is required',
        count: 0,
        totalCount: 0,
        products: [],
      }, { status: 400 });
    }

    const branchId = parseInt(branchNo);

    // ✅ If branchNo is not a valid number — return no products
    if (isNaN(branchId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid branch ID',
        count: 0,
        totalCount: 0,
        products: [],
      }, { status: 400 });
    }

    const branchesRes = await accurateFetch(
      '/accurate/api/branch/list.do?fields=id,name,defaultBranch&sp.pageSize=100'
    );
    const branches: Array<{ id: number; name: string; defaultBranch: boolean }> = branchesRes.d || [];
    const branch = branches.find((b) => Number(b.id) === branchId);

    // If branch not found in Accurate — return no products
    if (!branch) {
      return NextResponse.json({
        success: false,
        error: `Branch with ID ${branchId} does not exist`,
        count: 0,
        totalCount: 0,
        products: [],
      }, { status: 404 });
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

    // Filter by branch
    const defaultBranchName =
      branches.find((b) => b.defaultBranch === true)?.name ?? null;

    products = products.filter((product: any) => {
      const productBranch = product.itemBranchName;

      // No branch assigned → show everywhere
      if (!productBranch) return true;

      // Assigned to default branch → show everywhere
      if (productBranch === defaultBranchName) return true;

      // Explicitly assigned to this branch → show
      if (productBranch === branch.name) return true;

      // Assigned to a different branch → hide
      return false;
    });

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
