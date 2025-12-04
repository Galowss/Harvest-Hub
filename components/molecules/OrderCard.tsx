'use client';

import Image from 'next/image';
import { formatDate } from '@/lib/dateUtils';
import { useEffect, useState } from 'react';
import { Card, CardContent, Badge, Skeleton } from '@/components/atoms';

interface OrderCardProps {
  order: {
    id: string;
    productName?: string;
    name?: string;
    photo?: string;
    status: 'pending' | 'accepted' | 'completed' | 'cancelled';
    price: number;
    quantity: number;
    createdAt: Date | string;
    buyerEmail?: string;
    farmerEmail?: string;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <Skeleton className="h-32 sm:h-40 lg:h-24 lg:w-24 rounded-lg" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusStyles = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="h-32 sm:h-40 lg:h-24 lg:w-24 bg-gray-100 rounded-lg overflow-hidden relative">
              {order.photo ? (
                <Image
                  src={order.photo}
                  alt={order.productName || order.name || 'Product'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                  No Photo
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="flex-grow space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                {order.productName || order.name}
              </h3>
              <Badge className={getStatusStyles(order.status)}>
                {order.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm sm:text-base text-gray-600">
              <p><span className="font-medium">Order ID:</span> {order.id}</p>
              <p><span className="font-medium">Price:</span> ₱{order.price}</p>
              <p><span className="font-medium">Quantity:</span> {order.quantity}</p>
              <p><span className="font-medium">Date:</span> {formatDate(order.createdAt)}</p>
            </div>

            {order.buyerEmail && (
              <p className="text-sm sm:text-base text-gray-600">
                <span className="font-medium">Buyer:</span> {order.buyerEmail}
              </p>
            )}

            {order.farmerEmail && (
              <p className="text-sm sm:text-base text-gray-600">
                <span className="font-medium">Farmer:</span> {order.farmerEmail}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
