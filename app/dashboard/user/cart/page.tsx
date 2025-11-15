"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { useLogout } from "@/hooks/useLogout";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { handleLogout } = useLogout();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const userId = currentUser.uid;
        setUser({ id: userId });
        await fetchCartItems(userId);
      } catch (err) {
        console.error("Error loading cart:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchCartItems = async (userId: string) => {
    try {
      console.log("Fetching cart for user:", userId);
      const q = query(collection(db, "cart"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Cart items fetched:", items);
      setCartItems(items);
    } catch (err) {
      console.error("Error fetching cart items:", err);
      alert("Failed to fetch cart items. Please check your Firestore rules.");
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Select all items
  const selectAllItems = () => {
    const allItemIds = new Set(cartItems.map(item => item.id));
    setSelectedItems(allItemIds);
  };

  // Deselect all items
  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  // Get selected cart items
  const getSelectedCartItems = () => {
    return cartItems.filter(item => selectedItems.has(item.id));
  };

  // Calculate total for selected items
  const calculateSelectedTotal = () => {
    return getSelectedCartItems().reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleRemoveFromCart = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "cart", itemId));
      setCartItems(cartItems.filter((p) => p.id !== itemId));
      // Remove from selection if it was selected
      const newSelected = new Set(selectedItems);
      newSelected.delete(itemId);
      setSelectedItems(newSelected);
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  interface OrderData {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    farmerId?: string;
  }

  interface ProductData {
    photo?: string;
    [key: string]: any;
  }

  const createOrder = async (orderData: OrderData): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch product details including photo
      const productRef = doc(db, "products", orderData.productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error("Product not found");
      }

      const productData = productSnap.data() as ProductData;

      await addDoc(collection(db, "orders"), {
        ...orderData,
        photo: productData.photo || '', // Include photo URL
        buyerId: user.uid,
        status: "pending",
        createdAt: new Date()
      });

    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const handleOrderNow = (item: any) => {
    router.push(`/dashboard/user/order-summary?ids=${item.id}`);
  };

  const openCheckoutSummary = () => {
    const selectedCartItems = getSelectedCartItems();
    if (selectedCartItems.length === 0) {
      alert("Please select at least one item to checkout.");
      return;
    }
    const ids = selectedCartItems.map(item => item.id).join(",");
    router.push(`/dashboard/user/order-summary?ids=${ids}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-md p-3 sm:p-4 lg:h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-lg sm:text-xl font-bold">HarvestHub</h2>
          {/* Mobile Menu Toggle */}
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
        
        {/* Navigation */}
        <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block space-y-2`}>
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Dashboard
          </a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base">
            Cart
          </a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/user/rate_farmer" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Rate Farmer
          </a>
          <a href="/dashboard/user/profile" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Profile
          </a>
          <a href="/dashboard/community" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Community Hub
          </a>
          <a href="/dashboard/map" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Farmer Map
          </a>
        </nav>
        
        {/* Logout Button */}
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
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl lg:text-2xl font-bold">My Cart</h1>
          <span className="text-gray-700 font-medium text-sm lg:text-base truncate">{user?.email}</span>
        </header>

        {cartItems.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            Your cart is empty.
          </div>
        ) : (
          <>
            {/* Selection Header */}
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={selectedItems.size === cartItems.length ? deselectAllItems : selectAllItems}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedItems.size === cartItems.length
                          ? 'bg-green-600 border-green-600 text-white'
                          : selectedItems.size > 0
                          ? 'bg-green-200 border-green-600 text-green-600'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {selectedItems.size === cartItems.length ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : selectedItems.size > 0 ? (
                        <div className="w-2 h-2 bg-current rounded-full"></div>
                      ) : null}
                    </button>
                    <span className="text-sm font-medium">
                      {selectedItems.size === cartItems.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedItems.size} of {cartItems.length} selected
                  </div>
                </div>
                {selectedItems.size > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Selected Total:</div>
                    <div className="text-lg font-bold text-green-600">
                      ₱{calculateSelectedTotal().toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white p-3 lg:p-4 shadow rounded relative">
                  {/* Selection Circle */}
                  <div 
                    className="absolute top-2 right-2 cursor-pointer"
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedItems.has(item.id) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedItems.has(item.id) && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div
                    className="h-24 sm:h-32 bg-gray-200 mb-3 rounded flex items-center justify-center"
                    style={{
                      backgroundImage: `url(${item.photo})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!item.photo && <span className="text-xs lg:text-sm text-gray-500">No Photo</span>}
                  </div>
                  <h3 className="font-bold text-sm lg:text-base">{item.name}</h3>
                  <p className="text-xs lg:text-sm text-gray-500">Price: {item.price}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Qty: {item.quantity}</p>
                  <div className="flex flex-col sm:flex-row justify-between mt-3 gap-2">
                    <button
                      onClick={() => handleOrderNow(item)}
                      className="text-xs lg:text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Order Now
                    </button>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-xs lg:text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {cartItems.length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Checkout Selected Items */}
            {selectedItems.size > 0 && (
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold">Checkout Selected Items</h3>
                    <p className="text-sm text-gray-600">{selectedItems.size} item(s) selected</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ₱{calculateSelectedTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={openCheckoutSummary}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
                >
                  Checkout Selected Items
                </button>
              </div>
            )}
            
            {/* Checkout All Items (if no items selected) */}
            {selectedItems.size === 0 && (
              <div className="bg-white p-4 rounded-lg shadow">
                <button
                  onClick={() => {
                    setSelectedItems(new Set(cartItems.map(item => item.id)));
                    setTimeout(() => openCheckoutSummary(), 0);
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
                >
                  Checkout All Items
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
