"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

export default function FarmerOrdersPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // watch auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      await fetchOrders(currentUser.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // fetch all orders for this farmer
  const fetchOrders = async (farmerId: string) => {
    try {
      const q = query(collection(db, "orders"), where("farmerId", "==", farmerId));
      const querySnapshot = await getDocs(q);

      const fetchedOrders = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const orderData = docSnap.data();

          // fetch buyer info from users collection
          let buyerEmail = "Unknown";
          if (orderData.buyerId) {
            try {
              const buyerRef = doc(db, "users", orderData.buyerId);
              const buyerSnap = await getDoc(buyerRef);
              if (buyerSnap.exists()) {
                buyerEmail = buyerSnap.data().email || buyerEmail;
              }
            } catch (e) {
              console.warn("Buyer fetch error:", e);
            }
          }

          return {
            id: docSnap.id,
            ...orderData,
            buyerEmail,
          };
        })
      );

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // update order status
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      if (user) fetchOrders(user.uid);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update order status. Check permissions.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a href="/dashboard/farmer" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Homepage
          </a>
          <a href="/dashboard/farmer/profile" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Farmer Profile
          </a>
          <a
            href="/dashboard/farmer/orders"
            className="block px-3 py-2 rounded hover:bg-green-100 bg-green-50 font-semibold whitespace-nowrap text-sm lg:text-base"
          >
            Orders
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl lg:text-2xl font-bold">Customer Orders</h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="font-medium text-sm lg:text-base truncate">{user?.email}</span>
            <button onClick={handleLogout} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded text-sm lg:text-base whitespace-nowrap">
              Logout
            </button>
          </div>
        </header>

        {/* Orders List */}
        {orders.length === 0 ? (
          <p className="text-gray-500 mt-20 text-center">No orders yet.</p>
        ) : (
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
                <p className="text-gray-600 text-xs lg:text-sm">Buyer: {order.buyerEmail}</p>
                <p className="text-gray-600 text-xs lg:text-sm">Quantity: {order.quantity}</p>
                <p className="text-gray-700 font-medium mt-2 text-xs lg:text-sm">
                  Status:{" "}
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      order.status === "pending"
                        ? "bg-yellow-500"
                        : order.status === "completed"  // Changed from "Completed"
                        ? "bg-green-600"
                        : "bg-gray-500"
                    }`}
                  >
                    {order.status}
                  </span>
                </p>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleStatusUpdate(order.id, "completed")}  // Changed from "Completed"
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs lg:text-sm hover:bg-green-700"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(order.id, "pending")}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-xs lg:text-sm hover:bg-yellow-600"
                  >
                    Set Pending
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
