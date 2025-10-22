"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc, runTransaction } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLogout } from "@/hooks/useLogout";

interface User {
  id: string;
  email: string | null;
}

interface Order {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
  reviewed?: boolean;
  productImage?: string;
  buyerId: string;
  trackingNumber?: string;
  deliveryStatus?: string;
  deliveryStartedAt?: any;
  deliveredAt?: any;
  deliveryOption?: 'delivery' | 'pickup';
  deliveryAddress?: string;
  pickupDate?: string;
  pickupTime?: string;
  pickupDateTime?: any;
  requiresDelivery?: boolean;
  [key: string]: unknown; // Allow additional properties
}

interface ReviewModalState {
  isOpen: boolean;
  order: Order | null;
}

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [reviewModal, setReviewModal] = useState<ReviewModalState>({ isOpen: false, order: null });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { handleLogout } = useLogout();
  const router = useRouter();

  // Filter orders based on active filter
  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return order.status === 'pending' || order.status === 'Pending';
    if (activeFilter === 'out-for-delivery') return order.status === 'out-for-delivery';
    if (activeFilter === 'completed') return order.status === 'completed';
    if (activeFilter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  // Count orders by status
  const orderCounts = {
    all: orders.length,
    pending: orders.filter(order => order.status === 'pending' || order.status === 'Pending').length,
    'out-for-delivery': orders.filter(order => order.status === 'out-for-delivery').length,
    completed: orders.filter(order => order.status === 'completed').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length
  };

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
      
      const ordersWithImages = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const orderData = docSnap.data();
          
          // Fetch product info including images
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
            productImage,
            name: productName,
          } as Order;
        })
      );
      
      console.log("Fetched orders with images:", ordersWithImages);
      setOrders(ordersWithImages);
    } catch (err) {
      console.error("Error fetching orders:", err);
      alert("Failed to load your orders. Please check Firestore rules.");
    }
  };

  const handleCancelOrder = async (orderId: string, order: Order) => {
    if (order.status !== "pending" && order.status !== "Pending") {
      alert("Only pending orders can be cancelled.");
      return;
    }

    if (confirm(`Are you sure you want to cancel the order for "${order.name}"?`)) {
      try {
        // Reference to the product document
        const productRef = doc(db, "products", order.productId);

        // Run the order cancellation and quantity restoration in a transaction
        await runTransaction(db, async (transaction) => {
          const productSnap = await transaction.get(productRef);
          
          if (productSnap.exists()) {
            const productData = productSnap.data();
            const currentQuantity = productData.quantity;
            const restoredQuantity = currentQuantity + order.quantity;

            // Restore product quantity
            transaction.update(productRef, {
              quantity: restoredQuantity
            });
          }

          // Update order status to cancelled
          const orderRef = doc(db, "orders", orderId);
          transaction.update(orderRef, {
            status: "cancelled",
            cancelledAt: new Date()
          });
        });

        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: "cancelled" } : o
          )
        );

        alert("Order cancelled successfully. Product quantity has been restored.");
      } catch (error) {
        console.error("Error cancelling order:", error);
        alert("Failed to cancel the order. Please try again.");
      }
    }
  };

  const handleOpenReviewModal = (order: Order) => {
    setReviewModal({ isOpen: true, order });
    setReviewData({ rating: 5, comment: '' });
  };

  const handleCloseReviewModal = () => {
    setReviewModal({ isOpen: false, order: null });
    setReviewData({ rating: 5, comment: '' });
  };

  const handleSubmitReview = async () => {
    if (!reviewModal.order || !user) return;

    setSubmittingReview(true);
    try {
      // Get farmer information from the product
      const productDoc = await getDoc(doc(db, "products", reviewModal.order.productId));
      if (!productDoc.exists()) {
        alert("Product not found");
        return;
      }

      const productData = productDoc.data();
      const farmerId = productData.farmerId;

      // Create review document
      await addDoc(collection(db, "reviews"), {
        userId: user.id,
        userEmail: user.email,
        farmerId: farmerId,
        productId: reviewModal.order.productId,
        orderId: reviewModal.order.id,
        productName: reviewModal.order.name,
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: new Date(),
        reviewType: 'order'
      });

      // Update order to mark as reviewed
      await updateDoc(doc(db, "orders", reviewModal.order.id), {
        reviewed: true,
        reviewedAt: new Date()
      });

      // Update local orders state
      setOrders(prev => prev.map(order => 
        order.id === reviewModal.order?.id 
          ? { ...order, reviewed: true }
          : order
      ));

      alert("Review submitted successfully!");
      handleCloseReviewModal();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
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
          <Link href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Homepage
          </Link>
          <Link href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Cart
          </Link>
          <Link href="/dashboard/user/orders" className="block px-3 py-2 rounded bg-green-50 hover:bg-green-100 font-semibold whitespace-nowrap text-sm lg:text-base">
            Orders
          </Link>
          <Link href="/dashboard/user/rate_farmer" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Rate Farmer
          </Link>
          <Link href="/dashboard/user/profile" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Profile
          </Link>
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">My Orders</h1>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }`}
            >
              All Orders ({orderCounts.all})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeFilter === 'pending'
                  ? 'bg-yellow-500 text-white border-b-2 border-yellow-500'
                  : 'text-gray-600 hover:text-yellow-500 hover:bg-gray-50'
              }`}
            >
              Pending ({orderCounts.pending})
            </button>
            <button
              onClick={() => setActiveFilter('out-for-delivery')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeFilter === 'out-for-delivery'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }`}
            >
              🚚 Out for Delivery ({orderCounts['out-for-delivery']})
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeFilter === 'completed'
                  ? 'bg-green-500 text-white border-b-2 border-green-500'
                  : 'text-gray-600 hover:text-green-500 hover:bg-gray-50'
              }`}
            >
              Completed ({orderCounts.completed})
            </button>
            <button
              onClick={() => setActiveFilter('cancelled')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeFilter === 'cancelled'
                  ? 'bg-red-500 text-white border-b-2 border-red-500'
                  : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
              }`}
            >
              Cancelled ({orderCounts.cancelled})
            </button>
          </div>
        </div>

        {/* Orders Display */}
        {filteredOrders.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="mb-4">
              {activeFilter === 'all' 
                ? 'You have no orders yet.' 
                : `No ${activeFilter} orders found.`
              }
            </div>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View all orders
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredOrders.map((order) => (
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
                <p className="text-gray-600 text-xs lg:text-sm">Quantity: {order.quantity}</p>
                <p className="text-gray-600 text-xs lg:text-sm">Price: ₱{order.price}</p>
                
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

                <p className="text-gray-700 font-medium mt-2 text-xs lg:text-sm">
                  Status:{" "}
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      order.status === "pending" || order.status === "Pending"
                        ? "bg-yellow-500"
                        : order.status === "out-for-delivery"
                        ? "bg-blue-500"
                        : order.status === "cancelled"
                        ? "bg-red-500"
                        : "bg-green-600" // All completed orders will be green
                    }`}
                  >
                    {order.status === "out-for-delivery" ? "🚚 Out for Delivery" : order.status}
                  </span>
                </p>

                {/* Delivery Address (for delivery orders) */}
                {order.deliveryOption === 'delivery' && order.deliveryAddress && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-800">Delivery Address:</p>
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

                {/* Delivery Tracking Information */}
                {order.status === "out-for-delivery" && order.deliveryOption === 'delivery' && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-1">📦 Delivery Tracking</p>
                    {order.trackingNumber && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Tracking #:</span> {order.trackingNumber}
                      </p>
                    )}
                    {order.deliveryStartedAt && (
                      <p className="text-xs text-gray-600 mt-1">
                        Started: {new Date(order.deliveryStartedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {order.status === "completed" && order.deliveredAt && (
                  <p className="text-xs text-green-700 mt-1">
                    {order.deliveryOption === 'pickup' ? 'Picked up on:' : 'Delivered on:'} {new Date(order.deliveredAt.seconds * 1000).toLocaleDateString()}
                  </p>
                )}
                
                {/* Cancel button for pending orders */}
                {(order.status === "pending" || order.status === "Pending") && (
                  <button
                    onClick={() => handleCancelOrder(order.id, order)}
                    className="mt-3 w-full bg-red-600 text-white px-3 py-2 rounded text-xs lg:text-sm hover:bg-red-700 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}

                {/* Note for out for delivery/pickup ready orders */}
                {order.status === "out-for-delivery" && (
                  <div className="mt-3 w-full bg-blue-100 text-blue-800 px-3 py-2 rounded text-xs lg:text-sm text-center">
                    {order.deliveryOption === 'delivery' ? 'Your order is on its way!' : 'Your order is ready for pickup!'}
                  </div>
                )}

                {/* Review button for completed orders */}
                {order.status === "completed" && !order.reviewed && (
                  <button
                    onClick={() => handleOpenReviewModal(order)}
                    className="mt-3 w-full bg-blue-600 text-white px-3 py-2 rounded text-xs lg:text-sm hover:bg-blue-700 transition-colors"
                  >
                    Write Review
                  </button>
                )}

                {/* Already reviewed indicator */}
                {order.status === "completed" && order.reviewed && (
                  <div className="mt-3 w-full bg-gray-100 text-gray-600 px-3 py-2 rounded text-xs lg:text-sm text-center">
                    ✓ Reviewed
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {reviewModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Review Order</h2>
              
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{reviewModal.order?.name}</h3>
                <p className="text-gray-600 text-sm">Quantity: {reviewModal.order?.quantity}</p>
                <p className="text-gray-600 text-sm">Price: {reviewModal.order?.price}</p>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                      className={`text-2xl ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">{reviewData.rating} out of 5 stars</p>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience with this product..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 text-sm"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{reviewData.comment.length}/500 characters</p>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseReviewModal}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
