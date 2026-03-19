// app/payment/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Maxwidth from '@/components/Maxwidth';
import confetti from 'canvas-confetti';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const accurateOrder = searchParams.get('accurate_order');
  const tableNumber = searchParams.get('table');

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <Maxwidth className="flex min-h-[60vh] flex-col items-center justify-center py-16">
      <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Thank you for your order. Your payment has been processed successfully.
      </p>
      
      <div className="bg-muted p-6 rounded-lg mb-8 w-full max-w-md">
        {accurateOrder && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Invoice Number</p>
            <p className="font-mono font-bold text-xl">{accurateOrder}</p>
          </div>
        )}
        {orderId && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-mono font-bold text-xl">{orderId}</p>
          </div>
        )}
        {tableNumber && (
          <div>
            <p className="text-sm text-muted-foreground">Table Number</p>
            <p className="font-bold text-lg">Table {tableNumber}</p>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/orders">View Orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </Maxwidth>
  );
}