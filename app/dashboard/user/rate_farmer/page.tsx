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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // ✅ Fetch farmers from user's orders with enhanced profile data
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
          const farmerProfile = farmerDoc.data();
          
          // Debug: Log farmer profile to see available fields
          console.log(`Farmer ${farmerId} profile:`, farmerProfile);
          
          // Get farmer's average rating
          const ratingsQuery = query(
            collection(db, "reviews"), 
            where("farmerId", "==", farmerId)
          );
          const ratingsSnapshot = await getDocs(ratingsQuery);
          
          let totalRating = 0;
          let ratingCount = 0;
          ratingsSnapshot.forEach((doc) => {
            totalRating += doc.data().rating || 0;
            ratingCount++;
          });
          
          const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : null;

          // Process profile picture - handle base64 images
          let profileImageUrl = null;
          if (farmerProfile.profilePicture) {
            // Handle base64 images
            if (farmerProfile.profilePicture.startsWith('data:image/')) {
              profileImageUrl = farmerProfile.profilePicture;
            } else {
              // Handle regular URLs
              profileImageUrl = farmerProfile.profilePicture;
            }
          } else if (farmerProfile.photoURL) {
            profileImageUrl = farmerProfile.photoURL;
          } else if (farmerProfile.avatar) {
            profileImageUrl = farmerProfile.avatar;
          }

          farmerData.push({
            id: farmerId,
            ...farmerProfile,
            profileImageUrl, // Add processed image URL
            averageRating,
            reviewCount: ratingCount
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
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* ✅ Sidebar */}
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
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">Dashboard</a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">Cart</a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">Orders</a>
          <a href="/dashboard/user/rate_farmer" className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base">Rate Farmer</a>
          <a href="/dashboard/user/profile" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">Profile</a>
          <a href="/dashboard/community" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">Community Hub</a>
          <a href="/dashboard/map" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">Farmer Map</a>
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

      {/* ✅ Main Content */}
      <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <input
            type="text"
            placeholder="Search farmers..."
            className="w-full sm:w-1/2 lg:w-1/3 px-3 sm:px-4 py-2 border rounded text-sm sm:text-base"
          />
          <span className="font-medium text-gray-700 text-xs sm:text-sm lg:text-base truncate">{user?.email}</span>
        </header>

        {/* Hero Section */}
        <section className="bg-green-100 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Rate Your Farmers</h1>
          <p className="text-gray-700 text-sm sm:text-base">
            Select a farmer below to leave a rating and review for your
            experience.
          </p>
        </section>

        {/* ✅ Farmers List */}
        <section>
          {farmers.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-600 text-sm sm:text-base">
                You haven't ordered from any farmers yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {farmers.map((farmer) => (
                <div
                  key={farmer.id}
                  className="bg-white p-4 sm:p-6 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  {/* Farmer Profile Picture */}
                  <div className="flex items-center justify-center mb-3 sm:mb-4">
                    {farmer.profileImageUrl ? (
                      <div className="relative">
                        <img
                          src={farmer.profileImageUrl}
                          alt={farmer.name || "Farmer"}
                          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-4 border-green-200"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            console.log(`Failed to load image for farmer ${farmer.id}:`, farmer.profileImageUrl);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          onLoad={() => {
                            console.log(`Successfully loaded image for farmer ${farmer.id}`);
                          }}
                        />
                        <div 
                          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-4 border-green-200 hidden"
                        >
                          <span className="text-white font-bold text-lg sm:text-xl">
                            {(farmer.name || "F").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-4 border-green-200">
                        <span className="text-white font-bold text-lg sm:text-xl">
                          {(farmer.name || "F").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Farmer Information */}
                  <div className="text-center mb-3 sm:mb-4">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-1">
                      {farmer.name || "Unnamed Farmer"}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">{farmer.email}</p>
                    
                    {/* Additional Profile Information */}
                    <div className="space-y-1 text-xs sm:text-sm text-gray-500">
                      {farmer.phone && (
                        <p className="flex items-center justify-center gap-1 truncate">
                          <span>📞</span> <span className="truncate">{farmer.phone}</span>
                        </p>
                      )}
                      {farmer.address && (
                        <p className="flex items-center justify-center gap-1 truncate">
                          <span>📍</span> <span className="truncate">{farmer.address}</span>
                        </p>
                      )}
                      {farmer.farmName && (
                        <p className="flex items-center justify-center gap-1 truncate">
                          <span>🚜</span> <span className="truncate">{farmer.farmName}</span>
                        </p>
                      )}
                      {farmer.specialization && (
                        <p className="flex items-center justify-center gap-1 truncate">
                          <span>🌱</span> <span className="truncate">{farmer.specialization}</span>
                        </p>
                      )}
                    </div>

                    {/* Rating Display */}
                    {farmer.averageRating && (
                      <div className="mt-2 sm:mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-semibold text-yellow-700 text-sm sm:text-base">
                            {farmer.averageRating}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({farmer.reviewCount} review{farmer.reviewCount !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating Button */}
                  <button
                    onClick={() =>
                      router.push(`/dashboard/user/rate_farmer/${farmer.id}`)
                    }
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    Rate This Farmer
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
