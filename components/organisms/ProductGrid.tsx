'use client';

import { ProductCard } from '@/components/molecules';
import { Skeleton } from '@/components/atoms';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
  category?: string;
  imageUrl?: string;
  farmerName?: string;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function ProductGrid({ 
  products, 
  onAddToCart, 
  onViewDetails,
  loading = false,
  emptyMessage = 'No products available' 
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart ? () => onAddToCart(product.id) : undefined}
          onViewDetails={onViewDetails ? () => onViewDetails(product.id) : undefined}
        />
      ))}
    </div>
  );
}
