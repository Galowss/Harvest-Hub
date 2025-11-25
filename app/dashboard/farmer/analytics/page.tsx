"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    quantity: number;
  }>;
  recentOrders: Array<{
    id: string;
    buyerName: string;
    productName: string;
    quantity: number;
    total: number;
    status: string;
    date: any;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  paymentMethods: {
    wallet: number;
    cod: number;
  };
}

export default function FarmerAnalytics() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData>({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentOrders: [],
    monthlyRevenue: [],
    paymentMethods: { wallet: 0, cod: 0 },
  });
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("month");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().role === "farmer") {
        setUser({ id: currentUser.uid, ...docSnap.data() });
        await fetchAnalytics(currentUser.uid);
      } else {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, timeFilter]);

  const fetchAnalytics = async (farmerId: string) => {
    try {
      // Fetch all orders for this farmer
      // If index is still building, fall back to query without orderBy
      let ordersQuery;
      let ordersSnapshot;
      
      try {
        ordersQuery = query(
          collection(db, "orders"),
          where("farmerId", "==", farmerId),
          orderBy("createdAt", "desc")
        );
        ordersSnapshot = await getDocs(ordersQuery);
      } catch (indexError: any) {
        // If index is building, use simpler query
        console.log("Index building, using fallback query");
        ordersQuery = query(
          collection(db, "orders"),
          where("farmerId", "==", farmerId)
        );
        ordersSnapshot = await getDocs(ordersQuery);
      }

      let totalRevenue = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      let cancelledOrders = 0;
      const productSales: Record<string, { sales: number; revenue: number; quantity: number; name: string }> = {};
      const recentOrders: any[] = [];
      const monthlyData: Record<string, { revenue: number; orders: number }> = {};
      let walletPayments = 0;
      let codPayments = 0;

      const now = new Date();
      const filterDate = new Date();
      if (timeFilter === "week") {
        filterDate.setDate(now.getDate() - 7);
      } else if (timeFilter === "month") {
        filterDate.setMonth(now.getMonth() - 1);
      }

      // Convert to array and sort manually if needed
      const orderDocs = ordersSnapshot.docs.sort((a, b) => {
        const aTime = a.data().createdAt?.toMillis?.() || 0;
        const bTime = b.data().createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      orderDocs.forEach((orderDoc) => {
        const order = orderDoc.data();
        const orderDate = order.createdAt?.toDate();
        
        // Apply time filter
        if (timeFilter !== "all" && orderDate < filterDate) {
          return;
        }

        const amount = (parseFloat(order.price) || 0) * (parseInt(order.quantity) || 1);

        // Count orders by status
        if (order.status === "completed") {
          completedOrders++;
          totalRevenue += amount;

          // Track payment methods
          if (order.paymentMethod === "wallet") {
            walletPayments += amount;
          } else {
            codPayments += amount;
          }
        } else if (order.status === "pending" || order.status === "out-for-delivery") {
          pendingOrders++;
        } else if (order.status === "cancelled") {
          cancelledOrders++;
        }

        // Track product sales
        const productName = order.name || "Unknown Product";
        if (!productSales[productName]) {
          productSales[productName] = { sales: 0, revenue: 0, quantity: 0, name: productName };
        }
        if (order.status === "completed") {
          productSales[productName].sales++;
          productSales[productName].revenue += amount;
          productSales[productName].quantity += parseInt(order.quantity) || 1;
        }

        // Track monthly revenue
        if (order.status === "completed" && orderDate) {
          const monthKey = orderDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, orders: 0 };
          }
          monthlyData[monthKey].revenue += amount;
          monthlyData[monthKey].orders++;
        }

        // Recent orders (last 10)
        if (recentOrders.length < 10) {
          recentOrders.push({
            id: orderDoc.id,
            buyerName: order.buyerName || "Unknown",
            productName: order.name || "Unknown",
            quantity: order.quantity || 1,
            total: amount,
            status: order.status || "pending",
            date: order.createdAt,
          });
        }
      });

      // Sort top products by revenue
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Convert monthly data to array and sort
      const monthlyRevenue = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .slice(0, 6)
        .reverse();

      const totalOrders = completedOrders + pendingOrders + cancelledOrders;
      const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

      setSalesData({
        totalRevenue,
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        averageOrderValue,
        topProducts,
        recentOrders,
        monthlyRevenue,
        paymentMethods: { wallet: walletPayments, cod: codPayments },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-lg p-4 lg:p-6 flex flex-col fixed lg:static bottom-0 lg:bottom-auto left-0 right-0 lg:h-screen z-50 lg:z-auto max-h-[80vh] lg:max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-bold flex items-center gap-2">
            <img src="/harvest-hub-logo.png" alt="HarvestHub Logo" className="w-8 h-8" />
            HarvestHub
          </h2>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block space-y-2`}>
          <a href="/dashboard/farmer" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Home
          </a>
          <a href="/dashboard/farmer/analytics" className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base">
            Analytics
          </a>
          <a href="/dashboard/farmer/profile" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Profile
          </a>
          <a href="/dashboard/farmer/orders" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/farmer/pricing" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Market Pricing
          </a>
          <a href="/dashboard/farmer/ratings" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Ratings
          </a>
          <a href="/dashboard/farmer/wallet" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Wallet
          </a>
          <a href="/dashboard/community" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Community Hub
          </a>
        </nav>

        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block mt-auto pt-4 lg:pt-6 border-t border-gray-200`}>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                Sales Analytics
              </h1>
              <p className="text-gray-600 mt-1">Track your performance and sales metrics</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilter("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === "week"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeFilter("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === "month"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === "all"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm opacity-90">Total Revenue</h3>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold">₱{salesData.totalRevenue.toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-2">From {salesData.completedOrders} completed orders</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-600">Total Orders</h3>
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{salesData.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-2">
                {salesData.completedOrders} completed, {salesData.pendingOrders} pending
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-600">Average Order</h3>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">₱{salesData.averageOrderValue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">Per completed order</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-600">Completion Rate</h3>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {salesData.totalOrders > 0
                  ? ((salesData.completedOrders / salesData.totalOrders) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {salesData.cancelledOrders} cancelled orders
              </p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Methods</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-lg">💳</span> E-Wallet
                    </span>
                    <span className="text-sm font-semibold text-purple-600">
                      ₱{salesData.paymentMethods.wallet.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${
                          salesData.totalRevenue > 0
                            ? (salesData.paymentMethods.wallet / salesData.totalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-lg">💵</span> Cash on Delivery
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      ₱{salesData.paymentMethods.cod.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${
                          salesData.totalRevenue > 0
                            ? (salesData.paymentMethods.cod / salesData.totalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Order Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">✅ Completed</span>
                  <span className="text-lg font-bold text-green-600">{salesData.completedOrders}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-800">⏳ Pending</span>
                  <span className="text-lg font-bold text-orange-600">{salesData.pendingOrders}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-800">❌ Cancelled</span>
                  <span className="text-lg font-bold text-red-600">{salesData.cancelledOrders}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Selling Products</h3>
            {salesData.topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Orders</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📦"}</span>
                            <span className="font-medium text-gray-800">{product.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-600">{product.sales}</td>
                        <td className="text-right py-3 px-4 text-gray-600">{product.quantity}</td>
                        <td className="text-right py-3 px-4 font-semibold text-green-600">
                          ₱{product.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No product sales data yet</p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Orders</h3>
            {salesData.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Buyer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{order.buyerName}</td>
                        <td className="py-3 px-4 text-gray-600">{order.productName}</td>
                        <td className="text-right py-3 px-4 text-gray-600">{order.quantity}</td>
                        <td className="text-right py-3 px-4 font-semibold text-gray-800">
                          ₱{order.total.toFixed(2)}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "pending"
                                ? "bg-orange-100 text-orange-800"
                                : order.status === "out-for-delivery"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No recent orders</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
