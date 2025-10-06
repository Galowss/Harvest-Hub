"use client";

import ProductImage from '@/components/ProductImage';

interface Product {
  id: number;
  photo: string | null;
  name: string;
  description: string;
  price: number;
}

const products: Product[] = [
  {
    id: 1,
    photo: null,
    name: 'Sample Product',
    description: 'This is a sample product.',
    price: 9.99,
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Products</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow">
              <div className="h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <ProductImage
                  src={product.photo || '/placeholder.png'}
                  alt={product.name}
                />
              </div>
              <h2 className="text-lg font-semibold mb-2">{product.name}</h2>
              <p className="text-gray-700 mb-4">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">
                  ${product.price.toFixed(2)}
                </span>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
