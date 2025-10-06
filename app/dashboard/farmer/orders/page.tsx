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

          // fetch product info including images
          let productImage = "";
          let productName = orderData.name || "Unknown Product";
          if (orderData.productId) {
            try {
              const productRef = doc(db, "products", orderData.productId);
              const productSnap = await getDoc(productRef);
              if (productSnap.exists()) {
                const productData = productSnap.data();
                productName = productData.name || productName;
                // Get the first image from the product images array
                if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
                  productImage = productData.images[0];
                }
              }
            } catch (e) {
              console.warn("Product fetch error:", e);
            }
          }

          return {
            id: docSnap.id,
            ...orderData,
            buyerEmail,
            productImage,
            name: productName,
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

  // cancel order
  const handleCancelOrder = async (orderId: string) => {
    const confirmed = confirm("Are you sure you want to cancel this order? This action cannot be undone.");
    if (!confirmed) return;
    
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "cancelled" });
      if (user) fetchOrders(user.uid);
      alert("Order has been cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Failed to cancel order. Please try again.");
    }
  };

  // complete order and update product stock
  const handleCompleteOrder = async (orderId: string) => {
    try {
      // Get order details first
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        alert("Order not found.");
        return;
      }
      
      const orderData = orderSnap.data();
      const { productId, quantity } = orderData;
      
      if (!productId || !quantity) {
        alert("Order is missing product information.");
        return;
      }
      
      // Get product details
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        alert("Product not found. Completing order without stock update.");
        // Complete order anyway
        await updateDoc(orderRef, { status: "completed" });
        if (user) fetchOrders(user.uid);
        return;
      }
      
      const productData = productSnap.data();
      const currentStock = productData.stock || 0;
      const orderQuantity = parseInt(quantity);
      
      // Check if there's enough stock
      if (currentStock < orderQuantity) {
        const proceed = confirm(
          `Warning: Current stock (${currentStock}) is less than ordered quantity (${orderQuantity}). ` +
          "Do you want to complete the order anyway? This will set stock to 0."
        );
        if (!proceed) return;
      }
      
      // Calculate new stock (don't go below 0)
      const newStock = Math.max(0, currentStock - orderQuantity);
      
      // Update both order status and product stock
      await Promise.all([
        updateDoc(orderRef, { status: "completed" }),
        updateDoc(productRef, { stock: newStock })
      ]);
      
      if (user) fetchOrders(user.uid);
      alert(
        `Order completed successfully! ` +
        `Product stock updated: ${currentStock} → ${newStock}`
      );
      
    } catch (err) {
      console.error("Error completing order:", err);
      alert("Failed to complete order. Please try again.");
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
            Dashboard
          </a>
          <a href="/dashboard/farmer/profile" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Profile
          </a>
          <a href="/dashboard/farmer/orders" className="block px-3 py-2 rounded bg-green-100 text-green-800 whitespace-nowrap text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/farmer/ratings" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Ratings
          </a>
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl lg:text-2xl font-bold">Customer Orders</h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="font-medium text-sm lg:text-base truncate text-gray-600">Welcome, {user?.email?.split("@")[0]}!</span>
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
                  className="h-24 sm:h-32 bg-gray-200 mb-3 rounded flex items-center justify-center"
                  style={{
                    backgroundImage: order.productImage ? `url(${order.productImage})` : 'none',
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!order.productImage && (
                    <div className="text-center text-gray-500">
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">No Image</p>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm lg:text-base">{order.name}</h3>
                <p className="text-gray-600 text-xs lg:text-sm">Buyer: {order.buyerEmail}</p>
                <p className="text-gray-600 text-xs lg:text-sm">Quantity: {order.quantity}</p>
                <p className="text-gray-700 font-medium mt-2 text-xs lg:text-sm">
                  Status:{" "}
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      order.status === "pending"
                        ? "bg-yellow-500"
                        : order.status === "completed"
                        ? "bg-green-600"
                        : order.status === "cancelled"
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {order.status}
                  </span>
                </p>

                <div className="mt-3 flex flex-col gap-2">
                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleCompleteOrder(order.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs lg:text-sm hover:bg-green-700 transition-colors"
                      >
                        Complete Order
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs lg:text-sm hover:bg-red-700 transition-colors"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                  
                  {order.status === "completed" && (
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs lg:text-sm text-center">
                      ✓ Order Completed
                    </div>
                  )}
                  
                  {order.status === "cancelled" && (
                    <div className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs lg:text-sm text-center">
                      ✗ Order Cancelled
                    </div>
                  )}
                  
                  {order.status !== "pending" && order.status !== "completed" && order.status !== "cancelled" && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, "pending")}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-xs lg:text-sm hover:bg-yellow-600 transition-colors"
                    >
                      Set Pending
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
