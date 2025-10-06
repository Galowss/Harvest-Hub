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

export default function RateSpecificFarmer() {
  const params = useParams();
  const farmerId = params?.farmerId as string;
  const router = useRouter();

  const [farmer, setFarmer] = useState<any>(null);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmer = async () => {
      if (!farmerId) return;
      
      try {
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

    fetchFarmer();
  }, [farmerId]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !auth.currentUser) return;

    try {
      const reviewRef = await addDoc(collection(db, "reviews"), {
        farmerId,
        buyerId: auth.currentUser.uid,
        buyerName: auth.currentUser.email,
        comment: review,
        rating,
        createdAt: serverTimestamp()
      });

      alert("Rating submitted successfully!");
      router.push("/dashboard/user/rate-farmer");
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating");
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
      </aside>

      <main className="flex-1 p-4 lg:p-6">
        <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Rate {farmer.name}</h1>
        
        <form onSubmit={handleSubmitRating} className="max-w-sm sm:max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-2 justify-center sm:justify-start">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`text-2xl sm:text-3xl transition-colors ${
                    rating >= num ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full border rounded p-2 text-sm sm:text-base"
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm sm:text-base transition-colors"
          >
            Submit Rating
          </button>
        </form>
      </main>
    </div>
  );
}