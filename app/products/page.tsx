"use client";

import Navbar from "../components/Navbar";
import { useCart } from "../contextC/CartContext";

export default function ProductsPage() {
  const { addToCart } = useCart();

  const products = [
    { id: 1, name: "Fresh Corn 🌽", price: 50 },
    { id: 2, name: "Organic Tomatoes 🍅", price: 80 },
    { id: 3, name: "Brown Rice 🌾", price: 70 },
  ];

  return (
    <main className="min-h-screen bg-green-50">
      <Navbar />
      <div className="px-6 py-10">
        <h1 className="text-3xl font-bold text-green-800 mb-6">🌽 Products</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="p-6 bg-white rounded-xl shadow border">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="text-gray-600">₱{p.price}/kg</p>
              <button
                onClick={() => addToCart({ ...p, qty: 1 })}
                className="mt-3 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
              >
                Add to Cart 🛒
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
