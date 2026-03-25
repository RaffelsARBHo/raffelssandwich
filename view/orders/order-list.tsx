// view/orders/order-list.tsx
'use client';

import { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
}

export function OrderList({ orders, isLoading }: OrderListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order:any) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Order #{order.number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {order.transDate}
                </p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {order.status || 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Customer: {order.customer?.name}
                </p>
                <p className="text-lg font-semibold mt-1">
                  Rp{order.total?.toLocaleString('id-ID')}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/order-detail?id=${order.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}