"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";

export default function RateFarmer() {
  const [user, setUser] = useState<any>(null);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { handleLogout } = useLogout();

  // ✅ Auth check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().role === "user") {
        setUser({ ...docSnap.data(), uid: currentUser.uid });
        fetchFarmers(currentUser.uid);
      } else {
        alert("Unauthorized access");
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ✅ Fetch farmers from user's orders
  const fetchFarmers = async (userId: string) => {
    try {
      const q = query(collection(db, "orders"), where("buyerId", "==", userId));
      const querySnapshot = await getDocs(q);

      const farmerIds = new Set<string>();
      querySnapshot.forEach((order) => {
        const farmerId = order.data().farmerId;
        if (farmerId) farmerIds.add(farmerId);
      });

      const farmerData: any[] = [];
      for (let farmerId of farmerIds) {
        const farmerDoc = await getDoc(doc(db, "users", farmerId));
        if (farmerDoc.exists()) {
          farmerData.push({
            id: farmerId,
            ...farmerDoc.data(),
          });
        }
      }

      setFarmers(farmerData);
    } catch (error) {
      console.error("Error fetching farmers:", error);
      alert("Error loading farmers.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600 animate-pulse">Loading farmers...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ✅ Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold mb-6">HarvestHub</h2>
        <nav className="space-y-2">
          <a
            href="/dashboard/user"
            className="block px-3 py-2 rounded hover:bg-green-100"
          >
            Homepage
          </a>
          <a
            href="/dashboard/user/cart"
            className="block px-3 py-2 rounded hover:bg-green-100"
          >
            Cart
          </a>
          <a
            href="/dashboard/user/orders"
            className="block px-3 py-2 rounded hover:bg-green-100"
          >
            Orders
          </a>
          <a
            href="/dashboard/user/rate_farmer"
            className="block px-3 py-2 rounded bg-green-100 font-semibold"
          >
            Rate Farmer
          </a>
          <a
            href="/dashboard/user/rating-and-review"
            className="block px-3 py-2 rounded hover:bg-green-100"
          >
            Rating & Review
          </a>
        </nav>
      </aside>

      {/* ✅ Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <input
            type="text"
            placeholder="Search farmers..."
            className="px-4 py-2 border rounded w-1/3"
          />
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-700">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-green-100 p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold mb-2">Rate Your Farmers</h1>
          <p className="text-gray-700">
            Select a farmer below to leave a rating and review for your
            experience.
          </p>
        </section>

        {/* ✅ Farmers List */}
        <section>
          {farmers.length === 0 ? (
            <p className="text-gray-600">
              You haven't ordered from any farmers yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {farmers.map((farmer) => (
                <div
                  key={farmer.id}
                  className="bg-white p-4 shadow rounded-lg hover:shadow-md transition"
                >
                  <div
                    className="h-24 w-full bg-gray-200 mb-3 rounded"
                    style={{
                      backgroundImage: farmer.photoURL
                        ? `url(${farmer.photoURL})`
                        : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <h3 className="font-bold text-gray-800">
                    {farmer.name || "Unnamed Farmer"}
                  </h3>
                  <p className="text-sm text-gray-500">{farmer.email}</p>
                  <button
                    onClick={() =>
                      router.push(`/dashboard/user/rate_farmer/${farmer.id}`)
                    }
                    className="mt-3 text-sm text-white bg-green-600 px-3 py-1.5 rounded hover:bg-green-700"
                  >
                    Rate Farmer
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
