"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RatingAndReview() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Proper auth check with listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch reviews from Firestore
  useEffect(() => {
    const fetchReviews = async () => {
      const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedReviews = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviews(fetchedReviews);
    };
    fetchReviews();
  }, []);

  // Submit review
  const handleSubmit = async () => {
    if (!rating || !review.trim()) {
      alert("Please provide both a rating and review text.");
      return;
    }

    await addDoc(collection(db, "reviews"), {
      user: user?.email || "Anonymous",
      rating,
      review,
      createdAt: serverTimestamp(),
    });

    setRating(0);
    setReview("");
    alert("Thank you for your feedback!");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold mb-6">HarvestHub</h2>
        <nav className="space-y-2">
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100">
            Homepage
          </a>
          <a href="#" className="block px-3 py-2 rounded hover:bg-green-100">
            Product Details
          </a>
          <a href="/dashboard/user/rate_profile" className="block px-3 py-2 rounded hover:bg-green-100">
            Rate Farmer
          </a>
          <a
            href="/dashboard/user/rating-and-review"
            className="block px-3 py-2 rounded bg-green-100 font-semibold"
          >
            Rating & Review
          </a>
          <a href="#" className="block px-3 py-2 rounded hover:bg-green-100">
            Orders
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Rating and Review</h1>

        {/* Rate your transaction */}
        <section className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-2">Rate Your Transaction</h2>
          <p className="text-gray-600 mb-4">
            Share your experience with us to help other users make informed decisions.
          </p>

          {/* Star Rating */}
          <div className="flex items-center space-x-1 mb-4">
            {[...Array(5)].map((_, index) => {
              const starValue = index + 1;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHover(starValue)}
                  onMouseLeave={() => setHover(rating)}
                  className="text-2xl transition"
                >
                  {starValue <= (hover || rating) ? "★" : "☆"}
                </button>
              );
            })}
          </div>

          {/* Review Textarea */}
          <textarea
            className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-300"
            rows={4}
            placeholder="Write your review here..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
          >
            Submit Review
          </button>
        </section>

        {/* Previous Reviews */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Previous Reviews</h2>
          <div className="space-y-6">
            {reviews.map((r) => (
              <div key={r.id} className="border-b pb-4">
                <div className="flex items-center space-x-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {r.user?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold">{r.user}</h3>
                    <div className="text-yellow-400">
                      {"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{r.review}</p>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-gray-500 text-center">No reviews yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
