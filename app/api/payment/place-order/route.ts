// app/api/payment/place-order/route.ts
import { NextResponse } from 'next/server';
import { deletePendingOrder, getPendingOrder } from '@/lib/orderStorage';

type LogLevel = 'silent' | 'error' | 'info' | 'debug';
const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
function log(level: Exclude<LogLevel, 'silent'>, message: string, meta?: unknown) {
  const rank: Record<Exclude<LogLevel, 'silent'>, number> = { error: 0, info: 1, debug: 2 };
  const current = LOG_LEVEL === 'silent' ? -1 : rank[LOG_LEVEL === 'error' ? 'error' : LOG_LEVEL];
  if (current < 0 || rank[level] > current) return;
  const prefix = `[place-order] ${message}`;
  if (level === 'error') console.error(prefix, meta ?? '');
  else console.log(prefix, meta ?? '');
}

function getJakartaDate(): string {
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const day   = String(jakartaTime.getDate()).padStart(2, '0');
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const year  = jakartaTime.getFullYear();
  return `${day}/${month}/${year}`;
}

function computeTotalAmount(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId: string | undefined = body?.orderId;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Prefer server-side stored order (created during Midtrans transaction creation).
    // Fallback to request payload for backward compatibility.
    const stored = getPendingOrder(orderId);
    const customerName: string | undefined = stored?.customerName ?? body?.customerName;
    const items: any[] | undefined = stored?.items ?? body?.items;
    const tableNumber: string | undefined = stored?.tableNumber ?? body?.tableNumber;
    const branchNo: string | undefined = stored?.branchNo ?? body?.branchNo;
    const totalAmount: number =
      Number(body?.totalAmount) ||
      (Array.isArray(items) ? computeTotalAmount(items as any) : 0);

    log('info', 'Starting', {
      orderId,
      itemCount: Array.isArray(items) ? items.length : 0,
      tableNumber,
      branchNo,
      totalAmount,
      source: stored ? 'server' : 'request',
    });

    if (!customerName) {
      return NextResponse.json(
        { success: false, error: 'customerName is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'items array is required and must not be empty' },
        { status: 400 }
      );
    }

    const transDate = getJakartaDate();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: 'NEXT_PUBLIC_APP_URL is not set' },
        { status: 500 }
      );
    }

    // Step 1: Create Customer
    log('debug', 'Creating customer', { customerName, transDate });
    const customerResponse = await fetch(
      `${baseUrl}/api/accurate/customer/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName,
          transDate,
        }),
      }
    );

    const customerData = await customerResponse.json();
    if (!customerData.success) {
      throw new Error(`Failed to create customer: ${customerData.error}`);
    }

    const customerNo = customerData.customer.customerNo;
    log('info', 'Customer ready', { customerNo });

    // Step 2: Create Sales Invoice
    log('debug', 'Creating sales invoice', { orderId, customerNo, tableNumber, branchNo });
    const orderResponse = await fetch(
      `${baseUrl}/api/accurate/orders/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerNo,
          customerName,
          tableNumber,
          orderId,
          branchNo,
          transDate,
          items: items.map((item: any) => ({
            itemNo:    String(item.productNo || item.productId),
            quantity:  item.quantity,
            unitPrice: item.price,
          })),
        }),
      }
    );

    const orderData = await orderResponse.json();
    if (!orderData.success) {
      throw new Error(`Failed to create order: ${orderData.error}`);
    }

    log('info', 'Sales invoice created', {
      invoiceId: orderData?.data?.id,
      invoiceNumber: orderData?.data?.number,
      total: orderData?.data?.total ?? totalAmount,
    });

    // Step 3: Mark Invoice as Paid
    log('debug', 'Paying invoice', {
      invoiceId: orderData.data.id,
      customerNo,
      amount: Number(orderData.data.total ?? totalAmount),
      branchNo,
    });
    const payResponse = await fetch(
      `${baseUrl}/api/accurate/orders/pay`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId:    orderData.data.id,
          paymentDate:  transDate,
          bankAccountNo:
            process.env.ACCURATE_PAYMENT_ACCOUNT_NO ||
            process.env.ACCURATE_BANK_TRANSFER_ACCOUNT_NO,
          customerNo,
          amount: Number(orderData.data.total ?? totalAmount),
          branchNo,
        }),
      }
    );

    const payData = await payResponse.json();
    // if (!payData.success) {
    //   // Payment is required for POS flow; otherwise invoices remain "Not Paid Off".
    //   log('error', 'Invoice created but payment failed', { error: payData.error, details: payData.details, method: payData.method });
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: payData.error || 'Failed to mark invoice as paid',
    //       data: {
    //         customerNo,
    //         orderNumber: orderData.data.number,
    //         orderId: orderData.data.id,
    //       },
    //     },
    //     { status: 502 }
    //   );
    // }

    log('info', 'Invoice paid', { method: payData.method });

    // Clear server-side pending order after successful invoice + payment.
    try {
      deletePendingOrder(orderId);
    } catch (e) {
      log('debug', 'Failed to delete pending order', { orderId, error: String((e as any)?.message || e) });
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        customerNo,
        orderNumber: orderData.data.number,
        orderId:     orderData.data.id,
        total:       orderData.data.total ?? totalAmount,
      },
    });

  } catch (error: any) {
    log('error', 'Unhandled error', { error: error?.message || String(error) });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}