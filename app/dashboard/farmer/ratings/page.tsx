"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

export default function FarmerRatingsPage() {
  const [user, setUser] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const router = useRouter();

  // watch auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().role === "farmer") {
          setUser({ id: currentUser.uid, ...userSnap.data() });
          await fetchRatings(currentUser.uid);
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

  // fetch all ratings for this farmer
  const fetchRatings = async (farmerId: string) => {
    try {
      const q = query(collection(db, "ratings"), where("farmerId", "==", farmerId));
      const querySnapshot = await getDocs(q);

      const fetchedRatings = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const ratingData = docSnap.data();

          // fetch buyer info from users collection (handle both userId and buyerId)
          let buyerInfo = { name: "Anonymous", email: "Anonymous" };
          const userId = ratingData.userId || ratingData.buyerId;
          
          if (userId) {
            try {
              const buyerRef = doc(db, "users", userId);
              const buyerSnap = await getDoc(buyerRef);
              if (buyerSnap.exists()) {
                const userData = buyerSnap.data();
                buyerInfo = {
                  name: userData.name || userData.displayName || "Anonymous",
                  email: userData.email || "Anonymous"
                };
              }
            } catch (e) {
              console.warn("Buyer fetch error:", e);
            }
          }

          return {
            id: docSnap.id,
            ...ratingData,
            buyerInfo,
            // Ensure we have a valid timestamp
            createdAt: ratingData.createdAt || ratingData.timestamp,
          };
        })
      );

      // Sort by date (newest first)
      fetchedRatings.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setRatings(fetchedRatings);
      calculateRatingStats(fetchedRatings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  // calculate rating statistics
  const calculateRatingStats = (ratingsData: any[]) => {
    if (ratingsData.length === 0) {
      setRatingStats({
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
      return;
    }

    const totalRatings = ratingsData.length;
    const sumRatings = ratingsData.reduce((sum, rating) => sum + (rating.rating || 0), 0);
    const averageRating = totalRatings > 0 ? (sumRatings / totalRatings) : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingsData.forEach(rating => {
      const ratingValue = rating.rating || 0;
      if (ratingValue >= 1 && ratingValue <= 5) {
        distribution[ratingValue as keyof typeof distribution]++;
      }
    });

    setRatingStats({
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings,
      ratingDistribution: distribution
    });
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
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading ratings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-rose-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-pink-100 p-3 sm:p-4 lg:h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <img src="/harvest-hub-logo.png" alt="HarvestHub Logo" className="w-8 h-8" />
            HarvestHub
          </h2>
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block space-y-2`}>
          <a
            href="/dashboard/farmer"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Home
          </a>
          <a
            href="/dashboard/farmer/analytics"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Analytics
          </a>
          <a
            href="/dashboard/farmer/profile"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Profile
          </a>
          <a
            href="/dashboard/farmer/orders"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Orders
          </a>
          <a
            href="/dashboard/farmer/pricing"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Market Pricing
          </a>
          <a
            href="/dashboard/farmer/ratings"
            className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base"
          >
            Ratings
          </a>
          <a
            href="/dashboard/farmer/wallet"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Wallet
          </a>
          <a
            href="/dashboard/community"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Community Hub
          </a>
        </nav>

        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg
              className="w-4 h-4 lg:w-5 lg:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Customer Ratings & Reviews</h1>
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => user && fetchRatings(user.id)}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              Refresh
            </button>
            <span className="font-medium text-xs sm:text-sm lg:text-base truncate text-gray-600 flex-1 sm:flex-none">Welcome, {user?.email?.split("@")[0]}!</span>
          </div>
        </header>

        {/* Rating Statistics */}
        {ratingStats.totalRatings > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Rating Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{ratingStats.averageRating}</div>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        star <= ratingStats.averageRating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Average Rating</div>
                <div className="text-xs text-gray-500">{ratingStats.totalRatings} review{ratingStats.totalRatings !== 1 ? 's' : ''}</div>
              </div>

              {/* Rating Distribution */}
              <div className="md:col-span-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Rating Distribution</h3>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingStats.ratingDistribution[rating as keyof typeof ratingStats.ratingDistribution];
                  const percentage = ratingStats.totalRatings > 0 ? (count / ratingStats.totalRatings) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                      <div className="flex items-center space-x-1 w-8 sm:w-12">
                        <span className="text-xs sm:text-sm text-gray-600">{rating}</span>
                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-6 sm:w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Ratings List */}
        {ratings.length === 0 ? (
          <div className="text-center py-6 sm:py-8 lg:py-12">
            <div className="text-gray-400 text-3xl sm:text-4xl mb-3 sm:mb-4">⭐</div>
            <p className="text-gray-500 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">No ratings yet</p>
            <p className="text-gray-400 text-xs sm:text-sm lg:text-base px-4">Keep providing excellent service to receive your first ratings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {ratings.map((rating) => (
              <div key={rating.id} className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${
                          star <= (rating.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs sm:text-sm font-medium text-gray-700 ml-1 sm:ml-2">{rating.rating || 0}/5</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {rating.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                  </span>
                </div>
                
                <div className="mb-2 sm:mb-3">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                    From: {rating.buyerInfo?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Email: {rating.buyerInfo?.email || 'Anonymous'}
                  </p>
                  {rating.productName && (
                    <p className="text-xs text-gray-500 truncate">Product: {rating.productName}</p>
                  )}
                </div>
                
                {rating.review && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded">
                    <p className="text-xs sm:text-sm text-gray-700 italic break-words">"{rating.review}"</p>
                  </div>
                )}
                
                {!rating.review && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded">
                    <p className="text-xs text-gray-500 italic">No written review provided</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
