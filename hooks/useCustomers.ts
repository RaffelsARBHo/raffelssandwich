// hooks/useCustomers.ts
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/components/ReactQueryProvider';

interface CustomerFormData {
  name: string;
  transDate: string;
  customerNo?: string;
  mobilePhone?: string;
  email?: string;
  billStreet?: string;
  billCity?: string;
  billProvince?: string;
  billCountry?: string;
  billZipCode?: string;
}

async function createCustomer(customerData: CustomerFormData) {
  const res = await fetch('/api/accurate/customer/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create customer');
  }
  
  return res.json();
}

export function useCreateCustomer() {
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}