"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc, runTransaction } from "firebase/firestore";
import { useRouter } from "next/navigation";
import ProductImage from '@/components/ProductImage';

export default function OrdersPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Watch for auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const userId = currentUser.uid;
        setUser({ id: userId, email: currentUser.email });
        await fetchOrders(userId);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch user's orders from Firestore
  const fetchOrders = async (userId: string) => {
    try {
      console.log("Fetching orders for:", userId);
      const q = query(collection(db, "orders"), where("buyerId", "==", userId));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched orders:", items);
      setOrders(items);
    } catch (err) {
      console.error("Error fetching orders:", err);
      alert("Failed to load your orders. Please check Firestore rules.");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      alert("You do not have permission to change this order status.");
      console.error(err);
    }
  };

  // Example: Add this to your order creation logic (e.g., in your product details or cart page)
  interface OrderData {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    // Add other fields as needed
  }

  const createOrder = async (orderData: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Reference to the product document
      const productRef = doc(db, "products", orderData.productId);

      // Run the order creation and quantity update in a transaction
      await runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef);
        
        if (!productSnap.exists()) {
          throw new Error("Product not found");
        }

        const productData = productSnap.data();
        const currentQuantity = productData.quantity;

        // Check if enough stock is available
        if (currentQuantity < orderData.quantity) {
          throw new Error(`Not enough stock available. Only ${currentQuantity} items left.`);
        }

        // Calculate new quantity
        const newQuantity = currentQuantity - orderData.quantity;

        // Update product quantity
        transaction.update(productRef, {
          quantity: newQuantity
        });

        // Create the order
        const orderRef = doc(collection(db, "orders"));
        transaction.set(orderRef, {
          ...orderData,
          buyerId: user.uid,
          photo: productData.photo || '',
          status: "pending",
          createdAt: new Date(),
          originalQuantity: currentQuantity,
          newQuantity: newQuantity
        });
      });

      console.log("Order created and product quantity updated successfully");

    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof Error) {
        alert(error.message);
      }
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Homepage
          </a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Cart
          </a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded bg-green-50 hover:bg-green-100 font-semibold whitespace-nowrap text-sm lg:text-base">
            Orders
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">My Orders</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-3 lg:p-4 rounded shadow">
              <div
                className="h-24 sm:h-32 bg-gray-200 mb-3 rounded"
                style={{
                  backgroundImage: `url(${order.photo})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <h3 className="font-bold text-sm lg:text-base">{order.name}</h3>
              <p className="text-gray-600 text-xs lg:text-sm">Quantity: {order.quantity}</p>
              <p className="text-gray-600 text-xs lg:text-sm">Price: {order.price}</p>
              <p className="text-gray-700 font-medium mt-2 text-xs lg:text-sm">
                Status:{" "}
                <span
                  className={`px-2 py-1 rounded text-white text-xs ${
                    order.status === "pending" || order.status === "Pending"
                      ? "bg-yellow-500"
                      : "bg-green-600" // Now all completed orders will be green
                  }`}
                >
                  {order.status}
                </span>
              </p>
              {/* Removed the status update buttons for users */}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
