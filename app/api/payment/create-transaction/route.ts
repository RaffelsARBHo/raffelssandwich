// app/api/payment/create-transaction/route.ts
import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { storePendingOrder } from '@/lib/orderStorage';

export async function POST(request: Request) {
  try {
    const { orderId, customerName, items, grossAmount, tableNumber, branchNo } = await request.json();

    // Validate required fields
    if (!orderId || !customerName || !items || !grossAmount) {
      return NextResponse.json(
        { success: false, error: 'orderId, customerName, items and grossAmount are required' },
        { status: 400 }
      );
    }

    // Create Snap API instance
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.MIDTRANS_CLIENT_KEY!,
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: customerName,
      },
      item_details: items.map((item: any) => ({
        id: item.productId,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order_id=${orderId}`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    // Store order data so webhook can retrieve it later
    await storePendingOrder(orderId, {
      customerName,
      items,
      tableNumber,
      branchNo,
    });

    console.log('✅ Transaction created and order stored:', orderId);

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error: any) {
    console.error('Midtrans Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}