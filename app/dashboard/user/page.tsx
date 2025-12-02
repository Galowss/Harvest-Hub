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
import { CacheClient } from "@/lib/cacheClient";

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { handleLogout } = useLogout();

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // ✅ Fetch only available farmer products (stock > 0)
  const fetchProducts = async () => {
    setFetchingProducts(true);
    try {
      // Try cache first
      const cacheKey = CacheClient.productsListKey();
      const cached = await CacheClient.get(cacheKey);
      
      let allProductsData;
      if (cached) {
        console.log('✅ Products loaded from cache - saved Firebase read!');
        allProductsData = cached;
      } else {
        console.log('⚠️ Cache miss - fetching from Firestore');
        const querySnapshot = await getDocs(collection(db, "products"));
        allProductsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Store in cache for 1 hour
        await CacheClient.set(cacheKey, allProductsData, 3600);
      }
      
      // Filter only products with stock > 0 (available produce)
      const availableProducts = allProductsData.filter((product: any) => {
        const stock = product.stock || product.quantity || 0;
        return stock > 0;
      });
      
      // Log a sample product to check image structure
      if (availableProducts.length > 0) {
        const sampleProduct = availableProducts[0] as any;
        console.log('📸 Sample product with images:', {
          name: sampleProduct.name,
          hasImages: !!sampleProduct.images,
          imageCount: sampleProduct.images?.length || 0,
          firstImagePreview: sampleProduct.images?.[0]?.substring(0, 50) + '...'
        });
      }
      
      // Sort by creation date (newest first) and then by stock (highest first)
      availableProducts.sort((a: any, b: any) => {
        // First sort by creation date
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        const dateComparison = dateB.getTime() - dateA.getTime();
        
        if (dateComparison !== 0) return dateComparison;
        
        // If dates are same, sort by stock (highest first)
        const stockA = a.stock || a.quantity || 0;
        const stockB = b.stock || b.quantity || 0;
        return stockB - stockA;
      });
      
      setProducts(availableProducts);
      setFilteredProducts(availableProducts);
      console.log(`✅ Found ${availableProducts.length} available products`);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch available produce. Please try again.");
    } finally {
      setFetchingProducts(false);
    }
  };

  // ✅ Filter products based on search and category
  const filterProducts = () => {
    let filtered = [...products];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    setFilteredProducts(filtered);
  };

  // ✅ Apply filters when search or category changes
  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  // ✅ Get unique categories for filter dropdown
  const getCategories = () => {
    const categories = products.map(product => product.category).filter(Boolean);
    return [...new Set(categories)];
  };

  // ✅ Refresh products manually
  const handleRefresh = async () => {
    await fetchProducts();
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
        photo: (product.images && product.images.length > 0) ? product.images[0] : "",
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

  if (loading || !isClient)
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-green-100 p-3 sm:p-4 lg:h-screen overflow-y-auto">
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
          <a href="/dashboard/user" className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base">
            Home
          </a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Cart
          </a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/user/wallet" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Wallet
          </a>
          <a href="/dashboard/user/rate_farmer" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Rate Farmer
          </a>
          <a href="/dashboard/user/profile" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Profile
          </a>
          <a href="/dashboard/community" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Community Hub
          </a>
          <a href="/dashboard/map" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Farmer Map
          </a>
        </nav>
        
        {/* Logout Button */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block mt-4 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-200`}>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center lg:justify-start space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Header with Search and Filters */}
        <header className="mb-4 lg:mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search products, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded w-full sm:w-64 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded w-full sm:w-auto text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                {getCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={fetchingProducts}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className={`w-4 h-4 ${fetchingProducts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{fetchingProducts ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full lg:w-auto">
              <span className="font-medium text-sm lg:text-base truncate text-gray-600">Welcome, {user?.email?.split("@")[0]}!</span>
            </div>
          </div>
          
          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredProducts.length} of {products.length} available products
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory !== "all" && ` in ${selectedCategory}`}
            </span>
            {products.length === 0 && !loading && (
              <span className="text-orange-600">No products available at the moment</span>
            )}
          </div>
        </header>

        {/* Welcome */}
        <section className="bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 p-4 lg:p-6 rounded-xl shadow-md mb-4 lg:mb-6 border border-green-200">
          <h1 className="text-xl lg:text-2xl font-bold">
            Welcome, {user?.email?.split("@")[0]}!
          </h1>
          <p className="text-gray-700 text-sm lg:text-base">
            Discover fresh produce from trusted farmers.
          </p>
        </section>

        {/* Available Produce */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base lg:text-lg font-semibold">Available Produce</h2>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>In Stock</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Low Stock</span>
              </div>
            </div>
          </div>
          
          {fetchingProducts && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2 text-gray-600">
                <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Loading available produce...</span>
              </div>
            </div>
          )}
          
          {filteredProducts.length === 0 && !fetchingProducts ? (
            <div className="text-center py-8 lg:py-12">
              <div className="text-gray-400 text-4xl mb-4">🌾</div>
              <p className="text-gray-500 text-base lg:text-lg mb-4">
                {products.length === 0 ? "No produce available" : "No products match your search"}
              </p>
              <p className="text-gray-400 text-sm lg:text-base">
                {products.length === 0 
                  ? "Check back later for fresh produce from our farmers!" 
                  : "Try adjusting your search or filter criteria"}
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {filteredProducts.map((product) => {
                const stock = product.stock || product.quantity || 0;
                const isLowStock = stock <= 5 && stock > 0;
                
                return (
                  <div key={product.id} className="bg-white p-3 lg:p-4 shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-green-100">
                    <div className="relative">
                      <div
                        className="h-24 sm:h-32 bg-gray-200 mb-3 rounded flex items-center justify-center"
                        style={{
                          backgroundImage: product.images && product.images.length > 0 ? `url(${product.images[0]})` : 'none',
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {(!product.images || product.images.length === 0) && (
                          <div className="text-gray-400 text-center">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Stock Indicator */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        isLowStock ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {stock} left
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-sm lg:text-base mb-1">{product.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">₱{product.price}</p>
                    
                    {/* Category and Stock Info */}
                    <div className="mb-2">
                      {product.category && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2">
                          {product.category}
                        </span>
                      )}
                      <span className={`inline-block text-xs px-2 py-1 rounded ${
                        isLowStock ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleViewDetails(product)}
                      className="mt-2 w-full text-xs lg:text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
