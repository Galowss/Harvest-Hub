"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc,
  query,
  where,
  updateDoc 
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { deleteUser as deleteAuthUser } from "firebase/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt?: any;
}

interface Product {
  id: string;
  name: string;
  price: number;
  farmerId: string;
  farmerName?: string;
  stock?: number;
  category?: string;
}

interface Order {
  id: string;
  buyerId: string;
  buyerName?: string;
  farmerId: string;
  farmerName?: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt?: any;
  deliveryAddress?: string;
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [farmers, setFarmers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'farmers' | 'products' | 'orders'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user is admin
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || userDoc.data().role !== "admin") {
          alert("Unauthorized access. Admin only.");
          router.push("/login");
          return;
        }

        setCurrentUser({ id: user.uid, ...userDoc.data() });
        await fetchData();
      } catch (error: any) {
        console.error("Error in auth state change:", error);
        alert(`Error loading admin dashboard: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchData = async () => {
    try {
      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData: User[] = [];
      const farmersData: User[] = [];

      usersSnapshot.docs.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as User;
        if (data.role === "farmer") {
          farmersData.push(data);
        } else if (data.role === "user") {
          usersData.push(data);
        }
      });

      setUsers(usersData);
      setFarmers(farmersData);

      // Fetch all products
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData: Product[] = [];

        for (const productDoc of productsSnapshot.docs) {
          const product = { id: productDoc.id, ...productDoc.data() } as Product;
          
          // Get farmer name with error handling
          if (product.farmerId) {
            try {
              const farmerDoc = await getDoc(doc(db, "users", product.farmerId));
              if (farmerDoc.exists()) {
                product.farmerName = farmerDoc.data().name || farmerDoc.data().email;
              }
            } catch (err) {
              console.error("Error fetching farmer name:", err);
              product.farmerName = "Unknown";
            }
          }
          
          productsData.push(product);
        }

        setProducts(productsData);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      }

      // Fetch all orders
      try {
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const ordersData: Order[] = [];

        for (const orderDoc of ordersSnapshot.docs) {
          const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
          
          // Get buyer name with error handling
          if (order.buyerId) {
            try {
              const buyerDoc = await getDoc(doc(db, "users", order.buyerId));
              if (buyerDoc.exists()) {
                order.buyerName = buyerDoc.data().name || buyerDoc.data().email;
              }
            } catch (err) {
              console.error("Error fetching buyer name:", err);
              order.buyerName = "Unknown";
            }
          }
          
          // Get farmer name with error handling
          if (order.farmerId) {
            try {
              const farmerDoc = await getDoc(doc(db, "users", order.farmerId));
              if (farmerDoc.exists()) {
                order.farmerName = farmerDoc.data().name || farmerDoc.data().email;
              }
            } catch (err) {
              console.error("Error fetching farmer name:", err);
              order.farmerName = "Unknown";
            }
          }
          
          ordersData.push(order);
        }

        setOrders(ordersData);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      alert(`Failed to load data: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user: ${userEmail}?\n\nThis will delete:\n- User account\n- All their orders\n- All their cart items\n- All their ratings`)) {
      return;
    }

    setDeleting(true);
    try {
      // Delete related data first
      const ordersQuery = query(collection(db, "orders"), where("buyerId", "==", userId));
      const ordersSnapshot = await getDocs(ordersQuery);
      await Promise.all(ordersSnapshot.docs.map(orderDoc => 
        deleteDoc(doc(db, "orders", orderDoc.id))
      ));

      const cartQuery = query(collection(db, "cart"), where("userId", "==", userId));
      const cartSnapshot = await getDocs(cartQuery);
      await Promise.all(cartSnapshot.docs.map(cartDoc => 
        deleteDoc(doc(db, "cart", cartDoc.id))
      ));

      const ratingsQuery = query(collection(db, "ratings"), where("userId", "==", userId));
      const ratingsSnapshot = await getDocs(ratingsQuery);
      await Promise.all(ratingsSnapshot.docs.map(ratingDoc => 
        deleteDoc(doc(db, "ratings", ratingDoc.id))
      ));

      // Delete user document last
      await deleteDoc(doc(db, "users", userId));

      alert("User deleted successfully!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Error: " + error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteFarmer = async (farmerId: string, farmerEmail: string) => {
    if (!confirm(`Are you sure you want to delete farmer: ${farmerEmail}?\n\nThis will delete:\n- Farmer account\n- All their products\n- All orders related to their products\n- All their ratings`)) {
      return;
    }

    setDeleting(true);
    try {
      // Delete all related data first
      const productsQuery = query(collection(db, "products"), where("farmerId", "==", farmerId));
      const productsSnapshot = await getDocs(productsQuery);
      await Promise.all(productsSnapshot.docs.map(productDoc => 
        deleteDoc(doc(db, "products", productDoc.id))
      ));

      const ordersQuery = query(collection(db, "orders"), where("farmerId", "==", farmerId));
      const ordersSnapshot = await getDocs(ordersQuery);
      await Promise.all(ordersSnapshot.docs.map(orderDoc => 
        deleteDoc(doc(db, "orders", orderDoc.id))
      ));

      const ratingsQuery = query(collection(db, "ratings"), where("farmerId", "==", farmerId));
      const ratingsSnapshot = await getDocs(ratingsQuery);
      await Promise.all(ratingsSnapshot.docs.map(ratingDoc => 
        deleteDoc(doc(db, "ratings", ratingDoc.id))
      ));

      // Delete farmer document last
      await deleteDoc(doc(db, "users", farmerId));

      alert("Farmer and all related data deleted successfully!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting farmer:", error);
      alert("Failed to delete farmer. Error: " + error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete product: ${productName}?`)) {
      return;
    }

    setDeleting(true);
    try {
      // Remove from carts first
      const cartQuery = query(collection(db, "cart"), where("productId", "==", productId));
      const cartSnapshot = await getDocs(cartQuery);
      await Promise.all(cartSnapshot.docs.map(cartDoc => 
        deleteDoc(doc(db, "cart", cartDoc.id))
      ));

      // Delete product
      await deleteDoc(doc(db, "products", productId));

      alert("Product deleted successfully!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Error: " + error);
    } finally {
      setDeleting(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string, userEmail: string, currentRole: string) => {
    if (!confirm(`Are you sure you want to promote ${currentRole}: ${userEmail} to admin?\n\nThis will give them full administrative privileges.`)) {
      return;
    }

    setDeleting(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        role: "admin"
      });

      alert(`${userEmail} has been promoted to admin successfully!`);
      await fetchData();
    } catch (error) {
      console.error("Error promoting user:", error);
      alert("Failed to promote user. Error: " + error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelOrder = async (orderId: string, orderDetails: string) => {
    if (!confirm(`Are you sure you want to cancel this order?\n\n${orderDetails}`)) {
      return;
    }

    setDeleting(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: "admin"
      });

      alert("Order cancelled successfully!");
      await fetchData();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order. Error: " + error);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const filterData = (data: any[], searchFields: string[]) => {
    if (!searchTerm) return data;
    return data.filter(item =>
      searchFields.some(field =>
        item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const filteredUsers = filterData(users, ['email', 'name']);
  const filteredFarmers = filterData(farmers, ['email', 'name']);
  const filteredProducts = filterData(products, ['name', 'category', 'farmerName']);
  const filteredOrders = filterData(orders, ['productName', 'buyerName', 'farmerName', 'status']);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 relative">
      {/* Loading Overlay */}
      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-lg font-medium">Processing...</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-indigo-100 p-3 sm:p-4 lg:h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-lg sm:text-xl font-bold">Admin Panel</h2>
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
          <a href="/dashboard/admin" className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base">
            Dashboard
          </a>
        </nav>

        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block mt-4 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-200`}>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center lg:justify-start space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, farmers, and products</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Total Users</h3>
            <p className="text-2xl font-bold text-blue-900">{users.length}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Total Farmers</h3>
            <p className="text-2xl font-bold text-green-900">{farmers.length}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Total Products</h3>
            <p className="text-2xl font-bold text-purple-900">{products.length}</p>
          </div>
          <div className="bg-orange-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-800">Total Orders</h3>
            <p className="text-2xl font-bold text-orange-900">{orders.length}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Users ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('farmers')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'farmers'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            Farmers ({filteredFarmers.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            Products ({filteredProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            Orders ({filteredOrders.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{user.name || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handlePromoteToAdmin(user.id, user.email, 'user')}
                          disabled={deleting}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Promote to Admin
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deleting}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="text-center py-8 text-gray-500">No users found</p>
              )}
            </div>
          </div>
        )}

        {/* Farmers Tab */}
        {activeTab === 'farmers' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id}>
                      <td className="px-4 py-4 text-sm text-gray-900">{farmer.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{farmer.name || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handlePromoteToAdmin(farmer.id, farmer.email, 'farmer')}
                          disabled={deleting}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Promote to Admin
                        </button>
                        <button
                          onClick={() => handleDeleteFarmer(farmer.id, farmer.email)}
                          disabled={deleting}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFarmers.length === 0 && (
                <p className="text-center py-8 text-gray-500">No farmers found</p>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-4 text-sm text-gray-900">{product.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">₱{product.price}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{product.stock || 0}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{product.farmerName || 'Unknown'}</td>
                      <td className="px-4 py-4 text-sm">
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          disabled={deleting}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <p className="text-center py-8 text-gray-500">No products found</p>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-4 text-sm text-gray-900">{order.productName}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{order.buyerName || 'Unknown'}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{order.farmerName || 'Unknown'}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{order.quantity}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">₱{order.totalPrice}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          order.status === 'out-for-delivery' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {order.status !== 'cancelled' && order.status !== 'completed' && (
                          <button
                            onClick={() => handleCancelOrder(
                              order.id, 
                              `Product: ${order.productName}\nBuyer: ${order.buyerName}\nAmount: ₱${order.totalPrice}`
                            )}
                            disabled={deleting}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel Order
                          </button>
                        )}
                        {(order.status === 'cancelled' || order.status === 'completed') && (
                          <span className="text-gray-400 text-xs">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <p className="text-center py-8 text-gray-500">No orders found</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
