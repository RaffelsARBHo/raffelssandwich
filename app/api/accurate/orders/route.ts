//app/api/accurate/orders/route.ts
import { NextResponse } from 'next/server';
import { accurateFetch } from '@/lib/accurate';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const customerNo = searchParams.get('customerNo');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query parameters
    const queryParams = new URLSearchParams({
      // For sales invoices, total can appear as total or totalAmount depending on context.
      fields: 'id,number,transDate,customer,total,totalAmount,status',
      'sp.page': String(page),
      'sp.pageSize': String(pageSize),
    });

    // Add filters if provided
    if (customerNo) {
      queryParams.append('filter.customerNo.op', 'EXACT');
      queryParams.append('filter.customerNo', customerNo);
    }

    if (startDate) {
      queryParams.append('filter.transDate.op', 'GREATER_THAN_OR_EQUAL');
      queryParams.append('filter.transDate', startDate);
    }

    if (endDate) {
      queryParams.append('filter.transDate.op', 'LESS_THAN_OR_EQUAL');
      queryParams.append('filter.transDate', endDate);
    }

    // Use sales-invoice list so amounts match what POS actually creates
    const listResponse = await accurateFetch(
      `/accurate/api/sales-invoice/list.do?${queryParams.toString()}`
    );

    if (!listResponse.s) {
      return NextResponse.json(
        {
          success: false,
          error: listResponse.d || 'Failed to fetch sales orders',
        },
        { status: 400 }
      );
    }

    const rows = (listResponse.d || []) as any[];

    const normalized = rows.map((row) => ({
      ...row,
      // Normalize amount field for frontend (Order.total)
      total: row.total ?? row.totalAmount ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      pagination: listResponse.sp || {
        page,
        pageSize: pageSize,
        pageCount: 1,
        rowCount: 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
