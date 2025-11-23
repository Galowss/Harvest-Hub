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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">Products</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-green-100">
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
                <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold">
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
