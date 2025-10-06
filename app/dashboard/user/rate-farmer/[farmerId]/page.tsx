"use client";

import { useEffect, useState } from "react";        // React hooks
import { useParams, useRouter } from "next/navigation"; // Next.js routing
import { auth, db } from "../../../../config/firebase"; // Firebase config
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

  useEffect(() => {
    const fetchFarmer = async () => {
      if (!farmerId) return;
      
      try {
        setLoading(true);
        const farmerDoc = await getDoc(doc(db, "users", farmerId));
        if (farmerDoc.exists()) {
          setFarmer({ id: farmerId, ...farmerDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching farmer:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchFarmer();
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [farmerId, router]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !auth.currentUser) {
      alert("Please provide a rating");
      return;
    }

    if (!review.trim()) {
      alert("Please write a review before submitting");
      return;
    }

    if (review.trim().length < 10) {
      alert("Please write a review with at least 10 characters");
      return;
    }

    try {
      console.log("Submitting review:", {
        farmerId,
        buyerId: auth.currentUser.uid,
        buyerName: auth.currentUser.email,
        review: review.trim(),
        rating
      });

      const reviewRef = await addDoc(collection(db, "reviews"), {
        farmerId,
        buyerId: auth.currentUser.uid,
        buyerName: auth.currentUser.email,
        review: review.trim(),
        rating,
        createdAt: serverTimestamp()
      });

      console.log("Review submitted successfully with ID:", reviewRef.id);
      alert("Rating and review submitted successfully!");
      setRating(0);
      setReview("");
      router.push("/dashboard/user/rate-farmer");
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center px-4">
      <p className="text-gray-600 text-sm sm:text-base">Loading...</p>
    </div>
  );
  if (!farmer) return (
    <div className="flex h-screen items-center justify-center px-4">
      <p className="text-gray-600 text-sm sm:text-base">Farmer not found</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Homepage
          </a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Cart
          </a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/user/rate-farmer" className="block px-3 py-2 rounded bg-green-50 hover:bg-green-100 font-semibold whitespace-nowrap text-sm lg:text-base">
            Rate Farmer
          </a>
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 sm:space-x-2 w-full px-2 sm:px-3 py-1.5 sm:py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-xs sm:text-sm lg:text-base"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2 sm:gap-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">{farmer.name ? `Rate ${farmer.name}` : 'Rate Farmer'}</h1>
          <span className="font-medium text-gray-700 text-xs sm:text-sm lg:text-base truncate">{user?.email}</span>
        </header>
        
        <form onSubmit={handleSubmitRating} className="max-w-full sm:max-w-sm md:max-w-md space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-1 sm:gap-2 justify-center sm:justify-start">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`text-xl sm:text-2xl md:text-3xl transition-colors p-1 sm:p-2 ${
                    rating >= num ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">
              Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full border rounded p-2 sm:p-3 text-xs sm:text-sm md:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={4}
              required
              placeholder="Write your review about this farmer... (required)"
              minLength={10}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {review.length}/500 characters (minimum 10 characters required)
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded hover:bg-green-700 text-xs sm:text-sm md:text-base transition-colors font-medium"
          >
            Submit Rating
          </button>
        </form>
      </main>
    </div>
  );
}