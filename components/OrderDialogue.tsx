// components/OrderDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useTableStore } from '@/store/tableAndBranchStore';

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (customerName: string, tableNumber: string) => Promise<void>;
  totalAmount: number;
}

export function OrderDialog({
  open,
  onOpenChange,
  onConfirm,
  totalAmount,
}: OrderDialogProps) {
  const { tableNumber: storedTableNumber, setTableNumber: saveTableNumber } = useTableStore();
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load stored table number when dialog opens
  useEffect(() => {
    if (open && storedTableNumber) {
      setTableNumber(storedTableNumber);
    }
  }, [open, storedTableNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Save table number to store for future use
      if (tableNumber.trim()) {
        saveTableNumber(tableNumber.trim());
      }

      await onConfirm(customerName, tableNumber.trim());
      
      // Clear customer name but keep table number for next order
      setCustomerName('');
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Order</DialogTitle>
          <DialogDescription>
            Enter your details to proceed with payment of Rp{totalAmount.toLocaleString('id-ID')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="table">Table Number</Label>
              <Input
                id="table"
                placeholder="e.g., 4"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                disabled={isLoading}
              />
              {storedTableNumber && (
                <p className="text-xs text-muted-foreground">
                  ✓ Auto-filled from URL. You can edit if needed.
                </p>
              )}
              {!storedTableNumber && (
                <p className="text-xs text-muted-foreground">
                  Leave empty if ordering for takeaway
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCustomerName('');
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !customerName.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}