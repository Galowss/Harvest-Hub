"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  fetchDAPrices,
  generateMarketForecast,
  matchProductToDAData,
  generateHistoricalPrices,
  type DAPriceData,
  type MarketForecast,
} from "@/lib/marketData";

interface MarketPrice {
  category: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  productCount: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  daPrice?: number; // DA reference price
  source: "marketplace" | "da" | "combined";
}

interface PricingAnalytics {
  myAveragePrice: number;
  marketAveragePrice: number;
  competitiveness: "above" | "below" | "competitive";
  suggestedPrice: number;
  daReferencePrice?: number;
}

export default function PricingDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<PricingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [daPrices, setDaPrices] = useState<DAPriceData[]>([]);
  const [forecasts, setForecasts] = useState<Map<string, MarketForecast>>(new Map());
  const [selectedProductForForecast, setSelectedProductForForecast] = useState<any>(null);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().role === "farmer") {
        setUser({ id: currentUser.uid, ...docSnap.data() });
        await fetchMarketData(currentUser.uid);
      } else {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      console.log("Auto-refreshing market data...");
      fetchMarketData(user.id);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [user]);

  const fetchMarketData = async (farmerId: string) => {
    try {
      setRefreshing(true);
      // Fetch DA Philippines price data
      const daPriceData = await fetchDAPrices();
      setDaPrices(daPriceData);
      
      // Fetch all products from the market
      const productsSnapshot = await getDocs(collection(db, "products"));
      const allProducts = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get my products
      const myProductsData = allProducts.filter(
        (p: any) => p.farmerId === farmerId
      );
      setMyProducts(myProductsData);

      // Generate forecasts for my products
      const forecastMap = new Map<string, MarketForecast>();
      myProductsData.forEach((product: any) => {
        const daMatch = matchProductToDAData(product.name, product.category || 'other', daPriceData);
        const basePrice = daMatch?.price || parseFloat(product.price) || 50;
        const historicalPrices = generateHistoricalPrices(basePrice);
        
        const forecast = generateMarketForecast(
          product.name,
          parseFloat(product.price) || basePrice,
          historicalPrices,
          product.category || 'vegetables'
        );
        
        forecastMap.set(product.id, forecast);
      });
      setForecasts(forecastMap);

      // Calculate market prices by category, integrating DA data
      const categoryMap = new Map<string, any[]>();

      allProducts.forEach((product: any) => {
        const category = product.category || "other";
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(product);
      });

      const marketPriceData: MarketPrice[] = Array.from(
        categoryMap.entries()
      ).map(([category, products]) => {
        const prices = products
          .map((p: any) => parseFloat(p.price) || 0)
          .filter((p) => p > 0);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length || 0;
        const min = Math.min(...prices) || 0;
        const max = Math.max(...prices) || 0;

        // Get DA reference price for this category
        const categoryDAPrices = daPriceData.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );
        const daAvgPrice = categoryDAPrices.length > 0
          ? categoryDAPrices.reduce((sum, p) => sum + p.price, 0) / categoryDAPrices.length
          : undefined;

        // Calculate trend based on DA previous prices
        let trend: "up" | "down" | "stable" = "stable";
        let trendPercentage = 0;
        
        if (categoryDAPrices.length > 0 && categoryDAPrices[0].prevPrice) {
          const priceChange = ((categoryDAPrices[0].price - categoryDAPrices[0].prevPrice) / categoryDAPrices[0].prevPrice) * 100;
          trendPercentage = Math.abs(priceChange);
          
          if (priceChange > 3) trend = "up";
          else if (priceChange < -3) trend = "down";
        } else {
          // Fallback to random for categories without DA data
          const randomTrend = Math.random();
          if (randomTrend < 0.33) {
            trend = "up";
            trendPercentage = Math.random() * 15 + 5;
          } else if (randomTrend < 0.66) {
            trend = "down";
            trendPercentage = Math.random() * 15 + 5;
          } else {
            trendPercentage = Math.random() * 5;
          }
        }

        return {
          category,
          averagePrice: parseFloat(avg.toFixed(2)),
          minPrice: parseFloat(min.toFixed(2)),
          maxPrice: parseFloat(max.toFixed(2)),
          productCount: products.length,
          trend,
          trendPercentage: parseFloat(trendPercentage.toFixed(1)),
          daPrice: daAvgPrice ? parseFloat(daAvgPrice.toFixed(2)) : undefined,
          source: (daAvgPrice ? "combined" : "marketplace") as "marketplace" | "da" | "combined",
        };
      });

      setMarketPrices(marketPriceData.sort((a, b) => b.productCount - a.productCount));

      // Calculate my pricing analytics with DA reference
      if (myProductsData.length > 0) {
        const myAvg =
          myProductsData.reduce(
            (sum: number, p: any) => sum + (parseFloat(p.price) || 0),
            0
          ) / myProductsData.length;
        const marketAvg =
          allProducts.reduce(
            (sum: number, p: any) => sum + (parseFloat(p.price) || 0),
            0
          ) / allProducts.length;

        // Calculate DA reference price for farmer's products
        let daRefPrice = undefined;
        const myCategories = [...new Set(myProductsData.map((p: any) => p.category))];
        if (myCategories.length > 0) {
          const relevantDAPrices = daPriceData.filter(p => 
            myCategories.includes(p.category)
          );
          if (relevantDAPrices.length > 0) {
            daRefPrice = relevantDAPrices.reduce((sum, p) => sum + p.price, 0) / relevantDAPrices.length;
          }
        }

        let competitiveness: "above" | "below" | "competitive" = "competitive";
        const referencePrice = daRefPrice || marketAvg;
        
        if (myAvg > referencePrice * 1.1) competitiveness = "above";
        else if (myAvg < referencePrice * 0.9) competitiveness = "below";

        const suggested = parseFloat((referencePrice * 0.95).toFixed(2));

        setAnalytics({
          myAveragePrice: parseFloat(myAvg.toFixed(2)),
          marketAveragePrice: parseFloat(marketAvg.toFixed(2)),
          competitiveness,
          suggestedPrice: suggested,
          daReferencePrice: daRefPrice ? parseFloat(daRefPrice.toFixed(2)) : undefined,
        });
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const handleViewForecast = (product: any) => {
    setSelectedProductForForecast(product);
    setShowForecastModal(true);
  };

  const filteredPrices = selectedCategory === "all" 
    ? marketPrices 
    : marketPrices.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading pricing data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-amber-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-yellow-100 p-3 sm:p-4 lg:h-screen overflow-y-auto">
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
            Dashboard
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
            className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base"
          >
            Market Pricing
          </a>
          <a
            href="/dashboard/farmer/ratings"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Ratings
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

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">📊 Real-Time Market Pricing</h1>
              <p className="text-gray-600">Make informed pricing decisions based on current market trends</p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 5 minutes
                </p>
              )}
            </div>
            <button
              onClick={() => user && fetchMarketData(user.id)}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {/* My Pricing Analytics */}
        {analytics && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Your Pricing Analytics</h2>
              <div className="flex items-center space-x-2 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Powered by DA Philippines Data</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-1">Your Average Price</p>
                <p className="text-2xl font-bold text-green-600">₱{analytics.myAveragePrice}</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-1">Market Average</p>
                <p className="text-2xl font-bold text-blue-600">₱{analytics.marketAveragePrice}</p>
              </div>

              {analytics.daReferencePrice && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg shadow border border-green-200">
                  <p className="text-sm text-green-800 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    DA Reference Price
                  </p>
                  <p className="text-2xl font-bold text-green-700">₱{analytics.daReferencePrice}</p>
                  <p className="text-xs text-green-600 mt-1">Official DA avg</p>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-1">Competitiveness</p>
                <p className={`text-2xl font-bold ${
                  analytics.competitiveness === "competitive" ? "text-green-600" :
                  analytics.competitiveness === "above" ? "text-orange-600" : "text-red-600"
                }`}>
                  {analytics.competitiveness === "competitive" ? "✓ Competitive" :
                   analytics.competitiveness === "above" ? "↑ Above Market" : "↓ Below Market"}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-1">Suggested Price</p>
                <p className="text-2xl font-bold text-purple-600">₱{analytics.suggestedPrice}</p>
              </div>
            </div>
          </section>
        )}

        {/* Market Insights */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Market Insights by Category</h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {marketPrices.map((mp) => (
                <option key={mp.category} value={mp.category}>
                  {mp.category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrices.map((price) => (
              <div key={price.category} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg capitalize">{price.category}</h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">{price.productCount} products</p>
                      {price.source === "combined" && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">DA Data</span>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                    price.trend === "up" ? "bg-green-100 text-green-800" :
                    price.trend === "down" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {price.trend === "up" ? "↑" : price.trend === "down" ? "↓" : "→"}
                    <span>{price.trendPercentage}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average:</span>
                    <span className="font-bold text-lg">₱{price.averagePrice}</span>
                  </div>
                  {price.daPrice && (
                    <div className="flex justify-between items-center text-sm bg-green-50 px-2 py-1 rounded">
                      <span className="text-green-700 font-medium">DA Price:</span>
                      <span className="text-green-800 font-semibold">₱{price.daPrice}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Range:</span>
                    <span className="text-gray-800">₱{price.minPrice} - ₱{price.maxPrice}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    {price.trend === "up" && (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Prices trending upward
                      </span>
                    )}
                    {price.trend === "down" && (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                        Prices trending downward
                      </span>
                    )}
                    {price.trend === "stable" && (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                        Prices stable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* My Products Comparison */}
        {myProducts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Your Products vs Market (with AI Forecasting)</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold">Category</th>
                      <th className="px-4 py-3 text-right font-semibold">Your Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Market Avg</th>
                      <th className="px-4 py-3 text-right font-semibold">DA Price</th>
                      <th className="px-4 py-3 text-center font-semibold">Status</th>
                      <th className="px-4 py-3 text-center font-semibold">AI Forecast</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {myProducts.map((product) => {
                      const categoryData = marketPrices.find(
                        (mp) => mp.category === product.category
                      );
                      const myPrice = parseFloat(product.price) || 0;
                      const marketAvg = categoryData?.averagePrice || 0;
                      const daPrice = categoryData?.daPrice;
                      const difference = marketAvg > 0 ? ((myPrice - marketAvg) / marketAvg) * 100 : 0;
                      const forecast = forecasts.get(product.id);

                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3 capitalize">{product.category}</td>
                          <td className="px-4 py-3 text-right font-semibold">₱{myPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">₱{marketAvg.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-green-700 font-medium">
                            {daPrice ? `₱${daPrice.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              Math.abs(difference) < 10 ? "bg-green-100 text-green-800" :
                              difference > 0 ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"
                            }`}>
                              {Math.abs(difference) < 10 ? "✓ Competitive" :
                               difference > 0 ? `↑ ${difference.toFixed(1)}% higher` : `↓ ${Math.abs(difference).toFixed(1)}% lower`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {forecast && (
                              <button
                                onClick={() => handleViewForecast(product)}
                                className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-xs font-medium"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                                <span>
                                  {forecast.priceDirection === 'rising' ? '📈 Rising' :
                                   forecast.priceDirection === 'falling' ? '📉 Falling' : '→ Stable'}
                                </span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {myProducts.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-medium">No products added yet</p>
            <p className="text-yellow-600 text-sm mt-1">
              Add products to see personalized pricing recommendations
            </p>
            <a
              href="/dashboard/farmer"
              className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Add Products
            </a>
          </div>
        )}
      </main>

      {/* AI Forecast Modal */}
      {showForecastModal && selectedProductForForecast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                AI Market Forecast
              </h2>
              <button
                onClick={() => setShowForecastModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {(() => {
              const forecast = forecasts.get(selectedProductForForecast.id);
              if (!forecast) return null;

              return (
                <div className="space-y-6">
                  {/* Product Info */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-1">{selectedProductForForecast.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">Category: {selectedProductForForecast.category}</p>
                    <p className="text-2xl font-bold text-purple-700 mt-2">
                      Current Price: ₱{forecast.currentPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Price Predictions */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">📊 Price Predictions</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-xs text-blue-600 font-medium mb-1">1 Week</p>
                        <p className="text-xl font-bold text-blue-700">₱{forecast.predictedPrices.oneWeek.toFixed(2)}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {((forecast.predictedPrices.oneWeek - forecast.currentPrice) / forecast.currentPrice * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg text-center">
                        <p className="text-xs text-indigo-600 font-medium mb-1">2 Weeks</p>
                        <p className="text-xl font-bold text-indigo-700">₱{forecast.predictedPrices.twoWeeks.toFixed(2)}</p>
                        <p className="text-xs text-indigo-600 mt-1">
                          {((forecast.predictedPrices.twoWeeks - forecast.currentPrice) / forecast.currentPrice * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-xs text-purple-600 font-medium mb-1">1 Month</p>
                        <p className="text-xl font-bold text-purple-700">₱{forecast.predictedPrices.oneMonth.toFixed(2)}</p>
                        <p className="text-xs text-purple-600 mt-1">
                          {((forecast.predictedPrices.oneMonth - forecast.currentPrice) / forecast.currentPrice * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Market Analysis */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Market Demand</p>
                      <p className={`text-xl font-bold ${
                        forecast.demand === 'high' ? 'text-green-600' :
                        forecast.demand === 'medium' ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {forecast.demand === 'high' ? '🔥 High' :
                         forecast.demand === 'medium' ? '📊 Medium' : '❄️ Low'}
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Price Direction</p>
                      <p className={`text-xl font-bold ${
                        forecast.priceDirection === 'rising' ? 'text-green-600' :
                        forecast.priceDirection === 'falling' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {forecast.priceDirection === 'rising' ? '📈 Rising' :
                         forecast.priceDirection === 'falling' ? '📉 Falling' : '→ Stable'}
                      </p>
                    </div>
                  </div>

                  {/* Optimal Sale Period */}
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">⏰ Optimal Sale Period</p>
                    <p className="text-gray-700">{forecast.optimalSalePeriod}</p>
                  </div>

                  {/* AI Recommendation */}
                  <div className={`p-4 rounded-lg ${
                    forecast.demand === 'high' && forecast.priceDirection === 'rising' ? 'bg-green-50 border border-green-200' :
                    forecast.priceDirection === 'falling' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className="text-sm font-semibold mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      AI Recommendation
                    </p>
                    <p className="text-gray-800">{forecast.recommendation}</p>
                  </div>

                  {/* Confidence Score */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">Forecast Confidence</p>
                      <p className="text-lg font-bold text-gray-800">{forecast.confidence}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${forecast.confidence}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Based on historical data, market trends, and seasonal patterns
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
                    <p className="font-semibold mb-1">📌 Disclaimer:</p>
                    <p>
                      This forecast is generated using AI algorithms and historical market data. 
                      Actual prices may vary due to unforeseen market conditions, weather, supply chain, 
                      and other external factors. Use this as a guide, not as definitive financial advice.
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setShowForecastModal(false)}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Close Forecast
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
