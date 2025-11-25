"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import dynamic from "next/dynamic";

// Dynamically import the map component (client-side only)
const MapComponent = dynamic(
  () => import("./MapComponent").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface FarmerLocation {
  id: string;
  name: string;
  email: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  address?: string; // Separate address field
  contact?: string; // Contact number
  products: any[];
  distance?: number;
}

export default function FarmerMapPage() {
  const [user, setUser] = useState<any>(null);
  const [farmers, setFarmers] = useState<FarmerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerLocation | null>(
    null
  );
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [sortBy, setSortBy] = useState<"distance" | "products">("distance");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = { id: currentUser.uid, ...docSnap.data() } as any;
        setUser(userData);

        // Get user's location if available
        if (userData.location && userData.location.lat && userData.location.lng) {
          setUserLocation({
            lat: userData.location.lat,
            lng: userData.location.lng
          });
        } else {
          // Try to get browser location
          getUserLocation();
        }

        await fetchFarmers();
      } else {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          
          // Save to user profile
          if (user) {
            const userRef = doc(db, "users", user.id);
            updateDoc(userRef, { location }).catch(console.error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to Manila coordinates if location denied
          setUserLocation({ lat: 14.5995, lng: 120.9842 });
        }
      );
    }
  };

  const fetchFarmers = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "farmer")
      );
      const usersSnapshot = await getDocs(usersQuery);

      const farmersData: FarmerLocation[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const farmerData = userDoc.data();

        // Fetch farmer's products
        const productsQuery = query(
          collection(db, "products"),
          where("farmerId", "==", userDoc.id)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const products = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Build location object - prioritize ROOT-level lat/lng (farmer's set location)
        let locationData = null;
        
        // Check if farmer has lat/lng at root level (their set farm location)
        if (farmerData.lat !== undefined && farmerData.lng !== undefined) {
          const lat = typeof farmerData.lat === 'string' ? parseFloat(farmerData.lat) : farmerData.lat;
          const lng = typeof farmerData.lng === 'string' ? parseFloat(farmerData.lng) : farmerData.lng;
          
          if (!isNaN(lat) && !isNaN(lng)) {
            locationData = {
              lat: lat,
              lng: lng,
              address: farmerData.address || farmerData.location?.address || ''
            };
          }
        }
        // Fallback: use location object if root lat/lng not available
        else if (farmerData.location && typeof farmerData.location === 'object') {
          if (farmerData.location.lat && farmerData.location.lng) {
            locationData = farmerData.location;
            
            // If location doesn't have address, check separate address field
            if (!locationData.address && farmerData.address) {
              locationData = {
                ...locationData,
                address: farmerData.address
              };
            }
          }
        }

        const farmerInfo = {
          id: userDoc.id,
          name: farmerData.name || farmerData.email,
          email: farmerData.email,
          location: locationData,
          products,
          // Store original address field for reference
          address: farmerData.address,
          contact: farmerData.contact,
        };
        
        console.log('📍 Farmer loaded:', {
          name: farmerInfo.name,
          hasLocation: !!farmerInfo.location,
          location: farmerInfo.location,
          address: farmerInfo.address,
          productsCount: products.length
        });
        
        farmersData.push(farmerInfo);
      }

      console.log(`✅ Total farmers fetched: ${farmersData.length}`);
      console.log(`📍 Farmers with locations: ${farmersData.filter(f => f.location).length}`);
      setFarmers(farmersData);
    } catch (error) {
      console.error("Error fetching farmers:", error);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get nearby farmers
  const nearbyFarmers = farmers
    .filter((farmer) => {
      const hasLocation = !!farmer.location;
      if (!hasLocation) {
        console.log(`⚠️ Filtering out ${farmer.name} - no location`);
      }
      return hasLocation;
    })
    .map((farmer) => {
      if (userLocation && farmer.location) {
        console.log('📏 Calculating distance for', farmer.name, {
          userLoc: userLocation,
          farmerLoc: farmer.location
        });
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          farmer.location.lat,
          farmer.location.lng
        );
        console.log(`📏 Distance to ${farmer.name}: ${distance.toFixed(2)} km`);
        return { ...farmer, distance };
      }
      return farmer;
    })
    .filter((farmer) => !farmer.distance || farmer.distance <= searchRadius)
    .sort((a, b) => {
      if (sortBy === "distance") {
        return (a.distance || 999) - (b.distance || 999);
      } else {
        return b.products.length - a.products.length;
      }
    });

  const handleLocationChange = async (newLocation: { lat: number; lng: number }) => {
    setUserLocation(newLocation);
    
    // Save to Firestore
    if (user) {
      try {
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          location: {
            lat: newLocation.lat,
            lng: newLocation.lng,
            address: userLocation && user.location?.address ? user.location.address : ''
          }
        });
        console.log('✅ Location updated:', newLocation);
      } catch (error) {
        console.error('❌ Error saving location:', error);
        alert('Failed to save location. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  const isFarmer = user?.role === "farmer";

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-blue-100 p-3 sm:p-4 lg:h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <img src="/harvest-hub-logo.png" alt="HarvestHub Logo" className="w-8 h-8" />
            HarvestHub
          </h2>
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
          <a
            href={isFarmer ? "/dashboard/farmer" : "/dashboard/user"}
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Home
          </a>
          {isFarmer && (
            <>
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
                className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
              >
                Ratings
              </a>
            </>
          )}
          {!isFarmer && (
            <>
              <a
                href="/dashboard/user/cart"
                className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
              >
                Cart
              </a>
              <a
                href="/dashboard/user/orders"
                className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
              >
                Orders
              </a>
              <a
                href="/dashboard/user/wallet"
                className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
              >
                Wallet
              </a>
              <a
                href="/dashboard/user/rate_farmer"
                className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
              >
                Rate Farmer
              </a>
              <a
                href="/dashboard/user/profile"
                className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
              >
                Profile
              </a>
            </>
          )}
          {isFarmer && (
            <a
              href="/dashboard/farmer/wallet"
              className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
            >
              Wallet
            </a>
          )}
          <a
            href="/dashboard/community"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Community Hub
          </a>
          <a
            href="/dashboard/map"
            className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base"
          >
            Farmer Map
          </a>
        </nav>

        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block mt-4 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-200`}>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center lg:justify-start space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-100 to-teal-100 shadow-lg p-6 rounded-b-2xl border-b-4 border-blue-200">
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent">🗺️ Nearby Farmers Map</h1>
          <p className="text-gray-700 text-sm">
            Find farmers near you for efficient delivery and reduced costs
          </p>
        </header>

        {/* Controls */}
        <div className="bg-white border-b p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Search Radius
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-16">
                  {searchRadius} km
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="distance">Distance</option>
                <option value="products">Product Count</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={getUserLocation}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap font-semibold"
              >
                📍 Update Location
              </button>
            </div>
          </div>
        </div>

        {/* Map and List */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            {userLocation ? (
              <>
                {console.log('🗺️ Rendering map with:', {
                  userLocation,
                  farmersCount: nearbyFarmers.length,
                  farmers: nearbyFarmers.map(f => ({ name: f.name, location: f.location }))
                })}
                <MapComponent
                  userLocation={userLocation}
                  farmers={nearbyFarmers}
                  onFarmerClick={setSelectedFarmer}
                  onLocationChange={handleLocationChange}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Getting your location...</p>
                </div>
              </div>
            )}
          </div>

          {/* Farmers List */}
          <div className="w-full lg:w-96 bg-white border-l overflow-y-auto p-4">
            <h2 className="font-bold text-lg mb-4">
              Nearby Farmers ({nearbyFarmers.length})
            </h2>

            <div className="space-y-3">
              {nearbyFarmers.map((farmer) => (
                <div
                  key={farmer.id}
                  onClick={() => setSelectedFarmer(farmer)}
                  className={`p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedFarmer?.id === farmer.id
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 shadow-lg scale-105"
                      : "hover:bg-gray-50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{farmer.name}</h3>
                      <p className="text-xs text-gray-600">{farmer.email}</p>
                      {(farmer.location?.address || farmer.address) && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {farmer.location?.address || farmer.address}
                        </p>
                      )}
                      {farmer.contact && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {farmer.contact}
                        </p>
                      )}
                    </div>
                    {farmer.distance !== undefined && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0">
                        {farmer.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <span>{farmer.products.length} products</span>
                    </div>

                    {farmer.location && (
                      <div className="flex items-center space-x-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>Located</span>
                      </div>
                    )}
                  </div>

                  {farmer.products.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {farmer.products.slice(0, 3).map((product) => (
                        <span
                          key={product.id}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                        >
                          {product.name}
                        </span>
                      ))}
                      {farmer.products.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{farmer.products.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <a
                    href={`/dashboard/user?farmerId=${farmer.id}`}
                    className="mt-2 block text-center text-xs bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Products
                  </a>
                </div>
              ))}

              {nearbyFarmers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No farmers found within {searchRadius}km
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try increasing the search radius
                  </p>
                </div>
              )}

              {/* Farmers without location */}
              {farmers.filter(f => !f.location).length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-semibold text-sm mb-3 text-gray-700">
                    ⚠️ Farmers Without Location ({farmers.filter(f => !f.location).length})
                  </h3>
                  <div className="space-y-2">
                    {farmers.filter(f => !f.location).map((farmer) => (
                      <div
                        key={farmer.id}
                        className="p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{farmer.name}</h4>
                            <p className="text-xs text-gray-600">{farmer.email}</p>
                            {(farmer.address) && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {farmer.address} <span className="text-red-500">(GPS not set)</span>
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            No GPS
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          📦 {farmer.products.length} products • Needs to set location
                        </p>
                        <a
                          href={`/dashboard/user?farmerId=${farmer.id}`}
                          className="mt-2 block text-center text-xs bg-gray-600 text-white py-1 rounded hover:bg-gray-700 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Products
                        </a>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    💡 <strong>Note:</strong> These farmers have not set their GPS location yet. 
                    They can set it at <code className="bg-blue-100 px-1 rounded">/dashboard/farmer/location</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
