'use client';

import { OrderCard } from '@/components/molecules';
import { Skeleton } from '@/components/atoms';

interface Order {
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
}

interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  emptyMessage?: string;
}

export function OrderList({ 
  orders, 
  loading = false,
  emptyMessage = 'No orders found' 
}: OrderListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-6 space-y-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
