//app/api/accurate/customer/[id]/route.ts
import { NextResponse } from 'next/server';
import { accurateFetch } from '@/lib/accurate';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;

  if (!id || id === 'undefined') {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid customer ID',
      },
      { status: 400 }
    );
  }

  try {
    // Fetch customer detail from Accurate API
    const detailResponse = await accurateFetch(
      `/accurate/api/customer/detail.do?id=${id}`
    );

    if (!detailResponse.s) {
      return NextResponse.json(
        {
          success: false,
          error: detailResponse.d || 'Failed to fetch customer detail',
        },
        { status: 404 }
      );
    }

    // Extract customer data
    const customerData = detailResponse.d || {};

    // Return minimal e-commerce fields
    return NextResponse.json({
      success: true,
      customer: {
        id: customerData.id || null,
        customerNo: customerData.customerNo || null,
        name: customerData.name || null,
        email: customerData.email || null,
        mobilePhone: customerData.mobilePhone || null,
        billStreet: customerData.billStreet || null,
        billCity: customerData.billCity || null,
        billProvince: customerData.billProvince || null,
        billCountry: customerData.billCountry || null,
        billZipCode: customerData.billZipCode || null,
        shipStreet: customerData.shipStreet || null,
        shipCity: customerData.shipCity || null,
        shipProvince: customerData.shipProvince || null,
        shipCountry: customerData.shipCountry || null,
        shipZipCode: customerData.shipZipCode || null,
        shipSameAsBill: customerData.shipSameAsBill || false,
        priceCategoryId: customerData.priceCategoryId || null,
        termId: customerData.term?.id || null,
        balance: customerData.balanceList?.[0]?.balance || 0,
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
