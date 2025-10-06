"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useLogout } from "@/hooks/useLogout";

export default function RateSpecificFarmer() {
  const params = useParams();
  const farmerId = params?.farmerId as string;
  const router = useRouter();
  const { handleLogout } = useLogout();

  const [farmer, setFarmer] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Auth and fetch farmer
  useEffect(() => {
    if (!farmerId) return;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      await fetchFarmerDetails(farmerId);
    });

    return () => unsubscribe();
  }, [farmerId, router]);

  const fetchFarmerDetails = async (id: string) => {
    try {
      const farmerDoc = await getDoc(doc(db, "users", id));
      if (farmerDoc.exists()) {
        setFarmer({ id, ...farmerDoc.data() });
      } else {
        alert("Farmer not found.");
        router.push("/dashboard/user/rate_farmer");
      }
    } catch (error) {
      console.error("Error fetching farmer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!rating) {
      alert("Please select a rating.");
      return;
    }
    if (!user || !farmerId) return;

    try {
      // ✅ Save rating
      await addDoc(collection(db, "ratings"), {
        farmerId,
        userId: user.uid,
        rating: Number(rating),
        review,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Rating submitted:", { farmerId, rating, review });
      alert("Thank you for your feedback!");
      router.push("/dashboard/user/rate_farmer");
    } catch (error) {
      console.error("❌ Error submitting rating:", error);
      alert("Failed to submit rating.");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );

  if (!farmer)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Farmer not found.</p>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">Homepage</a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">Cart</a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">Orders</a>
          <a href="/dashboard/user/rate_farmer" className="block px-3 py-2 rounded hover:bg-green-100 bg-green-50 font-semibold whitespace-nowrap text-sm lg:text-base">Rate Farmer</a>
          <a href="/dashboard/user/profile" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">Profile</a>
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Rate {farmer.name || "Unnamed Farmer"}
          </h1>
          <span className="font-medium text-gray-700">{user?.email}</span>
        </header>

        <div className="bg-white shadow-md p-6 rounded-lg max-w-xl">
          <div className="mb-4">
            <p className="text-gray-700 font-medium mb-2">Select Rating:</p>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setRating(num)}
                  className={`px-4 py-2 rounded border ${
                    rating >= num
                      ? "bg-yellow-400 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {num} ⭐
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">
              Your Review
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Write your feedback..."
              rows={4}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Submit Rating
          </button>
        </div>
      </main>
    </div>
  );
}
