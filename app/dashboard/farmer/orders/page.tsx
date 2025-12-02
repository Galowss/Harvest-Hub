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
  addDoc,
  increment,
  Timestamp,
} from "firebase/firestore";
import { CacheClient } from "@/lib/cacheClient";

export default function FarmerOrdersPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      // Try cache first
      const cacheKey = CacheClient.farmerOrdersKey(farmerId);
      const cached = await CacheClient.get(cacheKey);
      
      if (cached) {
        console.log('✅ Farmer orders loaded from cache');
        setOrders(cached);
        return;
      }

      // Cache miss - fetch from Firestore
      console.log('⚠️ Cache miss - fetching farmer orders from Firestore');
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

      // Cache for 15 minutes
      await CacheClient.set(cacheKey, fetchedOrders, 900);
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
      
      // Invalidate order caches
      if (user) {
        await CacheClient.invalidatePattern(`farmer:${user.uid}:orders`);
        await CacheClient.invalidatePattern('admin:orders:*');
      }
      
      if (user) fetchOrders(user.uid);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update order status. Check permissions.");
    }
  };

  // mark order as out for delivery
  const handleMarkForDelivery = async (orderId: string) => {
    const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { 
        status: "out-for-delivery",
        deliveryStatus: "out-for-delivery",
        trackingNumber: trackingNumber,
        deliveryStartedAt: new Date(),
      });
      
      // Invalidate order caches
      if (user) {
        await CacheClient.invalidatePattern(`farmer:${user.uid}:orders`);
        await CacheClient.invalidatePattern('admin:orders:*');
      }
      
      if (user) fetchOrders(user.uid);
      alert(`Order marked for delivery!\nTracking Number: ${trackingNumber}`);
    } catch (err) {
      console.error("Error marking for delivery:", err);
      alert("Failed to mark order for delivery. Please try again.");
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

  // complete order and update product stock (mark as delivered)
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
        await updateDoc(orderRef, { 
          status: "completed",
          deliveryStatus: "delivered",
          deliveredAt: new Date()
        });
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
        updateDoc(orderRef, { 
          status: "completed",
          deliveryStatus: "delivered",
          deliveredAt: new Date()
        }),
        updateDoc(productRef, { stock: newStock })
      ]);
      
      // 💰 AUTO-PAYOUT: Credit farmer wallet if order was paid with wallet
      if (orderData.paymentMethod === 'wallet' && orderData.paymentStatus === 'paid') {
        try {
          const amount = (parseFloat(orderData.price) || 0) * (parseInt(orderData.quantity) || 1);
          const farmerId = user.uid;
          
          // Credit farmer's wallet
          const walletRef = doc(db, "wallets", farmerId);
          const walletSnap = await getDoc(walletRef);
          
          if (walletSnap.exists()) {
            await updateDoc(walletRef, {
              balance: increment(amount),
              totalEarnings: increment(amount),
              lastUpdated: Timestamp.now(),
            });
          } else {
            // Create wallet if doesn't exist
            await updateDoc(walletRef, {
              balance: amount,
              totalEarnings: amount,
              totalWithdrawals: 0,
              lastUpdated: Timestamp.now(),
            });
          }
          
          // Create credit transaction for farmer
          await addDoc(collection(db, "transactions"), {
            userId: farmerId,
            type: "credit",
            amount: amount,
            description: `Payment received for ${orderData.name || 'order'} (Order #${orderId.slice(0, 8)})`,
            orderId: orderId,
            status: "completed",
            createdAt: Timestamp.now(),
            completedAt: Timestamp.now(),
          });
          
          if (user) fetchOrders(user.uid);
          alert(
            `✅ Order marked as delivered!\n\n` +
            `📦 Product stock updated: ${currentStock} → ${newStock}\n` +
            `💰 ₱${amount.toFixed(2)} credited to your wallet!`
          );
        } catch (walletError) {
          console.error("Error processing payment:", walletError);
          if (user) fetchOrders(user.uid);
          alert(
            `⚠️ Order completed and stock updated, but wallet payout failed.\n\n` +
            `Product stock: ${currentStock} → ${newStock}\n` +
            `Please contact support to receive your payment.`
          );
        }
      } else {
        // Cash payment - no wallet transaction needed
        if (user) fetchOrders(user.uid);
        alert(
          `✅ Order marked as delivered!\n\n` +
          `📦 Product stock updated: ${currentStock} → ${newStock}\n` +
          `💵 Payment method: Cash (already collected)`
        );
      }
      
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
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-amber-50 to-orange-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-amber-100 p-3 sm:p-4 lg:h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <img src="/harvest-hub-logo.png" alt="HarvestHub Logo" className="w-8 h-8" />
            HarvestHub
          </h2>
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block space-y-2`}>
          <a
            href="/dashboard/farmer"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Home
          </a>
          <a
            href="/dashboard/farmer/analytics"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Analytics
          </a>
          <a
            href="/dashboard/farmer/profile"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Profile
          </a>
          <a
            href="/dashboard/farmer/orders"
            className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base"
          >
            Orders
          </a>
          <a
            href="/dashboard/farmer/pricing"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Market Pricing
          </a>
          <a
            href="/dashboard/farmer/ratings"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Ratings
          </a>
          <a
            href="/dashboard/farmer/wallet"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Wallet
          </a>
          <a
            href="/dashboard/community"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Community Hub
          </a>
        </nav>

        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg
              className="w-4 h-4 lg:w-5 lg:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
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
                  
                  {/* Delivery/Pickup Badge */}
                  <div className="mt-2">
                    {order.deliveryOption === 'delivery' && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        🚚 Delivery
                      </span>
                    )}
                    {order.deliveryOption === 'pickup' && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        📦 Pickup
                      </span>
                    )}
                  </div>

                  {/* Delivery Address (for delivery orders) */}
                  {order.deliveryOption === 'delivery' && order.deliveryAddress && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs font-semibold text-green-800">Delivery To:</p>
                      <p className="text-xs text-gray-700 mt-1">{order.deliveryAddress}</p>
                    </div>
                  )}

                  {/* Pickup Information (for pickup orders) */}
                  {order.deliveryOption === 'pickup' && order.pickupDate && order.pickupTime && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-800">Pickup Schedule:</p>
                      <p className="text-xs text-gray-700 mt-1">
                        📅 {new Date(order.pickupDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-700">
                        🕐 {order.pickupTime}
                      </p>
                    </div>
                  )}

                  <p className="text-gray-700 font-medium mt-2 text-xs lg:text-sm">
                    Status:{" "}
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        order.status === "pending"
                          ? "bg-yellow-500"
                          : order.status === "out-for-delivery"
                          ? "bg-blue-500"
                          : order.status === "completed"
                          ? "bg-green-600"
                          : order.status === "cancelled"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {order.status === "out-for-delivery" ? "Out for Delivery" : order.status}
                    </span>
                  </p>

                  {/* Display tracking number if available */}
                  {order.trackingNumber && (
                    <p className="text-gray-600 text-xs mt-1">
                      <span className="font-semibold">Tracking:</span> {order.trackingNumber}
                    </p>
                  )}

                <div className="mt-3 flex flex-col gap-2">
                  {order.status === "pending" && (
                    <>
                      {order.deliveryOption === 'delivery' && (
                        <button
                          onClick={() => handleMarkForDelivery(order.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs lg:text-sm hover:bg-blue-700 transition-colors"
                        >
                          🚚 Mark for Delivery
                        </button>
                      )}
                      {order.deliveryOption === 'pickup' && (
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs lg:text-sm hover:bg-green-700 transition-colors"
                        >
                          ✓ Ready for Pickup
                        </button>
                      )}
                      {!order.deliveryOption && (
                        <button
                          onClick={() => handleMarkForDelivery(order.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs lg:text-sm hover:bg-blue-700 transition-colors"
                        >
                          🚚 Mark for Delivery
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs lg:text-sm hover:bg-red-700 transition-colors"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}

                  {order.status === "out-for-delivery" && (
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs lg:text-sm hover:bg-green-700 transition-colors"
                    >
                      ✓ Mark as Delivered
                    </button>
                  )}
                  
                  {order.status === "completed" && (
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs lg:text-sm text-center">
                      ✓ {order.deliveryOption === 'pickup' ? 'Picked Up' : 'Delivered'}
                    </div>
                  )}
                  
                  {order.status === "cancelled" && (
                    <div className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs lg:text-sm text-center">
                      ✗ Order Cancelled
                    </div>
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
