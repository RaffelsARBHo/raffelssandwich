// app/api/accurate/orders/pay/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

type LogLevel = 'silent' | 'error' | 'info' | 'debug';
const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
function log(level: Exclude<LogLevel, 'silent'>, message: string, meta?: unknown) {
  const rank: Record<Exclude<LogLevel, 'silent'>, number> = { error: 0, info: 1, debug: 2 };
  const current = LOG_LEVEL === 'silent' ? -1 : rank[LOG_LEVEL === 'error' ? 'error' : LOG_LEVEL];
  if (current < 0 || rank[level] > current) return;
  const prefix = `[accurate-pay] ${message}`;
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

export async function POST(request: Request) {
  try {
    const { invoiceId, paymentDate, bankAccountNo, customerNo, amount, branchNo } =
      await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId is required' },
        { status: 400 }
      );
    }

    const resolvedBankAccountNo =
      bankAccountNo ||
      process.env.ACCURATE_PAYMENT_ACCOUNT_NO ||
      process.env.ACCURATE_BANK_TRANSFER_ACCOUNT_NO;

    if (!resolvedBankAccountNo) {
      return NextResponse.json(
        { success: false, error: 'bankAccountNo is required' },
        { status: 400 }
      );
    }

    const resolvedPaymentDate = paymentDate || getJakartaDate();
    log('info', 'Starting', {
      invoiceId,
      paymentDate: resolvedPaymentDate,
      branchNo,
      customerNo,
      amount,
      bankAccountNo: resolvedBankAccountNo,
    });

    // Attempt 1: Some setups support direct pay endpoint (may be unavailable depending on Accurate version/plan).
    const payFormData: Record<string, string> = {
      id: String(invoiceId),
      paymentDate: resolvedPaymentDate,
      bankAccountNo: resolvedBankAccountNo,
    };

    try {
      log('debug', 'Attempt 1: sales-invoice/pay.do', { invoiceId });
      const response = await accurateFetch('/accurate/api/sales-invoice/pay.do', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payFormData).toString(),
      });

      if (response?.s) {
        log('info', 'Paid via attempt 1', { invoiceId });
        return NextResponse.json({ success: true, data: response.r, method: 'sales-invoice/pay.do' });
      }

      const msg = Array.isArray(response?.d) ? response.d.join(' ') : String(response?.d || '');
      // If endpoint is invalid, fall through to sales receipt approach.
      if (!msg.includes('URL API tidak tepat')) {
        log('error', 'Attempt 1 failed', { invoiceId, error: response?.d });
        return NextResponse.json(
          { success: false, error: response.d, details: response },
          { status: 400 }
        );
      }

      log('debug', 'Attempt 1 not supported, falling back', { reason: msg });
    } catch (e: any) {
      const message = String(e?.message || '');
      if (!message.includes('URL API tidak tepat')) {
        throw e;
      }
      // else: fall through
      log('debug', 'Attempt 1 threw URL API invalid, falling back', { message });
    }

    // Attempt 2: Record "Penerimaan Penjualan" (Sales Receipt) and apply it to the invoice.
    // This is the most compatible way to mark invoices as paid.
    const resolvedCustomerNo = customerNo ? String(customerNo) : '';
    const resolvedAmount = Number(amount);
    if (!resolvedCustomerNo || !Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unable to pay invoice via sales receipt. customerNo and amount are required when sales-invoice/pay.do is not available.',
        },
        { status: 400 }
      );
    }

    const receiptFormData: Record<string, string> = {
      customerNo: resolvedCustomerNo,
      transDate: resolvedPaymentDate,
      description: `Payment for Sales Invoice ${invoiceId}`,
      // apply to invoice
      'detailInvoice[0].id': String(invoiceId),
      'detailInvoice[0].amount': String(resolvedAmount),
    };

    // Accurate variants: some tenants expect bankNo / cashBankNo instead of bankAccountNo
    receiptFormData.bankAccountNo = resolvedBankAccountNo;
    receiptFormData.bankNo = resolvedBankAccountNo;
    receiptFormData.cashBankNo = resolvedBankAccountNo;

    // If user has multi-branch access, Accurate requires branchId for data entry.
    if (branchNo) {
      receiptFormData.branchId = String(branchNo);
    }

    log('debug', 'Attempt 2: sales-receipt/save.do', {
      invoiceId,
      branchId: receiptFormData.branchId,
      bank: resolvedBankAccountNo,
      amount: resolvedAmount,
    });

    const receiptResponse = await accurateFetch('/accurate/api/sales-receipt/save.do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(receiptFormData).toString(),
    });

    if (!receiptResponse?.s) {
      log('error', 'Attempt 2 failed', { invoiceId, error: receiptResponse?.d });
      return NextResponse.json(
        { success: false, error: receiptResponse.d, details: receiptResponse },
        { status: 400 }
      );
    }

    log('info', 'Paid via attempt 2', { invoiceId });
    return NextResponse.json({
      success: true,
      data: receiptResponse.r,
      method: 'sales-receipt/save.do',
    });

  } catch (err: any) {
    log('error', 'Unhandled error', { error: err?.message || String(err) });
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}