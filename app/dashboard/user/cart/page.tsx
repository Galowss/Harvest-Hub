"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
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
  const [loading, setLoading] = useState(true);
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

  const handleRemoveFromCart = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "cart", itemId));
      setCartItems(cartItems.filter((p) => p.id !== itemId));
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

  const handleOrderNow = async (item: any) => {
    if (!user) return;
    try {
      // create new order document
      await addDoc(collection(db, "orders"), {
        buyerId: user.id, // match Firestore rules
        farmerId: item.farmerId || "", // optional
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        photo: item.photo,
        status: "pending",
        createdAt: new Date(),
      });

      // remove from cart after ordering
      await deleteDoc(doc(db, "cart", item.id));
      setCartItems(cartItems.filter((p) => p.id !== item.id));

      alert("Order placed successfully!");
    } catch (err: any) {
      console.error("Error creating order:", err);
      alert("Error creating order. Check Firestore rules and console logs.");
    }
  };

  const handleCheckout = async () => {
    try {
      for (const item of cartItems) {
        // Check product availability before proceeding
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          throw new Error(`Product ${item.name} is no longer available`);
        }

        if (productSnap.data().quantity < item.quantity) {
          throw new Error(`Not enough stock for ${item.name}`);
        }
      }

      // Proceed with order creation
      for (const item of cartItems) {
        await addDoc(collection(db, "orders"), {
          buyerId: user.id, // match Firestore rules
          farmerId: item.farmerId || "", // optional
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          photo: item.photo,
          status: "pending",
          createdAt: new Date(),
        });
      }

      // Clear cart after successful checkout
      for (const item of cartItems) {
        await deleteDoc(doc(db, "cart", item.id));
      }
      setCartItems([]);

      alert("Checkout successful! Your order is being processed.");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred during checkout.");
      }
    }
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
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">Homepage</a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 bg-green-50 font-semibold whitespace-nowrap text-sm lg:text-base">Cart</a>
          <a href="/dashboard/user/rate_farmer" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">Rate Farmer</a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">Orders</a>
        </nav>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white p-3 lg:p-4 shadow rounded">
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
        )}

        {cartItems.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              Checkout
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
