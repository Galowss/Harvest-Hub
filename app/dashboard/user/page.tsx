"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";
import ProductDetailsDialog from "./ProductDetailsDialog"; // ✅ This dialog shows the farmer rating

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { handleLogout } = useLogout();

  // ✅ Watch auth and load user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().role === "user") {
        setUser({ id: currentUser.uid, ...docSnap.data() });
        fetchProducts();
      } else {
        alert("Unauthorized access");
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // ✅ Fetch all farmer products
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // ✅ View details & open dialog
  const handleViewDetails = async (product: any) => {
    console.log("🟢 Opening details for product:", product);
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  // ✅ Add product to cart
  const handleAddToCart = async (product: any) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Please log in to add items to cart.");
        return;
      }

      await addDoc(collection(db, "cart"), {
        userId: currentUser.uid,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        photo: product.photo || "",
        farmerId: product.farmerId || "",
        createdAt: new Date(),
      });

      alert("Product added to cart!");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart.");
    }
  };

  // ✅ Order now (direct purchase)
  const handleOrderNow = async (product: any) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Please log in to order.");
        return;
      }

      await addDoc(collection(db, "orders"), {
        buyerId: currentUser.uid,
        farmerId: product.farmerId,
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        status: "pending",
        createdAt: new Date(),
      });

      alert("Order placed successfully!");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order.");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a
            href="/dashboard/user"
            className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
          >
            Homepage
          </a>
          <a
            href="/dashboard/user/cart"
            className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
          >
            Cart
          </a>
          <a
            href="/dashboard/user/orders"
            className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
          >
            Orders
          </a>
          <a
            href="/dashboard/user/rate_farmer"
            className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
          >
            Rate Farmer
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3 sm:gap-0">
          <input
            type="text"
            placeholder="Search products..."
            className="px-4 py-2 border rounded w-full sm:w-1/3 text-sm lg:text-base"
          />
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <span className="font-medium text-sm lg:text-base truncate">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-red-700 text-sm lg:text-base whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Welcome */}
        <section className="bg-green-100 p-4 lg:p-6 rounded-lg mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold">
            Welcome, {user?.email?.split("@")[0]}!
          </h1>
          <p className="text-gray-700 text-sm lg:text-base">
            Discover fresh produce from trusted farmers.
          </p>
        </section>

        {/* All Products */}
        <section>
          <h2 className="text-base lg:text-lg font-semibold mb-3">Available Produce</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white p-3 lg:p-4 shadow rounded">
                <div
                  className="h-24 sm:h-32 bg-gray-200 mb-3 rounded"
                  style={{
                    backgroundImage: `url(${product.photo})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <h3 className="font-bold text-sm lg:text-base">{product.name}</h3>
                <p className="text-xs lg:text-sm text-gray-500">₱{product.price}</p>
                <button
                  onClick={() => handleViewDetails(product)}
                  className="mt-2 text-xs lg:text-sm text-blue-600 hover:underline"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ✅ Product Dialog (shows rating) */}
      {selectedProduct && (
        <ProductDetailsDialog
          product={selectedProduct}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}
