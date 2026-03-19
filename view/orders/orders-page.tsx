// view/orders/orders-page.tsx
'use client';

import { useOrders } from '@/hooks/useOrders';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination';
import { OrderList } from '@/view/orders/order-list';
import Maxwidth from '@/components/Maxwidth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export function OrdersPage() {
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerNo: '',
  });

  // Pagination hook (same as products)
  const { page, pageSize, setPage, setPageSize, totalPages, paginationParams } =
    usePagination({
      initialPageSize: 10,
      totalItems: totalItems,
    });

  // Fetch orders with pagination
  const { data, isLoading } = useOrders(paginationParams, filters);

  const orders = data?.data || [];
  //   const totalItems = data?.pagination?.rowCount || 0;

  useEffect(() => {
    const totalItems = data?.pagination.rowCount || 0;
    setTotalItems(totalItems);
  }, [data?.pagination.rowCount]);

  return (
    <Maxwidth className="py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        {/* <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="" className="text-xs text-white/80">
              Start Date
            </label>
            <Input
              type="date"
              className="[&::-webkit-calendar-picker-indicator]:invert"
              onKeyDown={(e) => e.preventDefault()}
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => {
                // Convert YYYY-MM-DD to DD/MM/YYYY
                const [year, month, day] = e.target.value.split('-');
                setFilters({
                  ...filters,
                  startDate: `${day}/${month}/${year}`,
                });
                setPage(1); // Reset to first page
              }}
            />
          </div>

          <div>
            <label htmlFor="" className="text-xs text-white/80">
              End Date
            </label>
            <Input
              type="date"
             className="[&::-webkit-calendar-picker-indicator]:invert"
              onKeyDown={(e) => e.preventDefault()}
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => {
                const [year, month, day] = e.target.value.split('-');
                setFilters({
                  ...filters,
                  endDate: `${day}/${month}/${year}`,
                });
                setPage(1);
              }}
            />
          </div>

          <div>
            <label htmlFor="" className="text-xs text-white/80">
              Customer No
            </label>
            <Input
              type="text"
              placeholder="Customer No"
              value={filters.customerNo}
              onChange={(e) => {
                setFilters({ ...filters, customerNo: e.target.value });
                setPage(1);
              }}
            />
          </div>
        </div> */}
        <Button asChild>
          <Link href="/">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      {/* Orders List */}
      <OrderList orders={orders} isLoading={isLoading} />

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={totalItems}
          showPageSize={true}
          showPageInfo={true}
          pageSizeOptions={[10, 25, 50, 100]}
          className="mt-8"
        />
      )}
    </Maxwidth>
  );
}
