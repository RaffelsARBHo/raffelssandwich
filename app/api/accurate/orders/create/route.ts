//app/api/accurate/orders/create/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customerNo) {
      return NextResponse.json(
        {
          success: false,
          error: 'customerNo is required',
        },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'items array is required and must not be empty',
        },
        { status: 400 }
      );
    }

    // Validate each item
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.itemNo) {
        return NextResponse.json(
          {
            success: false,
            error: `Item at index ${i} is missing itemNo`,
          },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Item at index ${i} has invalid quantity`,
          },
          { status: 400 }
        );
      }
    }

    // Prepare the sales order data for Accurate API
    // Build form data for the request
    const formData: Record<string, string> = {
      customerNo:  body.customerNo,
      transDate:   body.transDate || getJakartaDate(),
      description: `Table No ${body.tableNumber} - ${body.orderId}`,
      detailMemo:  `Customer: ${body.customerName} | Table: ${body.tableNumber} | Order Ref: ${body.orderId}`,
    };

    // Table number as shipTo (separate field in Accurate)
    if (body.tableNumber) {
      formData.shipTo = `Table No ${body.tableNumber}`;
    }

    // Branch number
    if (body.branchNo) {
      formData.branchId = body.branchNo;
    }

    if (body.warehouseNo) {
      formData.warehouseNo = body.warehouseNo;
    }

    // Add line items with [n] notation
    body.items.forEach((item: any, index: number) => {
      formData[`detailItem[${index}].itemNo`] = item.itemNo;
      formData[`detailItem[${index}].quantity`] = String(item.quantity);

      if (item.unitPrice !== undefined) {
        formData[`detailItem[${index}].unitPrice`] = String(item.unitPrice);
      }

      if (item.discount) {
        formData[`detailItem[${index}].discount`] = String(item.discount);
      }

      if (item.detailNotes) {
        formData[`detailItem[${index}].detailNotes`] = item.detailNotes;
      }
    });

    // Create the sales order
    const response = await accurateFetch('/accurate/api/sales-invoice/save.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(formData).toString(),
    });

    if (!response.s) {
      return NextResponse.json(
        {
          success: false,
          error: response.d || 'Failed to create sales order',
          details: response,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sales order created successfully',
      data: {
        id:           response.r?.id,
        number:       response.r?.number,
        customerName: response.r?.customer?.name,
        tableNumber:  response.r?.shipTo,
        branchName:   response.r?.branch?.name,
        total:        response.r?.total,
        fullResponse: response.r,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error',
        details: err.toString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Get current date in Jakarta timezone in dd/mm/yyyy format
 */
function getJakartaDate(): string {
  const now = new Date();
  const jakartaTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  );

  const day = String(jakartaTime.getDate()).padStart(2, '0');
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const year = jakartaTime.getFullYear();

  return `${day}/${month}/${year}`;
}