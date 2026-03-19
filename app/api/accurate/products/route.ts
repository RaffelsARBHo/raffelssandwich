//app/api/accurate/products/route.ts
import { accurateFetch } from '@/lib/accurate';
import { useTableStore } from '@/store/tableAndBranchStore';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get pagination and search params from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const branch = useTableStore.getState().branchNo;

    // Build URL with pagination and stock fields
    let url = `/accurate/api/item/list.do?fields=id,name,no,itemType,unitPrice,minimumSellingQuantity,unit1Name,balance,availableToSell,itemTypeName,balanceInUnit,availableToSellInAllUnit,onSales,controlQuantity&sp.page=${page}&sp.pageSize=${pageSize}`;
    // Add search filter if provided
    if (search) {
      // Use CONTAIN operator for partial matching
      url += `&filter.keywords.op=CONTAIN&filter.keywords.val=${encodeURIComponent(search)}`;
    }

    // Fetch products
    const response = await accurateFetch(url);

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      search,
      count: response.d?.length || 0,
      totalCount: response.totalCount || response.sp?.rowCount || 0,
      products: response.d || [],
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