// app/api/payment/place-order/route.ts
import { NextResponse } from 'next/server';

function getJakartaDate(): string {
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const day   = String(jakartaTime.getDate()).padStart(2, '0');
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const year  = jakartaTime.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function POST(request: Request) {
  try {
    const { orderId, customerName, items, totalAmount, tableNumber, branchNo } = await request.json();

    const transDate = getJakartaDate();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Step 1: Create Customer
    console.log('👥 Step 1: Creating customer:', customerName);
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
    console.log('✅ Customer created:', customerNo);

    // Step 2: Create Sales Invoice
    console.log('📦 Step 2: Creating sales invoice...');
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

    console.log('✅ Sales invoice created:', orderData.data.number);
    console.log('   Invoice ID:', orderData.data.id);

    // Step 3: Mark Invoice as Paid
    console.log('💳 Step 3: Marking invoice as paid...');
    const payResponse = await fetch(
      `${baseUrl}/api/accurate/orders/pay`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId:    orderData.data.id,
          paymentDate:  transDate,
          bankAccountNo: process.env.ACCURATE_BANK_TRANSFER_ACCOUNT_NO,
        }),
      }
    );

    const payData = await payResponse.json();
    if (!payData.success) {
      console.error('⚠️ Invoice created but failed to mark as paid:', payData.error);
      // Don't throw — invoice was created successfully, payment status can be fixed manually
    } else {
      console.log('✅ Invoice marked as paid!');
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        customerNo,
        orderNumber: orderData.data.number,
        orderId:     orderData.data.id,
        total:       orderData.data.total,
      },
    });

  } catch (error: any) {
    console.error('❌ Error placing order:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}