"use client";

import Navbar from "../components/Navbar";
import { useCart } from "../contextC/CartContext";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart } = useCart();
  const router = useRouter();

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <main className="min-h-screen bg-green-50">
      <Navbar />
      <div className="px-6 py-10">
        <h1 className="text-3xl font-bold text-green-800 mb-6">🛒 Your Cart</h1>
        {cart.length === 0 ? (
          <p className="text-gray-600">Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between p-4 bg-white rounded-lg shadow border">
                <span>{item.name} (x{item.qty})</span>
                <span>₱{item.qty * item.price}</span>
              </div>
            ))}
            <div className="text-right font-bold text-xl mt-4">
              Total: ₱{total}
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="mt-3 bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800"
            >
              Checkout ✅
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
