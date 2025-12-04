'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, Badge, Button } from '@/components/atoms';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    unit: string;
    stock: number;
    category?: string;
    imageUrl?: string;
    farmerName?: string;
  };
  onAddToCart?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onViewDetails,
  showActions = true 
}: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative h-48 w-full bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        
        {product.category && (
          <Badge className="absolute top-2 right-2 bg-white/90 text-gray-800">
            {product.category}
          </Badge>
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-red-600 text-white">Out of Stock</Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-green-600">
            ₱{product.price}
          </span>
          <span className="text-sm text-gray-500">
            per {product.unit}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Stock: {product.stock}</span>
          {product.farmerName && (
            <span className="truncate ml-2">{product.farmerName}</span>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="flex-1"
            >
              View Details
            </Button>
          )}
          {onAddToCart && (
            <Button
              size="sm"
              onClick={onAddToCart}
              disabled={isOutOfStock}
              className="flex-1"
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
