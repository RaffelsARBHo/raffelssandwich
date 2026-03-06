// app/api/accurate/orders/pay/route.ts
import { accurateFetch } from '@/lib/accurate';
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
    const { invoiceId, paymentDate, bankAccountNo } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId is required' },
        { status: 400 }
      );
    }

    if (!bankAccountNo && !process.env.ACCURATE_PAYMENT_ACCOUNT_NO) {
      return NextResponse.json(
        { success: false, error: 'bankAccountNo is required' },
        { status: 400 }
      );
    }

    const formData: Record<string, string> = {
      id:            String(invoiceId),
      paymentDate:   paymentDate || getJakartaDate(),
      bankAccountNo: bankAccountNo || process.env.ACCURATE_PAYMENT_ACCOUNT_NO!,
    };

    console.log('💳 Marking invoice as paid:', formData);

    const response = await accurateFetch('/accurate/api/sales-invoice/pay.do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    });

    console.log('📥 Pay response:', JSON.stringify(response, null, 2));

    if (!response.s) {
      console.error('❌ Failed to mark invoice as paid:', response.d);
      return NextResponse.json(
        { success: false, error: response.d, details: response },
        { status: 400 }
      );
    }

    console.log('✅ Invoice marked as paid!');
    return NextResponse.json({ success: true, data: response.r });

  } catch (err: any) {
    console.error('❌ Error marking invoice as paid:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}