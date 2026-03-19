// hooks/usePayment.ts
import { useMutation } from '@tanstack/react-query';

interface PaymentData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
}

async function processPayment(paymentData: PaymentData) {
  // Yeh aapki payment gateway API call hogi
  const res = await fetch('/api/payment/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });
  
  if (!res.ok) {
    throw new Error('Payment failed');
  }
  
  return res.json();
}

export function usePayment() {
  return useMutation({
    mutationFn: processPayment,
  });
}