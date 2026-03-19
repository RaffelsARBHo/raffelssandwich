// hooks/useOrders.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/components/ReactQueryProvider';

// Types
export interface Order {
  id: string;
  number: string;
  transDate: string;
  customer: {
    id: string;
    customerNo: string;
    name: string;
  };
  total: number;
  status: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    rowCount: number;
  };
}

interface PaginationParams {
  page: number;
  pageSize: number;
}

interface OrderFilters {
  customerNo?: string;
  startDate?: string; // Format: "dd/mm/yyyy"
  endDate?: string; // Format: "dd/mm/yyyy"
}

// API Functions
async function fetchOrders(params: PaginationParams, filters:OrderFilters): Promise<OrdersResponse> {
  const urlParams = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  });

  // Add date filters if provided
  if (filters.startDate) {
    urlParams.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    urlParams.append('endDate', filters.endDate);
  }
  if (filters.customerNo) {
    urlParams.append('customerNo', filters.customerNo);
  }

  const res = await fetch(`/api/accurate/orders?${urlParams.toString()}`);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch orders');
  }

  const data = await res.json();

  return {
    success: data.success,
    data: data.data || [],
    pagination: data.pagination || {
      page: params.page,
      pageSize: params.pageSize,
      pageCount: 1,
      rowCount: 0,
    },
  };
}

async function fetchOrderDetail(id: string) {
  const res = await fetch(`/api/accurate/orders/${id}`);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch order detail');
  }

  const data = await res.json();
  return data.order;
}

// Hooks
export function useOrders(
  paginationParams: PaginationParams,
  filters: OrderFilters = {}
) {
  return useQuery({
    queryKey: ['orders', paginationParams.page, paginationParams.pageSize],
    queryFn: () => fetchOrders(paginationParams, filters),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrderDetail(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create Order (existing)
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (orderData: any) => {
      const res = await fetch('/api/accurate/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create order');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
