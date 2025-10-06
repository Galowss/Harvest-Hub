"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "../../config/firebase"; // ✅ ensure storage is exported from firebase config
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function FarmerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    harvestDate: "",
    photo: "",
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔍 Watch auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().role === "farmer") {
          setUser({ id: currentUser.uid, ...docSnap.data() });
          fetchProducts(currentUser.uid);
        } else {
          alert("Unauthorized access");
          router.push("/login");
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 🌾 Fetch products owned by this farmer
  const fetchProducts = async (farmerId: string) => {
    const q = query(collection(db, "products"), where("farmerId", "==", farmerId));
    const querySnapshot = await getDocs(q);

    const productsWithURLs = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        // ✅ If "photo" is a Firebase Storage path, convert it to a full URL
        if (data.photo && !data.photo.startsWith("http")) {
          try {
            const photoRef = ref(storage, data.photo);
            data.photo = await getDownloadURL(photoRef);
          } catch (error) {
            console.warn("Failed to load product photo:", error);
          }
        }

        return { id: docSnap.id, ...data };
      })
    );

    setProducts(productsWithURLs);
  };

  // ➕ Add new product
  const handleAddProduct = async (e: any) => {
    e.preventDefault();
    if (!user) return;

    await addDoc(collection(db, "products"), {
      ...newProduct,
      farmerId: user.id,
      createdAt: new Date(),
    });

    setNewProduct({ name: "", price: "", quantity: "", harvestDate: "", photo: "" });
    fetchProducts(user.id); // refresh list
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
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
          <a href="/dashboard/farmer/orders" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Orders
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Top Navbar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3 sm:gap-0">
          <input type="text" placeholder="Hello Farmer" className="px-4 py-2 w-full sm:w-auto text-sm lg:text-base" />
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="font-medium text-sm lg:text-base truncate">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded text-sm lg:text-base whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="bg-green-100 p-4 lg:p-6 rounded-lg mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold">
            Welcome, {user?.email?.split("@")[0]}!
          </h1>
          <p className="text-gray-700 text-sm lg:text-base">
            Manage your products and connect with buyers directly.
          </p>
        </section>

        {/* Product Listing Form */}
        <section className="mb-6 lg:mb-8 bg-white shadow p-4 lg:p-6 rounded">
          <h2 className="text-base lg:text-lg font-semibold mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="border px-3 py-2 rounded text-sm lg:text-base"
              required
            />
            <input
              type="text"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
              className="border px-3 py-2 rounded text-sm lg:text-base"
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newProduct.quantity}
              onChange={(e) =>
                setNewProduct({ ...newProduct, quantity: e.target.value })
              }
              className="border px-3 py-2 rounded text-sm lg:text-base"
              required
            />
            <input
              type="date"
              placeholder="Harvest Date"
              value={newProduct.harvestDate}
              onChange={(e) =>
                setNewProduct({ ...newProduct, harvestDate: e.target.value })
              }
              className="border px-3 py-2 rounded text-sm lg:text-base"
              required
            />
            <input
              type="text"
              placeholder="Photo URL or Storage Path"
              value={newProduct.photo}
              onChange={(e) =>
                setNewProduct({ ...newProduct, photo: e.target.value })
              }
              className="border px-3 py-2 rounded col-span-1 sm:col-span-2 text-sm lg:text-base"
            />
            <button
              type="submit"
              className="col-span-1 sm:col-span-2 bg-green-600 text-white py-2 rounded text-sm lg:text-base"
            >
              Add Product
            </button>
          </form>
        </section>

        {/* Display Products */}
        <section>
          <h2 className="text-base lg:text-lg font-semibold mb-3">Your Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {products.map((item) => (
              <div key={item.id} className="bg-white p-3 lg:p-4 shadow rounded">
                <div className="h-24 sm:h-32 bg-gray-200 mb-3 rounded overflow-hidden">
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.currentTarget.src = "/no-image.png") // fallback
                      }
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-500 text-xs lg:text-sm">
                      No Photo
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm lg:text-base">{item.name}</h3>
                <p className="text-xs lg:text-sm text-gray-500">Price: {item.price}</p>
                <p className="text-xs lg:text-sm text-gray-500">Qty: {item.quantity}</p>
                <p className="text-xs lg:text-sm text-gray-500">
                  Harvest: {item.harvestDate}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
