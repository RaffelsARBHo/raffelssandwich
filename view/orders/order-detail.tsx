// view/orders/order-detail-page.tsx
'use client';

import { useOrderDetail } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Maxwidth from '@/components/Maxwidth';
import { Calendar, User, MapPin, Package, DollarSign, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

 

export function OrderDetailPage() {
    const params = useSearchParams(); 
    const id = params?.get('id') as string;
  const { data: order, isLoading, error } = useOrderDetail(id);

  if (isLoading) {
    return (
      <Maxwidth className="py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </Maxwidth>
    );
  }

  if (error || !order) {
    return (
      <Maxwidth className="py-16 text-center">
        <h2 className="text-2xl font-bold">Order not found</h2>
        <p className="text-muted-foreground mt-2">
          The order you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </Maxwidth>
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
    <Maxwidth className="py-8">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.number}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {/* {formatDate(order.transDate)} */}
            {order.transDate}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.statusName || order.status}
        </Badge>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{order.customer?.name}</p>
            <p className="text-sm text-muted-foreground">
              ID: {order.customer?.customerNo}
            </p>
            {order.customer?.email && (
              <p className="text-sm">📧 {order.customer.email}</p>
            )}
            {order.customer?.mobilePhone && (
              <p className="text-sm">📞 {order.customer.mobilePhone}</p>
            )}
          </CardContent>
        </Card>

        {/* Table Information */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.tableLabel ? (
              <p className="text-sm">
                {order.tableLabel}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No table information</p>
            )}
          </CardContent>
        </Card> */}

        {/* Order Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items?.map((item: any, index: number) => (
                <div key={item.id || index}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.itemNo}
                      </p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="font-medium">
                        Rp{item.totalPrice?.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x Rp{item.unitPrice?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  {index < order.items.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>Rp{order.subTotal?.toLocaleString('id-ID')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-red-600">-Rp{order.discount?.toLocaleString('id-ID')}</span>
                </div>
              )}
              {order.tax1Amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>Rp{order.tax1Amount?.toLocaleString('id-ID')}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>Rp{order.totalAmount?.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Maxwidth>
  );
}