// view/cart/CartDrawer.tsx
'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/view/cart/cart-item';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { OrderDialog } from '@/components/OrderDialogue';
import { useTableStore } from '@/store/tableAndBranchStore';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, total, clearCart } = useCart();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const router = useRouter();

  // ✅ Get tableNumber and branchNo from Zustand (set from URL params)
  const { tableNumber, branchNo } = useTableStore();

  const handlePlaceOrder = async (customerName: string) => {
    try {
      const orderId = `ORDER-${Date.now()}`;

      const capturedBranchNo = branchNo || '';
      const capturedTableNumber = tableNumber || 'Takeaway';

      const orderItems = items.map((item) => ({
        productId: item.productId,
        productNo: item.productNo,
        name:      item.name,
        price:     item.price,
        quantity:  item.quantity,
      }));

      const grossAmount = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Create Midtrans transaction
      const response = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName,
          items:       orderItems,
          grossAmount,
          tableNumber: capturedTableNumber,
          branchNo:    capturedBranchNo,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      setIsOrderDialogOpen(false);
      onOpenChange(false);

      // Open Midtrans Snap
      setTimeout(() => {
        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: async function (result: any) {
              // Create invoice + payment in Accurate
              const placeOrderResponse = await fetch('/api/payment/place-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
              });

              const placeOrderData = await placeOrderResponse.json();

              if (placeOrderData.success) {
                toast.success('Order placed successfully!');
                clearCart();

                const successUrl = new URLSearchParams({
                  order_id:      orderId,
                  accurate_order: placeOrderData.data.orderNumber,
                  ...(capturedTableNumber && { table: capturedTableNumber }),
                });
                router.push(`/payment/success?${successUrl.toString()}`);
              } else {
                toast.error('Payment successful but failed to create order');
                router.push(`/payment/success?order_id=${orderId}`);
              }
            },
            onPending: function (result: any) {
              toast.loading('Payment is being processed...');
              router.push(`/payment/pending?order_id=${orderId}`);
            },
            onError: function (result: any) {
              console.error('❌ Payment error:', result);
              toast.error('Payment failed');
            },
            onClose: function () {
              toast('Payment cancelled', { icon: '❌' });
            },
          });
        }
      }, 300);

    } catch (error: any) {
      console.error('❌ Order placement failed:', error);
      toast.error(error.message || 'Failed to process order');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg py-10">
          <SheetHeader className="px-1">
            <SheetTitle className="flex items-center justify-between">
              <span>Your Order</span>
              <span className="text-sm font-normal text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Your order is empty</h3>
                <p className="text-sm text-muted-foreground">
                  Looks like you haven&apos;t added anything to your cart yet.
                </p>
              </div>
              <Button className="shadow-sm" onClick={() => onOpenChange(false)}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>Rp{total.toLocaleString('id-ID')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>Rp{total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* ✅ Show table and branch info */}
                {(tableNumber || branchNo) && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {tableNumber && <p>🪑 Table: {tableNumber}</p>}
                    {branchNo && <p>🏢 Branch: {branchNo}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setIsOrderDialogOpen(true)}
                  >
                    Place Order
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <OrderDialog
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
        onConfirm={handlePlaceOrder}
        totalAmount={total}
      />
    </>
  );
}