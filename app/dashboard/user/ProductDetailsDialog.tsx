"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "../../config/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  query,
  where,
} from "firebase/firestore";

interface ProductDetailsDialogProps {
  product: any;
  open: boolean;
  onClose: () => void;
  user: any;
}

const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  product,
  open,
  onClose,
  user,
}) => {
  const [farmer, setFarmer] = useState<any>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [productRating, setProductRating] = useState<{ average: number | null; totalReviews: number }>({ average: null, totalReviews: 0 });
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [farmerDetailsExpanded, setFarmerDetailsExpanded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

useEffect(() => {
  const fetchFarmerAndRatings = async () => {
    console.log("🔎 Product object:", product);
    console.log("🧑‍🌾 Farmer ID:", product?.farmerId);

    if (!product?.farmerId) {
      console.warn("No farmerId found on product:", product);
      setLoading(false);
      return;
    }

    // Reset quantity when product changes
    setQuantity(1);

      try {
        // Fetch farmer info
        const farmerRef = doc(db, "users", product.farmerId);
        const farmerSnap = await getDoc(farmerRef);

        if (farmerSnap.exists()) {
          const farmerData = farmerSnap.data();
          setFarmer(farmerData);
          console.log("👤 Farmer data loaded:", { 
            name: farmerData.name, 
            email: farmerData.email, 
            hasContact: !!farmerData.contact,
            contact: farmerData.contact,
            hasAddress: !!farmerData.address,
            address: farmerData.address
          });
        } else {
          console.warn("Farmer not found for ID:", product.farmerId);
        }

        // Fetch farmer ratings (overall)
        const ratingsRef = collection(db, "ratings");
        const q = query(ratingsRef, where("farmerId", "==", product.farmerId));
        const querySnapshot = await getDocs(q);

        console.log("Fetched farmer ratings:", querySnapshot.size);

        if (!querySnapshot.empty) {
          const ratings = querySnapshot.docs.map((d) => {
            const data = d.data();
            return typeof data.rating === "number"
              ? data.rating
              : parseFloat(data.rating || "0");
          });

          const avg =
            ratings.reduce((sum, r) => sum + r, 0) / (ratings.length || 1);
          setAvgRating(Number(avg.toFixed(1)));
        } else {
          setAvgRating(0);
        }

        // Fetch product-specific reviews
        if (product.id) {
          const reviewsRef = collection(db, "reviews");
          const productReviewsQuery = query(reviewsRef, where("productId", "==", product.id));
          const reviewsSnapshot = await getDocs(productReviewsQuery);

          console.log("Fetched product reviews:", reviewsSnapshot.size);

          if (!reviewsSnapshot.empty) {
            const reviewsData = reviewsSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                rating: data.rating || 0,
                comment: data.comment || '',
                userEmail: data.userEmail || '',
                createdAt: data.createdAt || null,
                ...data
              };
            });
            
            const validReviews = reviewsData.filter(review => 
              review.rating && typeof review.rating === "number" && review.rating > 0
            );
            
            setProductReviews(reviewsData); // Store all reviews for display
            
            if (validReviews.length > 0) {
              const ratings = validReviews.map(review => review.rating);
              const productAvg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
              setProductRating({
                average: Number(productAvg.toFixed(1)),
                totalReviews: validReviews.length
              });
            } else {
              setProductRating({ average: null, totalReviews: 0 });
            }
          } else {
            setProductReviews([]);
            setProductRating({ average: null, totalReviews: 0 });
          }
        }
      } catch (error) {
        console.error("Error fetching farmer/ratings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerAndRatings();
  }, [product]);

  const handleAddToCart = async () => {
    if (!user) {
      alert("You must be logged in to add to cart.");
      return;
    }

    const availableStock = product.stock || product.quantity || 0;
    if (quantity > availableStock) {
      alert(`Only ${availableStock} items available in stock.`);
      return;
    }

    try {
      await addDoc(collection(db, "cart"), {
        userId: user.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        photo: (product.images && product.images.length > 0) ? product.images[0] : "",
        farmerId: product.farmerId,
        quantity: quantity,
        createdAt: new Date(),
      });
      alert(`${quantity} item(s) added to cart!`);
      onClose();
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Failed to add to cart.");
    }
  };

  const handleOrderNow = async () => {
    if (!user) {
      alert("You must be logged in to order.");
      return;
    }

    const availableStock = product.stock || product.quantity || 0;
    if (quantity > availableStock) {
      alert(`Only ${availableStock} items available in stock.`);
      return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        buyerId: user.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        farmerId: product.farmerId,
        status: "pending",
        createdAt: new Date(),
      });
      alert(`Order for ${quantity} item(s) placed successfully!`);
      onClose();
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Failed to place order.");
    }
  };

  if (loading)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900">{product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          <div className="relative">
            {(product?.images && product.images.length > 0) ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-64 object-cover rounded-xl shadow-sm"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400 rounded-xl border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">No image available</span>
                </div>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium mb-1">Price</p>
                <p className="text-3xl font-bold text-green-800">₱{product?.price?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700 font-medium mb-1">Stock</p>
                <p className="text-lg font-semibold text-green-800">{product?.stock || product?.quantity || 0} items</p>
              </div>
            </div>
          </div>
          {/* Product Information */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                <p className="text-gray-600 leading-relaxed">{product?.description || "No description available"}</p>
              </div>
              {product?.category && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Category</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {product.category}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Reviews Section - Collapsible */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
            {/* Reviews Header - Clickable */}
            <div 
              className="p-4 cursor-pointer hover:bg-amber-100 transition-colors flex items-center justify-between"
              onClick={() => setReviewsExpanded(!reviewsExpanded)}
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-lg font-semibold text-amber-800">Customer Reviews</h3>
                {!reviewsExpanded && productRating.average !== null && (
                  <span className="ml-2 text-sm text-amber-600">
                    {productRating.average} ⭐ • {productRating.totalReviews} review{productRating.totalReviews !== 1 ? 's' : ''}
                  </span>
                )}
                {!reviewsExpanded && productRating.average === null && (
                  <span className="ml-2 text-sm text-amber-600">No reviews yet</span>
                )}
              </div>
              <div className="flex items-center">
                {productRating.average !== null && !reviewsExpanded && (
                  <div className="text-right mr-3">
                    <div className="text-2xl font-bold text-amber-700 flex items-center">
                      {productRating.average}
                      <svg className="w-6 h-6 ml-1 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                )}
                <svg 
                  className={`w-5 h-5 text-amber-600 transition-transform duration-200 ${
                    reviewsExpanded ? 'rotate-180' : ''
                  }`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Reviews Content - Collapsible */}
            {reviewsExpanded && (
              <div className="px-4 pb-4 border-t border-amber-200 pt-4">
                {productRating.average !== null ? (
                  <div className="mb-4">
                    {/* Rating Summary */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="text-3xl font-bold text-amber-700 mr-2">{productRating.average}</div>
                        <div>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= Math.round(productRating.average || 0)
                                    ? 'text-amber-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <div className="text-sm text-amber-700 font-medium">
                            Based on {productRating.totalReviews} review{productRating.totalReviews !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Individual Reviews */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {productReviews.map((review) => (
                        <div key={review.id} className="bg-white p-3 rounded-lg border border-amber-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-semibold text-amber-700">
                                  {(review.userEmail || 'Anonymous').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {review.userEmail ? review.userEmail.split('@')[0] : 'Anonymous'}
                                </div>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= (review.rating || 0)
                                          ? 'text-amber-400'
                                          : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                  <span className="ml-1 text-sm text-gray-600">{review.rating}/5</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 text-sm leading-relaxed ml-11">
                              "{review.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-3 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="text-amber-600">
                      <div className="text-lg font-medium mb-1">No reviews yet</div>
                      <div className="text-sm">Be the first to review this product!</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Quantity</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{quantity}</div>
                  <div className="text-sm text-gray-500">items</div>
                </div>
                <button
                  onClick={() => {
                    const maxStock = product?.stock || product?.quantity || 0;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity >= (product?.stock || product?.quantity || 0)}
                >
                  +
                </button>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Total Price</div>
                <div className="text-2xl font-bold text-green-600">
                  ₱{((product?.price || 0) * quantity).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Farmer Info - Collapsible */}
          {farmer ? (
            <div className="bg-green-50 rounded-lg border border-green-200">
              {/* Farmer Details Header - Clickable */}
              <div 
                className="p-3 cursor-pointer hover:bg-green-100 transition-colors flex items-center justify-between"
                onClick={() => setFarmerDetailsExpanded(!farmerDetailsExpanded)}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-semibold text-green-800">Farmer Details</h3>
                  {!farmerDetailsExpanded && (
                    <span className="ml-2 text-sm text-green-600">
                      {farmer.name} • {avgRating !== null ? `${avgRating} ⭐` : "No ratings"}
                    </span>
                  )}
                </div>
                <svg 
                  className={`w-5 h-5 text-green-600 transition-transform duration-200 ${
                    farmerDetailsExpanded ? 'rotate-180' : ''
                  }`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Farmer Details Content - Collapsible */}
              {farmerDetailsExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-green-200 pt-3">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <strong>Name:</strong> <span className="ml-1">{farmer.name || "N/A"}</span>
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <strong>Email:</strong> <span className="ml-1">{farmer.email || "N/A"}</span>
                  </p>
                  {farmer.contact && (
                    <div className="bg-white p-3 rounded border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <div>
                            <strong className="block text-sm">Contact Number</strong>
                            <span className="text-lg font-mono">{farmer.contact}</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a 
                            href={`tel:${farmer.contact}`} 
                            className="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded transition-colors text-center"
                            title="Call farmer"
                          >
                            📞 Call
                          </a>
                          <a 
                            href={`sms:${farmer.contact}`} 
                            className="text-green-600 hover:text-green-800 text-xs bg-green-100 hover:bg-green-200 px-3 py-2 rounded transition-colors text-center"
                            title="Send SMS"
                          >
                            💬 SMS
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  {farmer.address && (
                    <div className="bg-white p-3 rounded border border-green-200">
                      <div className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-1 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <strong className="block text-sm text-green-800">Farm Address</strong>
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{farmer.address}</p>
                          <div className="mt-2">
                            <a 
                              href={`https://maps.google.com/?q=${encodeURIComponent(farmer.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded transition-colors inline-flex items-center"
                              title="View on Google Maps"
                            >
                              🗺️ View on Maps
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <strong>Farmer Rating:</strong>{" "}
                    <span className="ml-1">{avgRating !== null ? `${avgRating} ⭐` : "No ratings yet"}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-gray-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Farmer details not found.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleAddToCart}
              variant="outline"
              className="flex-1 h-12 text-base font-semibold border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              Add to Cart
            </Button>
            <Button 
              onClick={handleOrderNow} 
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              Order Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
